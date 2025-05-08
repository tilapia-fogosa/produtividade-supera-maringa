
import { useNavigate, useLocation } from "react-router-dom";
import { GraduationCap, Package, MessageCircle, CalendarDays, ClipboardList, User, FileText } from "lucide-react";
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
    title: "Painel Pedagógico",
    path: "/painel-pedagogico",
    icon: GraduationCap,
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
];

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Sidebar 
      variant="floating" 
      className="border-sidebar-border bg-sidebar"
      // Removendo as propriedades incompatíveis
      // collapsedSize="60px"
      // expandedSize="240px"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground">Menu</SidebarGroupLabel>
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
                      "hover:bg-[#FF6B00] hover:text-white",
                      isActive && "bg-white/20 text-white hover:bg-[#FF6B00]"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
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
