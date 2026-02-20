
import React from 'react';
import { useIsMobile } from "@/hooks/use-mobile";

const TurmasVazia: React.FC = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className="text-center py-4">
      <p className={isMobile ? "text-sm" : ""}>
        Não há turmas cadastradas para este(a) professor(a).
      </p>
    </div>
  );
};

export default TurmasVazia;
