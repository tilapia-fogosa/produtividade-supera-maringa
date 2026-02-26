
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Package,
  CalendarDays,
  ClipboardList,
  User,
  Users,
  Calendar,
  LogOut,
  Settings,
  BookOpen,
  Target,
  Building,
  Shield,
  FileSpreadsheet,
  ListChecks,
  MapPin,
  AlertTriangle,
  Award,
  Home,
  Image,
  Bell,
  Clock,
  LayoutDashboard,
  MessageCircle,
  TrendingUp
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
import { DollarSign } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useActiveUnit } from "@/contexts/ActiveUnitContext";
import { supabase } from "@/integrations/supabase/client";

const MARINGA_UNIT_ID = '0df79a04-444e-46ee-b218-59e4b1835f4a';

const items = [
  {
    title: "Boas Vindas",
    url: "/home",
    icon: Home,
  },
  {
    title: "Abrindo Horizontes",
    url: "/abrindo-horizontes-fila",
    icon: ListChecks,
  },
  {
    title: "Calendário de Aulas",
    url: "/calendario-aulas",
    icon: Calendar,
  },
  {
    title: "Agenda Professor",
    url: "/agenda-professores",
    icon: CalendarDays,
  },
  {
    title: "Reservas de Sala",
    url: "/reservas-sala",
    icon: MapPin,
    maringaOnly: true,
  },
  {
    title: "Alunos Ativos",
    url: "/alunos-ativos",
    icon: Users,
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
    maringaOnly: true,
  },
  {
    title: "Galeria de Fotos",
    url: "/galeria-fotos",
    icon: Image,
    maringaOnly: true,
  },
  {
    title: "Avisos",
    url: "/avisos",
    icon: Bell,
    maringaOnly: true,
  },
];

const additionalItems = [
  {
    title: "Funcionários",
    url: "/funcionarios",
    icon: User,
    requiresAdmin: true,
    maringaOnly: true,
  },
  {
    title: "Alertas de Falta",
    url: "/alertas-falta",
    icon: AlertTriangle,
    requiresAdmin: true,
  },
  {
    title: "Alertas de Evasão",
    url: "/alertas-evasao",
    icon: Shield,
    requiresAdmin: true,
  },
  {
    title: "Configurações",
    url: "/admin/configuracao",
    icon: Settings,
    requiresAdmin: true,
  },
  {
    title: "Controle de Ponto",
    url: "/controle-ponto",
    icon: Clock,
    requiresAdmin: true,
    maringaOnly: true,
  },
  {
    title: "Registro de Ponto",
    url: "/registro-ponto",
    icon: Clock,
    requiresAdmin: true,
    maringaOnly: true,
  },
  {
    title: "Indicadores Comerciais",
    url: "/indicadores-comerciais",
    icon: TrendingUp,
    requiresAdmin: true,
  },
];

const comercialItems = [
  {
    title: "Painel do Consultor",
    url: "/crm",
    icon: Target, // Using Target icon for CRM/Consultor as it fits well
  },
  {
    title: "Clientes da Unidade",
    url: "/clientes-unidade",
    icon: Users,
  },
  {
    title: "WhatsApp Comercial",
    url: "/whatsapp-comercial",
    icon: MessageCircle,
  },
  {
    title: "Comissão",
    url: "/comissao",
    icon: DollarSign,
  },
];

const administrativoItems: Array<{ title: string; url: string; icon: any; maringaOnly?: boolean }> = [
  {
    title: "Painel Administrativo",
    url: "/painel-administrativo",
    icon: LayoutDashboard,
  },
  {
    title: "Eventos",
    url: "/eventos",
    icon: Calendar,
  },
  {
    title: "Sincronizar Turmas",
    url: "/sincronizar-turmas",
    icon: FileSpreadsheet,
  },
];

export function AppSidebar() {
  const { user, profile } = useAuth();
  const { isAdmin, isAdministrativo, userRole } = useUserPermissions();
  const { activeUnit } = useActiveUnit();
  const isMaringa = activeUnit?.id === MARINGA_UNIT_ID;
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
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
    localStorage.removeItem('sb-hkvjdxxndapxpslovrlc-auth-token');
    window.location.href = '/auth/login';
  };

  const isTeacher = userRole === 'educador';
  const isFuncionario = ['gestor_pedagogico', 'franqueado'].includes(userRole);

  const filteredItems = items.filter(item => {
    if (item.maringaOnly && !isMaringa) return false;
    if (item.requiresTeacher && !isTeacher) return false;
    return true;
  });

  const isFranqueado = userRole === 'franqueado';

  const adminItems = additionalItems.filter(item => {
    if (!isAdmin && !isFranqueado) return false;
    if (item.maringaOnly && !isMaringa) return false;
    // Franqueado não precisa de requiresAdmin, já tem acesso
    return true;
  });

  const filteredAdministrativoItems = administrativoItems.filter(item => {
    if (item.maringaOnly && !isMaringa) return false;
    return true;
  });

  const isSDR = userRole === 'sdr';
  const isConsultor = userRole === 'consultor';
  const showComercial = isAdmin || isConsultor || isFranqueado || isSDR;


  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border bg-sidebar-accent/50">
        <button
          onClick={() => navigate('/home')}
          className="flex h-16 items-center px-4 hover:bg-sidebar-accent/50 transition-colors w-full"
        >
          <Building className="h-8 w-8 text-primary mr-3" />
          <div className="flex flex-col text-left">
            <span className="text-lg font-bold text-primary">Supera</span>
            <span className="text-xs text-sidebar-foreground/70">Sistema de Gestão</span>
          </div>
        </button>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/80 mb-2">
            Pedagógico
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

        {showComercial && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/80 mb-2">
              Comercial
            </SidebarGroupLabel>
            <SidebarMenu>
              {comercialItems.map((item) => (
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

        {(isAdmin || isAdministrativo || isFranqueado) && filteredAdministrativoItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/80 mb-2">
              Administrativo
            </SidebarGroupLabel>
            <SidebarMenu>
              {filteredAdministrativoItems.map((item) => (
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

        {adminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/80 mb-2">
              Gestão
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
          <button
            onClick={() => navigate('/meu-perfil')}
            className="flex items-center space-x-3 hover:bg-sidebar-accent rounded-md p-1 -m-1 transition-colors"
          >
            <Avatar className="h-8 w-8 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {(profile?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 text-left">
              <span className="text-sm font-medium text-sidebar-foreground break-words line-clamp-2 leading-tight">
                {profile?.full_name || 'Usuário'}
              </span>
              <span className="text-xs text-sidebar-foreground/70">
                {isAdmin ? 'Administrador' : isTeacher ? 'Professor' : isFuncionario ? 'Funcionário' : 'Usuário'}
              </span>
            </div>
          </button>
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
