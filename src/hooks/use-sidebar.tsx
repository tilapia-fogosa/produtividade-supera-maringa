
import { create } from "zustand";

interface SidebarState {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const useSidebar = create<SidebarState>((set) => ({
  isOpen: false,
  setIsOpen: (isOpen) => set({ isOpen }),
}));
