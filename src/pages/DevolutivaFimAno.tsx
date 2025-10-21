import React from 'react';
import templateImage from '@/assets/devolutiva-fim-ano-template.png';
import './devolutiva-fim-ano.css';

const DevolutivaFimAno: React.FC = () => {
  return (
    <div className="devolutiva-fim-ano-container">
      <div className="a4-page">
        <img 
          src={templateImage} 
          alt="2025 no Supera - Devolutiva de Fim de Ano" 
          className="template-image"
        />
      </div>
    </div>
  );
};

export default DevolutivaFimAno;
