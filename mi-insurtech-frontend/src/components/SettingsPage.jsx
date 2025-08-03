// src/components/SettingsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from './ToastContext'; // Importación corregida

// Importar las constantes de opciones desde el archivo constantes.jsx
import {
  LANGUAGE_OPTIONS,
  CURRENCY_SYMBOL_OPTIONS,
  DATE_FORMAT_OPTIONS,
  COUNTRY_OPTIONS,
  MASTER_LICENSE_KEY // También importamos la clave maestra desde aquí
} from './constantes'; // <-- ¡IMPORTACIÓN CRÍTICA AQUÍ!

/**
 * Componente para la página de configuración de la aplicación.
 * Permite al usuario ajustar preferencias como idioma, moneda, formato de fecha,
 * país y visualizar el estado de la licencia.
 *
 * @param {object} props - Las propiedades del componente.
 * @param {string} props.selectedLanguage - Idioma seleccionado.
 * @param {string} props.currencySymbol - Símbolo de moneda seleccionado.
 * @param {string} props.dateFormat - Formato de fecha seleccionado.
 * @param {string} props.selectedCountry - País seleccionado.
 * @param {string} props.licenseKey - Clave de licencia actual (del frontend).
 * @param {function} props.setSelectedLanguage - Setter para el idioma.
 * @param {function} props.setCurrencySymbol - Setter para el símbolo de moneda.
 * @param {function} props.setDateFormat - Setter para el formato de fecha.
 * @param {function} props.setSelectedCountry - Setter para el país.
 * @param {function} props.setLicenseKey - Setter para la clave de licencia.
 * @param {function} props.onSaveSettings - Callback para guardar la configuración.
 * @param {object} props.licenseStatus - Objeto con el estado de la licencia del backend (is_license_active, message, is_trial).
 * @param {boolean} props.isLoadingLicense - Indica si el estado de la licencia está cargando.
 * @param {function} props.onActivateLicense - Callback para activar una licencia completa.
 */
