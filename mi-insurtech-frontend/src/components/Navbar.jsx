// src/components/Navbar.jsx
import React from 'react';
import { Button } from '@/components/ui/button'; // Asegúrate de que Button se importe desde aquí
// Importar NAV_ITEMS desde constantes.jsx
import { NAV_ITEMS } from './constantes'; // ¡IMPORTACIÓN CRÍTICA AQUÍ!

function Navbar({ currentUser, setToken, setCurrentUser, currentPage, onPageChange }) {
  // console.log("DEBUG Navbar.jsx: currentUser recibido:", currentUser); // Puedes descomentar para depurar

  const handleLogout = () => {
    localStorage.removeItem('token'); // Asegúrate de que 'token' sea la clave correcta si usas ACCESS_TOKEN_KEY
    setToken(null);
    setCurrentUser(null);
    onPageChange('login'); // Redirigir a la página de login después de cerrar sesión
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 shadow-lg flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl font-bold">Gestión Vital</h1>
        {currentUser && ( // Mostrar botones si el usuario está autenticado
          <div className="flex space-x-2"> {/* Usar un div para contener los botones */}
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`px-4 py-2 rounded-md transition-colors duration-200 ${
                  currentPage === item.id
                    ? 'bg-blue-700 text-white shadow-md'
                    : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                }`}
              >
                {item.name}
              </Button>
            ))}
          </div>
        )}
      </div>
      {currentUser && (
        <div className="flex items-center space-x-4">
          <Button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-md transition-colors duration-200 shadow-md"
          >
            Cerrar Sesión
          </Button>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
