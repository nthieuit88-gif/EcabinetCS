import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="py-10 bg-white/60 border-t border-slate-900/5">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-2 font-bold text-slate-900">
                    <div className="h-6 w-6 rounded bg-gradient-to-br from-teal-500 to-blue-600"></div>
                    <span>EcabinetCS</span>
                </div>
                <p className="text-xs text-slate-500">© {new Date().getFullYear()} EcabinetCS. Bảo lưu mọi quyền.</p>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm font-bold text-slate-600">
                <a href="#how" className="hover:text-teal-600">Tạo phòng & phiên họp</a>
                <a href="#documents" className="hover:text-teal-600">Kho tài liệu</a>
                <a href="#pricing" className="hover:text-teal-600">Bảng giá</a>
                <a href="#top" className="hover:text-teal-600">Về đầu trang</a>
                <Link to="/admin" className="hover:text-teal-600 text-slate-400">Quản trị</Link>
            </div>
        </div>

        {/* Thông tin liên hệ thêm */}
        <div className="mt-8 pt-4 border-t border-slate-900/5 text-center">
            <p className="text-[12px] font-bold animate-pulse text-teal-600">
                Một sản phẩm của Trung Hiếu _CS SĐT 0916.499.916
            </p>
        </div>
    </footer>
  );
};

export default Footer;