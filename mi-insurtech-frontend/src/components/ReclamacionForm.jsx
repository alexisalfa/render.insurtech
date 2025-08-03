// src/components/ReclamacionForm.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/lib/use-toast';

// Importar los componentes de estilo reutilizables
import FormContainer from './FormContainer';
import StyledFormField from './StyledFormField';
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';

// Importar las constantes
import { ESTADO_RECLAMACION_OPTIONS } from './constantes';

// No necesitamos formatDateToInput ni parseDateFromInput aquí, StyledFormField los maneja
// const formatDateToInput = (isoString) => { ... };
// const parseDateFromInput = (dateString) => { ... };

const ACCESS_TOKEN_KEY = 'insurtech_access_token';

/**
 * Componente para crear o editar una reclamación.
 *
 * @param {object} props - Las propiedades del componente.
 * @param {function} props.onReclamacionSaved - Función de callback que se ejecuta cuando una reclamación es guardada exitosamente.
 * @param {object|null} props.editingReclamacion - Objeto reclamación si se está editando una existente, de lo contrario null.
 * @param {function} props.setEditingReclamacion - Función para establecer la reclamación que se está editando (para cerrar el formulario de edición).
 * @param {Array<object>} props.polizas - Lista de pólizas disponibles para seleccionar.
 * @param {Array<object>} props.clientes - Lista de clientes disponibles para seleccionar.
 * @param {boolean} props.isLoadingPolicies - Indica si la lista de pólizas está cargando.
 * @param {boolean} props.isLoadingClients - Indica si la lista de clientes está cargando.
 * @param {string} props.API_URL - URL base de la API.
 * @param {boolean} props.isAuthLoading - Indica si la autenticación aún está cargando.
 * @param {string} props.token - El token de autenticación del usuario.
 */
