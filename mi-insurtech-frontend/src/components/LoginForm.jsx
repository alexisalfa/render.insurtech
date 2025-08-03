// src/components/LoginForm.jsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/lib/use-toast'; // Asegúrate de que esta ruta sea correcta para tu proyecto
import { Loader2 } from 'lucide-react';

/**
 * Componente para el formulario de inicio de sesión.
 * @param {object} props - Las propiedades del componente.
 * @param {string} props.API_URL - URL base de la API (debe ser http://localhost:8001/api/v1).
 * @param {function} props.onLoginSuccess - Callback al iniciar sesión exitosamente.
 */
function LoginForm({ API_URL, onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Crear el cuerpo de la solicitud como FormData para application/x-www-form-urlencoded
      const requestBody = new URLSearchParams();
      requestBody.append('username', username);
      requestBody.append('password', password);

      // ¡CRÍTICO! La URL para FastAPI es /auth/token (sin la barra final)
      const loginUrl = `${API_URL}/auth/token`;

      console.log("DEBUG FRONTEND: [LOGIN] Intentando enviar solicitud de login...");
      console.log("DEBUG FRONTEND: [LOGIN] URL de la API:", loginUrl);

      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          // ¡CRÍTICO! Content-Type para FastAPI es application/x-www-form-urlencoded
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: requestBody.toString(), // Convierte URLSearchParams a string
      });

      console.log("DEBUG FRONTEND: [LOGIN] Solicitud de login enviada. Estado de respuesta:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Error desconocido al iniciar sesión.' }));
        console.error("DEBUG FRONTEND: [LOGIN] Error en la respuesta del servidor:", errorData);

        let errorMessage = 'Error desconocido al iniciar sesión.';
        if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.message) { // Algunas APIs pueden usar 'message'
          errorMessage = errorData.message;
        }

        toast({
          title: "Error de Inicio de Sesión",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      const data = await response.json();
      console.log("DEBUG FRONTEND: [LOGIN] Respuesta exitosa del servidor:", data);

      // ¡CRÍTICO! FastAPI devuelve el token en 'access_token' y los datos del usuario
      // en el mismo objeto o en un campo 'user'.
      // Asumimos que data contiene 'access_token', 'username', 'email', etc.
      // Si tu API de FastAPI devuelve el usuario anidado (ej: data.user.username),
      // necesitarías ajustar esto.
      onLoginSuccess(data.access_token, {
        username: data.username,
        email: data.email,
        is_active: data.is_active,
        // ... cualquier otro campo que tu backend de FastAPI devuelva
      });

    } catch (error) {
      console.error('Error de inicio de sesión (catch):', error);
      toast({
        title: "Error de Inicio de Sesión",
        description: "No se pudo conectar con el servidor. Verifica tu conexión.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      console.log("DEBUG FRONTEND: [LOGIN] Finalizando intento de login.");
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-gray-900 text-white border border-gray-700 shadow-lg">
      <CardHeader className="border-b border-gray-700 pb-4 mb-4">
        <CardTitle className="text-3xl font-bold text-blue-400 text-center">Iniciar Sesión</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Usuario</Label>
            <Input
              id="username"
              type="text"
              placeholder="Tu nombre de usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md shadow-md transition-colors duration-300"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Iniciando Sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default LoginForm;
