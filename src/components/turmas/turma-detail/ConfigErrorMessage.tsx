
import React from 'react';
import { AlertTriangle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ConfigErrorMessageProps {
  errorMessage: string | null;
}

const ConfigErrorMessage: React.FC<ConfigErrorMessageProps> = ({ errorMessage }) => {
  const isMobile = useIsMobile();
  
  if (!errorMessage) return null;
  
  return (
    <div className={`mb-3 p-2 border border-destructive bg-destructive/10 rounded-md ${isMobile ? "text-xs" : "text-sm"} flex items-center`}>
      <AlertTriangle className={`${isMobile ? "h-3.5 w-3.5 mr-1.5" : "h-4 w-4 mr-2"} text-destructive`} />
      <span>{errorMessage}</span>
    </div>
  );
};

export default ConfigErrorMessage;
