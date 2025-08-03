// src/components/EmpresaAseguradoraList.jsx
import React, { useState, useEffect } from 'react';
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
import { PencilIcon, Trash2Icon, SearchIcon, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { PaginationComponent } from './Pagination';
import { useToast } from '@/lib/use-toast';
import { useConfirmation } from './ConfirmationContext'; // Importa el hook useConfirmation
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Componente de lista para mostrar Empresas Aseguradoras con búsqueda, paginación y exportación.
 * Recibe la lista de empresas y las funciones de acción desde el componente padre.
 *
 * @param {object} props - Las propiedades del componente.
 * @param {Array<object>} props.empresas - La lista de empresas a mostrar.
 * @param {function} props.onEditEmpresaAseguradora - Función para iniciar la edición de una empresa en el padre.
 * @param {function} props.onDeleteEmpresaAseguradora - Función para eliminar una empresa en el padre.
 * @param {number} props.currentPage - Página actual para la paginación.
 * @param {number} props.itemsPerPage - Ítems por página.
 * @param {number} props.totalItems - Total de ítems.
 * @param {function} props.onPageChange - Callback para cambio de página.
 * @param {string} props.searchTerm - Término de búsqueda general.
 * @param {function} props.onExport - Callback para exportar a CSV.
 * @param {function} props.onExportPdf - Callback para exportar a PDF.
 * @param {string} props.dateFormat - Formato de fecha seleccionado.
 * @param {function} props.getDateFormatOptions - Función para obtener opciones de formato de fecha.
 */
function EmpresaAseguradoraList({
  empresas,
  onEditEmpresaAseguradora,
  onDeleteEmpresaAseguradora,
  currentPage,
  itemsPerPage,
  totalItems,
  onPageChange,
  searchTerm,
  onExport,
  onExportPdf,
  dateFormat,
  getDateFormatOptions,
}) {
  const { toast } = useToast();
  const { confirm } = useConfirmation(); // Usa el hook de confirmación

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [empresaToDelete, setEmpresaToDelete] = useState(null);

  // Filtrado en el lado del cliente basado en el searchTerm
  // Ahora el filtro se aplica al término de búsqueda general que viene de EmpresasAseguradorasPage
  const filteredEmpresas = Array.isArray(empresas) ? empresas.filter((empresa) => {
    const lowerCaseSearchTerm = searchTerm ? searchTerm.toLowerCase() : '';
    return (
      (empresa.nombre?.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
      (empresa.rif?.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
      (empresa.email?.toLowerCase() || '').includes(lowerCaseSearchTerm)
    );
  }) : [];

  const handleDeleteClick = (empresa) => {
    setEmpresaToDelete(empresa);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (empresaToDelete) {
      const confirmed = await confirm({
        title: "¿Estás seguro?",
        message: `¿Realmente deseas eliminar la empresa aseguradora "${empresaToDelete.nombre}"? Esta acción no se puede deshacer.`,
      });

      if (confirmed) {
        try {
          await onDeleteEmpresaAseguradora(empresaToDelete.id);
          toast({
            title: "Empresa Eliminada",
            description: `La empresa aseguradora "${empresaToDelete.nombre}" ha sido eliminada exitosamente.`,
            variant: "success",
          });
        } catch (error) {
          console.error("Error al eliminar empresa aseguradora:", error);
          toast({
            title: "Error al Eliminar",
            description: `No se pudo eliminar la empresa aseguradora "${empresaToDelete.nombre}". ${error.message || ''}`,
            variant: "destructive",
          });
        } finally {
          setIsDeleteDialogOpen(false);
          setEmpresaToDelete(null);
        }
      } else {
        setIsDeleteDialogOpen(false);
        setEmpresaToDelete(null);
      }
    }
  };

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0">
          <CardTitle className="text-2xl font-bold text-gray-800">Listado de Empresas Aseguradoras</CardTitle>
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
            <Button
              onClick={onExport}
              className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white rounded-md shadow"
            >
              Exportar CSV
            </Button>
            <Button
              onClick={onExportPdf}
              className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white rounded-md shadow"
            >
              Exportar PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredEmpresas.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="min-w-full divide-y divide-gray-200">
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      RIF
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teléfono
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dirección
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Registro
                    </TableHead>
                    <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-white divide-y divide-gray-200">
                  {filteredEmpresas.map((empresa) => (
                    <TableRow key={empresa.id} className="hover:bg-gray-50">
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {empresa.nombre}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {empresa.rif}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {empresa.email}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {empresa.telefono}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {empresa.direccion}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {empresa.fecha_registro ? format(new Date(empresa.fecha_registro), dateFormat, { locale: es }) : 'N/A'}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditEmpresaAseguradora(empresa)}
                          title="Editar"
                        >
                          <PencilIcon className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(empresa)}
                          title="Eliminar"
                        >
                          <Trash2Icon className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              No hay empresas aseguradoras registradas con los filtros aplicados.
            </p>
          )}

          {totalItems > itemsPerPage && (
            <PaginationComponent
              currentPage={currentPage}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={onPageChange}
            />
          )}
        </CardContent>
      </Card>
      {/* Diálogo de Confirmación de Eliminación */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">Confirmar Eliminación</DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Esta acción eliminará permanentemente la empresa aseguradora "{empresaToDelete?.nombre}". ¿Estás seguro de que deseas continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-4 mt-6">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
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
    </>
  );
}
export default EmpresaAseguradoraList;