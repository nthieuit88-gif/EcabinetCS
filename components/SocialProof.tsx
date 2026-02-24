import React from 'react';
import ScrollReveal from './ui/ScrollReveal';

const SocialProof: React.FC = () => {
  const logos = [
      "Doanh nghiệp", "Ngân hàng", "Giáo dục", "Sản xuất", 
      "Chính phủ", "Y tế", "Bán lẻ", "Hậu cần"
  ];

  return (
    <section className="py-3 border-y border-slate-900/5 bg-white/60 overflow-hidden">
        <div className="container mx-auto px-4 mb-2">
            <ScrollReveal>
                <p className="text-center text-[10px] font-bold text-slate-400 tracking-wider">ĐƯỢC TIN DÙNG BỞI CÁC ĐỘI NGŨ HÀNH CHÍNH & VẬN HÀNH</p>
            </ScrollReveal>
        </div>
        
        {/* Infinite Marquee */}
        <div className="relative flex overflow-hidden group">
            <div className="animate-marquee flex gap-4 py-2 px-4 min-w-full shrink-0">
                {[...logos, ...logos, ...logos].map((logo, i) => (
                    <div key={`${logo}-${i}`} className="flex items-center justify-center rounded-full border border-slate-900/10 bg-white/75 px-4 py-1.5 text-[10px] font-extrabold text-slate-600/80 uppercase tracking-wider shadow-sm">
                        {logo}
                    </div>
                ))}
            </div>
            {/* Duplicate for seamless loop */}
            <div className="animate-marquee flex gap-4 py-2 px-4 min-w-full shrink-0" aria-hidden="true">
                {[...logos, ...logos, ...logos].map((logo, i) => (
                    <div key={`${logo}-${i}-dup`} className="flex items-center justify-center rounded-full border border-slate-900/10 bg-white/75 px-4 py-1.5 text-[10px] font-extrabold text-slate-600/80 uppercase tracking-wider shadow-sm">
                        {logo}
                    </div>
                ))}
            </div>
        </div>
    </section>
  );
};

export default SocialProof;