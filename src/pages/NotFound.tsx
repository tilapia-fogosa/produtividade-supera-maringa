
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center bg-white p-8 rounded-lg shadow-md border border-orange-200">
        <h1 className="text-4xl font-bold mb-4 text-orange-700">404</h1>
        <p className="text-xl text-gray-700 mb-4">Oops! Página não encontrada</p>
        <a href="/" className="text-orange-600 hover:text-orange-800 underline">
          Voltar para a Página Inicial
        </a>
      </div>
    </div>
  );
};

export default NotFound;
