import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@template/shared";
import {
  User,
  LogOut,
  Home,
  PanelLeft,
  LayoutGrid,
  Box
} from "lucide-react";
import { ReactNode, useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { storage } from "../../utils/sastStorage";

interface LayoutProps {
  children: ReactNode;
}

interface NavigationItem {
  id: string;
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigation: NavigationItem[] = [
  { id: "dashboard", name: "Dashboard", href: "/dashboard", icon: Home },
  { id: "child-mfe", name: "Child MFE", href: "/child", icon: LayoutGrid },
  { id: "mfe-hallo", name: "MFE Hallo", href: "/hallo", icon: Box },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const [sidebarExpanded, setSidebarExpanded] = useState(() => {
    const saved = storage.retrieve("sidebarExpanded");
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    storage.store("sidebarExpanded", JSON.stringify(sidebarExpanded));
  }, [sidebarExpanded]);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-40 ${sidebarExpanded ? "w-64" : "w-20"
          }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {sidebarExpanded ? (
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-orange-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="font-bold text-base text-gray-900 whitespace-nowrap">
                Template MFE
              </span>
            </Link>
          ) : (
            <Link to="/dashboard" className="flex items-center justify-center w-full">
              <div className="h-8 w-8 rounded bg-orange-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
            </Link>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto h-[calc(100vh-6rem)]">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.href ||
              location.pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.id}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? "bg-orange-50 text-orange-600"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  } ${!sidebarExpanded ? "justify-center" : ""}`}
                title={!sidebarExpanded ? item.name : ""}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-orange-600" : ""}`} />
                {sidebarExpanded && <span className="whitespace-nowrap">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarExpanded ? "ml-64" : "ml-20"}`}>
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 sticky top-0 flex items-center justify-between px-6 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className="h-8 w-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <PanelLeft className="h-4 w-4 text-gray-600" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5">
              <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                <User className="h-4 w-4 text-orange-600" />
              </div>
              <span className="text-sm font-medium">{user?.name || "Admin User"}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-600 hover:text-red-700">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main>{children}</main>
      </div>
    </div>
  );
}

export { Layout };
