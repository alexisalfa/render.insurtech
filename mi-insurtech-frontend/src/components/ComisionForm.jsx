// src/components/ComisionForm.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/lib/use-toast';

// Importar los componentes de estilo reutilizables
import FormContainer from './FormContainer';
import StyledFormField from './StyledFormField';
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';

// Importar las constantes para opciones de enums
import {
  ESTATUS_PAGO_OPTIONS,
  TIPO_COMISION_OPTIONS,
} from './constantes'; // ¡CRÍTICO! Importar desde constantes.jsx

// No necesitamos formatDateToInput ni parseDateFromInput aquí, StyledFormField los maneja
// const formatDateToInput = (isoString) => { ... };
// const parseDateFromInput = (dateString) => { ... };

const ACCESS_TOKEN_KEY = 'insurtech_access_token';

/**
 * Componente para crear o editar una comisión.
 *
 * @param {object} props - Las propiedades del componente.
 * @param {function} props.onComisionSaved - Función de callback que se ejecuta cuando una comisión es guardada exitosamente.
 * @param {object|null} props.editingComision - Objeto comisión si se está editando una existente, de lo contrario null.
 * @param {function} props.setEditingComision - Función para establecer la comisión que se está editando (para cerrar el formulario de edición).
 * @param {Array<object>} props.asesores - Lista de asesores disponibles para seleccionar.
 * @param {Array<object>} props.polizas - Lista de pólizas disponibles para seleccionar.
 * @param {boolean} props.isLoadingAdvisors - Indica si la lista de asesores está cargando.
 * @param {boolean} props.isLoadingPolicies - Indica si la lista de pólizas está cargando.
 * @param {string} props.token - El token de autenticación del usuario.
 * @param {string} props.API_URL - La URL base de la API.
 */
