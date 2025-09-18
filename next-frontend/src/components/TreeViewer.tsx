"use client";

import React, { useEffect, useState } from "react";
import Tree from "react-d3-tree";

const containerStyles = {
  width: "100%",
  height: "100vh",
};
interface TreeNode {
  name: string;
  files?: string[];
  children?: TreeNode[];
}
const transformNode = (node: TreeNode): TreeNode => {
  const nameWithFiles =
    node.files && node.files.length > 0
      ? `${node.name}\n[${node.files.join(", ")}]`
      : node.name;

  return {
    name: nameWithFiles,
    children: node.children?.map(transformNode) || [],
  };
};

export default function KnowledgeTree() {
  const [treeData, setTreeData] = useState<any>(null);

  useEffect(() => {
    fetch("dummy_graph.json", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const transformed = transformNode(data);
        setTreeData(transformed);
      });
  }, []);

  if (!treeData) return <div>Loading tree...</div>;

  return (
    <div style={containerStyles}>
      <Tree
        data={treeData}
        orientation="vertical"
        translate={{ x: 400, y: 100 }}
        pathFunc="diagonal"
        zoomable
        collapsible
        nodeSize={{ x: 200, y: 100 }}
        separation={{ siblings: 1.5, nonSiblings: 2 }}
      />
    </div>
  );
}
