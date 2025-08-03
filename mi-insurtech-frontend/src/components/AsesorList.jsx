// src/components/AsesorList.jsx
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PencilIcon, Trash2Icon, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/lib/use-toast';
import { useConfirmation } from './ConfirmationContext';
import { PaginationComponent } from './Pagination'; // Importa el componente de paginación
import { format } from 'date-fns'; // Para formatear la fecha
import { es } from 'date-fns/locale'; // Para el idioma español en date-fns

/**
 * Componente para mostrar la lista de asesores.
 *
 * @param {object} props - Las propiedades del componente.
 * @param {Array<object>} props.asesores - Array de objetos asesor.
 * @param {function} props.onEditAsesor - Callback para editar un asesor.
 * @param {function} props.onDeleteAsesor - Callback para eliminar un asesor.
 * @param {number} props.currentPage - Página actual para la paginación.
 * @param {number} props.itemsPerPage - Ítems por página para la paginación.
 * @param {number} props.totalItems - Número total de ítems para la paginación.
 * @param {function} props.onPageChange - Callback para cambiar de página.
 * @param {string} props.searchTerm - Término de búsqueda actual.
 * @param {function} props.setSearchTerm - Setter para el término de búsqueda (si se usa input interno).
 * @param {function} props.onSearch - Handler para aplicar la búsqueda (si se usa input interno).
 * @param {string} props.dateFormat - Formato de fecha configurado globalmente.
 * @param {function} props.getDateFormatOptions - Función para obtener opciones de formato de fecha.
 * @param {function} props.onExport - Callback para exportar a CSV.
 * @param {function} props.onExportPdf - Callback para exportar a PDF.
 * @param {boolean} props.isLoading - Indica si la lista está cargando.
 */
function AsesorList({
  asesores,
  onEditAsesor,
  onDeleteAsesor,
  currentPage,
  itemsPerPage,
  totalItems,
  onPageChange,
  searchTerm,
  setSearchTerm,
  onSearch,
  dateFormat,
  getDateFormatOptions,
  onExport,
  onExportPdf,
  isLoading,
}) {
  const { toast } = useToast();
  const { confirm } = useConfirmation(); // Usar el hook de confirmación

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [asesorToDelete, setAsesorToDelete] = useState(null);

  // Función para formatear la fecha de contratación
  const formatDisplayDate = (dateString) => {
    if (!dateString) return ''; // ¡CRÍTICO! Manejar valores nulos o indefinidos
    try {
      const date = new Date(dateString);
      if (isNaN(date)) return ''; // Si la fecha no es válida, devolver vacío
      return format(date, "PPP", { locale: es }); // "PPP" es un formato amigable de date-fns
    } catch (e) {
      console.error("Error al formatear fecha:", e);
      return '';
    }
  };

  const handleDeleteClick = (asesor) => {
    setAsesorToDelete(asesor);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (asesorToDelete) {
      setIsDeleteDialogOpen(false);
      try {
        await onDeleteAsesor(asesorToDelete.id);
        toast({
          title: "Eliminación Exitosa",
          description: `El asesor ${asesorToDelete.nombre} ${asesorToDelete.apellido} ha sido eliminado.`,
          variant: "success",
        });
      } catch (error) {
        console.error("Error al eliminar asesor:", error);
        toast({
          title: "Error de Eliminación",
          description: `No se pudo eliminar el asesor: ${error.message}`,
          variant: "destructive",
        });
      } finally {
        setAsesorToDelete(null);
      }
    }
  };

  const totalPages = useMemo(() => {
    return Math.ceil(totalItems / itemsPerPage);
  }, [totalItems, itemsPerPage]);

  return (
    <Card className="bg-gray-900 text-white border border-gray-700 shadow-lg">
      <CardHeader className="border-b border-gray-700 pb-4 mb-4">
        <CardTitle className="text-2xl font-bold text-blue-400">Lista de Asesores</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-400">Cargando asesores...</span>
          </div>
        ) : asesores.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No hay asesores para mostrar.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-full divide-y divide-gray-700">
              <TableHeader className="bg-gray-800">
                <TableRow>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Nombre</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Apellido</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Cédula</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Teléfono</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Fecha Contratación</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Empresa Aseguradora</TableHead>
                  <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-gray-900 divide-y divide-gray-800">
                {asesores.map((asesor) => (
                  <TableRow key={asesor.id} className="hover:bg-gray-800 transition-colors duration-200">
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{asesor.nombre}</TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{asesor.apellido}</TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{asesor.cedula}</TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{asesor.email}</TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{asesor.telefono}</TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatDisplayDate(asesor.fecha_contratacion)}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {asesor.empresa_aseguradora_nombre || 'N/A'}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditAsesor(asesor)}
                          className="text-blue-400 hover:text-blue-300 hover:bg-gray-700"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(asesor)}
                          className="text-red-400 hover:text-red-300 hover:bg-gray-700"
                        >
                          <Trash2Icon className="h-5 w-5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {totalPages > 1 && (
          <PaginationComponent
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        )}
      </CardContent>
      {/* Diálogo de Confirmación de Eliminación */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] p-6 bg-gray-900 text-white border border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-blue-400">Confirmar Eliminación</DialogTitle>
            <DialogDescription className="text-gray-400 mt-2">
              Esta acción eliminará permanentemente al asesor "{asesorToDelete?.nombre} {asesorToDelete?.apellido}". ¿Estás seguro de que deseas continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-4 mt-6">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="px-4 py-2 rounded-md border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default AsesorList;
