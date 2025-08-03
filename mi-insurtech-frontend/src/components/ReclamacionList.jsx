// src/components/ReclamacionList.jsx
import React, { useState, useEffect, useMemo } from 'react'; // Añadido useState y useMemo
import { Button } from '@/components/ui/button';
import { useToast } from '@/lib/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HeadlessSafeSelect } from './HeadlessSafeSelect';
import { useConfirmation } from './ConfirmationContext'; // Importar useConfirmation
import { Loader2 } from 'lucide-react'; // Importar Loader2 para el spinner
import { PaginationComponent } from './Pagination'; // Asumiendo que Pagination.jsx es el componente de paginación

/**
 * Componente para mostrar la lista de reclamaciones.
 *
 * @param {object} props - Las propiedades del componente.
 * @param {Array<object>} props.reclamaciones - Array de objetos reclamación.
 * @param {function} props.onEditReclamacion - Callback para editar una reclamación.
 * @param {function} props.onDeleteReclamacion - Callback para eliminar una reclamación.
 * @param {string} props.searchTerm - Término de búsqueda general.
 * @param {string} props.estadoFilter - Filtro por estado de reclamación.
 * @param {string|number} props.clienteIdFilter - Filtro por ID de cliente.
 * @param {string|number} props.polizaIdFilter - Filtro por ID de póliza.
 * @param {string} props.fechaReclamacionInicioFilter - Filtro por fecha de reclamación (Desde).
 * @param {string} props.fechaReclamacionFinFilter - Filtro por fecha de reclamación (Hasta).
 * @param {function} props.setSearchTerm - Setter para el término de búsqueda.
 * @param {function} props.setEstadoFilter - Setter para el filtro de estado.
 * @param {function} props.setClienteIdFilter - Setter para el filtro de cliente ID.
 * @param {function} props.setPolizaIdFilter - Setter para el filtro de póliza ID.
 * @param {function} props.setFechaReclamacionInicioFilter - Setter para la fecha de reclamación (Desde).
 * @param {function} props.setFechaReclamacionFinFilter - Setter para la fecha de reclamación (Hasta).
 * @param {function} props.onSearch - Handler para aplicar la búsqueda/filtro.
 * @param {Array<object>} props.clients - Lista de clientes disponibles para el dropdown de filtro.
 * @param {Array<object>} props.polizas - Lista de pólizas disponibles para el dropdown de filtro.
 * @param {function} props.onExport - Handler para exportar datos a CSV.
 * @param {function} props.onExportPdf - Handler para exportar datos a PDF.
 * @param {string} props.apiBaseUrl - La URL base de la API.
 * @param {number} props.currentPage - Página actual para la paginación.
 * @param {number} props.itemsPerPage - Ítems por página para la paginación.
 * @param {number} props.totalItems - Número total de ítems para la paginación.
 * @param {function} props.onPageChange - Callback para cambiar de página.
 * @param {boolean} props.isLoadingReclamaciones - Indica si las reclamaciones están cargando.
 * @param {boolean} props.isLoadingClients - Indica si los clientes están cargando para el filtro.
 * @param {boolean} props.isLoadingPolicies - Indica si las pólizas están cargando para el filtro.
 * @param {string} props.currencySymbol - Símbolo de moneda configurado globalmente.
 * @param {string} props.dateFormat - Formato de fecha configurado globalmente.
 * @param {function} props.getDateFormatOptions - Función para obtener opciones de formato de fecha.
 */
