import { useState, useEffect, useRef } from 'react';

/**
 * 模拟打字机效果
 * @param text 完整文本
 * @param speed 打字速度 (ms/char)
 * @param start 是否开始
 * @param onComplete 完成回调
 */
export const useTypewriter = (
  text: string, 
  speed: number = 30, 
  start: boolean = false,
  onComplete?: () => void
) => {
  const [displayedText, setDisplayedText] = useState('');
  const indexRef = useRef(0);

  useEffect(() => {
    if (!start || !text) return;

    // Reset if text changes significantly (optional safeguard)
    if (indexRef.current === 0) setDisplayedText('');

    const timer = setInterval(() => {
      if (indexRef.current < text.length) {
        // 取出下一个字符并追加
        const nextChar = text.charAt(indexRef.current);
        setDisplayedText((prev) => prev + nextChar);
        indexRef.current++;
      } else {
        clearInterval(timer);
        if (onComplete) onComplete();
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, start, onComplete]);

  return displayedText;
};