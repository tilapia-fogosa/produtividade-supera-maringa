
import { toast as sonnerToast } from "sonner";
import { create } from 'zustand';

// Tipo personalizado para manter compatibilidade com o uso atual no projeto
export interface CustomToastOptions {
  id?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
}

type ToastStore = {
  toasts: CustomToastOptions[];
  addToast: (toast: CustomToastOptions) => void;
  dismissToast: (id: string) => void;
}

// Cria uma store para gerenciar os toasts
const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => set((state) => ({ 
    toasts: [...state.toasts, { ...toast, id: toast.id || String(Math.random()) }]
  })),
  dismissToast: (id) => set((state) => ({ 
    toasts: state.toasts.filter((toast) => toast.id !== id)
  })),
}));

// Hook personalizado para manter compatibilidade
const useToast = () => {
  const { toasts, addToast, dismissToast } = useToastStore();
  
  // Função wrapper que transforma nossas opções personalizadas no formato aceito pelo sonner
  const toast = (options: CustomToastOptions) => {
    // Adicionamos o toast à nossa store para manter compatibilidade com o componente Toaster
    addToast(options);
    
    // Também chamamos o toast do sonner para exibição
    if (options.variant === "destructive") {
      return sonnerToast.error(options.title as string, {
        description: options.description,
        action: options.action,
      });
    }
    
    return sonnerToast(options.title as string, {
      description: options.description,
      action: options.action,
    });
  };

  return { toast, toasts, dismissToast };
};

// Função toast com formato compatível para uso direto (sem o hook)
const toast = (options: CustomToastOptions) => {
  // Adicionamos o toast à nossa store
  useToastStore.getState().addToast(options);
  
  // Também chamamos o toast do sonner para exibição
  if (options.variant === "destructive") {
    return sonnerToast.error(options.title as string, {
      description: options.description,
      action: options.action,
    });
  }
  
  return sonnerToast(options.title as string, {
    description: options.description,
    action: options.action,
  });
};

export { useToast, toast };