function ReclamacionList({
  reclamaciones = [],
  onEditReclamacion,
  onDeleteReclamacion,
  searchTerm,
  estadoFilter,
  clienteIdFilter,
  polizaIdFilter,
  fechaReclamacionInicioFilter,
  fechaReclamacionFinFilter,
  setSearchTerm,
  setEstadoFilter,
  setClienteIdFilter,
  setPolizaIdFilter,
  setFechaReclamacionInicioFilter,
  setFechaReclamacionFinFilter,
  onSearch,
  clients = [],
  polizas = [],
  onExport,
  onExportPdf,
  apiBaseUrl,
  currentPage,
  itemsPerPage,
  totalItems,
  onPageChange,
  isLoadingReclamaciones,
  isLoadingClients,
  isLoadingPolicies,
  currencySymbol, // Recibido como prop
  dateFormat,     // Recibido como prop
  getDateFormatOptions // Recibido como prop
}) {
  const { toast } = useToast();
  const { confirm } = useConfirmation(); // Usar el contexto de confirmación
  const [isExporting, setIsExporting] = useState(false); // Nuevo estado para el spinner de exportación

  useEffect(() => {
    console.log('DEBUG: ReclamacionList Render - reclamaciones prop (recibidas):', reclamaciones);
    console.log('DEBUG: ReclamacionList Render - totalItems prop (recibido):', totalItems);
    console.log('DEBUG: ReclamacionList Render - isLoadingReclamaciones prop (recibido):', isLoadingReclamaciones);
    console.log('DEBUG: ReclamacionList Render - Current Filters State:', { searchTerm, estadoFilter, clienteIdFilter, polizaIdFilter, fechaReclamacionInicioFilter, fechaReclamacionFinFilter });
  }, [reclamaciones, totalItems, isLoadingReclamaciones, searchTerm, estadoFilter, clienteIdFilter, polizaIdFilter, fechaReclamacionInicioFilter, fechaReclamacionFinFilter]);

  const estadoOptions = useMemo(() => [
    { id: '', nombre: 'Todos' },
    { id: 'Pendiente', nombre: 'Pendiente' },
    { id: 'Aprobada', nombre: 'Aprobada' },
    { id: 'Rechazada', nombre: 'Rechazada' },
    { id: 'En Proceso', nombre: 'En Proceso' }, // Asegurarse de que coincida con el backend
    { id: 'Cerrada', nombre: 'Cerrada' },
  ], []);

  const handleSearchTermChange = (e) => {
    setSearchTerm(e.target.value);
  };
  const handleEstadoFilterChange = (value) => {
    setEstadoFilter(value);
  };
  const handleClienteIdFilterChange = (value) => {
    setClienteIdFilter(value);
  };
  const handlePolizaIdFilterChange = (value) => {
    setPolizaIdFilter(value);
  };
  const handleFechaReclamacionInicioFilterChange = (e) => {
    setFechaReclamacionInicioFilter(e.target.value);
  };
  const handleFechaReclamacionFinFilterChange = (e) => {
    setFechaReclamacionFinFilter(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch(searchTerm, estadoFilter, clienteIdFilter, polizaIdFilter, fechaReclamacionInicioFilter, fechaReclamacionFinFilter);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setEstadoFilter('');
    setClienteIdFilter('');
    setPolizaIdFilter('');
    setFechaReclamacionInicioFilter('');
    setFechaReclamacionFinFilter('');
    onSearch('', '', '', '', '', '');
  };

  // Función auxiliar para formatear fechas para la visualización (usa el formato global)
  const formatDisplayDate = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'N/A';
    // Usar la función getDateFormatOptions pasada por props
    return date.toLocaleDateString('es-ES', getDateFormatOptions(dateFormat));
  };

  /**
   * Función auxiliar para formatear números como moneda, usando el símbolo configurado.
   * @param {number} amount - El monto a formatear.
   * @returns {string} El monto formateado como moneda.
   */
  const formatCurrency = (amount) => {
    // Asegurarse de que el número sea un string y reemplazar la coma por punto si es necesario
    const numString = String(amount).replace(',', '.');
    const parsedAmount = parseFloat(numString);

    if (isNaN(parsedAmount)) return 'N/A';

    const formatted = new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES', // Usamos un código de moneda base, el símbolo se reemplaza
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(parsedAmount);

    if (currencySymbol === '$') {
      return formatted.replace('Bs', '$');
    } else if (currencySymbol === '€') {
      return formatted.replace('Bs', '€');
    } else if (currencySymbol === 'S/') {
      return formatted.replace('Bs', 'S/');
    } else if (currencySymbol === 'COP') {
      return formatted.replace('Bs', 'COP');
    }
    return formatted;
  };

  // Cabeceras para exportación CSV
  const reclamacionCsvHeaders = useMemo(() => [
    { key: 'id', label: 'ID Reclamación' },
    { key: 'descripcion', label: 'Descripción' },
    { key: 'estado_display', label: 'Estado' }, // Usar el campo aplanado
    { key: 'monto_reclamado', label: 'Monto Reclamado' },
    { key: 'monto_aprobado', label: 'Monto Aprobado' },
    { key: 'fecha_reclamacion', label: 'Fecha Reclamación', type: 'date' },
    // Usar los campos aplanados para póliza y cliente
    { key: 'poliza_numero_poliza', label: 'Número Póliza' },
    { key: 'cliente_nombre_completo', label: 'Nombre Cliente' },
  ], []);

  // Cabeceras para exportación PDF (más concisas)
  const reclamacionPdfHeaders = useMemo(() => [
    { label: 'ID', key: 'id' },
    { label: 'Descripción', key: 'descripcion' },
    { label: 'Estado', key: 'estado_display' }, // Usar el campo aplanado
    { label: 'Monto Rec.', key: 'monto_reclamado' },
    { label: 'Monto Apr.', key: 'monto_aprobado' },
    { label: 'F. Recl.', key: 'fecha_reclamacion', type: 'date' },
    { label: 'Póliza', key: 'poliza_numero_poliza' }, // Usar el campo aplanado
    { label: 'Cliente', key: 'cliente_nombre_completo' }, // Usar el campo aplanado
  ], []);

  const handleExportCsv = () => {
    setIsExporting(true);
    onExport(reclamaciones, 'reporte_reclamaciones', reclamacionCsvHeaders);
    setIsExporting(false);
  };

  const handleExportPdf = () => {
    setIsExporting(true);
    onExportPdf(reclamaciones, 'reporte_reclamaciones', reclamacionPdfHeaders, 'Reporte de Reclamaciones');
    setIsExporting(false);
  };

  const handleDeleteClick = (reclamacion) => {
    confirm({
      title: "¿Estás seguro?",
      message: `¿Realmente deseas eliminar la reclamación con ID ${reclamacion.id}? Esta acción no se puede deshacer.`,
      onConfirm: () => onDeleteReclamacion(reclamacion.id),
    });
  };

  // Mapear clientes para el HeadlessSafeSelect
  const clientOptions = useMemo(() => [
    { id: '', nombre: 'Todos los clientes' },
    ...clients.map(c => ({ id: c.id, nombre: `${c.nombre} ${c.apellido || ''}`.trim() }))
  ], [clients]);

  // Mapear pólizas para el HeadlessSafeSelect
  const polizaOptions = useMemo(() => [
    { id: '', nombre: 'Todas las pólizas' },
    ...polizas.map(p => ({ id: p.id, nombre: p.numero_poliza }))
  ], [polizas]);

  const totalPages = Math.ceil((totalItems || 0) / (itemsPerPage || 1));
  // const pages = Array.from({ length: totalPages }, (_, i) => i + 1); // Ya no es necesario aquí, lo maneja el componente Pagination

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Lista de Reclamaciones</h3>
      <form onSubmit={handleSearchSubmit} className="mb-6 space-y-4 md:space-y-0 md:flex md:flex-wrap md:gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="search-reclamacion">Búsqueda General (Descripción)</Label>
          <Input
            id="search-reclamacion"
            name="search-reclamacion"
            type="text"
            value={searchTerm}
            onChange={handleSearchTermChange}
            placeholder="Buscar reclamaciones..."
          />
        </div>
        
        {/* Filtrar por Estado - Usando HeadlessSafeSelect */}
        <div className="flex-1 min-w-[150px]">
          <HeadlessSafeSelect
            label="Filtrar por Estado"
            value={estadoFilter}
            onChange={handleEstadoFilterChange}
            options={estadoOptions}
            placeholder="Todos"
          />
        </div>
        
        {/* Cliente Filter - Usando HeadlessSafeSelect */}
        <div className="flex-1 min-w-[200px]">
          <HeadlessSafeSelect
            label="Filtrar por Cliente"
            value={clienteIdFilter}
            onChange={handleClienteIdFilterChange}
            options={clientOptions}
            placeholder="Todos los clientes"
            loading={isLoadingClients}
          />
        </div>

        {/* Póliza Filter - Usando HeadlessSafeSelect */}
        <div className="flex-1 min-w-[200px]">
          <HeadlessSafeSelect
            label="Filtrar por Póliza"
            value={polizaIdFilter}
            onChange={handlePolizaIdFilterChange}
            options={polizaOptions}
            placeholder="Todas las pólizas"
            loading={isLoadingPolicies}
          />
        </div>

        {/* Nuevo: Filtro por Fecha de Reclamación (Desde) */}
        <div className="flex-1 min-w-[180px]">
          <Label htmlFor="fecha-reclamacion-inicio-filter">Fecha Reclamación (Desde)</Label>
          <Input
            id="fecha-reclamacion-inicio-filter"
            name="fecha-reclamacion-inicio-filter"
            type="date"
            value={fechaReclamacionInicioFilter}
            onChange={handleFechaReclamacionInicioFilterChange}
          />
        </div>

        {/* Nuevo: Filtro por Fecha de Reclamación (Hasta) */}
        <div className="flex-1 min-w-[180px]">
          <Label htmlFor="fecha-reclamacion-fin-filter">Fecha Reclamación (Hasta)</Label>
          <Input
            id="fecha-reclamacion-fin-filter"
            name="fecha-reclamacion-fin-filter"
            type="date"
            value={fechaReclamacionFinFilter}
            onChange={handleFechaReclamacionFinFilterChange}
          />
        </div>

        <div className="flex flex-col md:flex-row gap-2 mt-4 md:mt-0">
          <Button type="submit">
            Buscar / Filtrar
          </Button>
          <Button type="button" variant="outline" onClick={handleClearFilters}>
            Limpiar Filtros
          </Button>
        </div>
      </form>

      {/* Botones de Exportar a CSV y PDF */}
      <div className="mb-4 flex justify-end gap-2">
        <Button onClick={handleExportCsv} className="bg-green-600 hover:bg-green-700 text-white" disabled={isExporting || reclamaciones.length === 0}>
          {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Exportar CSV
        </Button>
        <Button onClick={handleExportPdf} className="bg-red-600 hover:bg-red-700 text-white" disabled={isExporting || reclamaciones.length === 0}>
          {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Exportar PDF
        </Button>
      </div>

      {/* Indicador de carga */}
      {isLoadingReclamaciones ? (
        <p className="text-gray-600 text-center py-4">Cargando reclamaciones...</p>
      ) : reclamaciones.length === 0 ? (
        <p className="text-gray-600">No hay reclamaciones para mostrar con los filtros aplicados.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Reclamación</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto Reclamado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto Aprobado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Reclamación</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Póliza</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reclamaciones.map((reclamacion) => (
                <tr key={reclamacion.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{reclamacion.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{reclamacion.descripcion}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{reclamacion.estado_display}</td> {/* Usar campo aplanado */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{reclamacion.monto_reclamado !== undefined && reclamacion.monto_reclamado !== null ? formatCurrency(reclamacion.monto_reclamado) : 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{reclamacion.monto_aprobado !== undefined && reclamacion.monto_aprobado !== null ? formatCurrency(reclamacion.monto_aprobado) : 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDisplayDate(reclamacion.fecha_reclamacion)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {reclamacion.poliza_numero_poliza || 'N/A'} {/* Usar campo aplanado */}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {reclamacion.cliente_nombre_completo || 'N/A'} {/* Usar campo aplanado */}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Button
                      variant="link"
                      onClick={() => onEditReclamacion(reclamacion)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Editar
                    </Button>
                    <Button
                      variant="link"
                      onClick={() => handleDeleteClick(reclamacion)}
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
        <PaginationComponent // Cambiado a PaginationComponent
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}

export default ReclamacionList;
