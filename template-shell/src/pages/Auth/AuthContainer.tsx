import React, { type ReactNode } from 'react';
import { Store } from 'lucide-react';

interface AuthContainerProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
}

export const AuthContainer: React.FC<AuthContainerProps> = ({
  title = 'Toko GKLaku',
  subtitle = 'Masuk ke panel pengurus toko untuk mengelola sistem',
  children,
}) => {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-slate-50/90 relative overflow-hidden px-4 py-16 selection:bg-orange-500 selection:text-white">
      {/* Ambient architectural lighting & subtle dot matrix */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[540px] h-[540px] bg-gradient-to-b from-orange-200/40 via-orange-100/20 to-transparent rounded-full blur-3xl opacity-80"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 right-10 w-[460px] h-[460px] bg-slate-200/50 rounded-full blur-3xl opacity-60"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-35"
        aria-hidden="true"
      />

      <div className="w-full max-w-[420px] flex flex-col items-center relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-7 flex flex-col items-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-[11px] font-semibold text-orange-700 tracking-wider uppercase mb-3.5">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            Portal Pengurus Toko
          </div>

          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-600 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-600/25 mb-3.5 border border-white/30 transition-transform duration-300 hover:scale-105">
            <Store className="w-7 h-7" strokeWidth={1.85} />
          </div>

          <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight leading-snug">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 font-normal max-w-xs mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Double-Bezel (Doppelrand) Architecture */}
        <div className="w-full p-2.5 sm:p-3 rounded-[2rem] bg-slate-200/50 border border-slate-200/80 shadow-2xl shadow-slate-300/40 backdrop-blur-xl transition-all duration-300">
          <div className="bg-white rounded-[calc(2rem-0.625rem)] p-7 sm:p-8 border border-white/80 shadow-xs">
            {children}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-7 text-xs text-slate-400 font-medium">
          &copy; {new Date().getFullYear()} Toko GKLaku &bull; Keamanan Akses Terpusat
        </div>
      </div>
    </div>
  );
};

export default AuthContainer;
