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
  Database,
  ShoppingCart,
  ShoppingBag,
  Bell,
  Tag,
  CheckCircle,
  Activity,
  Sliders,
  FileText,
  Users,
  UserCheck,
  Settings,
  Store,
  TrendingUp,
  Wrench,
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

const GROUP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  master: Database,
  transaksi: ShoppingBag,
  trx: ShoppingBag,
  operasional: ShoppingCart,
  monitoring: Activity,
  monitor: Activity,
  beranda: Home,
  laporan: FileText,
  report: FileText,
  pengaturan: Settings,
  maintenance: Wrench,
  maintain: Wrench,
};

const MENU_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard: Home,
  'master-produk': Package,
  'master-kategori': Layers,
  'master-ekspedisi': Truck,
  'master-pelanggan': Users,
  'master-user': UserCheck,
  pesanan: ShoppingBag,
  'permintaan-diskon': Tag,
  notifikasi: Bell,
  'persetujuan-diskon': CheckCircle,
  'laporan-penjualan': TrendingUp,
  'pengaturan-aplikasi': Sliders,
  'pengaturan-toko': Store,
  'audit-log': Activity,
  'user-control': Users,
  'hak-akses-peran': UserCheck,
  'master-grup-menu': Layers,
  'grup-menu': Layers,
  'master-menu': Box,
  'menu': Box,
};

const MENU_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  'master-produk': "Produk",
  'master-kategori': "Kategori",
  'master-ekspedisi': "Ekspedisi",
  'master-pelanggan': "Pelanggan",
  'master-user': "User Pengguna",
  pesanan: "Pesanan",
  'permintaan-diskon': "Permintaan Diskon",
  notifikasi: "Notifikasi",
  'persetujuan-diskon': "Persetujuan Diskon",
  'laporan-penjualan': "Laporan Penjualan",
  'pengaturan-aplikasi': "Pengaturan Aplikasi",
  'pengaturan-toko': "Pengaturan Toko",
  'audit-log': "Audit Log",
  'user-control': "User Control",
  'hak-akses-peran': "Hak Akses Peran",
  'master-grup-menu': "Grup Menu",
  'grup-menu': "Grup Menu",
  'master-menu': "Master Menu",
  'menu': "Master Menu",
};

