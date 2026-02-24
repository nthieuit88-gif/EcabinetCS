import React from 'react';
import ScrollReveal from './ui/ScrollReveal';

const FAQItem: React.FC<{ question: string; answer: string; delay: number }> = ({ question, answer, delay }) => (
    <ScrollReveal delay={delay} className="group rounded-2xl border border-slate-900/10 bg-white/75 shadow-sm transition-all hover:border-teal-500/20">
        <details className="group p-0">
            <summary className="flex cursor-pointer items-center justify-between p-5 font-black text-slate-800 focus:outline-none">
                {question}
                <span className="ml-4 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-transform group-open:rotate-180">
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1.5 1.5L6 6L10.5 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </span>
            </summary>
            <div className="px-5 pb-5 text-sm font-semibold leading-relaxed text-slate-600/80">
                {answer}
            </div>
        </details>
    </ScrollReveal>
);

const FAQ: React.FC = () => {
  return (
    <section id="faq" className="py-24 bg-slate-50/50 border-y border-slate-900/5">
        <div className="container mx-auto px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center mb-12">
                <ScrollReveal>
                    <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Hỏi đáp thường gặp</h2>
                    <p className="text-lg text-slate-600/80">Một vài thông tin trước khi bắt đầu.</p>
                </ScrollReveal>
            </div>

            <div className="mx-auto max-w-2xl grid gap-4">
                <FAQItem 
                    delay={0}
                    question="Mô hình tổ chức nào phù hợp với EcabinetCS?"
                    answer="Phù hợp cho các doanh nghiệp/đơn vị cần chuẩn hóa quy trình họp, quản lý tài liệu và theo dõi quyết định sau cuộc họp."
                />
                <FAQItem 
                    delay={60}
                    question="Có thể triển khai On-Premise không?"
                    answer="Có. EcabinetCS có thể triển khai trên Cloud hoặc On-Premise (Máy chủ riêng) tùy thuộc vào yêu cầu bảo mật và hạ tầng của bạn."
                />
                <FAQItem 
                    delay={120}
                    question="Hệ thống có nhật ký kiểm toán không?"
                    answer="Có. Hệ thống hỗ trợ phân quyền theo vai trò, nhật ký truy cập, tùy chọn đóng dấu mờ (watermark) và các chính sách bảo mật tổ chức."
                />
                <FAQItem 
                    delay={180}
                    question="Có hỗ trợ giảm chuyển động không?"
                    answer="Có. Trang web tôn trọng cài đặt `prefers-reduced-motion` để tắt các hiệu ứng hạt và hoạt ảnh nặng."
                />
            </div>
        </div>
    </section>
  );
};

export default FAQ;