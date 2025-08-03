// src/components/ClientList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/lib/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useConfirmation } from './ConfirmationContext';
import { Loader2, PlusCircle, Edit, Trash2, Search, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Componente para mostrar la lista de clientes.
 *
 * @param {object} props - Las propiedades del componente.
 * @param {Array<object>} props.clients - Array de objetos cliente.
 * @param {function} props.onEditClient - Callback para editar un cliente.
 * @param {function} props.onDeleteClient - Callback para eliminar un cliente.
 * @param {string} props.searchTerm - Término de búsqueda general.
 * @param {string} props.emailFilter - Filtro por email.
 * @param {function} props.setSearchTerm - Setter para el término de búsqueda.
 * @param {function} props.setEmailFilter - Setter para el filtro de email.
 * @param {function} props.onSearch - Handler para aplicar la búsqueda/filtro.
 * @param {number} props.currentPage - Página actual para la paginación.
 * @param {number} props.itemsPerPage - Ítems por página para la paginación.
 * @param {number} props.totalItems - Número total de ítems para la paginación.
 * @param {function} props.onPageChange - Callback para cambiar de página.
 * @param {function} props.onExport - Handler para exportar datos a CSV.
 * @param {function} props.onExportPdf - Handler para exportar datos a PDF.
 * @param {string} props.dateFormat - Formato de fecha configurado globalmente.
 * @param {function} props.getDateFormatOptions - Función para obtener opciones de formato de fecha.
 */
function ClientList({
  clients = [],
  onEditClient,
  onDeleteClient,
  searchTerm,
  emailFilter,
  setSearchTerm,
  setEmailFilter,
  onSearch,
  currentPage,
  itemsPerPage,
  totalItems,
  onPageChange,
  onExport,
  onExportPdf,
  dateFormat,
  getDateFormatOptions
}) {
  const { toast } = useToast();
  const { confirm } = useConfirmation();
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    console.log('DEBUG: ClientList Render - searchTerm:', searchTerm, 'suggestions.length:', suggestions.length, 'showSuggestions:', showSuggestions);
  }, [searchTerm, suggestions, showSuggestions]);

  useEffect(() => {
    console.log('DEBUG: useEffect suggestions - clients length:', clients.length, 'searchTerm length:', searchTerm.length);
    if (searchTerm.length >= 2 && clients.length > 0) {
      const filteredSuggestions = clients
        .filter(client =>
          client.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (client.cedula && client.cedula.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) // Asegurarse de que email exista
        )
        .map(client => ({
          id: client.id,
          name: `${client.nombre} ${client.apellido} (${client.cedula || 'N/A'})`,
        }))
        .slice(0, 5);
      
      setSuggestions(filteredSuggestions);
      if (filteredSuggestions.length > 0) {
          setShowSuggestions(true);
      } else {
          setShowSuggestions(false);
      }
      console.log('DEBUG: Suggestions generated:', filteredSuggestions);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      console.log('DEBUG: Suggestions cleared or not generated.');
    }
  }, [searchTerm, clients]);

  const handleSearchTermChange = (e) => {
    console.log('DEBUG: handleSearchTermChange - New value:', e.target.value);
    setSearchTerm(e.target.value);
  };

  const handleEmailFilterChange = (e) => {
    setEmailFilter(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    console.log('DEBUG: handleSearchSubmit - Submitting search with term:', searchTerm);
    onSearch(searchTerm, emailFilter);
    setShowSuggestions(false);
  };

  const handleClearFilters = () => {
    console.log('DEBUG: handleClearFilters - Clearing filters.');
    setSearchTerm('');
    setEmailFilter('');
    onSearch('', '');
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestionName) => {
    console.log('DEBUG: handleSuggestionClick - Suggestion clicked:', suggestionName);
    setSearchTerm(suggestionName);
    onSearch(suggestionName, emailFilter);
    setShowSuggestions(false);
  };

  const handleDeleteClick = (client) => {
    confirm({
      title: "¿Estás seguro?",
      message: `¿Realmente deseas eliminar al cliente ${client.nombre} ${client.apellido}? Esta acción no se puede deshacer.`,
      onConfirm: () => onDeleteClient(client.id),
    });
  };

  // Define los encabezados para la exportación a CSV
  const clientCsvHeaders = useMemo(() => [
    { key: 'id', label: 'ID Cliente' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'apellido', label: 'Apellido' },
    { key: 'email', label: 'Email' },
    { key: 'telefono', label: 'Teléfono' },
    { key: 'cedula', label: 'Cédula' },
    { key: 'fecha_nacimiento', label: 'Fecha Nacimiento', type: 'date' },
    { key: 'direccion', label: 'Dirección' },
    { key: 'fecha_registro', label: 'Fecha Registro', type: 'date' },
  ], []);

  // Define los encabezados para la exportación a PDF (generalmente menos columnas)
  const clientPdfHeaders = useMemo(() => [
    { label: 'ID', key: 'id' },
    { label: 'Nombre', key: 'nombre' },
    { label: 'Apellido', key: 'apellido' },
    { label: 'Email', key: 'email' },
    { label: 'Teléfono', key: 'telefono' },
    { label: 'Cédula', key: 'cedula' },
    { label: 'F. Nac.', key: 'fecha_nacimiento', type: 'date' },
  ], []);

  // Handler para la exportación de clientes a CSV
  const handleExportCsv = () => {
    setIsExporting(true);
    onExport(clients, 'reporte_clientes', clientCsvHeaders);
    setIsExporting(false);
  };

  // Handler para la exportación de clientes a PDF
  const handleExportPdf = () => {
    setIsExporting(true);
    onExportPdf(clients, 'reporte_clientes', clientPdfHeaders, 'Reporte de Clientes');
    setIsExporting(false);
  };

  // Lógica de paginación
  const totalPages = Math.ceil((totalItems || 0) / (itemsPerPage || 1));
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Lista de Clientes</h3>
      <form onSubmit={handleSearchSubmit} className="mb-6 space-y-4 md:space-y-0 md:flex md:gap-4 items-end relative">
        <div className="flex-1">
          <Label htmlFor="search-client">Búsqueda General (Nombre, Apellido, Cédula, Email)</Label>
          <Input
            id="search-client"
            name="search-client"
            type="text"
            value={searchTerm}
            onChange={handleSearchTermChange}
            placeholder="Buscar clientes..."
            autoComplete="off"
            onFocus={() => {
                if (searchTerm.length >= 2 && suggestions.length > 0) {
                    setShowSuggestions(true);
                }
            }}
            onBlur={() => {
                setTimeout(() => setShowSuggestions(false), 100);
            }}
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
              {suggestions.map((suggestion) => (
                <li
                  key={suggestion.id}
                  className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                  onMouseDown={() => handleSuggestionClick(suggestion.name)}
                >
                  {suggestion.name}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex-1">
          <Label htmlFor="email-filter">Filtrar por Email</Label>
          <Input
            id="email-filter"
            name="email-filter"
            type="email"
            value={emailFilter}
            onChange={handleEmailFilterChange}
            placeholder="Ej: correo@example.com"
          />
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          <Button type="submit">
            Buscar / Filtrar
          </Button>
          <Button type="button" variant="outline" onClick={handleClearFilters}>
            Limpiar Filtros
          </Button>
        </div>
      </form>

      {/* Botones de Exportar */}
      <div className="mb-4 flex justify-end gap-2">
        <Button onClick={handleExportCsv} className="bg-green-600 hover:bg-green-700 text-white" disabled={isExporting || clients.length === 0}>
          {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Exportar CSV
        </Button>
        <Button onClick={handleExportPdf} className="bg-red-600 hover:bg-red-700 text-white" disabled={isExporting || clients.length === 0}>
          {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Exportar PDF
        </Button>
      </div>

      {/* Lista de Clientes (Tabla) */}
      {clients.length === 0 ? (
        <p className="text-gray-600">No hay clientes para mostrar con los filtros aplicados.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apellido</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cédula</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clients.map((client) => (
                <tr key={client.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{client.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.apellido}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.telefono}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.cedula}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Button
                      variant="link"
                      onClick={() => onEditClient(client)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Editar
                    </Button>
                    <Button
                      variant="link"
                      onClick={() => handleDeleteClick(client)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Eliminar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Controles de Paginación */}
      {totalPages > 1 && (
        <nav className="flex justify-center mt-6">
          <ul className="flex items-center -space-x-px h-10 text-base">
            <li>
              <Button
                variant="outline"
                className="flex items-center justify-center px-4 h-10 leading-tight text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 hover:text-gray-700"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
            </li>
            {pages.map(page => (
              <li key={page}>
                <Button
                  variant={currentPage === page ? "default" : "outline"}
                  className={`flex items-center justify-center px-4 h-10 leading-tight ${
                    currentPage === page
                      ? "text-white bg-blue-600 border-blue-600 hover:bg-blue-700"
                      : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700"
                  }`}
                  onClick={() => onPageChange(page)}
                >
                  {page}
                </Button>
              </li>
            ))}
            <li>
              <Button
                variant="outline"
                className="flex items-center justify-center px-4 h-10 leading-tight text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-100 hover:text-gray-700"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}

export default ClientList;
