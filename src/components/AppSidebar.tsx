
import { useNavigate, useLocation } from "react-router-dom";
import { Package, MessageCircle, CalendarDays, ClipboardList, User, FileText, Users, Calendar, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useAuth } from "@/contexts/AuthContext";

const menuItems = [
  {
    title: "Lançamentos",
    path: "/lancamentos",
    icon: ClipboardList,
  },
  {
    title: "Diário de Turma",
    path: "/diario",
    icon: CalendarDays,
  },
  {
    title: "Calendário de Aulas",
    path: "/calendario-aulas",
    icon: Calendar,
  },
  {
    title: "Estoque",
    path: "/estoque",
    icon: Package,
  },
  {
    title: "Devolutivas",
    path: "/devolutivas",
    icon: MessageCircle,
  },
  {
    title: "Fichas",
    path: "/fichas",
    icon: FileText,
  },
  {
    title: "Funcionários",
    path: "/funcionarios",
    icon: User,
  },
  {
    title: "Alunos Ativos",
    path: "/alunos-ativos",
    icon: Users,
  },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPageAccess } = useUserPermissions();
  const { signOut, profile } = useAuth();

  // Filtrar itens do menu baseado nas permissões do usuário
  const accessibleMenuItems = menuItems.filter(item => hasPageAccess(item.path));

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/login');
  };

  return (
    <Sidebar 
      variant="floating" 
      className="border-sidebar-border bg-sidebar"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground font-medium">Menu</SidebarGroupLabel>
          <SidebarMenu>
            {accessibleMenuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.path)}
                    isActive={isActive}
                    tooltip={item.title}
                    className={cn(
                      "text-sidebar-foreground transition-colors duration-200",
                      "hover:bg-sidebar-primary hover:text-sidebar-primary-foreground",
                      isActive && "bg-white/20 text-white hover:bg-sidebar-primary"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>

        {/* Seção do usuário */}
        <SidebarGroup className="mt-auto">
          <div className="px-3 py-2 text-sm text-sidebar-foreground/80">
            <p className="font-medium">{profile?.full_name || 'Usuário'}</p>
            <p className="text-xs capitalize">{profile?.role?.replace(/_/g, ' ') || 'Sem perfil'}</p>
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleSignOut}
                className="text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-primary/10"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sair</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
