// src/hooks/useLicenseStatus.js
import { useState, useEffect, useCallback } from 'react';

const useLicenseStatus = (API_URL, token, handleLogout) => {
  // Estado para almacenar la información de la licencia del usuario
  // Inicializamos con valores por defecto para evitar errores de null
  const [licenseStatus, setLicenseStatus] = useState({
    is_license_active: false,
    is_trial_active: false, // Añadido para reflejar el estado de prueba
    license_type: 'unknown', // Puede ser 'full' o 'trial'
    message: 'Cargando estado de licencia...'
  });
  const [isLoadingLicense, setIsLoadingLicense] = useState(true);

  // Función para obtener el estado de la licencia desde el backend
  const fetchLicenseStatus = useCallback(async () => {
    if (!token) {
      setIsLoadingLicense(false);
      setLicenseStatus({
        is_license_active: false,
        is_trial_active: false,
        license_type: 'none',
        message: 'No autenticado. Inicie sesión para verificar la licencia.'
      });
      return;
    }

    setIsLoadingLicense(true);
    try {
      const response = await fetch(`${API_URL}/auth/license-status`, { // <-- ¡CORRECCIÓN CRÍTICA AQUÍ!
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        // Si la respuesta no es OK (ej. 401 Unauthorized, 403 Forbidden)
        const errorData = await response.json();
        console.error("Error al obtener estado de licencia:", errorData);
        // Si el token es inválido o expirado, forzar logout
        if (response.status === 401 || response.status === 403) {
          handleLogout(); // Llama a la función de logout de App.jsx
          setLicenseStatus({
            is_license_active: false,
            is_trial_active: false,
            license_type: 'invalid',
            message: 'Sesión expirada o inválida. Por favor, inicie sesión de nuevo.'
          });
        } else {
          setLicenseStatus({
            is_license_active: false,
            is_trial_active: false,
            license_type: 'error',
            message: `Error al cargar licencia: ${errorData.detail || response.statusText}`
          });
        }
        return;
      }

      const data = await response.json();
      setLicenseStatus({
        is_license_active: data.is_license_active,
        is_trial_active: data.message.includes('prueba'), // Heurística simple para detectar si es de prueba
        license_type: data.is_license_active ? (data.message.includes('prueba') ? 'trial' : 'full') : 'expired',
        message: data.message
      });
      console.log("Estado de licencia cargado:", data);

    } catch (error) {
      console.error("Error de red o inesperado al obtener estado de licencia:", error);
      setLicenseStatus({
        is_license_active: false,
        is_trial_active: false,
        license_type: 'network_error',
        message: 'Error de conexión al verificar licencia.'
      });
    } finally {
      setIsLoadingLicense(false);
    }
  }, [API_URL, token, handleLogout]);

  // Efecto para cargar el estado de la licencia cuando el token cambia
  useEffect(() => {
    fetchLicenseStatus();
  }, [fetchLicenseStatus]);

  // isLicenseValid se calcula a partir de licenseStatus
  const isLicenseValid = licenseStatus.is_license_active;

  return {
    licenseStatus,
    isLoadingLicense,
    fetchLicenseStatus,
    handleActivateLicense: () => { /* Lógica para activar licencia, si es necesaria */ },
    isLicenseValid
  };
};

export default useLicenseStatus;
