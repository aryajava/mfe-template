import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@template/shared";
import {
  User,
  LogOut,
  Home,
  PanelLeft,
  LayoutGrid,
  Box,
  Package,
  Layers,
  Truck,
  ChevronDown,
  Database
} from "lucide-react";
import { ReactNode, useState, useEffect, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { storage } from "../../utils/sastStorage";

interface LayoutProps {
  children: ReactNode;
}

interface NavSingleItem {
  type: "item";
  id: string;
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  menuCode?: string;
}

interface NavChildItem {
  id: string;
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  menuCode?: string;
}

interface NavGroupItem {
  type: "group";
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  children: NavChildItem[];
}

type NavEntry = NavSingleItem | NavGroupItem;

const navigationEntries: NavEntry[] = [
  {
    type: "item",
    id: "dashboard",
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
    menuCode: "dashboard",
  },
  {
    type: "group",
    id: "master",
    name: "Master",
    icon: Database,
    children: [
      { id: "master-produk", name: "Produk", href: "/master/produk", icon: Package, menuCode: "master-produk" },
      { id: "master-kategori", name: "Kategori", href: "/master/kategori", icon: Layers, menuCode: "master-kategori" },
      { id: "master-ekspedisi", name: "Ekspedisi", href: "/master/ekspedisi", icon: Truck, menuCode: "master-ekspedisi" },
    ],
  },
  {
    type: "item",
    id: "child-mfe",
    name: "Child MFE",
    href: "/child",
    icon: LayoutGrid,
  },
  {
    type: "item",
    id: "mfe-hallo",
    name: "MFE Hallo",
    href: "/hallo",
    icon: Box,
  },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user, canAccessMenu, menuPermissions } = useAuth();

  const [sidebarExpanded, setSidebarExpanded] = useState(() => {
    const saved = storage.retrieve("sidebarExpanded");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const isMasterActive = location.pathname.startsWith("/master");
  const [isMasterOpen, setIsMasterOpen] = useState<boolean>(() => {
    const saved = storage.retrieve("navGroup_master");
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    storage.store("sidebarExpanded", JSON.stringify(sidebarExpanded));
  }, [sidebarExpanded]);

  // Otomatis buka accordion Master jika pengguna berada pada rute /master/*
  useEffect(() => {
    if (isMasterActive) {
      setIsMasterOpen(true);
    }
  }, [isMasterActive]);

  const toggleMasterGroup = () => {
    setIsMasterOpen((prev) => {
      const next = !prev;
      storage.store("navGroup_master", JSON.stringify(next));
      return next;
    });
  };

  const handleLogout = () => {
    logout();
  };

  const visibleNavEntries = useMemo(() => {
    return navigationEntries
      .map((entry) => {
        if (entry.type === "item") {
          if (entry.menuCode && !canAccessMenu(entry.menuCode)) {
            return null;
          }
          return entry;
        } else {
          // Saring anak menu berdasarkan hak akses peran di database
          const visibleChildren = entry.children.filter((child) => {
            if (child.menuCode && !canAccessMenu(child.menuCode)) {
              return false;
            }
            return true;
          });

          // Sembunyikan seluruh grup bila tidak ada satu pun menu anak yang diizinkan
          if (visibleChildren.length === 0) {
            return null;
          }

          return {
            ...entry,
            children: visibleChildren,
          };
        }
      })
      .filter((entry): entry is NavEntry => entry !== null);
  }, [canAccessMenu, menuPermissions]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 ease-in-out z-40 ${
          sidebarExpanded ? "w-64" : "w-20"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-gray-200 overflow-hidden">
          <Link to="/dashboard" className="flex items-center gap-3 min-w-max">
            <div className="h-8 w-8 rounded-lg bg-orange-500 flex items-center justify-center shrink-0 shadow-2xs">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span
              className={`font-bold text-base text-gray-900 whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
                sidebarExpanded
                  ? "opacity-100 max-w-[160px] translate-x-0"
                  : "opacity-0 max-w-0 -translate-x-3 pointer-events-none"
              }`}
            >
              Template MFE
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-5 px-3 space-y-1.5 overflow-y-auto h-[calc(100vh-6rem)]">
          {visibleNavEntries.map((entry) => {
            if (entry.type === "item") {
              const Icon = entry.icon;
              const isActive =
                location.pathname === entry.href ||
                location.pathname.startsWith(entry.href + "/");

              return (
                <Link
                  key={entry.id}
                  to={entry.href}
                  className={`flex items-center rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-orange-50 text-orange-600 font-semibold"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  } ${sidebarExpanded ? "px-3 py-2.5" : "px-0 py-2.5 justify-center"}`}
                  title={!sidebarExpanded ? entry.name : ""}
                >
                  <Icon
                    className={`h-5 w-5 shrink-0 transition-transform duration-200 ${
                      isActive ? "text-orange-600 scale-105" : "text-gray-500"
                    }`}
                  />
                  <span
                    className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
                      sidebarExpanded
                        ? "opacity-100 max-w-[150px] ml-3 translate-x-0"
                        : "opacity-0 max-w-0 ml-0 -translate-x-2 pointer-events-none"
                    }`}
                  >
                    {entry.name}
                  </span>
                </Link>
              );
            }

            // Grup: Master
            const GroupIcon = entry.icon;
            const isGroupActive = entry.children.some(
              (child) =>
                location.pathname === child.href ||
                location.pathname.startsWith(child.href + "/")
            );

            return (
              <div key={entry.id} className="pt-1">
                {/* Accordion Header Button */}
                <button
                  type="button"
                  onClick={toggleMasterGroup}
                  className={`w-full flex items-center rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-200 ${
                    isGroupActive
                      ? "text-orange-700 bg-orange-50/70"
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                  } ${sidebarExpanded ? "px-3 py-2 justify-between" : "px-0 py-2 justify-center"}`}
                  title={!sidebarExpanded ? "Master Data" : ""}
                >
                  <div className="flex items-center">
                    <GroupIcon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        isGroupActive ? "text-orange-600" : "text-gray-400"
                      }`}
                    />
                    <span
                      className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
                        sidebarExpanded
                          ? "opacity-100 max-w-[120px] ml-2.5 translate-x-0"
                          : "opacity-0 max-w-0 ml-0 -translate-x-2 pointer-events-none"
                      }`}
                    >
                      {entry.name}
                    </span>
                  </div>
                  <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 transition-all duration-300 ease-in-out ${
                      isMasterOpen
                        ? "rotate-0 text-orange-600"
                        : "-rotate-90 text-gray-400"
                    } ${
                      sidebarExpanded
                        ? "opacity-100 scale-100"
                        : "opacity-0 scale-50 max-w-0 overflow-hidden"
                    }`}
                  />
                </button>

                {/* Sub-menu Item Master with CSS Grid Accordion Transition */}
                <div
                  className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                    isMasterOpen
                      ? "grid-rows-[1fr] opacity-100 mt-1"
                      : "grid-rows-[0fr] opacity-0 pointer-events-none"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div
                      className={`transition-all duration-300 space-y-1 py-0.5 ${
                        sidebarExpanded
                          ? "ml-4 pl-2.5 border-l-2 border-orange-100"
                          : "flex flex-col items-center border-y border-gray-100 my-1 py-1"
                      }`}
                    >
                      {entry.children.map((child) => {
                        const ChildIcon = child.icon;
                        const isChildActive =
                          location.pathname === child.href ||
                          location.pathname.startsWith(child.href + "/");

                        return (
                          <Link
                            key={child.id}
                            to={child.href}
                            className={`flex items-center rounded-lg text-sm font-medium transition-all duration-200 ${
                              isChildActive
                                ? "bg-orange-50 text-orange-600 font-semibold shadow-2xs"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            } ${
                              sidebarExpanded
                                ? "gap-2.5 px-3 py-2 w-full"
                                : "p-2 justify-center w-full"
                            }`}
                            title={!sidebarExpanded ? `Master: ${child.name}` : ""}
                          >
                            <ChildIcon
                              className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                                isChildActive ? "text-orange-600 scale-105" : "text-gray-400"
                              }`}
                            />
                            <span
                              className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
                                sidebarExpanded
                                  ? "opacity-100 max-w-[130px] translate-x-0"
                                  : "opacity-0 max-w-0 -translate-x-2 pointer-events-none"
                              }`}
                            >
                              {child.name}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ease-in-out ${sidebarExpanded ? "ml-64" : "ml-20"}`}>
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 sticky top-0 flex items-center justify-between px-6 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className="h-9 w-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all shadow-2xs"
              title={sidebarExpanded ? "Ciutkan Sidebar" : "Buka Sidebar"}
            >
              <PanelLeft
                className={`h-4 w-4 text-gray-600 transition-transform duration-300 ease-in-out ${
                  !sidebarExpanded ? "rotate-180 text-orange-600" : ""
                }`}
              />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2.5 px-3 py-1.5">
              <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                <User className="h-4 w-4 text-orange-600" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-semibold text-gray-900 leading-tight">{user?.name || "Admin User"}</span>
                <span className="text-[10px] font-bold text-orange-600 tracking-wider">
                  {user?.roles?.[1] || user?.roles?.[0]?.toUpperCase() || "USER"}
                </span>
              </div>
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
