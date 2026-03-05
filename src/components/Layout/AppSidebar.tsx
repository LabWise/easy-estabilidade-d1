import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';
import { 
  Home, 
  Plus, 
  Beaker, 
  Package,
  Settings, 
  FileText,
  Activity,
  FlaskConical,
  ClipboardList,
  Calendar
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';

const menuItems = [
  { icon: Home, label: 'Dashboard', path: '/', page: 'dashboard' },
  { icon: Plus, label: 'Entrada de Amostras', path: '/entrada', page: 'entrada' },
  { icon: Beaker, label: 'Gestão de Amostras', path: '/gestao', page: 'gestao' },
  { icon: Package, label: 'Retirada de Amostras', path: '/retirada', page: 'retirada' },
  { icon: Calendar, label: 'Próximas Retiradas', path: '/proximas-retiradas', page: 'proximas-retiradas' },
  { icon: FlaskConical, label: 'Análises Laboratoriais', path: '/analises', page: 'analises' },
  { icon: FileText, label: 'Relatórios', path: '/relatorios', page: 'relatorios' },
  { icon: ClipboardList, label: 'Audit Trail', path: '/audit-trail', page: 'audit-trail', requireAuditTrail: true },
  { icon: Settings, label: 'Configurações', path: '/configuracoes', page: 'configuracoes' },
];

const LOGO_URL = "https://vfhebnctlsyiduwciiuo.supabase.co/storage/v1/object/public/icons/easyestabilidade-logo.png";

export const AppSidebar = () => {
  const location = useLocation();
  const { state } = useSidebar();
  const { canAccessPage, canAccessAuditTrail } = useUserProfile();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" className={isCollapsed ? 'w-16' : 'w-64'}>
      {/* Logo/Header */}
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
            <img 
              src={LOGO_URL} 
              alt="Easy Estabilidade Logo" 
              className="w-6 h-6 object-contain"
            />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-foreground truncate">Easy Estabilidade</h1>
              <p className="text-xs text-muted-foreground truncate">QAS</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          {!isCollapsed && <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems
                .filter(item => {
                  // Filtrar itens baseado no perfil do usuário
                  if (item.requireAuditTrail) {
                    return canAccessAuditTrail();
                  }
                  return canAccessPage(item.page);
                })
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive}
                        tooltip={isCollapsed ? item.label : undefined}
                        className={isCollapsed ? 'justify-center' : ''}
                      >
                        <Link to={item.path} className="flex items-center gap-3">
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          {!isCollapsed && <span className="truncate">{item.label}</span>}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-sidebar-border p-4">
        {!isCollapsed ? (
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Copyright © 2026 LabWise.</p>
            <p>Todos os direitos reservados.</p>
            <p>LabWise Ltda</p>
            <p className="text-primary">suporte@easyestabilidade.com.br</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};
