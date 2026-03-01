import React from 'react';
import ScrollReveal from './ui/ScrollReveal';
import MagneticButton from './ui/MagneticButton';
import { Check, Zap, Crown, Building } from 'lucide-react';

interface PricingCardProps {
    title: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    isPopular?: boolean;
    buttonText?: string;
    icon: any;
    delay?: number;
}

const PricingCard: React.FC<PricingCardProps> = ({ 
    title, price, period, description, features, isPopular, buttonText = "Đăng ký ngay", icon: Icon, delay = 0 
}) => {
    return (
        <ScrollReveal delay={delay} className="h-full">
            <div className={`relative flex flex-col h-full rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-2 ${
                isPopular 
                ? 'bg-white/80 border-teal-500 shadow-xl shadow-teal-900/10 scale-105 z-10' 
                : 'bg-white/60 border-slate-900/10 shadow-lg hover:shadow-xl'
            }`}>
                {isPopular && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-teal-500 to-blue-600 text-white text-[10px] font-bold uppercase tracking-widest py-1.5 px-4 rounded-full shadow-lg">
                        Khuyên dùng
                    </div>
                )}

                <div className="mb-4">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${isPopular ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-600'}`}>
                        <Icon size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                    <p className="text-xs text-slate-500 mt-2 min-h-[32px]">{description}</p>
                </div>

                <div className="mb-4 pb-4 border-b border-slate-100">
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{price}</span>
                        <span className="text-xs font-semibold text-slate-500">{period}</span>
                    </div>
                </div>

                <ul className="space-y-3 mb-6 flex-1">
                    {features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3 text-xs text-slate-700 font-medium">
                            <div className={`mt-0.5 h-3.5 w-3.5 rounded-full flex items-center justify-center shrink-0 ${isPopular ? 'bg-teal-100 text-teal-600' : 'bg-slate-200 text-slate-500'}`}>
                                <Check size={8} strokeWidth={4} />
                            </div>
                            {feature}
                        </li>
                    ))}
                </ul>

                <MagneticButton 
                    variant={isPopular ? 'primary' : 'ghost'} 
                    className={`w-full text-xs py-2.5 ${!isPopular ? 'border-slate-200 bg-white hover:bg-slate-50' : ''}`}
                    as="a"
                    href="#"
                >
                    {buttonText}
                </MagneticButton>
            </div>
        </ScrollReveal>
    );
};

const Pricing: React.FC = () => {
    return (
        <section id="pricing" className="py-6 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 translate-y-1/3 translate-x-1/3 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="container mx-auto px-4 sm:px-6 relative z-10">
                <div className="mx-auto max-w-2xl text-center mb-8">
                    <ScrollReveal>
                        <h2 className="mb-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Bảng giá dịch vụ</h2>
                        <p className="text-base text-slate-600/80">Chi phí linh hoạt phù hợp với quy mô doanh nghiệp của bạn.</p>
                    </ScrollReveal>
                </div>

                <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-center">
                    {/* Gói 1 */}
                    <PricingCard 
                        title="Gói Cơ bản"
                        price="699.000đ"
                        period="/tháng"
                        description="Dành cho các nhóm nhỏ hoặc doanh nghiệp khởi nghiệp."
                        icon={Zap}
                        features={[
                            "Tối đa 20 người dùng (User)",
                            "Cloud lưu trữ đi kèm (Free Cloud)",
                            "Họp không giấy tờ cơ bản",
                            "Biểu quyết & Lấy ý kiến",
                            "Hỗ trợ qua Email"
                        ]}
                        delay={0}
                    />

                    {/* Gói 2 */}
                    <PricingCard 
                        title="Gói Tiêu chuẩn"
                        price="1.399.000đ"
                        period="/tháng"
                        description="Giải pháp tối ưu cho doanh nghiệp vừa và nhỏ (SME)."
                        icon={Crown}
                        isPopular={true}
                        features={[
                            "Tối đa 25 người dùng (User)",
                            "100GB Cloud lưu trữ",
                            "Tất cả tính năng gói Cơ bản",
                            "Quản lý tài liệu nâng cao",
                            "Ghi âm & Biên bản tự động",
                            "Hỗ trợ ưu tiên 24/7"
                        ]}
                        delay={100}
                    />

                    {/* Gói 3 */}
                    <PricingCard 
                        title="Gói Nâng cao"
                        price="Liên hệ"
                        period=""
                        description="Dành cho tập đoàn lớn hoặc nhu cầu tùy chỉnh riêng."
                        icon={Building}
                        buttonText="Liên hệ tư vấn"
                        features={[
                            "Từ 25 - 50 người dùng (User)",
                            "100GB Cloud lưu trữ (Có thể mở rộng)",
                            "Triển khai On-Premise / Private Cloud",
                            "Tích hợp SSO & AD doanh nghiệp",
                            "Tùy chỉnh tính năng theo yêu cầu",
                            "Chuyên viên hỗ trợ riêng"
                        ]}
                        delay={200}
                    />
                </div>
            </div>
        </section>
    );
};

export default Pricing;