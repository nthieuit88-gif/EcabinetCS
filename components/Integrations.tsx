import React from 'react';
import ScrollReveal from './ui/ScrollReveal';

const Integrations: React.FC = () => {
  // Updated items to reflect User Management & Organization features
  const items = [
    "Sơ đồ tổ chức", 
    "Phân quyền", 
    "SSO / LDAP", 
    "Nhóm người dùng", 
    "Mời khách", 
    "Lịch & Email", 
    "API mở", 
    "Audit Log"
  ];

  return (
    <section id="users" className="py-24">
        <div className="container mx-auto px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center mb-12">
                <ScrollReveal>
                    <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Quản lý người dùng & Tổ chức</h2>
                    <p className="text-lg text-slate-600/80">Kiểm soát truy cập chặt chẽ, đồng bộ cơ cấu tổ chức và tích hợp định danh doanh nghiệp.</p>
                </ScrollReveal>
            </div>

            <div className="mx-auto max-w-3xl grid grid-cols-2 sm:grid-cols-4 gap-4">
                {items.map((item, i) => (
                    <ScrollReveal key={item} delay={i * 40} className="flex items-center justify-center rounded-[18px] border border-slate-900/10 bg-white/70 py-4 px-4 text-sm font-black tracking-wide text-slate-700 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-500/20 hover:shadow-md cursor-default">
                        {item}
                    </ScrollReveal>
                ))}
            </div>
        </div>
    </section>
  );
};

export default Integrations;