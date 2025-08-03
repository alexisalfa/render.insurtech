// src/components/PolizaList.jsx
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HeadlessSafeSelect } from './HeadlessSafeSelect';
import { useToast } from '@/lib/use-toast';
import { useConfirmation } from './ConfirmationContext'; // Importar useConfirmation
import { Loader2 } from 'lucide-react'; // Importar Loader2 para el spinner
import { PaginationComponent } from './Pagination'; // Importación corregida
import { saveAs } from 'file-saver'; // Importar saveAs para descargar el archivo

/**
 * Componente para mostrar la lista de pólizas.
 *
 * @param {object} props - Las propiedades del componente.
 * @param {Array<object>} props.polizas - Array de objetos póliza.
 * @param {function} props.onEditPoliza - Callback para editar una póliza.
 * @param {function} props.onDeletePoliza - Callback para eliminar una póliza.
 * @param {string} props.searchTerm - Término de búsqueda general.
 * @param {string} props.tipoFilter - Filtro por tipo de póliza.
 * @param {string} props.estadoFilter - Filtro por estado de póliza.
 * @param {string} props.clienteIdFilter - Filtro por ID de cliente.
 * @param {string} props.fechaInicioFilter - Filtro por fecha de inicio (Desde).
 * @param {string} props.fechaFinFilter - Filtro por fecha de fin (Hasta).
 * @param {function} props.setSearchTerm - Setter para el término de búsqueda.
 * @param {function} props.setTipoFilter - Setter para el filtro de tipo.
 * @param {function} props.setEstadoFilter - Setter para el filtro de estado.
 * @param {function} props.setClienteIdFilter - Setter para el filtro de cliente ID.
 * @param {function} props.setFechaInicioFilter - Setter para la fecha de inicio.
 * @param {function} props.setFechaFinFilter - Setter para la fecha de fin.
 * @param {function} props.onSearch - Handler para aplicar la búsqueda/filtro.
 * @param {number} props.currentPage - Página actual para la paginación.
 * @param {number} props.itemsPerPage - Ítems por página para la paginación.
 * @param {number} props.totalItems - Número total de ítems para la paginación.
 * @param {function} props.onPageChange - Callback para cambiar de página.
 * @param {function} props.onExport - Handler para exportar datos a CSV.
 * @param {function} props.onExportPdf - Handler para exportar datos a PDF.
 * @param {Array<object>} props.clients - Lista de clientes para el filtro.
 * @param {string} props.currencySymbol - Símbolo de moneda configurado globalmente.
 * @param {string} props.dateFormat - Formato de fecha configurado globalmente.
 * @param {function} props.getDateFormatOptions - Función para obtener opciones de formato de fecha.
 */
