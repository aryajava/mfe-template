import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@template/shared';

const Detail: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div className="p-4 flex items-center flex-col">
            <h1 className="text-6xl font-bold text-muted-foreground">Detail</h1>
            <p>Ini adalah halaman detail dari mfe hallo</p>
            <Button onClick={() => navigate(-1)} className='mt-4'>Kembali</Button>
        </div>
    );
};

export default Detail;