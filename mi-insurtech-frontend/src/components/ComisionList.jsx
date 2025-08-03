// src/components/ComisionList.jsx
import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PaginationComponent } from './Pagination';
import { useConfirmation } from './ConfirmationContext';
import { useToast } from './ToastContext';
import { Loader2 } from 'lucide-react';

import {
  ESTATUS_PAGO_OPTIONS,
  ACCESS_TOKEN_KEY
} from './constantes';

// Helper function to format a date string to a displayable format
const formatDisplayDate = (isoString, format = 'DD/MM/YYYY') => {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  // Basic format based on 'DD/MM/YYYY', can be expanded
  return `${day}/${month}/${year}`;
};

// Helper function to format a currency value
const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'N/A';
  return `$${parseFloat(value).toFixed(2)}`;
};

/**
 * Componente para mostrar una lista de comisiones con filtros y paginación.
 */
function ComisionList({
  comisiones = [],
  asesores = [],
  polizas = [],
  onDeleteComision,
  onSearch,
  currentPage,
  itemsPerPage,
  totalItems,
  onPageChange,
  isLoadingComisiones,
  isLoadingAdvisors,
  isLoadingPolicies,
  currencySymbol,
  dateFormat,
  getDateFormatOptions,
  onExport,
  onExportPdf,
  asesorIdFilter,
  estadoPagoFilter,
  fechaInicioFilter,
  fechaFinFilter,
  setAsesorIdFilter,
  setEstadoPagoFilter,
  setFechaInicioFilter,
  setFechaFinFilter,
  API_URL,
}) {
  const { toast } = useToast();
  const { showConfirmation } = useConfirmation();

  const handleDeleteClick = useCallback((comision) => {
    showConfirmation({
      title: "Confirmar Eliminación",
      message: `¿Estás seguro de que deseas eliminar la comisión con ID ${comision.id}?`,
      onConfirm: () => onDeleteComision(comision.id),
    });
  }, [showConfirmation, onDeleteComision]);


  // Opciones de filtro para el select de estatus de pago
  const estatusPagoOptions = useMemo(() => {
    return [{ value: '', label: 'Todos' }, ...ESTATUS_PAGO_OPTIONS];
  }, []);

  // Función para obtener el nombre del asesor por ID
  const getAsesorNombreCompleto = (id) => {
    const asesor = asesores.find(a => a.id === id);
    return asesor ? `${asesor.nombre} ${asesor.apellido}` : 'N/A';
  };

  // Función para obtener el número de póliza por ID
  const getPolizaNumero = (id) => {
    const poliza = polizas.find(p => p.id === id);
    return poliza ? poliza.numero_poliza : 'N/A';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Lista de Comisiones</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoadingComisiones ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Asesor</TableHead>
                    <TableHead>Póliza</TableHead>
                    <TableHead>Tipo</TableHead>
                    {/* CAMBIO #1: Cambiar el título de la columna */}
                    <TableHead>Porcentaje de Comisión</TableHead>
                    <TableHead>Monto Base</TableHead>
                    <TableHead>Monto Final</TableHead>
                    {/* CAMBIO #2: Cambiar el título de la columna */}
                    <TableHead>Fecha de Generación</TableHead>
                    <TableHead>Estatus de Pago</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comisiones.map((comision) => (
                    <TableRow key={comision.id}>
                      <TableCell className="font-medium">{comision.id}</TableCell>
                      <TableCell>{getAsesorNombreCompleto(comision.asesor_id)}</TableCell>
                      <TableCell>{getPolizaNumero(comision.poliza_id)}</TableCell>
                      <TableCell>{comision.tipo_comision}</TableCell>
                      {/* CAMBIO #3: Mostrar el porcentaje de comisión */}
                      <TableCell>{comision.porcentaje_comision}%</TableCell>
                      <TableCell>{formatCurrency(comision.monto)}</TableCell>
                      <TableCell>{formatCurrency(comision.monto * (1 + comision.porcentaje_comision / 100))}</TableCell>
                      {/* CAMBIO #4: Formatear la fecha de generación correctamente */}
                      <TableCell>{formatDisplayDate(comision.fecha_calculo)}</TableCell>
                      <TableCell>{comision.estatus_pago}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(comision)}
                        >
                          Eliminar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <PaginationComponent
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              totalItems={totalItems}
              onPageChange={onPageChange}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default ComisionList;
