
import React from 'react';
import { AlertTriangle } from "lucide-react";

interface ConfigErrorMessageProps {
  errorMessage: string | null;
}

const ConfigErrorMessage: React.FC<ConfigErrorMessageProps> = ({ errorMessage }) => {
  if (!errorMessage) return null;
  
  return (
    <div className="mb-3 p-2 border border-destructive bg-destructive/10 rounded-md text-sm flex items-center">
      <AlertTriangle className="h-4 w-4 mr-2 text-destructive" />
      <span>{errorMessage}</span>
    </div>
  );
};

export default ConfigErrorMessage;
