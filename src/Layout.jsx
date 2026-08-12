import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  LayoutDashboard,
  Layers,
  Map,
  CheckSquare,
  ClipboardCheck,
  BarChart3,
  Settings,
  BookOpen,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Building2,
  HardHat,
  Users,
  ShieldCheck
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import api from '@/services/api';
import { useAuth } from '@/lib/AuthContext';
import { isFx4SuperAdmin } from '@/lib/superAdmin';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

export default function Layout({ children, currentPageName }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { user, logout, assistedTenant, endAssistedAccess } = useAuth();
  const queryClient = useQueryClient();
  const canAccessFx4Saas = isFx4SuperAdmin(user);
  const isCentralFx4Mode = canAccessFx4Saas && !assistedTenant;
  const vpsIp = (import.meta.env.VITE_VPS_IP || '').trim();

  // Notifications Logic
  const { data: notifications } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const res = await api.get('/resources/notifications', {
        params: { user_email: user.email, is_read: 'false' }
      });
      // Client-side sort and limit since generic controller might not support it yet
      return (res.data || [])
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10);
    },
    enabled: !!user?.email && !isCentralFx4Mode,
    refetchInterval: 30000 // Poll every 30s
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => api.put(`/resources/notifications/${id}`, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries(['notifications'])
  });

  const unreadCount = notifications?.length || 0;

  // Fetch System Configs for Logos
  const { data: systemConfigs } = useQuery({
    queryKey: ['systemConfigs'],
    queryFn: async () => {
      const res = await api.get('/resources/system-configs');
      return res.data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !isCentralFx4Mode,
  });

  const clientLogoUrl = systemConfigs?.find(c => c.key === 'client_logo_url')?.value;
  const fx4LogoUrl = "https://fx4.com.br/wp-content/uploads/2025/07/logo-bola.png";
  const sidebarLogoUrl = clientLogoUrl || fx4LogoUrl;
  const sidebarLogoAlt = clientLogoUrl ? 'Client Logo' : 'FX4 Logo';

  const handleLogout = async () => {
    logout();
  };

  const clientMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: 'Dashboard' },
    { icon: Layers, label: 'TAO', path: 'TaoList' },
    { icon: Map, label: 'Mapa de Calor', path: 'Heatmap' },
    { icon: CheckSquare, label: 'Aprovações', path: 'Approvals' },
    { icon: BarChart3, label: 'Relatórios', path: 'Reports' },
    { icon: Settings, label: 'Configurações', path: 'Settings' },
    { icon: BookOpen, label: 'Manual do Sistema', path: 'Manual' },
    ...(user?.role === 'admin' ? [{ icon: Users, label: 'Usuários', path: 'Users' }] : []),
  ];

  const centralMenuItems = [
    { icon: Settings, label: 'Configurações', path: 'Settings' },
    { icon: ShieldCheck, label: 'Painel SaaS FX4', path: 'SaasAdmin' },
  ];

  const menuItems = isCentralFx4Mode ? centralMenuItems : clientMenuItems;

  // Filter menu items for non-admin users
  const filteredMenuItems = user?.role !== 'admin'
    ? menuItems.filter(item => ['TaoList', 'Approvals', 'Manual'].includes(item.path))
    : menuItems;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex">
      {/* Sidebar Desktop - Dark Theme */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white border-r border-slate-800 fixed h-full z-30">
        <div className="p-6 border-b border-slate-800 flex flex-col items-center gap-2">
          <img src={sidebarLogoUrl} alt={sidebarLogoAlt} className="max-h-16 max-w-40 rounded bg-white object-contain p-1" />
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-slate-200 tracking-wider">
              {assistedTenant ? `FXTAO - ${assistedTenant.display_name}` : 'FXTAO SaaS'}
            </span>
            <span className="text-xs text-slate-500">
              {assistedTenant ? 'Acesso assistido FX4' : 'Administração FX4'}
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const isActive = currentPageName === item.path;
            const Icon = item.icon;
            return (
              <Link key={item.path} to={createPageUrl(item.path)}>
                <div className={`
                  flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 text-sm font-medium
                  ${isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          {clientLogoUrl && (
            <div className="mb-4 flex justify-center pb-4 border-b border-slate-800">
              <img
                src={clientLogoUrl}
                alt="Client Logo"
                className="max-h-12 max-w-full object-contain"
                onError={(e) => e.target.style.display = 'none'} // Hide if broken
              />
            </div>
          )}
          <div className="flex items-center gap-3 mb-4 px-2">
            <Avatar className="h-9 w-9 border border-slate-700">
              <AvatarImage src={user?.avatar_url} />
              <AvatarFallback className="bg-slate-700 text-slate-300">
                {user?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {assistedTenant ? `Suporte FX4 em ${assistedTenant.display_name}` : (user?.full_name || 'Usuário')}
              </p>
              {assistedTenant && (
                <p className="text-xs text-slate-500 truncate">Administrador · Visão de negócio</p>
              )}

            </div>
          </div>
          {assistedTenant && (
            <Button
              variant="outline"
              className="mb-2 w-full justify-start border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"
              onClick={endAssistedAccess}
            >
              Retornar à administração FX4
            </Button>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
          {vpsIp && (
            <div className="mt-4 border-t border-slate-800 pt-3 text-[11px] font-medium uppercase tracking-wider text-slate-500">
              VPS IP: <span className="font-mono text-slate-400">{vpsIp}</span>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 text-white border-b border-slate-800 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <HardHat className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg">FX TAO</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white hover:bg-slate-800">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-900/80 z-40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Mobile Sidebar */}
      <div className={`
        md:hidden fixed inset-y-0 left-0 w-72 bg-slate-900 text-white z-50 transform transition-transform duration-300 ease-in-out shadow-2xl
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <span className="text-xl font-bold text-white">Menu</span>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </Button>
        </div>
        <nav className="p-4 space-y-2">
          {filteredMenuItems.map((item) => (
            <Link key={item.path} to={createPageUrl(item.path)} onClick={() => setIsMobileMenuOpen(false)}>
              <div className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                <item.icon className="w-5 h-5" />
                {item.label}
              </div>
            </Link>
          ))}
        </nav>
        {vpsIp && (
          <div className="absolute bottom-4 left-4 right-4 border-t border-slate-800 pt-3 text-[11px] font-medium uppercase tracking-wider text-slate-500">
            VPS IP: <span className="font-mono text-slate-400">{vpsIp}</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-h-screen flex flex-col bg-slate-50/50">
        {/* Desktop Header */}
        <header className="hidden md:flex h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20 px-8 items-center justify-between shadow-sm">
          <div className="flex items-center text-sm text-slate-500">
            <span className="font-medium text-slate-900">{menuItems.find(i => i.path === currentPageName)?.label || currentPageName}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar..."
                className="pl-9 pr-4 py-1.5 text-sm bg-slate-100 border-transparent rounded-full focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all w-64"
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-600 relative">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 mr-4" align="end">
                <div className="p-4 border-b border-slate-100">
                  <h4 className="font-medium text-slate-900">Notificações</h4>
                </div>
                <ScrollArea className="h-[300px]">
                  {unreadCount === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">
                      Nenhuma nova notificação.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={() => {
                            markReadMutation.mutate(notif.id);
                            if (notif.link) window.location.href = notif.link;
                          }}
                        >
                          <p className="text-sm font-medium text-slate-900">{notif.title}</p>
                          <p className="text-xs text-slate-500 mt-1">{notif.message}</p>
                          <p className="text-[10px] text-slate-400 mt-2">
                            {format(new Date(notif.created_date), 'dd/MM/yyyy HH:mm')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        <div className="p-4 md:p-8 mt-16 md:mt-0 flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
