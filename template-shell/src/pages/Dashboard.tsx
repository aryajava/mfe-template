import React from "react";
import { useAuth } from "../contexts/AuthContext";

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome{user?.name ? `, ${user.name}` : ""} to Template MFE Shell
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-2">Getting Started</h3>
          <p className="text-sm text-gray-600">
            This is the shell application. It hosts micro-frontends loaded via Module Federation.
          </p>
        </div>

        <div className="bg-white rounded-lg border p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-2">Child MFEs</h3>
          <p className="text-sm text-gray-600">
            Navigate to <code className="bg-gray-100 px-1 rounded">/child</code> to see the template child MFE loaded dynamically.
          </p>
        </div>

        <div className="bg-white rounded-lg border p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-2">MFE Hallo</h3>
          <p className="text-sm text-gray-600">
            Navigate to <code className="bg-gray-100 px-1 rounded">/hallo</code> to see the MFE Hallo loaded dynamically.
          </p>
        </div>

        <div className="bg-white rounded-lg border p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-2">Shared Library</h3>
          <p className="text-sm text-gray-600">
            The <code className="bg-gray-100 px-1 rounded">@template/shared</code> package provides common components, hooks, and utilities.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
