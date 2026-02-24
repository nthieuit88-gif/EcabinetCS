import React from 'react';
import ScrollReveal from './ui/ScrollReveal';

interface FeatureCardProps {
    title: string;
    description: string;
    items: string[];
    delay: number;
    href?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, items, delay, href }) => {
    const CardContent = (
        <div className="group h-full rounded-2xl border border-slate-900/10 bg-white/70 p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-teal-500/20 hover:shadow-xl flex flex-col">
            <h3 className="mb-3 text-lg font-bold tracking-tight text-slate-900 group-hover:text-teal-700 transition-colors">{title}</h3>
            <p className="mb-5 text-sm leading-relaxed text-slate-600 flex-1">{description}</p>
            <ul className="space-y-2">
                {items.map(item => (
                    <li key={item} className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <div className="h-1.5 w-1.5 rounded-full bg-teal-400 group-hover:scale-125 transition-transform"></div>
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    );

    if (href) {
        return (
            <ScrollReveal delay={delay} className="h-full">
                <a href={href} className="block h-full cursor-pointer focus:outline-none">
                    {CardContent}
                </a>
            </ScrollReveal>
        );
    }

    return <ScrollReveal delay={delay} className="h-full">{CardContent}</ScrollReveal>;
};

const Features: React.FC = () => {
  const features = [
    {
        title: "Lịch họp & Thông báo",
        description: "Quản lý lịch họp trực quan, tự động gửi thư mời và nhắc nhở qua Email/SMS/App.",
        items: ["Lịch tháng/tuần", "Đặt phòng họp", "Thông báo tự động"],
        href: "#calendar"
    },
    {
        title: "Điều hành Phiên họp",
        description: "Công cụ hỗ trợ chủ tọa điều hành: điểm danh, phát biểu, biểu quyết và trình chiếu.",
        items: ["Điều khiển tập trung", "Biểu quyết điện tử", "Đăng ký phát biểu"],
        href: "#how"
    },
    {
        title: "Biên bản & Quyết định",
        description: "Tự động ghi nhận ý kiến, kết luận và giao việc sau cuộc họp.",
        items: ["Mẫu biên bản", "Danh sách việc cần làm", "Nhắc nhở công việc"],
        href: "#how"
    },
    {
        title: "Quản trị & Phân quyền",
        description: "Mô hình tổ chức cây đa cấp, tích hợp SSO và phân quyền chi tiết đến từng chức năng.",
        items: ["Sơ đồ tổ chức", "SSO (LDAP/AD)", "Audit Log"],
        href: "#users"
    },
    {
        title: "Bảng điều khiển & Báo cáo",
        description: "Theo dõi hiệu quả cuộc họp: tần suất, tỷ lệ hoàn thành và chỉ số vận hành.",
        items: ["Bảng điều khiển trực quan", "Xuất báo cáo", "KPI phòng ban"],
        href: "#demo" // Use demo as placeholder or future dashboard section
    }
  ];

  return (
    <section id="features" className="py-24">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
                <FeatureCard key={i} {...f} delay={(i % 3) * 60} />
            ))}
        </div>
      </div>
    </section>
  );
};

export default Features;