
import { useNavigate, useLocation } from "react-router-dom";
import { Settings, GraduationCap, Package, MessageCircle, CalendarDays, Home } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const menuItems = [
  {
    title: "Home",
    path: "/home",
    icon: Home,
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
];

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Sidebar variant="floating">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.path)}
                    isActive={location.pathname === item.path}
                    tooltip={item.title}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
