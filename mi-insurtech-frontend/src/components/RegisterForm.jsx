// src/components/RegisterForm.jsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/lib/use-toast';
import { Loader2 } from 'lucide-react';

/**
 * Componente para el formulario de registro de usuarios.
 * @param {object} props - Las propiedades del componente.
 * @param {string} props.API_URL - URL base de la API.
 * @param {function} props.setActiveTab - Función para cambiar la pestaña activa en App.jsx.
 */
function RegisterForm({ API_URL, setActiveTab }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [masterLicenseKey, setMasterLicenseKey] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const validateForm = () => {
    const newErrors = {};
    if (!username.trim()) {
      newErrors.username = 'El nombre de usuario es obligatorio.';
    } else if (username.length < 3) {
      newErrors.username = 'El nombre de usuario debe tener al menos 3 caracteres.';
    }
    if (!email.trim()) {
      newErrors.email = 'El email es obligatorio.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'El formato del email no es válido.';
    }
    if (!password.trim()) {
      newErrors.password = 'La contraseña es obligatoria.';
    } else if (password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres.';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Errores de Formulario",
        description: "Por favor, corrige los errores en el formulario.",
        variant: "destructive",
      });
      console.log("DEBUG: Errores de validación:", errors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const requestBody = {
        username,
        email,
        password,
        master_license_key: masterLicenseKey,
      };

      console.log("DEBUG: Intentando enviar solicitud de registro...");
      console.log("DEBUG: URL de la API:", `${API_URL}/auth/register`); // DEBUG: Verificar URL
      console.log("DEBUG: Cuerpo de la solicitud (JSON):", JSON.stringify(requestBody)); // DEBUG: Verificar JSON

      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log("DEBUG: Solicitud de registro enviada. Estado de respuesta:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Error desconocido al registrar.' }));
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }

      toast({
        title: "Registro Exitoso",
        description: "Tu cuenta ha sido creada. ¡Ahora puedes iniciar sesión!",
        variant: "success",
      });
      setActiveTab('login');
    } catch (error) {
      console.error('Error de registro (catch):', error); // DEBUG: Log del error de la promesa fetch
      toast({
        title: "Error de Registro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      console.log("DEBUG: Finalizando intento de registro.");
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-gray-900 text-white border border-gray-700 shadow-lg">
      <CardHeader className="border-b border-gray-700 pb-4 mb-4">
        <CardTitle className="text-3xl font-bold text-blue-400 text-center">Registrarse</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campo de Usuario */}
          <div className="space-y-2">
            <Label htmlFor="username">Usuario <span className="text-red-400">*</span></Label>
            <Input
              id="username"
              type="text"
              placeholder="Tu nombre de usuario"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (errors.username) setErrors((prev) => ({ ...prev, username: undefined }));
              }}
              required
              className={`bg-gray-800 border-gray-600 text-white placeholder:text-gray-500 ${errors.username ? 'border-red-500' : ''}`}
            />
            {errors.username && <p className="text-red-400 text-sm mt-1">{errors.username}</p>}
          </div>

          {/* Campo de Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email <span className="text-red-400">*</span></Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              required
              className={`bg-gray-800 border-gray-600 text-white placeholder:text-gray-500 ${errors.email ? 'border-red-500' : ''}`}
            />
            {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
          </div>

          {/* Campo de Contraseña */}
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña <span className="text-red-400">*</span></Label>
            <Input
              id="password"
              type="password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              required
              className={`bg-gray-800 border-gray-600 text-white placeholder:text-gray-500 ${errors.password ? 'border-red-500' : ''}`}
            />
            {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
          </div>

          {/* Campo de Confirmar Contraseña */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Contraseña <span className="text-red-400">*</span></Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Repite tu contraseña"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }}
              required
              className={`bg-gray-800 border-gray-600 text-white placeholder:text-gray-500 ${errors.confirmPassword ? 'border-red-500' : ''}`}
            />
            {errors.confirmPassword && <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>}
          </div>

          {/* Nuevo campo para la clave maestra de licencia */}
          <div className="space-y-2">
            <Label htmlFor="masterLicenseKey">Clave Maestra de Licencia (Opcional)</Label>
            <Input
              id="masterLicenseKey"
              type="password"
              placeholder="Introduce la clave maestra si la tienes"
              value={masterLicenseKey}
              onChange={(e) => setMasterLicenseKey(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500"
            />
            <p className="text-gray-400 text-sm mt-1">Si tienes la clave maestra, te registrarás como administrador.</p>
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md shadow-md transition-colors duration-300"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : (
              'Registrarse'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default RegisterForm;
