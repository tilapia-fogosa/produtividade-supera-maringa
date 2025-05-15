
import { toast as sonnerToast, useToast as useSonnerToast } from "sonner";

// Re-exportamos os hooks com aliases para evitar a circularidade
export const useToast = useSonnerToast;
export const toast = sonnerToast;
