import React from 'react';
import { Settings, BarChart3, FileText } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Child MFE - Home</h1>
        <p className="text-gray-600 mt-1">
          This is a template child micro-frontend loaded via Module Federation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center mb-4">
            <BarChart3 className="h-5 w-5 text-orange-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Analytics</h3>
          <p className="text-sm text-gray-600">
            Add your analytics dashboard or reporting components here.
          </p>
        </div>

        <div className="bg-white rounded-lg border p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Documents</h3>
          <p className="text-sm text-gray-600">
            Add your document management or file handling components here.
          </p>
        </div>

        <div className="bg-white rounded-lg border p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center mb-4">
            <Settings className="h-5 w-5 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Settings</h3>
          <p className="text-sm text-gray-600">
            Add your configuration or settings management components here.
          </p>
        </div>
      </div>

      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h2 className="font-semibold text-gray-900 mb-3">Quick Start Guide</h2>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>1. Add your pages in <code className="bg-gray-100 px-1 rounded">src/pages/</code></li>
          <li>2. Add routes in <code className="bg-gray-100 px-1 rounded">src/App.tsx</code> (standalone mode)</li>
          <li>3. Add sub-route handling in <code className="bg-gray-100 px-1 rounded">src/Module.tsx</code> (MFE mode)</li>
          <li>4. Add API services in <code className="bg-gray-100 px-1 rounded">src/services/</code></li>
          <li>5. Register in the shell's routes configuration</li>
        </ul>
      </div>
    </div>
  );
};

export default Home;
