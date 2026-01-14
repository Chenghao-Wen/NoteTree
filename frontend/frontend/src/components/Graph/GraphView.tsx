import React, { useRef, useEffect, useLayoutEffect } from 'react';
import * as d3 from 'd3';
import { NoteNode, useTreeStore } from '../../store/useTreeStore';

const COLOR_MAP: Record<string, string> = {
  PENDING: '#9CA3AF', // Gray-400
  READY: '#4F46E5',   // Indigo-600
  FAILED: '#EF4444',  // Red-500
};

// 分类颜色生成器
const categoryColorScale = d3.scaleOrdinal(d3.schemeCategory10);

export const GraphView: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodes = useTreeStore((state) => state.nodes);
  const selectNode = useTreeStore((state) => state.selectNode);

  // 1. Initialize Simulation (Run once)
  // 使用 ref 存储 simulation 实例，避免重复创建
  const simulationRef = useRef<d3.Simulation<NoteNode, undefined> | null>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 清空旧内容 (Handle HMR)
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // 容器组 (Zoom Support)
    const g = svg.append('g').attr('class', 'graph-container');

    // Zoom Behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    svg.call(zoom);

    // Initialize Simulation
    simulationRef.current = d3.forceSimulation<NoteNode>()
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30))
      // 假设有 Link 数据，此处暂时省略 forceLink，仅做节点展示
      .on('tick', ticked);

    // Tick Function: Update DOM positions
    function ticked() {
      g.selectAll<SVGCircleElement, NoteNode>('circle')
        .attr('cx', (d) => d.x!)
        .attr('cy', (d) => d.y!);

      g.selectAll<SVGTextElement, NoteNode>('text')
        .attr('x', (d) => d.x!)
        .attr('y', (d) => d.y!);
    }
    
    // Resize Observer
    const ro = new ResizeObserver(() => {
       // Optional: Update center force on resize
    });
    ro.observe(containerRef.current);

    return () => ro.disconnect();
  }, []); // Run once on mount

  // 2. Update Pattern (Run whenever nodes change)
  useLayoutEffect(() => {
    if (!simulationRef.current || !svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const g = svg.select('.graph-container');

    // --- Nodes (Circles) ---
    const nodeSelection = g.selectAll<SVGCircleElement, NoteNode>('circle')
      .data(nodes, (d) => d.id);

    // EXIT
    nodeSelection.exit().remove();

    // UPDATE
    nodeSelection
      .attr('fill', (d) => 
        d.status === 'READY' 
          ? (d.category ? categoryColorScale(d.category) : COLOR_MAP.READY) 
          : COLOR_MAP[d.status]
      )
      .attr('stroke', (d) => d.status === 'PENDING' ? '#ccc' : '#fff');

    // ENTER
    const nodeEnter = nodeSelection.enter()
      .append('circle')
      .attr('r', 0) // Initial radius for animation
      .attr('fill', (d) => COLOR_MAP.PENDING)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('cursor', 'pointer')
      .call(d3.drag<SVGCircleElement, NoteNode>() // Drag Behavior
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      )
      .on('click', (event, d) => {
        event.stopPropagation(); // Prevent background click
        selectNode(d.id);
      });
    
    // Enter Animation: Pop in
    nodeEnter.transition().duration(500).attr('r', 20);

    // --- Labels ---
    const labelSelection = g.selectAll<SVGTextElement, NoteNode>('text')
      .data(nodes, (d) => d.id);
    
    labelSelection.exit().remove();

    labelSelection.enter()
      .append('text')
      .text((d) => d.title)
      .attr('text-anchor', 'middle')
      .attr('dy', 35) // Below the circle
      .attr('font-size', '12px')
      .attr('fill', '#4b5563')
      .attr('pointer-events', 'none'); // Let clicks pass through to circle/bg

    // Restart Simulation with new data
    simulationRef.current.nodes(nodes);
    simulationRef.current.alpha(1).restart();

    // Drag Handlers
    function dragstarted(event: any, d: NoteNode) {
      if (!event.active) simulationRef.current?.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    function dragged(event: any, d: NoteNode) {
      d.fx = event.x;
      d.fy = event.y;
    }
    function dragended(event: any, d: NoteNode) {
      if (!event.active) simulationRef.current?.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

  }, [nodes, selectNode]); // Re-run when data changes

  return (
    <div ref={containerRef} className="w-full h-full bg-gray-50 relative overflow-hidden">
      <svg ref={svgRef} className="w-full h-full block" onClick={() => selectNode(null)} />
    </div>
  );
};