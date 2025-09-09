
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Package, 
  MessageCircle, 
  CalendarDays, 
  ClipboardList, 
  User, 
  FileText, 
  Users, 
  Calendar, 
  LogOut,
  Settings,
  TrendingUp,
  BookOpen,
  Target,
  Building,
  Shield,
  FileSpreadsheet
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { supabase } from "@/integrations/supabase/client";

const items = [
  {
    title: "Lançamentos",
    url: "/lancamentos",
    icon: ClipboardList,
  },
  {
    title: "Diário de Turma", 
    url: "/diario",
    icon: CalendarDays,
  },
  {
    title: "Calendário de Aulas",
    url: "/calendario-aulas", 
    icon: Calendar,
  },
  {
    title: "Eventos",
    url: "/eventos",
    icon: Calendar,
  },
  {
    title: "Estoque",
    url: "/estoque",
    icon: Package,
  },
  {
    title: "Devolutivas",
    url: "/devolutivas",
    icon: MessageCircle,
  },
  {
    title: "Fichas",
    url: "/fichas",
    icon: FileText,
  },
  {
    title: "Funcionários",
    url: "/funcionarios",
    icon: User,
    requiresFuncionario: true,
  },
  {
    title: "Alunos Ativos",
    url: "/alunos-ativos",
    icon: Users,
  },
  {
    title: "Sincronizar Turmas",
    url: "/sincronizar-turmas",
    icon: FileSpreadsheet,
  },
  {
    title: "Painel Pedagógico",
    url: "/painel-pedagogico",
    icon: TrendingUp,
    requiresAdmin: true,
  },
  {
    title: "Correções AH",
    url: "/correcoes-ah",
    icon: BookOpen,
    requiresTeacher: true,
  },
  {
    title: "Projeto São Rafael",
    url: "/projeto-sao-rafael",
    icon: Target,
    requiresTeacher: true,
  },
  {
    title: "Gestão de Retenções",
    url: "/retencoes",
    icon: Shield,
    requiresAdmin: true,
  },
];

const additionalItems = [
  {
    title: "Configuração",
    url: "/admin/configuracao",
    icon: Settings,
    requiresAdmin: true,
  },
];

export function AppSidebar() {
  const { user } = useAuth();
  const { isAdmin, userRole } = useUserPermissions();
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkIfMobile = () => setIsMobile(window.innerWidth < 768);
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const isTeacher = userRole === 'educador';
  const isFuncionario = ['gestor_pedagogico', 'franqueado'].includes(userRole);

  const filteredItems = items.filter(item => {
    if (item.requiresAdmin && !isAdmin) return false;
    if (item.requiresTeacher && !isTeacher) return false;
    if (item.requiresFuncionario && !isFuncionario) return false;
    return true;
  });

  const adminItems = additionalItems.filter(item => isAdmin);

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border bg-sidebar-accent/50">
        <div className="flex h-16 items-center px-4">
          <Building className="h-8 w-8 text-primary mr-3" />
          <div className="flex flex-col">
            <span className="text-lg font-bold text-primary">Supera</span>
            <span className="text-xs text-sidebar-foreground/70">Sistema de Gestão</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/80 mb-2">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarMenu>
            {filteredItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild 
                  isActive={location.pathname === item.url}
                  className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  onClick={() => navigate(item.url)}
                >
                  <button className="flex items-center space-x-3 w-full p-2 rounded-md transition-colors">
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium">{item.title}</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {adminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/80 mb-2">
              Administração
            </SidebarGroupLabel>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === item.url}
                    className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    onClick={() => navigate(item.url)}
                  >
                    <button className="flex items-center space-x-3 w-full p-2 rounded-md transition-colors">
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="font-medium">{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border bg-sidebar-accent/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.email || 'Usuário'}
              </span>
              <span className="text-xs text-sidebar-foreground/70">
                {isAdmin ? 'Administrador' : isTeacher ? 'Professor' : isFuncionario ? 'Funcionário' : 'Usuário'}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