function SettingsPage({
  selectedLanguage,
  currencySymbol,
  dateFormat,
  selectedCountry,
  licenseKey,
  setSelectedLanguage,
  setCurrencySymbol,
  setDateFormat,
  setSelectedCountry,
  setLicenseKey,
  onSaveSettings,
  licenseStatus, 
  isLoadingLicense,
  onActivateLicense,
}) {
  const { toast } = useToast();

  const [localLicenseKey, setLocalLicenseKey] = useState(licenseKey || ''); // Inicialización robusta
  const [isSaving, setIsSaving] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  // Sincronizar la clave de licencia local con la prop inicial
  useEffect(() => {
    setLocalLicenseKey(licenseKey || '');
  }, [licenseKey]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveSettings({
        language: selectedLanguage,
        currency_symbol: currencySymbol,
        date_format: dateFormat,
        country: selectedCountry,
      });
      toast({
        title: "Configuración Guardada",
        description: "Tus preferencias han sido actualizadas exitosamente.",
        variant: "success", 
      });
    } catch (error) {
      console.error("Error al guardar configuración:", error);
      toast({
        title: "Error al Guardar",
        description: "No se pudieron guardar tus preferencias. Intenta de nuevo.",
        variant: "destructive", 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleActivateLicenseClick = async () => {
    setIsActivating(true);
    try {
      await onActivateLicense(localLicenseKey); 
      toast({
        title: "Licencia Activada",
        description: "Tu licencia completa ha sido activada exitosamente.",
        variant: "success",
      });
    } catch (error) {
      console.error("Error al activar licencia:", error);
      toast({
        title: "Error de Activación",
        description: `No se pudo activar la licencia: ${error.message || 'Clave inválida.'}`,
        variant: "destructive",
      });
    } finally {
      setIsActivating(false);
    }
  };

  // Determinar si la clave de licencia del frontend es válida (solo para visualización local)
  // Ahora la validación se hace contra MASTER_LICENSE_KEY importada
  const isFrontendLicenseKeyValid = localLicenseKey === MASTER_LICENSE_KEY;

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-lg rounded-xl">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-xl">
        <CardTitle className="text-2xl font-bold">Configuración General</CardTitle>
        <p className="text-blue-100">Ajusta las preferencias de visualización y licencia de la aplicación.</p>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Sección de Licencia */}
        <div className="space-y-2 p-4 border border-blue-300 rounded-lg bg-blue-50">
          <h3 className="text-xl font-semibold mb-2 text-blue-800 flex items-center">
            Estado de la Licencia
            {licenseStatus && licenseStatus.is_license_active ? (
              <CheckCircle className="ml-2 h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="ml-2 h-5 w-5 text-red-600" />
            )}
          </h3>
          {licenseStatus && (
            <>
              <p className="text-blue-700">
                Estado: <span className={`font-bold ${licenseStatus.is_license_active ? 'text-green-600' : 'text-red-600'}`}>
                  {licenseStatus.is_license_active ? 'Activa' : 'Inactiva'}
                </span>
              </p>
              <p className="text-blue-700">
                Mensaje: <span className="font-medium">{licenseStatus.message}</span>
              </p>
              {/* Botón de "Comprar Licencia (Activar 1 Año)" */}
              {/* Solo se muestra si la licencia NO es completa y activa */}
              {(!licenseStatus.is_license_active || licenseStatus.is_trial) && (
                <Button
                  onClick={handleActivateLicenseClick}
                  className="mt-4 bg-green-500 hover:bg-green-600 text-white"
                  disabled={isActivating || isLoadingLicense}
                >
                  {isActivating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Comprar Licencia (Activar 1 Año)
                </Button>
              )}
            </>
          )}
        </div>

        {/* Sección de Preferencias Generales */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800">Preferencias Generales</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* País y Región */}
            <div className="space-y-2">
              <Label htmlFor="country">País y Región</Label>
              <Select
                value={selectedCountry === undefined ? "undefined" : selectedCountry}
                onValueChange={(value) => setSelectedCountry(value === "undefined" ? undefined : value)}
              >
                <SelectTrigger id="country" className="w-full border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 rounded-md shadow-sm">
                  <SelectValue placeholder="Selecciona un país" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                    <SelectItem value="undefined">Selecciona un país</SelectItem>
                  {COUNTRY_OPTIONS.map((option) => (
                    <SelectItem key={option.id} value={option.id}> {/* Usar option.id para value y key */}
                      {option.nombre} {/* Usar option.nombre para el texto visible */}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Idioma */}
            <div className="space-y-2">
              <Label htmlFor="language">Idioma</Label>
              <Select
                value={selectedLanguage === undefined ? "undefined" : selectedLanguage}
                onValueChange={(value) => setSelectedLanguage(value === "undefined" ? undefined : value)}
              >
                <SelectTrigger id="language" className="w-full border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 rounded-md shadow-sm">
                  <SelectValue placeholder="Selecciona un idioma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="undefined">Selecciona un idioma</SelectItem>
                  {LANGUAGE_OPTIONS.map((option) => (
                    <SelectItem key={option.id} value={option.id}> {/* Usar option.id para value y key */}
                      {option.nombre} {/* Usar option.nombre para el texto visible */}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Símbolo de Moneda */}
            <div className="space-y-2">
              <Label htmlFor="currency">Símbolo de Moneda</Label>
              <Select
                value={currencySymbol === undefined ? "undefined" : currencySymbol}
                onValueChange={(value) => setCurrencySymbol(value === "undefined" ? undefined : value)}
              >
                <SelectTrigger id="currency" className="w-full border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 rounded-md shadow-sm">
                  <SelectValue placeholder="Selecciona un símbolo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="undefined">Selecciona un símbolo</SelectItem>
                  {CURRENCY_SYMBOL_OPTIONS.map((option) => (
                    <SelectItem key={option.id} value={option.id}> {/* Usar option.id para value y key */}
                      {option.nombre} {/* Usar option.nombre para el texto visible */}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Formato de Fecha */}
            <div className="space-y-2">
              <Label htmlFor="date-format">Formato de Fecha</Label>
              <Select
                value={dateFormat === undefined ? "undefined" : dateFormat}
                onValueChange={(value) => setDateFormat(value === "undefined" ? undefined : value)}
              >
                <SelectTrigger id="date-format" className="w-full border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 rounded-md shadow-sm">
                  <SelectValue placeholder="Selecciona un formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="undefined">Selecciona un formato</SelectItem>
                  {DATE_FORMAT_OPTIONS.map((option) => (
                    <SelectItem key={option.id} value={option.id}> {/* Usar option.id para value y key */}
                      {option.nombre} {/* Usar option.nombre para el texto visible */}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Clave de Licencia (Frontend) - SOLO VISUALIZACIÓN */}
        <div className="space-y-2">
          <Label htmlFor="license-key-frontend">Clave de Licencia (Frontend)</Label>
          <Input
            id="license-key-frontend"
            type="text"
            value={localLicenseKey || ''}
            onChange={(e) => setLocalLicenseKey(e.target.value)}
            placeholder="Introduce tu clave de licencia"
            readOnly
            className="bg-gray-100 cursor-not-allowed"
          />
          {/* Validación de la clave de licencia del frontend */}
          {localLicenseKey && (
            isFrontendLicenseKeyValid ? (
              <p className="text-sm text-green-600 flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" /> Licencia válida (validación frontend).
              </p>
            ) : (
              <p className="text-sm text-red-600 flex items-center">
                <XCircle className="h-4 w-4 mr-1" /> Clave de licencia inválida (validación frontend).
              </p>
            )
          )}
        </div>

        <Button
          onClick={handleSave}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition duration-200 flex items-center justify-center"
          disabled={isSaving}
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar Configuración
        </Button>
      </CardContent>
    </Card>
  );
}

export default SettingsPage;
