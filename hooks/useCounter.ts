import { useState, useEffect, useRef } from 'react';

export const useCounter = (end: number, duration: number = 1500, decimals: number = 0) => {
  const [count, setCount] = useState(0);
  const elementRef = useRef<HTMLSpanElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const node = elementRef.current;
    if (!node) return;

    observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            let start = 0;
            const step = (timestamp: number) => {
                if (!start) start = timestamp;
                const progress = Math.min((timestamp - start) / duration, 1);
                // EaseOutCubic
                const ease = 1 - Math.pow(1 - progress, 3);
                
                setCount(end * ease);

                if (progress < 1) {
                    window.requestAnimationFrame(step);
                }
            };
            window.requestAnimationFrame(step);
            observerRef.current?.disconnect();
        }
    }, { threshold: 0.4 });

    observerRef.current.observe(node);

    return () => {
        if (observerRef.current) observerRef.current.disconnect();
    }
  }, [end, duration]);

  return { count: count.toFixed(decimals), elementRef };
};