const GROUP_LABELS: Record<string, string> = {
  master: "Master Data",
  transaksi: "Transaksi",
  trx: "Transaksi",
  operasional: "Operasional",
  monitoring: "Monitoring",
  monitor: "Monitoring",
  beranda: "Beranda",
  laporan: "Laporan",
  report: "Laporan",
  pengaturan: "Pengaturan",
  maintenance: "Maintenance",
  maintain: "Maintenance",
};

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user, canAccessMenu, menuPermissions } = useAuth();

  const [sidebarExpanded, setSidebarExpanded] = useState(() => {
    const saved = storage.retrieve("sidebarExpanded");
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    storage.store("sidebarExpanded", JSON.stringify(sidebarExpanded));
  }, [sidebarExpanded]);

  const visibleNavEntries = useMemo(() => {
    // 1. Kumpulkan daftar unik permission yang memiliki hak canRead
    const uniqueMap = new Map<string, any>();
    for (const [key, item] of Object.entries(menuPermissions)) {
      if (!item || !item.canRead) continue;
      const code = (item.menuCode || key).toLowerCase();
      if (!uniqueMap.has(code)) {
        uniqueMap.set(code, item);
      }
    }

    const items = Array.from(uniqueMap.values());

    // 2. Fallback default jika permission belum selesai termuat
    if (items.length === 0) {
      return [
        {
          type: "item" as const,
          id: "dashboard",
          name: "Dashboard",
          href: "/dashboard",
          icon: Home,
          menuCode: "dashboard",
        },
      ];
    }

    // 3. Pisahkan item single (Beranda / Dashboard) dan kelompokkan item lainnya berdasarkan groupCode
    const singleItems: NavSingleItem[] = [];
    const groupedMap = new Map<string, { groupName: string; children: NavChildItem[] }>();

    for (const item of items) {
      const code = (item.menuCode || "").toLowerCase();
      const groupCode = (item.groupCode || "").toLowerCase();
      const fullPath = item.fullPath || item.urlPrefix || `/${code}`;
      const name =
        item.menuName ||
        MENU_LABELS[code] ||
        code
          .split("-")
          .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(" ");
      const Icon = MENU_ICONS[code] || Box;

      if (code === "dashboard" || groupCode === "beranda" || !groupCode) {
        singleItems.push({
          type: "item",
          id: code,
          name,
          href: code === "dashboard" ? "/dashboard" : fullPath,
          icon: Icon,
          menuCode: code,
        });
      } else {
        if (!groupedMap.has(groupCode)) {
          const groupName =
            item.groupName ||
            GROUP_LABELS[groupCode] ||
            groupCode.charAt(0).toUpperCase() + groupCode.slice(1);
          groupedMap.set(groupCode, { groupName, children: [] });
        }
        groupedMap.get(groupCode)!.children.push({
          id: code,
          name,
          href: fullPath,
          icon: Icon,
          menuCode: code,
        });
      }
    }

    // 4. Susun daftar entri navigasi
    const entries: NavEntry[] = [...singleItems];

    for (const [groupCode, groupData] of groupedMap.entries()) {
      if (groupData.children.length === 0) continue;
      entries.push({
        type: "group",
        id: groupCode,
        name: groupData.groupName,
        icon: GROUP_ICONS[groupCode] || Layers,
        children: groupData.children,
      });
    }

    return entries;
  }, [menuPermissions]);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    try {
      const saved = storage.retrieve("sidebar_open_groups");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Otomatis buka accordion grup yang sedang aktif
  useEffect(() => {
    for (const entry of visibleNavEntries) {
      if (entry.type === "group") {
        const isGroupActive = entry.children.some(
          (child) =>
            location.pathname === child.href ||
            location.pathname.startsWith(child.href + "/")
        );
        if (isGroupActive) {
          setOpenGroups((prev) => {
            if (prev[entry.id]) return prev;
            const next = { ...prev, [entry.id]: true };
            storage.store("sidebar_open_groups", JSON.stringify(next));
            return next;
          });
        }
      }
    }
  }, [location.pathname, visibleNavEntries]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      storage.store("sidebar_open_groups", JSON.stringify(next));
      return next;
    });
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 ease-in-out z-40 flex flex-col ${sidebarExpanded ? "w-64" : "w-20"
          }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-gray-200 overflow-hidden shrink-0">
          <Link to="/dashboard" className="flex items-center gap-3 min-w-max">
            <div className="h-8 w-8 rounded-lg bg-orange-500 flex items-center justify-center shrink-0 shadow-2xs">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span
              className={`font-bold text-base text-gray-900 whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${sidebarExpanded
                  ? "opacity-100 max-w-[160px] translate-x-0"
                  : "opacity-0 max-w-0 -translate-x-3 pointer-events-none"
                }`}
            >
              Template MFE
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
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
                  className={`flex items-center rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                      ? "bg-orange-50 text-orange-600 font-semibold"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    } ${sidebarExpanded ? "px-3 py-2.5" : "px-0 py-2.5 justify-center"}`}
                  title={!sidebarExpanded ? entry.name : ""}
                >
                  <Icon
                    className={`h-5 w-5 shrink-0 transition-transform duration-200 ${isActive ? "text-orange-600 scale-105" : "text-gray-500"
                      }`}
                  />
                  <span
                    className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${sidebarExpanded
                        ? "opacity-100 max-w-[150px] ml-3 translate-x-0"
                        : "opacity-0 max-w-0 ml-0 -translate-x-2 pointer-events-none"
                      }`}
                  >
                    {entry.name}
                  </span>
                </Link>
              );
            }

            // Grup: Accordion Dinamis
            const GroupIcon = entry.icon;
            const isGroupActive = entry.children.some(
              (child) =>
                location.pathname === child.href ||
                location.pathname.startsWith(child.href + "/")
            );
            const isOpen = openGroups[entry.id] ?? false;

            return (
              <div key={entry.id} className="pt-1">
                {/* Accordion Header Button */}
                <button
                  type="button"
                  onClick={() => toggleGroup(entry.id)}
                  className={`w-full flex items-center rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-200 ${isGroupActive
                      ? "text-orange-700 bg-orange-50/70"
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                    } ${sidebarExpanded ? "px-3 py-2 justify-between" : "px-0 py-2 justify-center"}`}
                  title={!sidebarExpanded ? entry.name : ""}
                >
                  <div className="flex items-center">
                    <GroupIcon
                      className={`h-4 w-4 shrink-0 transition-colors ${isGroupActive ? "text-orange-600" : "text-gray-400"
                        }`}
                    />
                    <span
                      className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${sidebarExpanded
                          ? "opacity-100 max-w-[120px] ml-2.5 translate-x-0"
                          : "opacity-0 max-w-0 ml-0 -translate-x-2 pointer-events-none"
                        }`}
                    >
                      {entry.name}
                    </span>
                  </div>
                  <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 transition-all duration-300 ease-in-out ${isOpen
                        ? "rotate-0 text-orange-600"
                        : "-rotate-90 text-gray-400"
                      } ${sidebarExpanded
                        ? "opacity-100 scale-100"
                        : "opacity-0 scale-50 max-w-0 overflow-hidden"
                      }`}
                  />
                </button>

                {/* Sub-menu Item with CSS Grid Accordion Transition */}
                <div
                  className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${isOpen
                      ? "grid-rows-[1fr] opacity-100 mt-1"
                      : "grid-rows-[0fr] opacity-0 pointer-events-none"
                    }`}
                >
                  <div className="overflow-hidden">
                    <div
                      className={`transition-all duration-300 space-y-1 py-0.5 ${sidebarExpanded
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
                            className={`flex items-center rounded-lg text-sm font-medium transition-all duration-200 ${isChildActive
                                ? "bg-orange-50 text-orange-600 font-semibold shadow-2xs"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                              } ${sidebarExpanded
                                ? "gap-2.5 px-3 py-2 w-full"
                                : "p-2 justify-center w-full"
                              }`}
                            title={!sidebarExpanded ? `${entry.name}: ${child.name}` : ""}
                          >
                            <ChildIcon
                              className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isChildActive ? "text-orange-600 scale-105" : "text-gray-400"
                                }`}
                            />
                            <span
                              className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${sidebarExpanded
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
                className={`h-4 w-4 text-gray-600 transition-transform duration-300 ease-in-out ${!sidebarExpanded ? "rotate-180 text-orange-600" : ""
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
