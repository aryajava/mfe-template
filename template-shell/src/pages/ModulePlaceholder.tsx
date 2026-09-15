import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@template/shared';
import { Construction, Home, ArrowLeft } from 'lucide-react';

interface ModulePlaceholderProps {
  title?: string;
  description?: string;
}

export const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({
  title,
  description,
}) => {
  const location = useLocation();

  const derivedTitle =
    title ||
    location.pathname
      .split('/')
      .filter(Boolean)
      .pop()
      ?.replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase()) ||
    'Modul';

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-[60vh] flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center mb-6 shadow-xs">
        <Construction className="w-8 h-8" />
      </div>

      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 mb-3">
        Dalam Pengembangan
      </span>

      <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
        Modul {derivedTitle}
      </h1>

      <p className="text-gray-500 max-w-md text-sm leading-relaxed mb-8">
        {description ||
          `Halaman ini telah diotorisasi untuk peran Anda (${location.pathname}), namun Remote Micro-Frontend untuk modul ini sedang dalam proses pengembangan.`}
      </p>

      <div className="flex items-center gap-3">
        <Button variant="outline" asChild>
          <Link to="/dashboard" className="gap-2">
            <Home className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>
        </Button>
        <Button onClick={() => window.history.back()} className="gap-2 bg-orange-600 hover:bg-orange-700 text-white">
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Halaman Sebelumnya</span>
        </Button>
      </div>
    </div>
  );
};

export default ModulePlaceholder;
