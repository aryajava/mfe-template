import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@template/shared';
import { AlertCircle } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center p-6 text-center">
      <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mb-4">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-bold text-slate-900 mb-1">Halaman Tidak Ditemukan</h2>
      <p className="text-xs text-slate-500 max-w-sm mb-6">
        Halaman monitoring diskon yang Anda tuju tidak tersedia atau Anda tidak memiliki izin akses.
      </p>
      <Link to="/monitoring/permintaan-diskon">
        <Button size="sm" variant="outline">
          Kembali ke Permintaan Diskon
        </Button>
      </Link>
    </div>
  );
};

export default NotFound;