function ComisionForm({
  onComisionSaved,
  editingComision,
  setEditingComision,
  asesores,
  polizas,
  isLoadingAdvisors,
  isLoadingPolicies,
  token,
  API_URL,
}) {
  const { toast } = useToast();

  const initialComisionState = useMemo(() => ({
    asesor_id: '',
    poliza_id: '',
    tipo_comision: 'Venta Nueva', // ¡CRÍTICO! Coincidir con el enum del backend
    valor_comision: '',
    monto_base: '',
    monto_final: '',
    fecha_generacion: undefined, // undefined para StyledFormField
    fecha_pago: undefined, // undefined para StyledFormField
    estatus_pago: 'Pendiente', // ¡CRÍTICO! Coincidir con el enum del backend
    observaciones: '',
  }), []);

  const [comision, setComision] = useState(initialComisionState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (editingComision) {
      setComision({
        asesor_id: editingComision.asesor_id ? String(editingComision.asesor_id) : '',
        poliza_id: editingComision.poliza_id ? String(editingComision.poliza_id) : '',
        tipo_comision: editingComision.tipo_comision || 'Venta Nueva',
        valor_comision: editingComision.valor_comision !== undefined && editingComision.valor_comision !== null ? String(editingComision.valor_comision) : '',
        monto_base: editingComision.monto_base !== undefined && editingComision.monto_base !== null ? String(editingComision.monto_base) : '',
        monto_final: editingComision.monto_final !== undefined && editingComision.monto_final !== null ? String(editingComision.monto_final) : '',
        fecha_generacion: editingComision.fecha_generacion ? new Date(editingComision.fecha_generacion) : undefined,
        fecha_pago: editingComision.fecha_pago ? new Date(editingComision.fecha_pago) : undefined,
        estatus_pago: editingComision.estatus_pago || 'Pendiente',
        observaciones: editingComision.observaciones || '',
      });
    } else {
      setComision(initialComisionState);
    }
  }, [editingComision, initialComisionState]);

  // Efecto para calcular monto_final automáticamente
  useEffect(() => {
    const calculateMontoFinal = () => {
      const valor = parseFloat(String(comision.valor_comision).replace(',', '.'));
      const base = parseFloat(String(comision.monto_base).replace(',', '.'));

      if (isNaN(valor) || isNaN(base) || base < 0) {
        setComision((prev) => ({ ...prev, monto_final: '' }));
        return;
      }

      let finalAmount = 0;
      // ¡CRÍTICO! Coincidir con los valores del enum del backend
      if (comision.tipo_comision === 'Venta Nueva' || comision.tipo_comision === 'Renovación' || comision.tipo_comision === 'Servicio Adicional') {
        // Asumiendo que para estos tipos, valor_comision es un porcentaje
        finalAmount = (base * valor) / 100;
      } else { // Si se añade un tipo de comisión 'Fija' en el futuro
        finalAmount = valor;
      }
      setComision((prev) => ({ ...prev, monto_final: finalAmount.toFixed(2) }));
    };

    calculateMontoFinal();
  }, [comision.tipo_comision, comision.valor_comision, comision.monto_base]);


  // Manejador genérico para cambios en los inputs de texto/número
  const handleChange = useCallback((e) => {
    const { id, value } = e.target;
    let processedValue = value;

    // ¡CRÍTICO! Reemplazar coma por punto para campos numéricos
    if (id === 'valor_comision' || id === 'monto_base' || id === 'monto_final') {
      processedValue = value.replace(',', '.');
    }
    console.log(`DEBUG ComisionForm: Input changed - ID: ${id}, Value: ${processedValue}`);
    setComision((prev) => ({ ...prev, [id]: processedValue }));
  }, []);

  // Manejador para cambios en los Select de Shadcn/UI (usado por StyledFormField type="select")
  const handleSelectChange = useCallback((id, value) => {
    console.log(`DEBUG ComisionForm: Select changed - ID: ${id}, Value: ${value}`);
    setComision((prev) => {
      let parsedValue = value;
      // Convertir IDs a números o null si están vacíos
      if (['poliza_id', 'asesor_id'].includes(id)) {
        if (value === '' || value === null || value === undefined) {
          parsedValue = null;
        } else {
          parsedValue = parseInt(value, 10);
          if (isNaN(parsedValue)) {
            parsedValue = null;
          }
        }
      }
      return { ...prev, [id]: parsedValue };
    });
  }, []);

  // Manejador para cambios en el Calendar (usado por StyledFormField type="date")
  const handleDateChange = useCallback((id, date) => {
    console.log(`DEBUG ComisionForm: Date changed - ID: ${id}, Date: ${date}`);
    setComision((prev) => ({ ...prev, [id]: date }));
  }, []);


  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!token) {
      toast({ title: "Error de Autenticación", description: "No hay token de autenticación. Por favor, inicie sesión.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    // Formatear datos para enviar al backend
    const dataToSend = {
      asesor_id: comision.asesor_id ? parseInt(comision.asesor_id, 10) : null,
      poliza_id: comision.poliza_id ? parseInt(comision.poliza_id, 10) : null,
      tipo_comision: comision.tipo_comision,
      
      // Nombres corregidos para coincidir con el backend
      porcentaje_comision: comision.valor_comision ? parseFloat(String(comision.valor_comision).replace(',', '.')) : null,
      monto: comision.monto_base ? parseFloat(String(comision.monto_base).replace(',', '.')) : null,

      monto_final: comision.monto_final ? parseFloat(String(comision.monto_final).replace(',', '.')) : null,
      fecha_generacion: comision.fecha_generacion instanceof Date && !isNaN(comision.fecha_generacion) ? comision.fecha_generacion.toISOString() : null,
      fecha_pago: comision.fecha_pago instanceof Date && !isNaN(comision.fecha_pago) ? comision.fecha_pago.toISOString() : null,
      estatus_pago: comision.estatus_pago,
      observaciones: comision.observaciones,
    };

    console.log("DEBUG ComisionForm: Data to send (corrected):", dataToSend);

    // Validaciones de frontend
    if (!dataToSend.asesor_id) {
      setError('Debe seleccionar un asesor.');
      toast({ title: "Error de Formulario", description: "Debe seleccionar un asesor.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    if (!dataToSend.poliza_id) {
      setError('Debe seleccionar una póliza.');
      toast({ title: "Error de Formulario", description: "Debe seleccionar una póliza.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    if (dataToSend.porcentaje_comision === null || isNaN(dataToSend.porcentaje_comision) || dataToSend.porcentaje_comision < 0) {
      setError('El valor de la comisión es obligatorio y debe ser un número positivo.');
      toast({ title: "Error de Formulario", description: "El valor de la comisión es obligatorio y debe ser un número positivo.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    if (dataToSend.monto === null || isNaN(dataToSend.monto) || dataToSend.monto < 0) {
      setError('El monto base es obligatorio y debe ser un número positivo.');
      toast({ title: "Error de Formulario", description: "El monto base es obligatorio y debe ser un número positivo.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    if (dataToSend.monto_final === null || isNaN(dataToSend.monto_final) || dataToSend.monto_final < 0) {
      setError('El monto final es obligatorio y debe ser un número positivo.');
      toast({ title: "Error de Formulario", description: "El monto final es obligatorio y debe ser un número positivo.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    if (!dataToSend.fecha_generacion) {
      setError('La fecha de generación es obligatoria.');
      toast({ title: "Error de Formulario", description: "La fecha de generación es obligatoria.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    if (!dataToSend.estatus_pago) {
      setError('El estatus de pago es obligatorio.');
      toast({ title: "Error de Formulario", description: "El estatus de pago es obligatorio.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    if (!dataToSend.tipo_comision) {
      setError('El tipo de comisión es obligatorio.');
      toast({ title: "Error de Formulario", description: "El tipo de comisión es obligatorio.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }


    try {
      const method = editingComision ? 'PUT' : 'POST';
      // ¡CRÍTICO! Rutas ajustadas para coincidir con el router que tiene prefix="/comisiones"
      const url = editingComision
        ? `${API_URL}/comisiones/${editingComision.id}` // Sin barra final aquí para PUT
        : `${API_URL}/comisiones/`; // ¡CRÍTICO! Corregido: antes era /comisiones/comisiones/, ahora es /comisiones/

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Error desconocido en el servidor.' }));
        let errorMessage = errorData.detail || `Error ${response.status}: ${response.statusText}`;
        
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(err => {
            const loc = err.loc ? `Campo: ${err.loc.join(' -> ')}` : '';
            return `${loc} - ${err.msg}`;
          }).join('; ');
        }
        
        throw new Error(errorMessage);
      }

      toast({
        title: editingComision ? "Comisión Actualizada" : "Comisión Creada",
        description: editingComision ? "La comisión ha sido actualizada con éxito." : "La comisión ha sido creada con éxito.",
        variant: "success",
      });
      onComisionSaved();
      setComision(initialComisionState);
      setEditingComision(null);
    } catch (error) {
      console.error("Error al guardar comisión:", error);
      setError(error.message);
      toast({
        title: "Error al Guardar Comisión",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [comision, editingComision, onComisionSaved, asesores, polizas, token, API_URL, toast, initialComisionState, setEditingComision]);

  const handleCancelEdit = useCallback(() => {
    setEditingComision(null);
    setComision(initialComisionState);
    setError(null);
  }, [setEditingComision, initialComisionState]);

  // Mapear asesores a un formato { value: ..., label: texto }
  const asesorOptions = useMemo(() => {
    return asesores.map(a => ({
      value: String(a.id),
      label: `${a.nombre} ${a.apellido || ''} (${a.cedula})`
    }));
  }, [asesores]);

  // Mapear pólizas a un formato { value: ..., label: texto }
  const polizaOptions = useMemo(() => {
    return polizas.map(p => ({
      value: String(p.id),
      label: `${p.numero_poliza} - ${p.cliente ? p.cliente.nombre : 'N/A'} ${p.cliente ? p.cliente.apellido : ''}`
    }));
  }, [polizas]);


  return (
    <FormContainer title={editingComision ? 'Editar Comisión' : 'Crear Nueva Comisión'}>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Asesor - Selector */}
        <StyledFormField
          label="Asesor"
          htmlFor="asesor_id"
          required
          type="select"
          options={asesorOptions}
          disabled={isLoadingAdvisors}
          value={comision.asesor_id}
          onValueChange={(value) => handleSelectChange('asesor_id', value)}
          placeholder={isLoadingAdvisors ? "Cargando asesores..." : "Selecciona un asesor"}
        />

        {/* Póliza - Selector */}
        <StyledFormField
          label="Póliza"
          htmlFor="poliza_id"
          required
          type="select"
          options={polizaOptions}
          disabled={isLoadingPolicies}
          value={comision.poliza_id}
          onValueChange={(value) => handleSelectChange('poliza_id', value)}
          placeholder={isLoadingPolicies ? "Cargando pólizas..." : "Selecciona una póliza"}
        />

        {/* Tipo de Comisión - Selector */}
        <StyledFormField
          label="Tipo de Comisión"
          htmlFor="tipo_comision"
          required
          type="select"
          options={TIPO_COMISION_OPTIONS} // ¡CRÍTICO! Usar opciones de constantes.jsx
          value={comision.tipo_comision}
          onValueChange={(value) => handleSelectChange('tipo_comision', value)}
          placeholder="Selecciona tipo"
        />

        {/* Porcentaje de Comisión - Input numérico */}
        <StyledFormField
          label="Porcentaje de comisión"
          id="valor_comision"
          required
          type="number"
          step="0.01"
          value={comision.valor_comision}
          onChange={handleChange}
          placeholder={
            ['Venta Nueva', 'Renovación', 'Servicio Adicional'].includes(comision.tipo_comision)
              ? 'Ej: 10 es 10%'
              : 'Ej: 50.00'
          }
        />

        {/* Monto Base - Input numérico */}
        <StyledFormField
          label="Monto Base"
          id="monto_base"
          required
          type="number"
          step="0.01"
          value={comision.monto_base}
          onChange={handleChange}
          placeholder="Ej: 1000.00"
          disabled={comision.tipo_comision !== 'Venta Nueva' && comision.tipo_comision !== 'Renovación' && comision.tipo_comision !== 'Servicio Adicional'} // Deshabilitar si no es porcentaje
        />

        {/* Monto Final - Input numérico (solo lectura) */}
        <StyledFormField
          label="Monto Final"
          id="monto_final"
          required
          type="number"
          step="0="
          value={comision.monto_final}
          readOnly // Solo lectura, se calcula automáticamente
          className="bg-gray-100 cursor-not-allowed"
        />

        {/* Fecha de Generación - Input de fecha */}
        <StyledFormField
          label="Fecha de Generación"
          htmlFor="fecha_generacion"
          required
          type="date"
          value={comision.fecha_generacion} // Debe ser un objeto Date o undefined
          onDateSelect={(date) => handleDateChange('fecha_generacion', date)}
          placeholder="Selecciona una fecha"
        />

        {/* Fecha de Pago - Input de fecha (opcional) */}
        <StyledFormField
          label="Fecha de Pago"
          htmlFor="fecha_pago"
          type="date"
          value={comision.fecha_pago} // Debe ser un objeto Date o undefined
          onDateSelect={(date) => handleDateChange('fecha_pago', date)}
          placeholder="Selecciona una fecha"
        />

        {/* Estatus de Pago - Selector */}
        <StyledFormField
          label="Estatus de Pago"
          htmlFor="estatus_pago"
          required
          type="select"
          options={ESTATUS_PAGO_OPTIONS} // ¡CRÍTICO! Usar opciones de constantes.jsx
          value={comision.estatus_pago}
          onValueChange={(value) => handleSelectChange('estatus_pago', value)}
          placeholder="Selecciona estatus"
        />

        {/* Observaciones - Input de texto */}
        <StyledFormField
          label="Observaciones"
          id="observaciones"
          type="text"
          value={comision.observaciones}
          onChange={handleChange}
          placeholder="Notas adicionales sobre la comisión"
          className="md:col-span-2"
        />

        {error && <p className="text-red-500 text-sm md:col-span-2">{error}</p>}

        <div className="md:col-span-2 flex justify-end space-x-4 mt-6">
          {editingComision && (
            <SecondaryButton onClick={handleCancelEdit} type="button" disabled={isSubmitting}>
              Cancelar Edición
            </SecondaryButton>
          )}
          <PrimaryButton
            type="submit"
            disabled={isSubmitting || isLoadingAdvisors || asesores.length === 0 || isLoadingPolicies || polizas.length === 0}
          >
            {isSubmitting ? 'Guardando...' : (editingComision ? 'Actualizar Comisión' : 'Crear Comisión')}
          </PrimaryButton>
        </div>
      </form>
    </FormContainer>
  );
}

export default ComisionForm;