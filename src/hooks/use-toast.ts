
import { toast as sonnerToast, useToast as useSonnerToast, ToastT } from "sonner";

// Tipo personalizado para manter compatibilidade com o uso atual no projeto
interface CustomToastOptions {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
}

// Hook personalizado para manter compatibilidade
const useToast = () => {
  // Função wrapper que transforma nossas opções personalizadas no formato aceito pelo sonner
  const toast = (options: CustomToastOptions) => {
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

  return { toast };
};

// Função toast com formato compatível para uso direto (sem o hook)
const toast = (options: CustomToastOptions) => {
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
