import React, { useEffect, useRef, useState } from 'react';
import ScrollReveal from './ui/ScrollReveal';
import { Mic, Video, Hand, FileText, MoreVertical, Users, CheckCircle2, XCircle, BarChart3, Clock } from 'lucide-react';

const TimelineStep: React.FC<{ number: number; title: string; desc: string; isActive: boolean; onClick: () => void }> = ({ number, title, desc, isActive, onClick }) => (
    <div 
        onClick={onClick}
        className={`relative pl-8 pb-8 last:pb-0 cursor-pointer transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-60 hover:opacity-80'}`}
    >
        {/* Line */}
        <div className="absolute left-[11px] top-[24px] bottom-0 w-0.5 bg-slate-200 last:hidden"></div>
        
        {/* Dot */}
        <div className={`absolute left-0 top-[4px] h-6 w-6 rounded-full flex items-center justify-center border-2 transition-all ${isActive ? 'border-teal-500 bg-teal-50 text-teal-600 scale-110 shadow-md' : 'border-slate-300 bg-white text-slate-400'}`}>
            <span className="text-[10px] font-bold">{number}</span>
        </div>

        <h3 className={`text-base font-bold mb-1 transition-colors ${isActive ? 'text-teal-700' : 'text-slate-700'}`}>{title}</h3>
        <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
    </div>
);

