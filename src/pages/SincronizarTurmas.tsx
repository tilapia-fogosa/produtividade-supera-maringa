import React from 'react';
import { FileSpreadsheet } from "lucide-react";
import XlsUploadComponent from '@/components/sync/XlsUploadComponent';
import XlsSyncStatus from '@/components/sync/XlsSyncStatus';

const SincronizarTurmas = () => {
  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center gap-3 mb-6">
        <FileSpreadsheet className="h-8 w-8 text-supera" />
        <div>
          <h1 className="text-2xl font-bold text-azul-500">Sincronizar Turmas</h1>
          <p className="text-azul-400">Importe turmas, professores e alunos via arquivo Excel</p>
        </div>
      </div>
      
      <div className="space-y-6">
        <XlsUploadComponent />
        <XlsSyncStatus />
      </div>
    </div>
  );
};

export default SincronizarTurmas;