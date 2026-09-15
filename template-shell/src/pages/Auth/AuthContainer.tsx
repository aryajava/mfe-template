import React, { type ReactNode } from 'react';
import { Store } from 'lucide-react';

interface AuthContainerProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
}

export const AuthContainer: React.FC<AuthContainerProps> = ({
  title = 'Toko GKLaku',
  subtitle = 'Silakan masuk ke panel pengurus toko untuk mengelola sistem',
  children,
}) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50/90 relative overflow-hidden px-4 py-12 selection:bg-orange-500 selection:text-white">
      {/* Ambient architectural lighting (anti-slop, restrained) */}
      <div
        className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 bg-orange-100/50 rounded-full blur-3xl opacity-70"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 w-96 h-96 bg-slate-200/50 rounded-full blur-3xl opacity-70"
        aria-hidden="true"
      />

      <div className="w-full max-w-[420px] flex flex-col items-center relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-orange-600 text-white shadow-md shadow-orange-600/25 mb-3.5 transition-transform hover:scale-105 duration-200">
            <Store className="w-6 h-6" strokeWidth={2.2} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
          <p className="text-sm text-gray-500 mt-1.5 font-normal max-w-xs mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Card Box Login */}
        <div className="w-full bg-white border border-gray-200 rounded-2xl shadow-xl shadow-slate-200/50 p-6 sm:p-8 transition-all duration-200">
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
