// src/pages/LoginPage.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/LoginForm'; // Asegúrate de que esta ruta sea correcta
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator'; // Importa Separator

/**
 * Página de inicio de sesión de usuario.
 * Permite a los usuarios iniciar sesión en la aplicación.
 */
function LoginPage({ onLogin }) {
  const navigate = useNavigate();

  const handleLoginSuccess = (token) => {
    onLogin(token); // Llama al callback de App.jsx para guardar el token y actualizar el estado de autenticación
    navigate('/dashboard'); // Redirige al usuario al dashboard
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(10vh-80px)] py-10"> {/* Ajustado min-h para dejar espacio a navbar/footer */}
      <Card className="w-full max-w-md mx-auto shadow-lg rounded-lg bg-white p-6">
        <CardHeader className="text-center mb-4">
          <CardTitle className="text-3xl font-bold text-gray-800 mb-2">Iniciar Sesión</CardTitle>
          <CardDescription className="text-gray-600">
            Ingresa tus credenciales para acceder.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/*
            CAMBIO CRÍTICO AQUÍ:
            Ya no pasamos apiBaseUrl. LoginForm ahora usa rutas relativas directamente,
            aprovechando el proxy de Vite en vite.config.js.
          */}
          <LoginForm onLoginSuccess={handleLoginSuccess} />
        </CardContent>
        <Separator className="my-6" /> {/* Separador para estilo */}
        <div className="text-center text-sm text-gray-600">
          ¿No tienes una cuenta?{' '}
          <button
            onClick={() => navigate('/register')}
            className="text-blue-600 hover:underline font-medium"
          >
            Regístrate
          </button>
        </div>
      </Card>
    </div>
  );
}

export default LoginPage;
