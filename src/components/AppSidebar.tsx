
import { useNavigate, useLocation } from "react-router-dom";
import { Package, MessageCircle, CalendarDays, ClipboardList, User, FileText, Users, BookText } from "lucide-react";
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
  {
    title: "Correções Abrindo Horizontes",
    path: "/correcoes-ah",
    icon: BookText,
  },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Sidebar 
      variant="floating" 
      className="border-sidebar-border bg-sidebar"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground font-medium">Menu</SidebarGroupLabel>
          <SidebarMenu>
            {menuItems.map((item) => {
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
      </SidebarContent>
    </Sidebar>
  );
}
