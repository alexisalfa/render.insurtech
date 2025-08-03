// src/pages/AsesoresPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import AsesorForm from '@/components/AsesorForm';
import AsesorList from '@/components/AsesorList'; // Asegúrate de importar AsesorList
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useToast } from '@/lib/use-toast'; // Importar useToast

/**
 * Componente de página para la gestión de Asesores.
 * Orquesta el formulario de creación/edición y la lista de visualización.
 *
 * @param {object} props - Las propiedades del componente.
 * @param {Array<object>} props.empresasAseguradoras - Lista de empresas aseguradoras para el select.
 * @param {boolean} props.isLoadingCompanies - Indica si la lista de empresas aseguradoras está cargando.
 * @param {string} props.API_URL - URL base de la API.
 * @param {boolean} props.isAuthLoading - Indica si la autenticación aún está cargando.
 * @param {string} props.dateFormat - Formato de fecha configurado globalmente.
 * @param {function} props.getDateFormatOptions - Función para obtener opciones de formato de fecha.
 * @param {function} props.onExportCsv - Función para exportar datos a CSV.
 * @param {function} props.onExportPdf - Función para exportar datos a PDF.
 */
function AsesoresPage({
  empresasAseguradoras,
  isLoadingCompanies,
  API_URL,
  isAuthLoading,
  dateFormat,
  getDateFormatOptions,
  onExportCsv,
  onExportPdf,
}) {
  const { toast } = useToast();
  const ACCESS_TOKEN_KEY = 'insurtech_access_token';

  const initialAsesorFormData = {
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    cedula: '',
    empresa_aseguradora_id: '',
  };

  const [asesores, setAsesores] = useState([]);
  const [editingAsesor, setEditingAsesor] = useState(null);
  const [asesorFormData, setAsesorFormData] = useState(initialAsesorFormData);
  const [currentPageAsesores, setCurrentPageAsesores] = useState(1);
  const [itemsPerPageAsesores] = useState(10); // Puedes hacer esto configurable
  const [totalItemsAsesores, setTotalItemsAsesores] = useState(0);
  const [searchTermAsesores, setSearchTermAsesores] = useState('');
  const [isLoadingAsesores, setIsLoadingAsesores] = useState(false);

  // Sincronizar asesorFormData cuando editingAsesor cambia
  useEffect(() => {
    if (editingAsesor) {
      setAsesorFormData({
        nombre: editingAsesor.nombre || '',
        apellido: editingAsesor.apellido || '',
        email: editingAsesor.email || '',
        telefono: editingAsesor.telefono || '',
        cedula: editingAsesor.cedula || '', // Usar 'cedula' directamente
        empresa_aseguradora_id: String(editingAsesor.empresa_aseguradora_id || ''),
      });
    } else {
      setAsesorFormData(initialAsesorFormData);
    }
  }, [editingAsesor]);

  const fetchAsesores = useCallback(async (page, limit, searchTerm = '') => {
    if (isAuthLoading) return; // No intentar cargar si la autenticación está en curso

    setIsLoadingAsesores(true);
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) {
      toast({ title: "Error de Autenticación", description: "No se encontró el token de acceso. Por favor, inicia sesión.", variant: "destructive" });
      setIsLoadingAsesores(false);
      return;
    }

    try {
      const offset = (page - 1) * limit;
      const queryParams = new URLSearchParams();
      queryParams.append('offset', offset);
      queryParams.append('limit', limit);
      if (searchTerm) {
        queryParams.append('search_term', searchTerm);
      }

      // ¡CRÍTICO! La URL es /api/v1/asesores/
      const url = `${API_URL}/asesores/?${queryParams.toString()}`;
      console.log("DEBUG EN ASESORESPAGE: URL de Asesores:", url); // Debugging

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Error desconocido al cargar asesores.' }));
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("DEBUG EN ASESORESPAGE: Asesores recibidos:", data); // Debugging

      setAsesores(data.items || []);
      setTotalItemsAsesores(data.total || 0);
      setCurrentPageAsesores(data.page || 1);

    } catch (error) {
      console.error("Error al cargar asesores:", error);
      toast({
        title: "Error de Carga",
        description: `No se pudieron cargar los asesores: ${error.message}`,
        variant: "destructive",
      });
      setAsesores([]);
      setTotalItemsAsesores(0);
    } finally {
      setIsLoadingAsesores(false);
    }
  }, [API_URL, isAuthLoading, toast]);

  // Efecto para cargar asesores al montar y cuando cambian los parámetros de paginación/búsqueda
  useEffect(() => {
    fetchAsesores(currentPageAsesores, itemsPerPageAsesores, searchTermAsesores);
  }, [fetchAsesores, currentPageAsesores, itemsPerPageAsesores, searchTermAsesores]);

  const handleFormSaved = useCallback(() => {
    setEditingAsesor(null); // Limpiar el estado de edición
    setAsesorFormData(initialAsesorFormData); // Resetear el formulario
    fetchAsesores(currentPageAsesores, itemsPerPageAsesores, searchTermAsesores); // Recargar la lista
  }, [fetchAsesores, currentPageAsesores, itemsPerPageAsesores, searchTermAsesores]);

  const handleCancelEdit = useCallback(() => {
    setEditingAsesor(null);
    setAsesorFormData(initialAsesorFormData);
  }, []);

  const handleSearch = useCallback((term) => {
    setSearchTermAsesores(term);
    setCurrentPageAsesores(1); // Resetear a la primera página en cada búsqueda
  }, []);

  const handlePageChange = useCallback((page) => {
    setCurrentPageAsesores(page);
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Gestión de Asesores</h1>
      <AsesorForm
        onAsesorSaved={handleFormSaved}
        editingAsesor={editingAsesor}
        setEditingAsesor={setEditingAsesor}
        empresasAseguradoras={empresasAseguradoras}
        isLoadingCompanies={isLoadingCompanies}
        API_URL={API_URL}
        isAuthLoading={isAuthLoading}
        asesor={asesorFormData}
        setAsesor={setAsesorFormData}
        onCancelEdit={handleCancelEdit}
      />

      <Card className="shadow-lg mt-8">
        <CardContent>
          <div className="flex flex-col md:flex-row mb-4 space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex w-full md:w-1/2 relative">
              <Input
                type="text"
                placeholder="Buscar por nombre, cédula o email..."
                value={searchTermAsesores}
                onChange={(e) => setSearchTermAsesores(e.target.value)}
                className="pr-10 rounded-md"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <Button onClick={() => handleSearch(searchTermAsesores)} className="w-full md:w-auto">
              Buscar
            </Button>
            {searchTermAsesores && (
              <Button onClick={() => handleSearch('')} variant="outline" className="w-full md:w-auto">
                <XCircle className="h-4 w-4 mr-2" /> Limpiar
              </Button>
            )}
          </div>
          <AsesorList
            asesores={asesores}
            onEditAsesor={setEditingAsesor}
            onDeleteAsesor={async (id) => {
              const token = localStorage.getItem(ACCESS_TOKEN_KEY);
              if (!token) {
                toast({ title: "Error de Autenticación", description: "No se encontró el token de acceso.", variant: "destructive" });
                return;
              }
              try {
                // ¡CRÍTICO! URL corregida para eliminar asesores (con barra final)
                const response = await fetch(`${API_URL}/asesores/${id}/`, {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                });
                if (!response.ok) {
                  const errorData = await response.json().catch(() => ({ detail: 'Error desconocido al eliminar.' }));
                  throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
                }
                toast({ title: "Asesor Eliminado", description: "El asesor ha sido eliminado exitosamente.", variant: "success" });
                fetchAsesores(currentPageAsesores, itemsPerPageAsesores, searchTermAsesores); // Recargar la lista
              } catch (error) {
                console.error("Error al eliminar asesor:", error);
                toast({ title: "Error al Eliminar", description: `No se pudo eliminar el asesor: ${error.message}`, variant: "destructive" });
              }
            }}
            currentPage={currentPageAsesores}
            itemsPerPage={itemsPerPageAsesores}
            totalItems={totalItemsAsesores}
            onPageChange={handlePageChange}
            searchTerm={searchTermAsesores}
            setSearchTerm={setSearchTermAsesores}
            onSearch={handleSearch}
            dateFormat={dateFormat}
            getDateFormatOptions={getDateFormatOptions}
            onExport={onExportCsv}
            onExportPdf={onExportPdf}
            isLoading={isLoadingAsesores}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default AsesoresPage;