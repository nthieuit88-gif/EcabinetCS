import React from 'react';
import HeroVisual from './HeroVisual';
import ScrollReveal from './ui/ScrollReveal';
import MagneticButton from './ui/MagneticButton';
import Stats from './Stats';
import { ArrowRight, Shield, Zap, Globe } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <section className="pt-8 pb-12 md:pt-16 lg:pt-20 overflow-x-hidden relative">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-teal-500/5 blur-[100px]" />
        <div className="absolute top-[20%] right-[-10%] w-[30%] h-[50%] rounded-full bg-blue-500/5 blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          
          {/* Left: Copy */}
          <div className="max-w-2xl">
            <ScrollReveal delay={0}>
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-50/50 px-4 py-2 text-xs font-semibold text-teal-700 mb-6 shadow-sm backdrop-blur-sm">
                <span className="flex h-2 w-2 rounded-full bg-teal-500 animate-pulse"></span>
                <span>Giải pháp họp không giấy tờ thế hệ mới</span>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={80}>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl mb-6 leading-[1.15]">
                Chuyển đổi số <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600">
                  phòng họp của bạn
                </span>
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={140}>
              <p className="text-lg leading-relaxed text-slate-600 mb-8 max-w-lg">
                EcabinetCS mang đến trải nghiệm họp trực tuyến và trực tiếp liền mạch. Quản lý tài liệu, biểu quyết an toàn và tự động hóa biên bản với công nghệ AI tiên tiến.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={220}>
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <MagneticButton variant="primary" as="a" href="#" className="text-base px-8 py-4 rounded-xl shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 group">
                  Bắt đầu ngay
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </MagneticButton>
                <MagneticButton variant="ghost" as="a" href="#how" className="text-base px-8 py-4 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center">
                  Xem Demo
                </MagneticButton>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={280}>
              <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-8">
                 <div className="flex flex-col gap-2">
                   <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center">
                     <Shield className="w-4 h-4" />
                   </div>
                   <span className="text-sm font-medium text-slate-700">Bảo mật cấp cao</span>
                 </div>
                 <div className="flex flex-col gap-2">
                   <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                     <Zap className="w-4 h-4" />
                   </div>
                   <span className="text-sm font-medium text-slate-700">Tốc độ tối ưu</span>
                 </div>
                 <div className="flex flex-col gap-2">
                   <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                     <Globe className="w-4 h-4" />
                   </div>
                   <span className="text-sm font-medium text-slate-700">Mọi lúc mọi nơi</span>
                 </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right: Visual */}
          <ScrollReveal delay={120} className="w-full relative z-10">
            <HeroVisual />
          </ScrollReveal>
        </div>

        <div className="mt-20">
          <Stats />
        </div>
      </div>
    </section>
  );
};

export default Hero;