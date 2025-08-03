// src/hooks/useLicenseStatus.js
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/lib/use-toast'; // Asegúrate de que esta ruta sea correcta

/**
 * Hook personalizado para gestionar el estado de la licencia del usuario.
 *
 * @param {string} API_URL - La URL base de la API del backend.
 * @param {boolean} isAuthenticated - Indica si el usuario está autenticado.
 * @param {function} onLogout - Callback para cerrar la sesión del usuario.
 * @returns {{licenseStatus: object, isLoadingLicense: boolean, fetchLicenseStatus: function, handleActivateLicense: function}}
 */
export const useLicenseStatus = (API_URL, isAuthenticated, onLogout) => {
  const { toast } = useToast();
  const [licenseStatus, setLicenseStatus] = useState({
    is_license_active: false,
    is_trial_active: false,
    days_remaining: 0,
    license_type: "Desconocida",
    message: "Verificando estado de licencia...",
  });
  const [isLoadingLicense, setIsLoadingLicense] = useState(true);

  const fetchLicenseStatus = useCallback(async () => {
    setIsLoadingLicense(true);
    const token = localStorage.getItem('token');

    if (!isAuthenticated || !token) {
      console.log("useLicenseStatus: No autenticado o no hay token, saltando fetch de licencia.");
      setLicenseStatus({
        is_license_active: false,
        is_trial_active: false,
        days_remaining: 0,
        license_type: "No Autenticado",
        message: "Por favor, inicia sesión para verificar tu licencia.",
      });
      setIsLoadingLicense(false);
      return;
    }

    try {
      console.log("useLicenseStatus: Intentando obtener estado de licencia...");
      // CORRECCIÓN CLAVE: Asegurarse de que la URL incluya /api/v1
      const response = await fetch(`${API_URL}/license/status/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401 || response.status === 403) {
        console.warn("useLicenseStatus: Token inválido o expirado. Forzando logout.");
        onLogout(); // Forzar logout si el token es inválido/expirado
        setLicenseStatus({
          is_license_active: false,
          is_trial_active: false,
          days_remaining: 0,
          license_type: "Inválida/Expirada",
          message: "Tu sesión ha expirado o tu licencia es inválida. Por favor, inicia sesión de nuevo.",
        });
        toast({
          title: "Sesión Expirada",
          description: "Tu sesión ha expirado o tu licencia es inválida. Por favor, inicia sesión de nuevo.",
          variant: "destructive",
        });
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Error desconocido en el servidor.' }));
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("useLicenseStatus: Estado de licencia recibido:", data);
      setLicenseStatus(data);
      if (!data.is_license_active && !data.is_trial_active) {
        toast({
          title: "Licencia Inactiva",
          description: data.message || "Tu licencia no está activa. Por favor, actívala en Configuración.",
          variant: "warning",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("useLicenseStatus: Error al obtener estado de la licencia:", error);
      setLicenseStatus(prev => ({
        ...prev,
        is_license_active: false,
        is_trial_active: false,
        license_type: "Error de Conexión",
        message: `Error al obtener estado de la licencia: ${error.message}`,
      }));
      toast({
        title: "Error de Licencia",
        description: `No se pudo verificar la licencia: ${error.message}.`,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoadingLicense(false);
    }
  }, [API_URL, isAuthenticated, onLogout, toast]);

  const handleActivateLicense = useCallback(async (key) => {
    setIsLoadingLicense(true);
    const token = localStorage.getItem('token');

    if (!isAuthenticated || !token) {
      toast({
        title: "Error de Autenticación",
        description: "No estás autenticado para activar la licencia.",
        variant: "destructive",
      });
      setIsLoadingLicense(false);
      return;
    }

    try {
      console.log(`useLicenseStatus: Intentando activar licencia con clave: ${key}`);
      // CORRECCIÓN CLAVE: Asegurarse de que la URL incluya /api/v1
      const response = await fetch(`${API_URL}/license/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ license_key: key || "" }), // Enviar la clave, o cadena vacía si es null
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Error desconocido al activar licencia.' }));
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("useLicenseStatus: Respuesta de activación de licencia:", data);
      setLicenseStatus(data);
      toast({
        title: "Licencia Activada",
        description: data.message || "Tu licencia ha sido activada con éxito.",
        variant: "success",
        duration: 5000,
      });
    } catch (error) {
      console.error("useLicenseStatus: Error al activar licencia:", error);
      toast({
        title: "Error de Activación",
        description: `No se pudo activar la licencia: ${error.message}.`,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoadingLicense(false);
    }
  }, [API_URL, isAuthenticated, toast]);

  // Efecto para cargar el estado de la licencia al montar el componente o al autenticarse
  useEffect(() => {
    if (isAuthenticated) {
      fetchLicenseStatus();
    }
  }, [isAuthenticated, fetchLicenseStatus]);

  return { licenseStatus, isLoadingLicense, fetchLicenseStatus, handleActivateLicense };
};
