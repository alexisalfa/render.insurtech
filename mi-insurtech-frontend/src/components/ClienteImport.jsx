// src/components/ClienteImport.jsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/lib/use-toast';
import { saveAs } from 'file-saver'; // Asegurarse de que file-saver esté importado, aunque no se usa directamente aquí, es buena práctica si la app lo necesita.


/**
 * Componente para importar clientes desde un archivo CSV.
 *
 * @param {object} props - Las propiedades del componente.
 * @param {string} props.apiBaseUrl - La URL base de la API.
 * @param {function} props.onImportComplete - Callback que se llama al completar la importación.
 */
function ClienteImport({ apiBaseUrl, onImportComplete }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event) => {
    const file = event.target.files ? event.target.files[0] : null;
    setSelectedFile(file);
  };

  const handleImportClick = async () => {
    if (!selectedFile) {
      toast({
        title: "Archivo no seleccionado",
        description: "Por favor, selecciona un archivo CSV para importar.",
        variant: "warning",
      });
      return;
    }

    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      toast({
        title: "Formato de archivo inválido",
        description: "Por favor, selecciona un archivo CSV (.csv).",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    const token = localStorage.getItem('access_token');
    if (!token) {
      toast({
        title: "Error de Autenticación",
        description: "No autorizado. Por favor, inicie sesión.",
        variant: "destructive",
      });
      setIsImporting(false);
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    toast({
      title: "Importando Clientes",
      description: "Procesando el archivo CSV, esto puede tardar un momento...",
      variant: "info",
    });

    try {
      const response = await fetch(`${apiBaseUrl}/clientes/import_csv/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Sesión Expirada",
            description: "Tu sesión ha expirado o no está autorizada. Por favor, inicia sesión de nuevo.",
            variant: "destructive",
          });
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al importar clientes.');
      }

      const result = await response.json();
      
      toast({
        title: "Importación Completada",
        description: `Procesadas: ${result.total_rows_processed} filas. Éxito: ${result.successful_imports} nuevos, Actualizados: ${result.updated_records}. Fallidos: ${result.failed_imports}.`,
        variant: result.failed_imports > 0 ? "warning" : "success",
      });

      if (result.failed_imports > 0 && result.errors.length > 0) {
        // Mostrar los errores más detallados en la consola o en un toast más grande
        console.error("Errores en la importación CSV:", result.errors);
        toast({
          title: "Errores en la Importación",
          description: "Algunas filas no se pudieron importar. Revisa la consola para más detalles.",
          variant: "destructive",
          duration: 9000, // Dar más tiempo para leer si hay errores
        });
      }

      setSelectedFile(null); // Limpiar el archivo seleccionado
      // Llamar al callback para que el componente padre recargue la lista de clientes
      onImportComplete();

    } catch (error) {
      console.error('Error durante la importación de clientes:', error);
      toast({
        title: "Error de Importación",
        description: `Ocurrió un error inesperado: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Importar Clientes desde CSV</h3>
      <div className="space-y-4">
        <div>
          <Label htmlFor="csv-file">Seleccionar archivo CSV</Label>
          <Input
            id="csv-file"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={isImporting}
          />
          {selectedFile && (
            <p className="text-sm text-gray-500 mt-2">Archivo seleccionado: {selectedFile.name}</p>
          )}
          <p className="text-sm text-gray-600 mt-2">
            El archivo CSV debe contener las columnas: `nombre`, `apellido`, `email`, `telefono`, `fecha_nacimiento` (YYYY-MM-DD), `direccion`.
            `apellido`, `fecha_nacimiento`, `direccion` son opcionales. El `email` es clave para identificar si un cliente ya existe.
          </p>
        </div>
        <Button
          onClick={handleImportClick}
          disabled={!selectedFile || isImporting}
        >
          {isImporting ? 'Importando...' : 'Iniciar Importación'}
        </Button>
      </div>
    </div>
  );
}

export default ClienteImport;
