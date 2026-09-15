import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { Button, Card, CardContent } from '@template/shared';

interface ForbiddenProps {
  title?: string;
  message?: string;
  backUrl?: string;
  backLabel?: string;
}

/**
 * Halaman 403 Forbidden Umum (General Purpose).
 * Digunakan untuk menangani pembatasan otorisasi lintas MFE.
 */
export const Forbidden: React.FC<ForbiddenProps> = ({
  title = 'Akses Tidak Diizinkan',
  message = 'Anda tidak memiliki izin untuk mengakses halaman atau fitur ini. Silakan hubungi Administrator sistem jika Anda memerlukan hak akses tambahan.',
  backUrl,
  backLabel = 'Halaman Sebelumnya',
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backUrl) {
      navigate(backUrl);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="py-16 px-4 flex items-center justify-center">
      <Card className="max-w-md w-full border border-amber-200/80 shadow-sm bg-white overflow-hidden text-center">
        <CardContent className="p-8 space-y-6">
          <div className="inline-flex p-4 rounded-2xl bg-amber-50 border border-amber-100 text-amber-700 shadow-2xs">
            <ShieldAlert className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900">
              403 Forbidden
            </span>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              {title}
            </h2>
            <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
              {message}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={handleBack}
              className="w-full sm:w-auto text-xs font-medium border-gray-300 hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{backLabel}</span>
            </Button>
            <Button
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto text-xs font-medium bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center gap-2 shadow-xs"
            >
              <Home className="h-4 w-4" />
              <span>Ke Dashboard</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Forbidden;
