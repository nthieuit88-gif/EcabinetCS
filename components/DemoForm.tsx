import React, { FormEvent } from 'react';
import ScrollReveal from './ui/ScrollReveal';
import MagneticButton from './ui/MagneticButton';

const DemoForm: React.FC = () => {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    alert("Cảm ơn! Yêu cầu demo của bạn đã được ghi nhận (Mô phỏng Offline).");
  };

  return (
    <section id="demo" className="py-16">
      <div className="container mx-auto px-4 sm:px-6">
        <ScrollReveal className="relative overflow-hidden rounded-[26px] border border-slate-900/10 bg-white/80 p-6 shadow-2xl md:p-12">
           {/* Background Mesh */}
           <div className="absolute inset-0 z-0 opacity-40 pointer-events-none bg-[radial-gradient(900px_320px_at_20%_0%,rgba(14,165,164,0.16),transparent_60%),radial-gradient(800px_320px_at_80%_30%,rgba(37,99,235,0.12),transparent_55%)]"></div>
           
           <div className="relative z-10 grid gap-10 lg:grid-cols-2">
             <div className="max-w-lg">
                <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Đặt lịch Demo EcabinetCS</h2>
                <p className="text-slate-600/80 leading-relaxed mb-8">
                    Nhận bản demo được thiết kế riêng cho nhu cầu của bạn (họp hội đồng quản trị, hội nghị, quản trị...) và tư vấn triển khai.
                </p>
                <div className="hidden lg:block text-sm text-slate-500 font-medium">
                    Được tin dùng bởi hơn 500 tổ chức để tối ưu hóa việc ra quyết định.
                </div>
             </div>

             <form onSubmit={handleSubmit} className="grid gap-5">
                <div className="grid gap-2">
                    <label htmlFor="name" className="text-xs font-extrabold uppercase text-slate-500">Họ và tên</label>
                    <input 
                        id="name"
                        type="text" 
                        required 
                        placeholder="Nguyễn Văn A" 
                        className="w-full rounded-xl border border-slate-900/10 bg-white/85 px-4 py-3 font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                </div>
                <div className="grid gap-2">
                    <label htmlFor="email" className="text-xs font-extrabold uppercase text-slate-500">Email công việc</label>
                    <input 
                        id="email"
                        type="email" 
                        required 
                        placeholder="nguyen.a@congty.com" 
                        className="w-full rounded-xl border border-slate-900/10 bg-white/85 px-4 py-3 font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                </div>
                <div className="grid gap-2">
                    <label htmlFor="company" className="text-xs font-extrabold uppercase text-slate-500">Tổ chức / Công ty</label>
                    <input 
                        id="company"
                        type="text" 
                        required 
                        placeholder="Công ty CP ABC" 
                        className="w-full rounded-xl border border-slate-900/10 bg-white/85 px-4 py-3 font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                </div>
                <div className="mt-2">
                    <MagneticButton type="submit" variant="primary" className="w-full sm:w-auto">
                        Yêu cầu Demo
                    </MagneticButton>
                    <p className="mt-3 text-xs text-slate-500">Bằng cách gửi, bạn đồng ý nhận lịch hẹn demo từ chúng tôi.</p>
                </div>
             </form>
           </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default DemoForm;