const MeetingUI: React.FC<{ step: number }> = ({ step }) => {
    return (
        <div className="relative rounded-xl border border-slate-900/10 bg-slate-800 shadow-2xl overflow-hidden aspect-[16/10] flex flex-col transition-all duration-500">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-900/50 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-teal-500 flex items-center justify-center font-bold text-white text-xs">CS</div>
                    <div>
                        <div className="text-sm font-bold text-white">Họp Hội đồng Quản trị Q3/2024</div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span className="flex items-center gap-1"><Clock size={10} /> 09:30 - 11:30</span>
                            <span className="h-0.5 w-0.5 rounded-full bg-slate-500"></span>
                            <span className="text-green-400">Đang diễn ra</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                     <button className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"><Users size={16} /></button>
                     <button className="h-8 w-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"><MoreVertical size={16} /></button>
                </div>
            </div>

            {/* Main Body */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar Agenda */}
                <div className="w-64 border-r border-white/5 bg-slate-900/30 flex flex-col hidden sm:flex">
                    <div className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Chương trình</div>
                    <div className="space-y-1 px-2">
                        {['Tuyên bố lý do', 'Báo cáo hoạt động Q2', 'Thảo luận Kế hoạch Q3', 'Biểu quyết chỉ tiêu', 'Bế mạc'].map((item, i) => (
                            <div key={i} className={`flex items-center gap-3 p-2 rounded-lg text-sm font-medium transition-colors ${i === (step === 3 ? 3 : 2) ? 'bg-teal-500/20 text-teal-400' : 'text-slate-400'}`}>
                                <div className={`h-1.5 w-1.5 rounded-full ${i < (step === 3 ? 3 : 2) ? 'bg-slate-600' : i === (step === 3 ? 3 : 2) ? 'bg-teal-400 animate-pulse' : 'bg-slate-700'}`}></div>
                                {item}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 relative bg-slate-900 flex flex-col p-4 items-center justify-center">
                    {/* Document Viewer Simulation */}
                    <div className="w-full h-full bg-white rounded-lg shadow-lg overflow-hidden relative">
                         <div className="absolute top-0 left-0 right-0 h-1 bg-teal-500 z-10"></div>
                         <div className="p-8 text-slate-800">
                             <h1 className="text-2xl font-bold mb-4 text-center">BÁO CÁO HOẠT ĐỘNG KINH DOANH Q2/2024</h1>
                             <div className="space-y-4">
                                 <div className="h-4 bg-slate-100 rounded w-full"></div>
                                 <div className="h-4 bg-slate-100 rounded w-5/6"></div>
                                 <div className="h-4 bg-slate-100 rounded w-4/6"></div>
                                 <div className="grid grid-cols-2 gap-4 mt-8">
                                     <div className="h-32 bg-blue-50 rounded border border-blue-100 flex items-end p-2 pb-0 justify-around">
                                         <div className="w-8 bg-blue-400 h-[60%] rounded-t"></div>
                                         <div className="w-8 bg-blue-500 h-[80%] rounded-t"></div>
                                         <div className="w-8 bg-blue-600 h-[40%] rounded-t"></div>
                                     </div>
                                     <div className="space-y-2">
                                         <div className="h-3 bg-slate-100 rounded w-full"></div>
                                         <div className="h-3 bg-slate-100 rounded w-full"></div>
                                         <div className="h-3 bg-slate-100 rounded w-2/3"></div>
                                     </div>
                                 </div>
                             </div>
                         </div>
                    </div>

                    {/* Voting Overlay (Visible if step 3) */}
                    <div className={`absolute bottom-8 right-8 w-72 bg-white rounded-xl shadow-2xl p-4 transition-all duration-500 transform ${step === 3 ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
                        <div className="flex items-center gap-2 mb-3">
                             <div className="p-1.5 rounded bg-teal-100 text-teal-600"><BarChart3 size={16} /></div>
                             <span className="text-sm font-bold text-slate-800">Biểu quyết: Chỉ tiêu Q3</span>
                        </div>
                        <div className="space-y-2">
                            <button className="w-full flex items-center justify-between p-2 rounded-lg border border-slate-200 hover:bg-green-50 hover:border-green-200 transition-colors group">
                                <span className="text-sm font-medium text-slate-700">Đồng ý</span>
                                <CheckCircle2 size={16} className="text-slate-300 group-hover:text-green-500" />
                            </button>
                            <button className="w-full flex items-center justify-between p-2 rounded-lg border border-slate-200 hover:bg-red-50 hover:border-red-200 transition-colors group">
                                <span className="text-sm font-medium text-slate-700">Không đồng ý</span>
                                <XCircle size={16} className="text-slate-300 group-hover:text-red-500" />
                            </button>
                        </div>
                        <div className="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-teal-500 w-[75%]"></div>
                        </div>
                        <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                             <span>Đã tham gia: 12/15</span>
                             <span>Còn lại: 00:45</span>
                        </div>
                    </div>

                </div>
            </div>

            {/* Footer Controls */}
            <div className="h-16 bg-slate-900 border-t border-white/5 flex items-center justify-center gap-4">
                 <button className="h-10 w-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"><Mic size={20} /></button>
                 <button className="h-10 w-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"><Video size={20} /></button>
                 <button className="h-10 w-10 rounded-full bg-teal-600 text-white flex items-center justify-center hover:bg-teal-500 shadow-lg shadow-teal-500/20 transition-colors"><FileText size={20} /></button>
                 <button className="h-10 w-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"><Hand size={20} /></button>
                 <button className="h-10 px-4 rounded-full bg-red-600 text-white text-sm font-bold hover:bg-red-500 transition-colors">Kết thúc</button>
            </div>
        </div>
    );
};

const Timeline: React.FC = () => {
    const [activeStep, setActiveStep] = useState(2);
    const sectionRef = useRef<HTMLDivElement>(null);

    return (
        <section id="how" className="py-6 bg-slate-50/50 border-y border-slate-900/5 relative overflow-hidden">
             {/* Background Decoration */}
             <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
             <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[800px] h-[800px] bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>

             <div className="container mx-auto px-4 sm:px-6 relative z-10" ref={sectionRef}>
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    
                    {/* Left Column: Timeline Steps */}
                    <div>
                        <ScrollReveal>
                            <h2 className="mb-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Điều hành phiên họp thông minh</h2>
                            <p className="text-base text-slate-600/80 mb-8">
                                Kiểm soát hoàn toàn diễn biến cuộc họp với các công cụ điều hành chuyên nghiệp, đồng bộ tức thì trên mọi thiết bị.
                            </p>
                        </ScrollReveal>
                        
                        <div className="space-y-1">
                             <TimelineStep 
                                number={1} 
                                title="Chuẩn bị & Phát hành" 
                                desc="Tạo phòng họp, tải tài liệu, phân quyền truy cập và gửi giấy mời tự động qua Email/SMS."
                                isActive={activeStep === 1}
                                onClick={() => setActiveStep(1)}
                             />
                             <TimelineStep 
                                number={2} 
                                title="Điều hành & Trình chiếu" 
                                desc="Đồng bộ chuyển trang tài liệu, chia sẻ màn hình và ghi chú trực tiếp cho tất cả đại biểu."
                                isActive={activeStep === 2}
                                onClick={() => setActiveStep(2)}
                             />
                             <TimelineStep 
                                number={3} 
                                title="Biểu quyết & Lấy ý kiến" 
                                desc="Tạo các phiên biểu quyết công khai hoặc bỏ phiếu kín. Kết quả được tổng hợp tức thì."
                                isActive={activeStep === 3}
                                onClick={() => setActiveStep(3)}
                             />
                             <TimelineStep 
                                number={4} 
                                title="Kết luận & Ban hành" 
                                desc="Tự động trích xuất biên bản, gán nhiệm vụ và lưu trữ hồ sơ cuộc họp theo quy định."
                                isActive={activeStep === 4}
                                onClick={() => setActiveStep(4)}
                             />
                        </div>
                    </div>

                    {/* Right Column: Visual Mockup */}
                    <ScrollReveal delay={200} className="relative">
                         <div className="absolute -inset-4 bg-gradient-to-tr from-teal-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-70"></div>
                         <MeetingUI step={activeStep} />
                    </ScrollReveal>
                </div>
             </div>
        </section>
    );
};

export default Timeline;