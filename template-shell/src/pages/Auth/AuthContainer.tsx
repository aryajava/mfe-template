import React, { type ReactNode } from 'react';
import { Store } from 'lucide-react';

interface AuthContainerProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
}

export const AuthContainer: React.FC<AuthContainerProps> = ({
  title = 'Toko GKLaku',
  subtitle = 'Silakan masuk untuk melanjutkan ke sistem',
  children,
}) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-orange-50/30 to-amber-50/40 px-4 py-8 sm:px-6">
      <div className="w-full max-w-[420px] flex flex-col items-center">
        {/* Brand Header khas cobaproject */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-600 text-white shadow-md shadow-orange-500/20 mb-3 transition-transform hover:scale-105 duration-200">
            <Store className="w-7 h-7" strokeWidth={2.2} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-xs mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Card Box Login/Auth */}
        <div className="w-full bg-white border border-gray-200/90 rounded-2xl shadow-xl shadow-gray-200/60 p-6 sm:p-7 transition-all duration-200">
          {children}
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-gray-400">
          &copy; {new Date().getFullYear()} Toko GKLaku &bull; Hak Cipta Dilindungi
        </div>
      </div>
    </div>
  );
};

export default AuthContainer;