function ReclamacionForm({
  onReclamacionSaved,
  editingReclamacion,
  setEditingReclamacion,
  polizas,
  clientes,
  isLoadingPolicies,
  isLoadingClients,
  API_URL,
  isAuthLoading,
  token,
}) {
  const { toast } = useToast();
  const initialReclamacionState = useMemo(() => ({
    fecha_reclamacion: undefined, // undefined para que StyledFormField lo maneje como Date o vacío
    descripcion: '',
    monto_reclamado: '',
    monto_aprobado: '',
    estado: 'Pendiente', // Valor por defecto
    poliza_id: '',
    cliente_id: '',
    observaciones: '', // Asegurarse de que este campo también esté en el estado si se usa
  }), []);

  const [reclamacion, setReclamacion] = useState(initialReclamacionState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (editingReclamacion) {
      setReclamacion({
        // Convertir ISO string a objeto Date para el campo de fecha
        fecha_reclamacion: editingReclamacion.fecha_reclamacion ? new Date(editingReclamacion.fecha_reclamacion) : undefined,
        descripcion: editingReclamacion.descripcion || '',
        // Asegurarse de que los valores numéricos sean strings para el input
        monto_reclamado: editingReclamacion.monto_reclamado !== undefined && editingReclamacion.monto_reclamado !== null ? String(editingReclamacion.monto_reclamado) : '',
        monto_aprobado: editingReclamacion.monto_aprobado !== undefined && editingReclamacion.monto_aprobado !== null ? String(editingReclamacion.monto_aprobado) : '',
        estado: editingReclamacion.estado || 'Pendiente',
        poliza_id: editingReclamacion.poliza_id ? String(editingReclamacion.poliza_id) : '',
        cliente_id: editingReclamacion.cliente_id ? String(editingReclamacion.cliente_id) : '',
        observaciones: editingReclamacion.observaciones || '',
      });
    } else {
      setReclamacion(initialReclamacionState);
    }
  }, [editingReclamacion, initialReclamacionState]);

  // Manejador genérico para cambios en los inputs de texto/número
  const handleChange = useCallback((e) => {
    const { id, value } = e.target;
    let processedValue = value;

    // ¡CRÍTICO! Reemplazar coma por punto para campos numéricos
    if (id === 'monto_reclamado' || id === 'monto_aprobado') {
      processedValue = value.replace(',', '.');
    }
    console.log(`DEBUG ReclamacionForm: Input changed - ID: ${id}, Value: ${processedValue}`);
    setReclamacion((prev) => ({ ...prev, [id]: processedValue }));
  }, []);

  // Manejador para cambios en los Select de Shadcn/UI (usado por StyledFormField type="select")
  const handleSelectChange = useCallback((id, value) => {
    console.log(`DEBUG ReclamacionForm: Select changed - ID: ${id}, Value: ${value}`);
    setReclamacion((prev) => {
      let parsedValue = value;
      // Convertir IDs a números o null si están vacíos
      if (['poliza_id', 'cliente_id'].includes(id)) {
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
    console.log(`DEBUG ReclamacionForm: Date changed - ID: ${id}, Date: ${date}`);
    setReclamacion((prev) => ({ ...prev, [id]: date }));
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

    // Preparar los datos para enviar al backend
    const dataToSend = {
      ...reclamacion,
      // Asegurarse de que los IDs sean números o null
      poliza_id: reclamacion.poliza_id ? parseInt(reclamacion.poliza_id, 10) : null,
      cliente_id: reclamacion.cliente_id ? parseInt(reclamacion.cliente_id, 10) : null,
      // Asegurarse de que los montos sean números o null
      monto_reclamado: reclamacion.monto_reclamado ? parseFloat(reclamacion.monto_reclamado) : null,
      monto_aprobado: reclamacion.monto_aprobado ? parseFloat(reclamacion.monto_aprobado) : null,
      // Formatear fechas a ISO string para el backend
      fecha_reclamacion: reclamacion.fecha_reclamacion instanceof Date && !isNaN(reclamacion.fecha_reclamacion) ? reclamacion.fecha_reclamacion.toISOString() : null,
    };

    console.log("DEBUG ReclamacionForm: Data to send:", dataToSend);

    // Validaciones básicas
    if (!dataToSend.fecha_reclamacion) {
      setError('La fecha de reclamación es obligatoria.');
      toast({ title: "Error de Formulario", description: "La fecha de reclamación es obligatoria.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    if (!dataToSend.descripcion || dataToSend.descripcion.trim() === '') {
      setError('La descripción es obligatoria.');
      toast({ title: "Error de Formulario", description: "La descripción es obligatoria.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    if (dataToSend.monto_reclamado === null || isNaN(dataToSend.monto_reclamado) || dataToSend.monto_reclamado < 0) {
      setError('El monto reclamado es obligatorio y debe ser un número no negativo.');
      toast({ title: "Error de Formulario", description: "El monto reclamado es obligatorio y debe ser un número no negativo.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    if (dataToSend.monto_aprobado === null || isNaN(dataToSend.monto_aprobado) || dataToSend.monto_aprobado < 0) {
      setError('El monto aprobado es obligatorio y debe ser un número no negativo.');
      toast({ title: "Error de Formulario", description: "El monto aprobado es obligatorio y debe ser un número no negativo.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    if (dataToSend.monto_aprobado > dataToSend.monto_reclamado) {
      setError('El monto aprobado no puede ser mayor que el monto reclamado.');
      toast({ title: "Error de Formulario", description: "El monto aprobado no puede ser mayor que el monto reclamado.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    if (!dataToSend.estado || dataToSend.estado.trim() === '') {
      setError('El estado de la reclamación es obligatorio.');
      toast({ title: "Error de Formulario", description: "El estado de la reclamación es obligatorio.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    if (polizas.length > 0 && (dataToSend.poliza_id === null || isNaN(dataToSend.poliza_id))) {
      setError('Debe seleccionar una póliza válida.');
      toast({ title: "Error de Formulario", description: "Debe seleccionar una póliza válida.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    if (clientes.length > 0 && (dataToSend.cliente_id === null || isNaN(dataToSend.cliente_id))) {
      setError('Debe seleccionar un cliente válido.');
      toast({ title: "Error de Formulario", description: "Debe seleccionar un cliente válido.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }


    try {
      const method = editingReclamacion ? 'PUT' : 'POST';
      const url = editingReclamacion
        ? `${API_URL}/reclamaciones/${editingReclamacion.id}`
        : `${API_URL}/reclamaciones`;

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
        title: editingReclamacion ? "Reclamación Actualizada" : "Reclamación Creada",
        description: editingReclamacion ? "La reclamación ha sido actualizada con éxito." : "La reclamación ha sido creada con éxito.",
        variant: "success",
      });
      onReclamacionSaved();
      setReclamacion(initialReclamacionState);
      setEditingReclamacion(null);
    } catch (error) {
      console.error("Error al guardar reclamación:", error);
      setError(error.message);
      toast({
        title: "Error al Guardar Reclamación",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [reclamacion, editingReclamacion, onReclamacionSaved, polizas, clientes, token, toast, API_URL, initialReclamacionState, setEditingReclamacion]);

  const handleCancelEdit = useCallback(() => {
    setEditingReclamacion(null);
    setReclamacion(initialReclamacionState);
    setError(null);
  }, [setEditingReclamacion, initialReclamacionState]);

  // Opciones para el Select de Estado de Reclamación
  const estadoReclamacionOptions = ESTADO_RECLAMACION_OPTIONS; 

  // Mapear pólizas y clientes a un formato { value: ..., label: texto }
  const polizaOptions = useMemo(() => polizas.map(p => ({
    value: String(p.id),
    label: `${p.numero_poliza} (${p.cliente ? p.cliente.nombre : 'N/A'})`
  })), [polizas]);

  const clienteOptions = useMemo(() => clientes.map(c => ({
    value: String(c.id),
    label: `${c.nombre} ${c.apellido || ''} (${c.cedula_ruc})`
  })), [clientes]);


  return (
    <FormContainer title={editingReclamacion ? 'Editar Reclamación' : 'Crear Nueva Reclamación'}>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fecha de Reclamación - Usando StyledFormField con type="date" */}
        <StyledFormField
          label="Fecha de Reclamación"
          htmlFor="fecha_reclamacion"
          required
          type="date"
          value={reclamacion.fecha_reclamacion} // Debe ser un objeto Date o undefined
          onDateSelect={(date) => handleDateChange('fecha_reclamacion', date)}
          placeholder="Selecciona una fecha"
        />

        {/* Estado - Usando StyledFormField con type="select" */}
        <StyledFormField
          label="Estado"
          htmlFor="estado"
          required
          type="select"
          options={estadoReclamacionOptions}
          value={reclamacion.estado}
          onValueChange={(value) => handleSelectChange('estado', value)}
          placeholder="Selecciona estado"
        />

        {/* Descripción - Usando StyledFormField con type="text" */}
        <StyledFormField
          label="Descripción"
          id="descripcion" // Usar id en lugar de htmlFor para inputs directos
          required
          type="text"
          value={reclamacion.descripcion}
          onChange={handleChange}
          placeholder="Breve descripción de la reclamación"
          className="md:col-span-2"
        />

        {/* Monto Reclamado - Usando StyledFormField con type="number" */}
        <StyledFormField
          label="Monto Reclamado"
          id="monto_reclamado"
          required
          type="number"
          step="0.01"
          value={reclamacion.monto_reclamado}
          onChange={handleChange}
          placeholder="Ej: 500.00"
        />

        {/* Monto Aprobado - Usando StyledFormField con type="number" */}
        <StyledFormField
          label="Monto Aprobado"
          id="monto_aprobado"
          required
          type="number"
          step="0.01"
          value={reclamacion.monto_aprobado}
          onChange={handleChange}
          placeholder="Ej: 450.00"
        />

        {/* Póliza Asociada - Usando StyledFormField con type="select" */}
        <StyledFormField
          label="Póliza Asociada"
          htmlFor="poliza_id"
          required
          type="select"
          options={polizaOptions}
          disabled={isLoadingPolicies}
          value={reclamacion.poliza_id}
          onValueChange={(value) => handleSelectChange('poliza_id', value)}
          placeholder={isLoadingPolicies ? "Cargando pólizas..." : "Selecciona una póliza"}
        />

        {/* Cliente - Usando StyledFormField con type="select" */}
        <StyledFormField
          label="Cliente"
          htmlFor="cliente_id"
          required
          type="select"
          options={clienteOptions}
          disabled={isLoadingClients}
          value={reclamacion.cliente_id}
          onValueChange={(value) => handleSelectChange('cliente_id', value)}
          placeholder={isLoadingClients ? "Cargando clientes..." : "Selecciona un cliente"}
        />

        {/* Observaciones - Input de texto (opcional, si lo tienes en el modelo) */}
        <StyledFormField
          label="Observaciones"
          id="observaciones"
          type="text"
          value={reclamacion.observaciones}
          onChange={handleChange}
          placeholder="Observaciones adicionales"
          className="md:col-span-2"
        />

        {error && <p className="text-red-500 text-sm md:col-span-2">{error}</p>}

        <div className="md:col-span-2 flex justify-end space-x-4 mt-6">
          {editingReclamacion && (
            <SecondaryButton onClick={handleCancelEdit} type="button" disabled={isSubmitting}>
              Cancelar Edición
            </SecondaryButton>
          )}
          <PrimaryButton
            type="submit"
            disabled={isSubmitting || isLoadingClients || isLoadingPolicies || (clientes.length === 0 && polizas.length === 0 && !editingReclamacion)}
          >
            {isSubmitting ? 'Guardando...' : (editingReclamacion ? 'Actualizar Reclamación' : 'Crear Reclamación')}
          </PrimaryButton>
        </div>
      </form>
    </FormContainer>
  );
}

export default ReclamacionForm;
