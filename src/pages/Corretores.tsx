
import React from 'react';
import { Corretor } from '@/types/corretores';

const Corretores = () => {
  const [corretores, setCorretores] = React.useState<Corretor[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Aqui seria implementada a lógica para carregar os corretores
    // Por enquanto, vamos simular alguns dados
    const exemploCorretores: Corretor[] = [
      { id: '1', nome: 'Corretor 1', tipo: 'corretor' },
      { id: '2', nome: 'Corretor 2', tipo: 'corretor' },
      { id: '3', nome: 'Corretor 3', tipo: 'corretor' },
    ];
    
    // Simular carregamento
    setTimeout(() => {
      setCorretores(exemploCorretores);
      setIsLoading(false);
    }, 500);
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Corretores</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {corretores.length === 0 ? (
          <p className="p-4 text-center">Nenhum corretor encontrado.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {corretores.map(corretor => (
              <li key={corretor.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center">
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{corretor.nome}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Corretores;