function PolizaList({
  polizas = [],
  onEditPoliza,
  onDeletePoliza,
  searchTerm,
  tipoFilter,
  estadoFilter,
  clienteIdFilter,
  fechaInicioFilter,
  fechaFinFilter,
  setSearchTerm,
  setTipoFilter,
  setEstadoFilter,
  setClienteIdFilter,
  setFechaInicioFilter,
  setFechaFinFilter,
  onSearch,
  currentPage,
  itemsPerPage,
  totalItems,
  onPageChange,
  onExport,
  onExportPdf,
  clients = [], // Asegúrate de que clients se reciba
  currencySymbol,
  dateFormat,
  getDateFormatOptions,
}) {
  const { toast } = useToast();
  const { confirm } = useConfirmation();
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false); // Nuevo estado para el spinner del PDF

  const handleDeleteClick = (poliza) => {
    confirm({
      title: "¿Estás seguro?",
      message: `¿Realmente deseas eliminar la póliza ${poliza.numero_poliza}? Esta acción no se puede deshacer.`,
      onConfirm: () => onDeletePoliza(poliza.id),
    });
  };

  const handleSearchClick = (e) => {
    e.preventDefault(); // Prevenir recarga de página si es un formulario
    console.log("DEBUG PolizaList: Ejecutando búsqueda con filtros:", { searchTerm, tipoFilter, estadoFilter, clienteIdFilter, fechaInicioFilter, fechaFinFilter });
    onSearch(searchTerm, tipoFilter, estadoFilter, clienteIdFilter, fechaInicioFilter, fechaFinFilter);
  };

  const handleClearFilters = () => {
    console.log("DEBUG PolizaList: Limpiando filtros.");
    setSearchTerm('');
    setTipoFilter('');
    setEstadoFilter('');
    setClienteIdFilter('');
    setFechaInicioFilter('');
    setFechaFinFilter('');
    onSearch('', '', '', '', '', ''); // Disparar búsqueda con filtros vacíos
  };

  // Función auxiliar para formatear fechas para la visualización (usa el formato global)
  const formatDisplayDate = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'N/A';
    // Utilizar el formato de fecha configurado globalmente
    return date.toLocaleDateString('es-ES', getDateFormatOptions(dateFormat));
  };

  /**
   * Función auxiliar para formatear números como moneda, usando el símbolo configurado.
   * @param {number} amount - El monto a formatear.
   * @returns {string} El monto formateado como moneda.
   */
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return 'N/A';
    const formatted = new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES', // Moneda base para el formato
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

    // Reemplazar el símbolo de la moneda base por el configurado
    // Asegurarse de que currencySymbol sea un string y no un objeto si viene de opciones
    const symbol = typeof currencySymbol === 'object' ? currencySymbol.value : currencySymbol;

    if (symbol === '$') {
      return formatted.replace('Bs', '$');
    } else if (symbol === '€') {
      return formatted.replace('Bs', '€');
    } else if (symbol === 'S/') {
      return formatted.replace('Bs', 'S/');
    } else if (symbol === 'COP') {
      return formatted.replace('Bs', 'COP');
    }
    return formatted; // Devuelve el formato original si el símbolo no coincide
  };


  // Opciones para el Select de Tipo de Póliza
  const tipoPolizaOptions = useMemo(() => [
    { value: '', label: 'Todos los tipos' },
    { value: 'Salud', label: 'Salud' },
    { value: 'Vida', label: 'Vida' },
    { value: 'Vehículo', label: 'Vehículo' },
    { value: 'Hogar', label: 'Hogar' },
    { value: 'Viaje', label: 'Viaje' },
    { value: 'Otros', label: 'Otros' },
  ], []);

  // Opciones para el Select de Estado de Póliza
  const estadoPolizaOptions = useMemo(() => [
    { value: '', label: 'Todos los estados' },
    { value: 'Activa', label: 'Activa' },
    { value: 'Pendiente', label: 'Pendiente' },
    { value: 'Vencida', label: 'Vencida' },
    { value: 'Cancelada', label: 'Cancelada' },
  ], []);

  // Mapear clientes para el HeadlessSafeSelect
  const clienteOptions = useMemo(() => [
    { value: '', label: 'Todos los clientes' },
    ...clients.map(c => ({ value: String(c.id), label: `${c.nombre} ${c.apellido || ''}`.trim() }))
  ], [clients]);


  // Cabeceras para exportación CSV
  const polizaCsvHeaders = useMemo(() => [
    { key: 'id', label: 'ID Póliza' },
    { key: 'numero_poliza', label: 'Número de Póliza' },
    { key: 'tipo_poliza', label: 'Tipo de Póliza' },
    { key: 'fecha_inicio', label: 'Fecha de Inicio', type: 'date' },
    { key: 'fecha_fin', label: 'Fecha de Fin', type: 'date' },
    { key: 'monto_asegurado', label: 'Monto Asegurado', formatter: formatCurrency }, // Añadir formatter
    { key: 'prima', label: 'Prima', formatter: formatCurrency }, // Añadir formatter
    { key: 'estado', label: 'Estado' },
    { key: 'observaciones', label: 'Observaciones' },
    { key: 'cliente_nombre_completo', label: 'Cliente' }, // Usar campo plano
    { key: 'empresa_aseguradora_nombre', label: 'Empresa Aseguradora' }, // Usar campo plano
    { key: 'asesor_nombre_completo', label: 'Asesor' }, // Usar campo plano
  ], [formatCurrency]); // Dependencia del formatter

  // Cabeceras para exportación PDF (más concisas)
  const polizaPdfHeaders = useMemo(() => [
    { label: 'ID', key: 'id' },
    { label: 'Nro. Póliza', key: 'numero_poliza' },
    { label: 'Tipo', key: 'tipo_poliza' },
    { label: 'F. Inicio', key: 'fecha_inicio', type: 'date' },
    { label: 'F. Fin', key: 'fecha_fin', type: 'date' },
    { label: 'Prima', key: 'prima', formatter: formatCurrency }, // Añadir formatter
    { label: 'Estado', key: 'estado' },
    { label: 'Cliente', key: 'cliente_nombre_completo' }, // Usar campo plano
    { label: 'Empresa', key: 'empresa_aseguradora_nombre' }, // Usar campo plano
    { label: 'Asesor', key: 'asesor_nombre_completo' }, // Usar campo plano
  ], [formatCurrency]); // Dependencia del formatter

  const handleExportCsv = () => {
    console.log("DEBUG PolizaList: Exportando a CSV.");
    setIsExporting(true);
    onExport(polizas, 'reporte_polizas', polizaCsvHeaders);
    setIsExporting(false);
  };

  const handleExportPdf = () => {
    console.log("DEBUG PolizaList: Exportando a PDF.");
    setIsExporting(true);
    onExportPdf(polizas, 'reporte_polizas', polizaPdfHeaders, 'Reporte de Pólizas');
    setIsExporting(false);
  };

  // FUNCIÓN PARA GENERAR FACTURA PDF INDIVIDUAL
  const handleGenerateInvoicePdf = async (polizaId, numeroPoliza) => {
    console.log(`DEBUG PolizaList: Generando factura PDF para póliza ID: ${polizaId}, Número: ${numeroPoliza}`);
    setIsGeneratingPdf(true);
    const token = localStorage.getItem('insurtech_access_token'); // Usar la constante ACCESS_TOKEN_KEY si está disponible
    if (!token) {
      toast({ title: "Error de Autenticación", description: "No se encontró el token de acceso. Por favor, inicia sesión.", variant: "destructive" });
      setIsGeneratingPdf(false);
      return;
    }

    try {
      // ¡CRÍTICO! La ruta del endpoint de PDF en main.py es /polizas/{poliza_id}/pdf/
      // Asegúrate de que API_BASE_URL esté definida y sea accesible aquí (viene de App.jsx)
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1'; // Re-definir si no se pasa como prop
      const response = await fetch(`${API_BASE_URL}/polizas/${polizaId}/pdf/`, { // <-- RUTA CORREGIDA
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text(); // Leer el texto del error
        console.error("DEBUG PolizaList: Error al generar PDF - Respuesta del servidor:", errorText);
        throw new Error(`Error ${response.status}: ${errorText || response.statusText}`);
      }

      const blob = await response.blob();
      saveAs(blob, `factura_poliza_${numeroPoliza}.pdf`);
      toast({
        title: "Factura Generada",
        description: `La factura para la póliza ${numeroPoliza} ha sido generada exitosamente.`,
        variant: "success",
      });
    } catch (error) {
      console.error("DEBUG PolizaList: Error al generar factura PDF:", error);
      toast({
        title: "Error al Generar Factura",
        description: `No se pudo generar la factura: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };


  const totalPages = Math.ceil((totalItems || 0) / (itemsPerPage || 1));

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Lista de Pólizas</h3>
      <form onSubmit={handleSearchClick} className="mb-6 space-y-4 md:space-y-0 md:flex md:flex-wrap md:gap-4 items-end">
        {/* Campo de búsqueda general */}
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="search-term">Buscar</Label>
          <Input
            id="search-term"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por número, cliente, etc."
          />
        </div>

        {/* Filtro por Tipo de Póliza */}
        <div className="flex-1 min-w-[150px]">
          <HeadlessSafeSelect
            label="Filtrar por Tipo"
            value={tipoFilter}
            onChange={setTipoFilter}
            options={tipoPolizaOptions}
            placeholder="Todos los tipos"
          />
        </div>

        {/* Filtro por Estado de Póliza */}
        <div className="flex-1 min-w-[150px]">
          <HeadlessSafeSelect
            label="Filtrar por Estado"
            value={estadoFilter}
            onChange={setEstadoFilter}
            options={estadoPolizaOptions}
            placeholder="Todos los estados"
          />
        </div>

        {/* Filtro por Cliente */}
        <div className="flex-1 min-w-[200px]">
          <HeadlessSafeSelect
            label="Filtrar por Cliente"
            value={clienteIdFilter}
            onChange={setClienteIdFilter}
            options={clienteOptions}
            placeholder="Todos los clientes"
          />
        </div>

        {/* Filtro por Fecha de Inicio (Desde) */}
        <div className="flex-1 min-w-[180px]">
          <Label htmlFor="fecha-inicio-filter">Fecha Inicio (Desde)</Label>
          <Input
            id="fecha-inicio-filter"
            name="fecha-inicio-filter"
            type="date"
            value={fechaInicioFilter}
            onChange={(e) => setFechaInicioFilter(e.target.value)}
          />
        </div>

        {/* Filtro por Fecha de Fin (Hasta) */}
        <div className="flex-1 min-w-[180px]">
          <Label htmlFor="fecha-fin-filter">Fecha Fin (Hasta)</Label>
          <Input
            id="fecha-fin-filter"
            name="fecha-fin-filter"
            type="date"
            value={fechaFinFilter}
            onChange={(e) => setFechaFinFilter(e.target.value)}
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
        <Button onClick={handleExportCsv} className="bg-green-600 hover:bg-green-700 text-white" disabled={isExporting || polizas.length === 0}>
          {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Exportar CSV
        </Button>
        <Button onClick={handleExportPdf} className="bg-red-600 hover:bg-red-700 text-white" disabled={isExporting || polizas.length === 0}>
          {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Exportar PDF
        </Button>
      </div>

      {polizas.length === 0 ? (
        <p className="text-gray-600">No hay pólizas para mostrar con los filtros aplicados.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número Póliza</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Inicio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Fin</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prima</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa Aseguradora</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asesor</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {polizas.map((poliza) => (
                <tr key={poliza.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{poliza.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{poliza.numero_poliza}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{poliza.tipo_poliza}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDisplayDate(poliza.fecha_inicio)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDisplayDate(poliza.fecha_fin)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(poliza.prima)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{poliza.estado}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {/* ¡CRÍTICO! Usar el campo plano */}
                    {poliza.cliente_nombre_completo || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {/* ¡CRÍTICO! Usar el campo plano */}
                    {poliza.empresa_aseguradora_nombre || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {/* ¡CRÍTICO! Usar el campo plano */}
                    {poliza.asesor_nombre_completo || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Button
                      variant="link"
                      onClick={() => onEditPoliza(poliza)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Editar
                    </Button>
                    <Button
                      variant="link"
                      onClick={() => handleDeleteClick(poliza)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Eliminar
                    </Button>
                    {/* BOTÓN PARA GENERAR FACTURA PDF */}
                    <Button
                      variant="link"
                      onClick={() => handleGenerateInvoicePdf(poliza.id, poliza.numero_poliza)}
                      className="text-blue-600 hover:text-blue-900"
                      disabled={isGeneratingPdf}
                    >
                      {isGeneratingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Factura PDF
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
        <PaginationComponent
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}

export default PolizaList;