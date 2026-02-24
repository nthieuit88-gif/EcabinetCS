import React from 'react';
import ScrollReveal from './ui/ScrollReveal';
import { useCounter } from '../hooks/useCounter';

const StatItem: React.FC<{ to: number; label: string; suffix?: string; decimals?: number; delay?: number }> = ({ to, label, suffix = '', decimals = 0, delay = 0 }) => {
    const { count, elementRef } = useCounter(to, 1500, decimals);
    
    return (
        <ScrollReveal delay={delay} className="rounded-xl border border-slate-900/10 bg-white/70 p-4 shadow-md backdrop-blur-sm">
            <div className="text-2xl font-black tracking-tight text-slate-900">
                <span ref={elementRef}>{count}</span>{suffix}
            </div>
            <div className="mt-1 text-xs font-bold text-slate-500">{label}</div>
        </ScrollReveal>
    );
};

const Stats: React.FC = () => {
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <StatItem to={45} label="Giảm thời gian chuẩn bị" suffix="%" />
        <StatItem to={60} label="Tốc độ phê duyệt nhanh hơn" suffix="%" delay={60} />
        <StatItem to={99.9} label="Thời gian hoạt động (SLA)" suffix="%" decimals={1} delay={120} />
    </div>
  );
};

export default Stats;