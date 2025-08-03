// src/pages/RegisterPage.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import RegisterForm from '../components/RegisterForm'; // Asegúrate de que esta ruta sea correcta
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

/**
 * Página de registro de usuario.
 * Permite a los usuarios registrarse en la aplicación.
 */
function RegisterPage() {
  const navigate = useNavigate();

  const handleRegisterSuccess = () => {
    // Redirigir al usuario a la página de inicio de sesión después de un registro exitoso
    navigate('/login');
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] py-10"> {/* Ajustado min-h para dejar espacio a navbar/footer */}
      <Card className="w-full max-w-md mx-auto shadow-lg rounded-lg bg-white p-6">
        <CardHeader className="text-center mb-4">
          <CardTitle className="text-3xl font-bold text-gray-800 mb-2">Registrarse</CardTitle>
          <CardDescription className="text-gray-600">
            Crea una cuenta para acceder a la plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/*
            PASO CRÍTICO:
            Pasamos una cadena vacía a apiBaseUrl.
            Esto permite que el proxy de Vite configurado en vite.config.js
            intercepte las llamadas a rutas como '/register' y las redirija
            correctamente a tu backend en http://localhost:8001.
            Si pasáramos 'http://localhost:8000', el frontend intentaría
            conectarse directamente a ese puerto, causando el ERR_CONNECTION_REFUSED.
          */}
          <RegisterForm onRegisterSuccess={handleRegisterSuccess} />
        </CardContent>
        <Separator className="my-6" /> {/* Separador para estilo */}
        <div className="text-center text-sm text-gray-600">
          ¿Ya tienes una cuenta?{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-blue-600 hover:underline font-medium"
          >
            Inicia Sesión
          </button>
        </div>
      </Card>
    </div>
  );
}

export default RegisterPage;
