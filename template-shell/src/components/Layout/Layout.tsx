import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  resolveLucideIcon,
} from "@template/shared";
import {
  User,
  LogOut,
  Home,
  PanelLeft,
  LayoutGrid,
  Box,
  Layers,
  ChevronDown,
  ChevronRight,
  Search,
  X,
  Settings,
} from "lucide-react";
import { ReactNode, useState, useEffect, useMemo, useRef } from "react";
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

  // Ambil display name dan username yang akurat dari data user (API / DB)
  const userDisplayName = user?.displayName || user?.name || user?.username || "Pengguna";
  const userUsername = user?.username || user?.email || "user";
  const userRole = user?.roles?.[1] || user?.roles?.[0] || "SA";

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
    const groupedMap = new Map<string, { groupName: string; groupIcon?: string | null; children: NavChildItem[] }>();

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
      const Icon = resolveLucideIcon(item.icon, code === "dashboard" ? Home : Box);

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
          groupedMap.set(groupCode, { groupName, groupIcon: item.groupIcon, children: [] });
        } else if (!groupedMap.get(groupCode)!.groupIcon && item.groupIcon) {
          groupedMap.get(groupCode)!.groupIcon = item.groupIcon;
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
        icon: resolveLucideIcon(groupData.groupIcon, Layers),
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

  // State & handler pencarian cepat global
  const [quickSearch, setQuickSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // State & ref untuk popover dropdown profil pengguna
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchFocused(false);
      }
      if (
        profileContainerRef.current &&
        !profileContainerRef.current.contains(e.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSearchFocused(false);
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Tutup dropdown jika rute berpindah
  useEffect(() => {
    setIsProfileOpen(false);
    setIsSearchFocused(false);
  }, [location.pathname]);

  // Indeks daftar seluruh menu untuk fitur pencarian cepat
  const searchableMenus = useMemo(() => {
    const list: {
      id: string;
      name: string;
      href: string;
      groupName: string;
      icon: React.ComponentType<{ className?: string }>;
    }[] = [];
    for (const entry of visibleNavEntries) {
      if (entry.type === "item") {
        list.push({
          id: entry.id,
          name: entry.name,
          href: entry.href,
          groupName: "Beranda",
          icon: entry.icon,
        });
      } else if (entry.type === "group") {
        for (const child of entry.children) {
          list.push({
            id: child.id,
            name: child.name,
            href: child.href,
            groupName: entry.name,
            icon: child.icon,
          });
        }
      }
    }
    return list;
  }, [visibleNavEntries]);

  // Hasil filter pencarian cepat
  const searchResults = useMemo(() => {
    const q = quickSearch.trim().toLowerCase();
    if (!q) return [];
    return searchableMenus
      .filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.groupName.toLowerCase().includes(q) ||
          m.href.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [quickSearch, searchableMenus]);

  // Konteks navigasi dinamis untuk breadcrumb di bilah atas
  const currentNavContext = useMemo(() => {
    const path = location.pathname;
    if (path === "/" || path === "/dashboard") {
      return { group: null, current: "Dashboard", href: "/dashboard" };
    }

    for (const entry of visibleNavEntries) {
      if (entry.type === "item") {
        if (path === entry.href || path.startsWith(entry.href + "/")) {
          return { group: null, current: entry.name, href: entry.href };
        }
      } else if (entry.type === "group") {
        for (const child of entry.children) {
          if (path === child.href || path.startsWith(child.href + "/")) {
            return { group: entry.name, current: child.name, href: child.href };
          }
        }
      }
    }

    const segments = path.split("/").filter(Boolean);
    const last = segments[segments.length - 1] || "Halaman";
    const formatted = last
      .split("-")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");

    return {
      group: segments.length > 1 ? segments[0].charAt(0).toUpperCase() + segments[0].slice(1) : null,
      current: formatted,
      href: path,
    };
  }, [location.pathname, visibleNavEntries]);

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
                    } ${sidebarExpanded ? "px-3 py-2.5 justify-between" : "px-0 py-2.5 justify-center"}`}
                  title={!sidebarExpanded ? entry.name : ""}
                >
                  <div className="flex items-center">
                    <GroupIcon
                      className={`h-5 w-5 shrink-0 transition-colors ${isGroupActive ? "text-orange-600" : "text-gray-400"
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
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-all duration-300 ease-in-out ${isOpen
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
                                ? "gap-3 px-3 py-2.5 w-full"
                                : "px-0 py-2.5 justify-center w-full"
                              }`}
                            title={!sidebarExpanded ? `${entry.name}: ${child.name}` : ""}
                          >
                            <ChildIcon
                              className={`h-5 w-5 shrink-0 transition-transform duration-200 ${isChildActive ? "text-orange-600 scale-105" : "text-gray-400"
                                }`}
                            />
                            <span
                              className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${sidebarExpanded
                                  ? "opacity-100 max-w-[150px] translate-x-0"
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
        <header className="h-16 bg-white/95 backdrop-blur-md border-b border-gray-200/80 sticky top-0 flex items-center justify-between px-4 sm:px-6 z-30 shadow-2xs">
          {/* Sisi Kiri: Tombol Toggle Sidebar & Breadcrumb Dinamis */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className="h-9 w-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all shadow-2xs cursor-pointer"
              title={sidebarExpanded ? "Ciutkan Sidebar" : "Buka Sidebar"}
            >
              <PanelLeft
                className={`h-4 w-4 text-gray-600 transition-transform duration-300 ease-in-out ${
                  !sidebarExpanded ? "rotate-180 text-orange-600" : ""
                }`}
              />
            </button>

            <div className="h-5 w-px bg-gray-200 mx-1 hidden sm:block" />

            {/* Breadcrumb Terstandarisasi di Bilah Atas */}
            <div className="flex items-center gap-1.5 text-xs">
              <Link
                to="/dashboard"
                className="text-gray-400 hover:text-orange-600 font-medium transition-colors hidden sm:inline"
              >
                Beranda
              </Link>
              {currentNavContext.group && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300 hidden sm:inline" />
                  <span className="text-gray-500 font-medium hidden sm:inline">
                    {currentNavContext.group}
                  </span>
                </>
              )}
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 hidden sm:inline" />
              <span className="text-gray-900 font-semibold text-sm tracking-tight">
                {currentNavContext.current}
              </span>
            </div>
          </div>

          {/* Sisi Kanan: Pencarian Cepat Global, Profil Pengguna, & Logout */}
          <div className="flex items-center gap-3 shrink-0 ml-4">
            {/* Pencarian Cepat Global (Fixed Width) */}
            <div ref={searchContainerRef} className="relative w-64 sm:w-72 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari rute, produk, menu..."
                  value={quickSearch}
                  onFocus={() => setIsSearchFocused(true)}
                  onChange={(e) => {
                    setQuickSearch(e.target.value);
                    setIsSearchFocused(true);
                  }}
                  className="w-full h-9 pl-9 pr-8 text-xs bg-gray-50/90 hover:bg-gray-100/70 focus:bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-gray-800 placeholder-gray-400 shadow-2xs"
                />
                {quickSearch && (
                  <button
                    type="button"
                    onClick={() => setQuickSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded cursor-pointer"
                    title="Bersihkan pencarian"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Dropdown Hasil Pencarian Cepat */}
              {isSearchFocused && quickSearch.trim().length > 0 && (
                <div className="absolute right-0 w-80 sm:w-96 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-2 border-b border-gray-50 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    Menu & Halaman Terkait
                  </div>
                  {searchResults.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-400">
                      Tidak ditemukan menu dengan kata kunci "{quickSearch}"
                    </div>
                  ) : (
                    <div className="p-1.5 space-y-0.5 max-h-80 overflow-y-auto">
                      {searchResults.map((item) => {
                        const ItemIcon = item.icon;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              navigate(item.href);
                              setQuickSearch("");
                              setIsSearchFocused(false);
                            }}
                            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-orange-50 text-left transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="p-1.5 rounded-lg bg-gray-100 group-hover:bg-orange-100 group-hover:text-orange-600 text-gray-600 transition-colors shrink-0">
                                <ItemIcon className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-gray-900 group-hover:text-orange-700 truncate">
                                  {item.name}
                                </div>
                                <div className="text-[10px] text-gray-400 font-mono truncate">
                                  {item.groupName} • {item.href}
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-orange-600 transition-colors shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profil Pengguna: [Icon/Foto Profil] [Nama di atas / Peran di bawah] */}
            <div ref={profileContainerRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsProfileOpen((prev) => !prev)}
                aria-expanded={isProfileOpen}
                aria-haspopup="true"
                aria-label="Menu profil pengguna"
                className="w-44 h-10 flex items-center gap-2.5 px-2 py-1 rounded-xl bg-transparent hover:bg-gray-100/70 active:bg-gray-200/50 transition-colors cursor-pointer select-none focus:outline-none"
              >
                {/* Icon / Foto Profil */}
                <div className="h-8 w-8 rounded-lg bg-orange-50 border border-orange-200/80 text-orange-700 flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                  {userDisplayName.charAt(0).toUpperCase()}
                </div>

                {/* Di atas: display name / nama. Di bawah: peran / role */}
                <div className="flex flex-col text-left min-w-0 flex-1">
                  <span
                    className="text-xs font-semibold text-gray-900 leading-tight truncate block"
                    title={userDisplayName}
                  >
                    {userDisplayName}
                  </span>
                  <span
                    className="text-[10px] font-medium text-gray-500 leading-tight truncate block uppercase tracking-wider mt-0.5"
                    title={userRole}
                  >
                    {userRole}
                  </span>
                </div>
              </button>

              {/* Popover Dropdown Profil (Rombak Total: Compact, Minimalist, Enterprise-Grade) */}
              {isProfileOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-gray-200/80 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 divide-y divide-gray-100">
                  {/* Header: Display Name di atas, Username di bawah (Bukan Role) */}
                  <div className="p-3 bg-gray-50/50 text-left">
                    <div
                      className="text-xs font-bold text-gray-900 truncate"
                      title={userDisplayName}
                    >
                      {userDisplayName}
                    </div>
                    <div
                      className="text-[11px] text-gray-500 truncate mt-0.5 font-mono"
                      title={userUsername}
                    >
                      @{userUsername}
                    </div>
                  </div>

                  {/* Menu Navigasi / Tindakan Cepat */}
                  <div className="p-1.5 space-y-0.5">
                    <Link
                      to="/dashboard"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 rounded-lg transition-colors group"
                    >
                      <Home className="w-4 h-4 text-gray-400 group-hover:text-orange-600 transition-colors shrink-0" />
                      <span>Dashboard Utama</span>
                    </Link>

                    {(canAccessMenu("pengaturan-aplikasi") || canAccessMenu("pengaturan-toko")) && (
                      <Link
                        to={
                          canAccessMenu("pengaturan-aplikasi")
                            ? "/pengaturan/pengaturan-aplikasi"
                            : "/pengaturan/pengaturan-toko"
                        }
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 rounded-lg transition-colors group"
                      >
                        <Settings className="w-4 h-4 text-gray-400 group-hover:text-orange-600 transition-colors shrink-0" />
                        <span>Pengaturan Sistem</span>
                      </Link>
                    )}
                  </div>

                  {/* Tombol Keluar Sesi */}
                  <div className="p-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer group text-left"
                    >
                      <LogOut className="w-4 h-4 text-red-500 group-hover:text-red-600 transition-colors shrink-0" />
                      <span>Keluar dari Akun</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main>{children}</main>
      </div>
    </div>
  );
}

export { Layout };
