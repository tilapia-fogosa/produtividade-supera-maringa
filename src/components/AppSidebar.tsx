import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Menu, X, LayoutDashboard, Book, Calendar, GraduationCap, Users, Settings, SendIcon } from 'lucide-react';
import { Separator } from "@/components/ui/separator"
import { useSidebar } from '@/hooks/use-sidebar';

const AppSidebar = () => {
  const { isOpen, setIsOpen } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();

  const closeSidebar = () => {
    setIsOpen(false);
  };
  
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button className="md:hidden p-2 rounded-md hover:bg-accent">
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px] bg-white">
        <SheetHeader className="space-y-2.5">
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription>
            Navegue pelas funcionalidades do sistema.
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-4">
          <nav className="flex flex-col gap-2">
            <Link 
              to="/dashboard" 
              onClick={closeSidebar} 
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-slate-900 transition-all hover:text-orange-500 ${location.pathname === '/dashboard' ? 'bg-orange-100 text-orange-500' : ''}`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link 
              to="/turmas" 
              onClick={closeSidebar} 
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-slate-900 transition-all hover:text-orange-500 ${location.pathname === '/turmas' ? 'bg-orange-100 text-orange-500' : ''}`}
            >
              <GraduationCap className="h-4 w-4" />
              Turmas
            </Link>
            <Link 
              to="/professores" 
              onClick={closeSidebar} 
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-slate-900 transition-all hover:text-orange-500 ${location.pathname === '/professores' ? 'bg-orange-100 text-orange-500' : ''}`}
            >
              <Users className="h-4 w-4" />
              Professores
            </Link>
            <Link 
              to="/calendario" 
              onClick={closeSidebar} 
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-slate-900 transition-all hover:text-orange-500 ${location.pathname === '/calendario' ? 'bg-orange-100 text-orange-500' : ''}`}
            >
              <Calendar className="h-4 w-4" />
              Calendário
            </Link>
            <Link 
              to="/lancamentos" 
              onClick={closeSidebar} 
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-slate-900 transition-all hover:text-orange-500 ${location.pathname === '/lancamentos' ? 'bg-orange-100 text-orange-500' : ''}`}
            >
              <Book className="h-4 w-4" />
              Lançamentos
            </Link>
            
            {/* Developer section */}
            <Separator className="my-2" />
            <span className="px-4 text-xs font-semibold text-muted-foreground">Ferramentas de Desenvolvimento</span>
            <Link 
              to="/test-slack" 
              onClick={closeSidebar} 
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-900 transition-all hover:text-orange-500"
            >
              <SendIcon className="h-4 w-4" />
              Testar Slack
            </Link>
            
            <Separator className="my-2" />
            <Link 
              to="/settings" 
              onClick={closeSidebar} 
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-slate-900 transition-all hover:text-orange-500 ${location.pathname === '/settings' ? 'bg-orange-100 text-orange-500' : ''}`}
            >
              <Settings className="h-4 w-4" />
              Configurações
            </Link>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AppSidebar;
