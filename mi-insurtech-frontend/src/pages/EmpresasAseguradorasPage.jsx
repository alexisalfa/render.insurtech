// src/pages/EmpresasAseguradorasPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import EmpresaAseguradoraForm from '@/components/EmpresaAseguradoraForm';
import EmpresaAseguradoraList from '@/components/EmpresaAseguradoraList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

/**
 * Componente de página principal para la gestión de Empresas Aseguradoras.
 * Orquesta el formulario de creación/edición y la lista de visualización.
 *
 * @param {object} props - Las propiedades del componente.
 * @param {string} props.API_URL - URL base de la API.
 * @param {Array<object>} props.empresas - Lista de empresas aseguradoras.
 * @param {number} props.currentPage - Página actual de la lista.
 * @param {number} props.itemsPerPage - Ítems por página.
 * @param {number} props.totalItems - Total de ítems.
 * @param {function} props.onPageChange - Callback para cambio de página.
 * @param {string} props.searchTerm - Término de búsqueda.
 * @param {function} props.setSearchTerm - Setter para el término de búsqueda.
 * @param {function} props.onSearch - Callback para ejecutar la búsqueda.
 * @param {function} props.onExport - Callback para exportar a CSV.
 * @param {function} props.onExportPdf - Callback para exportar a PDF.
 * @param {string} props.dateFormat - Formato de fecha global.
 * @param {function} props.getDateFormatOptions - Función para opciones de formato de fecha.
 * @param {function} props.onEmpresaAseguradoraSaved - Callback cuando una empresa es guardada.
 * @param {object|null} props.editingEmpresaAseguradora - Empresa en edición.
 * @param {function} props.setEditingEmpresaAseguradora - Setter para la empresa en edición.
 * @param {boolean} props.isAuthLoading - Indica si la autenticación aún está cargando.
 */
function EmpresasAseguradorasPage({
  API_URL,
  empresas,
  currentPage,
  itemsPerPage,
  totalItems,
  onPageChange,
  searchTerm,
  setSearchTerm,
  onSearch,
  onExport,
  onExportPdf,
  dateFormat,
  getDateFormatOptions,
  onEmpresaAseguradoraSaved,
  editingEmpresaAseguradora,
  setEditingEmpresaAseguradora,
  isAuthLoading,
}) {
  // DEBUG: Log para ver las empresas recibidas en esta página
  useEffect(() => {
    console.log("%cDEBUG EN EMPRESASASEGURADORASPAGE: Empresas recibidas:", "color: purple; font-weight: bold;", empresas);
  }, [empresas]);

  // Estado local para el formulario de la empresa aseguradora
  const initialFormData = {
    nombre: '',
    rif: '',
    direccion: '',
    telefono: '',
    email: '',
  };
  const [formDataForForm, setFormDataForForm] = useState(initialFormData);

  // Sincronizar formDataForForm cuando editingEmpresaAseguradora cambia
  useEffect(() => {
    if (editingEmpresaAseguradora) {
      setFormDataForForm({
        nombre: editingEmpresaAseguradora.nombre || '',
        rif: editingEmpresaAseguradora.rif || '',
        direccion: editingEmpresaAseguradora.direccion || '',
        telefono: editingEmpresaAseguradora.telefono || '',
        email: editingEmpresaAseguradora.email || '',
      });
    } else {
      setFormDataForForm(initialFormData);
    }
  }, [editingEmpresaAseguradora]);

  const handleFormSaved = useCallback(() => {
    setEditingEmpresaAseguradora(null); // Limpiar el estado de edición
    setFormDataForForm(initialFormData); // Resetear el formulario
    onEmpresaAseguradoraSaved(); // Notificar al padre (App.jsx) para recargar la lista
  }, [onEmpresaAseguradoraSaved, setEditingEmpresaAseguradora]);

  const handleCancelEdit = useCallback(() => {
    setEditingEmpresaAseguradora(null);
    setFormDataForForm(initialFormData);
  }, [setEditingEmpresaAseguradora]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestión de Empresas Aseguradoras</h1>

      <EmpresaAseguradoraForm
        onEmpresaAseguradoraSaved={handleFormSaved}
        editingEmpresaAseguradora={editingEmpresaAseguradora}
        setEditingEmpresaAseguradora={setEditingEmpresaAseguradora}
        API_URL={API_URL}
        isAuthLoading={isAuthLoading}
        // Pasamos formDataForForm y setFormDataForForm explícitamente
        formData={formDataForForm}
        setFormData={setFormDataForForm}
        onCancelEdit={handleCancelEdit} // Pasar la función de cancelar edición
      />

      <Card className="mt-8 shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-gray-700">Lista de Empresas Aseguradoras</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center justify-between mb-4 space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex w-full md:w-1/2 relative">
              <Input
                type="text"
                placeholder="Buscar por nombre o RIF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 rounded-md"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <Button onClick={() => onSearch(searchTerm)} className="w-full md:w-auto">
              Buscar
            </Button>
          </div>
          <EmpresaAseguradoraList
            empresas={empresas} // Pasa la prop 'empresas'
            onEditEmpresaAseguradora={setEditingEmpresaAseguradora}
            onDeleteEmpresaAseguradora={(id) => {
              onEmpresaAseguradoraSaved(); // Llama a la función que recarga la lista
            }}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
            onPageChange={onPageChange}
            onExport={onExport}
            onExportPdf={onExportPdf}
            dateFormat={dateFormat}
            getDateFormatOptions={getDateFormatOptions}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default EmpresasAseguradorasPage;
