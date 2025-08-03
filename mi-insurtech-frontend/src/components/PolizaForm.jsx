// src/components/PolizaForm.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
// Importaciones de Shadcn/UI que ya no se anidan directamente en StyledFormField
// import { Input } from '@/components/ui/input';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Calendar as CalendarIcon } } from 'lucide-react';
// import { format } from 'date-fns';
// import { es } from 'date-fns/locale';
// import { Calendar } from '@/components/ui/calendar';
// import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
// import { cn } from '@/lib/utils';
import { useToast } from '@/lib/use-toast';
// import { Button } from '@/components/ui/button';

// Importar los componentes de estilo reutilizables
import FormContainer from './FormContainer';
import StyledFormField from './StyledFormField'; // Asegúrate de que esta importación sea correcta
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './PrimaryButton'; // Corregido para usar SecondaryButton si es necesario

// Importar las constantes de tipo de póliza y estado de póliza
// Las opciones deben coincidir exactamente con los valores del Enum en el backend
import { ESTADO_POLIZA_OPTIONS } from './constantes'; // Mantener si ya existe

// ¡CRÍTICO! Definir TIPO_POLIZA_OPTIONS para que coincida con el backend
const TIPO_POLIZA_OPTIONS = [
  { value: 'Salud', label: 'Salud' },
  { value: 'Vida', label: 'Vida' }, // Corregido: 'Vida' con 'V' mayúscula
  { value: 'Vehículo', label: 'Vehículo' },
  { value: 'Hogar', label: 'Hogar' },
  { value: 'Viaje', label: 'Viaje' },
  { value: 'Otros', label: 'Otros' },
];


const ACCESS_TOKEN_KEY = 'insurtech_access_token'; // Asegúrate de que esta constante esté definida

/**
 * Formulario para crear o editar pólizas.
 * Utiliza los componentes de UI de Shadcn y los estilos de Tailwind CSS.
 *
 * @param {object} props - Propiedades del componente.
 * @param {function} props.onPolizaSaved - Callback que se llama cuando una póliza es guardada (creada/actualizada).
 * @param {object|null} props.editingPoliza - Objeto de la póliza a editar, o null si es un nuevo registro.
 * @param {function} props.setEditingPoliza - Setter para limpiar el estado de edición en el padre.
 * @param {Array<object>} props.clientes - Lista de clientes para el select.
 * @param {Array<object>} props.empresasAseguradoras - Lista de empresas aseguradoras para el select.
 * @param {Array<object>} props.asesores - Lista de asesores para el select.
 * @param {boolean} props.isLoadingClients - Indica si la lista de clientes está cargando.
 * @param {boolean} props.isLoadingCompanies - Indica si la lista de empresas aseguradoras está cargando.
 * @param {boolean} props.isLoadingAdvisors - Indica si la lista de asesores está cargando.
 * @param {string} props.API_URL - URL base de la API.
 * @param {boolean} props.isAuthLoading - Indica si la autenticación aún está cargando.
 */
function PolizaForm({
  onPolizaSaved,
  editingPoliza,
  setEditingPoliza,
  clientes,
  empresasAseguradoras,
  asesores,
  isLoadingClients,
  isLoadingCompanies,
  isLoadingAdvisors,
  API_URL,
  isAuthLoading,
}) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado inicial del formulario
  const initialFormData = useMemo(() => ({
    numero_poliza: '',
    tipo_poliza: '',
    fecha_inicio: undefined, // Usar undefined para date-fns si no hay fecha
    fecha_fin: undefined,
    monto_asegurado: '',
    prima: '',
    estado: 'Activa', // Valor por defecto
    observaciones: '',
    cliente_id: '',
    empresa_aseguradora_id: '',
    asesor_id: '',
  }), []);

  const [formData, setFormData] = useState(initialFormData);

  // Efecto para precargar datos si estamos editando una póliza
  useEffect(() => {
    if (editingPoliza) {
      setFormData({
        numero_poliza: editingPoliza.numero_poliza || '',
        tipo_poliza: editingPoliza.tipo_poliza || '',
        fecha_inicio: editingPoliza.fecha_inicio ? new Date(editingPoliza.fecha_inicio) : undefined,
        fecha_fin: editingPoliza.fecha_fin ? new Date(editingPoliza.fecha_fin) : undefined,
        monto_asegurado: editingPoliza.monto_asegurado !== undefined ? String(editingPoliza.monto_asegurado) : '',
        prima: editingPoliza.prima !== undefined ? String(editingPoliza.prima) : '',
        estado: editingPoliza.estado || 'Activa',
        observaciones: editingPoliza.observaciones || '',
        cliente_id: editingPoliza.cliente_id !== undefined ? String(editingPoliza.cliente_id) : '',
        empresa_aseguradora_id: editingPoliza.empresa_aseguradora_id !== undefined ? String(editingPoliza.empresa_aseguradora_id) : '',
        asesor_id: editingPoliza.asesor_id !== undefined ? String(editingPoliza.asesor_id) : '',
      });
    } else {
      setFormData(initialFormData); // Resetear a valores iniciales si no estamos editando
    }
  }, [editingPoliza, initialFormData]);

  // Manejador genérico para cambios en los inputs de texto/número
  const handleChange = useCallback((e) => {
    const { id, value } = e.target;
    let processedValue = value;

    // ¡CRÍTICO! Reemplazar coma por punto para campos numéricos
    if (id === 'monto_asegurado' || id === 'prima') {
      processedValue = value.replace(',', '.');
    }

    console.log(`DEBUG PolizaForm: Input changed - ID: ${id}, Value: ${processedValue}`);
    setFormData((prev) => ({ ...prev, [id]: processedValue }));
  }, []);

  // Manejador para cambios en los Select de Shadcn/UI
  const handleSelectChange = useCallback((id, value) => {
    console.log(`DEBUG PolizaForm: Select changed - ID: ${id}, Value: ${value}`);
    setFormData((prev) => {
      let parsedValue = value;
      if (['cliente_id', 'empresa_aseguradora_id', 'asesor_id'].includes(id)) {
        if (value === '' || value === null || value === undefined) {
          parsedValue = null; // ¡CRÍTICO! Convertir cadena vacía a null para IDs
        } else {
          parsedValue = parseInt(value, 10);
          if (isNaN(parsedValue)) {
            parsedValue = null; // Si parseInt devuelve NaN, también convertir a null
          }
        }
      }
      return { ...prev, [id]: parsedValue };
    });
  }, []);

  // Manejador para cambios en el Calendar
  const handleDateChange = useCallback((id, date) => {
    console.log(`DEBUG PolizaForm: Date changed - ID: ${id}, Date: ${date}`);
    setFormData((prev) => ({ ...prev, [id]: date }));
  }, []);

  // Opciones para los selectores
  const clienteOptions = useMemo(() => {
    console.log("DEBUG PolizaForm: Generando clienteOptions. Clientes recibidos:", clientes);
    return clientes.map((cliente) => ({
      value: String(cliente.id),
      label: `${cliente.nombre} ${cliente.apellido} (${cliente.cedula})`,
    }));
  }, [clientes]);

  const empresaOptions = useMemo(() => {
    console.log("DEBUG PolizaForm: Generando empresaOptions. Empresas recibidas:", empresasAseguradoras);
    return empresasAseguradoras.map((empresa) => ({
      value: String(empresa.id),
      label: `${empresa.nombre} (${empresa.rif})`,
    }));
  }, [empresasAseguradoras]);

  const asesorOptions = useMemo(() => {
    console.log("DEBUG PolizaForm: Generando asesorOptions. Asesores recibidos:", asesores);
    return asesores.map((asesor) => ({
      value: String(asesor.id),
      label: `${asesor.nombre} ${asesor.apellido} (${asesor.cedula})`,
    }));
  }, [asesores]);

  // Debugging de las opciones generadas
  useEffect(() => {
    console.log("DEBUG PolizaForm: clienteOptions generadas:", clienteOptions);
    console.log("DEBUG PolizaForm: empresaOptions generadas:", empresaOptions);
    console.log("DEBUG PolizaForm: asesorOptions generadas:", asesorOptions);
    console.log("DEBUG PolizaForm: formData actual:", formData);
  }, [clienteOptions, empresaOptions, asesorOptions, formData]);


  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) {
      toast({
        title: "Error de Autenticación",
        description: "No se encontró el token de acceso. Por favor, inicia sesión.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Validaciones básicas
    // Si asesor_id es opcional en el backend, no debe ser requerido aquí
    if (!formData.numero_poliza || !formData.tipo_poliza || !formData.fecha_inicio || !formData.fecha_fin ||
        !formData.monto_asegurado || !formData.prima || !formData.cliente_id || !formData.empresa_aseguradora_id) {
      toast({
        title: "Campos Incompletos",
        description: "Por favor, completa todos los campos obligatorios.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }
    // Validación específica para asesor_id si es requerido en el frontend
    if (formData.asesor_id === null || formData.asesor_id === undefined || formData.asesor_id === '') {
      toast({
        title: "Campo Obligatorio",
        description: "Por favor, selecciona un asesor para la póliza.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }


    // Asegurarse de que los campos numéricos sean números
    const dataToSend = {
      ...formData,
      monto_asegurado: parseFloat(formData.monto_asegurado),
      prima: parseFloat(formData.prima),
      // Formatear fechas a ISO string para el backend
      fecha_inicio: formData.fecha_inicio ? formData.fecha_inicio.toISOString() : null,
      fecha_fin: formData.fecha_fin ? formData.fecha_fin.toISOString() : null,
      // Asegurarse de que los IDs sean números o null si son opcionales
      cliente_id: formData.cliente_id ? parseInt(formData.cliente_id, 10) : null,
      empresa_aseguradora_id: formData.empresa_aseguradora_id ? parseInt(formData.empresa_aseguradora_id, 10) : null,
      asesor_id: formData.asesor_id ? parseInt(formData.asesor_id, 10) : null, // Ahora puede ser null
    };

    console.log("DEBUG PolizaForm: Data to send:", dataToSend); // Añadir este log

    try {
      const method = editingPoliza ? 'PUT' : 'POST';
      const url = editingPoliza
        ? `${API_URL}/polizas/polizas/${editingPoliza.id}` // Ahora coincide con el backend
        : `${API_URL}/polizas/polizas/`; // Ahora coincide con el backend

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        // ¡CRÍTICO! Capturar y mostrar el detalle del error de FastAPI
        const errorData = await response.json().catch(() => ({ detail: 'Error desconocido en el servidor.' }));
        let errorMessage = errorData.detail || `Error ${response.status}: ${response.statusText}`;
        
        // Si el detalle es una lista de errores de validación de Pydantic
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(err => {
            const loc = err.loc ? `Campo: ${err.loc.join(' -> ')}` : '';
            return `${loc} - ${err.msg}`;
          }).join('; ');
        }
        
        throw new Error(errorMessage);
      }

      toast({
        title: editingPoliza ? "Póliza Actualizada" : "Póliza Creada",
        description: `La póliza ${formData.numero_poliza} ha sido ${editingPoliza ? 'actualizada' : 'creada'} con éxito.`,
        variant: "success",
      });
      setFormData(initialFormData); // Limpiar formulario
      setEditingPoliza(null); // Limpiar estado de edición
      onPolizaSaved(); // Notificar al padre para recargar la lista
    } catch (error) {
      console.error("Error al guardar póliza:", error);
      toast({
        title: "Error al Guardar",
        description: `No se pudo guardar la póliza: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, editingPoliza, API_URL, onPolizaSaved, setEditingPoliza, toast, initialFormData]);

  const handleCancelEdit = useCallback(() => {
    setEditingPoliza(null);
    setFormData(initialFormData);
  }, [setEditingPoliza, initialFormData]);

  // Deshabilitar el formulario si la autenticación está cargando
  if (isAuthLoading) {
    return (
      <FormContainer title={editingPoliza ? "Cargando Póliza..." : "Cargando Formulario..."}>
        <div className="flex justify-center items-center h-48">
          <p className="text-gray-500">Cargando datos...</p>
        </div>
      </FormContainer>
    );
  }

  return (
    <FormContainer title={editingPoliza ? "Editar Póliza" : "Crear Nueva Póliza"}>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Número de Póliza - Input de texto */}
        <StyledFormField
          label="Número de Póliza"
          id="numero_poliza"
          required
          type="text"
          value={formData.numero_poliza}
          onChange={handleChange}
          placeholder="Ej: POLIZA-2024-001"
        />

        {/* Tipo de Póliza - Selector */}
        <StyledFormField
          label="Tipo de Póliza"
          htmlFor="tipo_poliza"
          required
          type="select"
          options={TIPO_POLIZA_OPTIONS} // Usar las opciones corregidas
          value={formData.tipo_poliza}
          onValueChange={(value) => handleSelectChange('tipo_poliza', value)}
          placeholder="Selecciona un tipo"
        />

        {/* Fecha de Inicio - Selector de fecha */}
        <StyledFormField
          label="Fecha de Inicio"
          htmlFor="fecha_inicio"
          required
          type="date"
          value={formData.fecha_inicio}
          onDateSelect={(date) => handleDateChange('fecha_inicio', date)}
          placeholder="Selecciona una fecha"
        />

        {/* Fecha de Fin - Selector de fecha */}
        <StyledFormField
          label="Fecha de Fin"
          htmlFor="fecha_fin"
          required
          type="date"
          value={formData.fecha_fin}
          onDateSelect={(date) => handleDateChange('fecha_fin', date)}
          placeholder="Selecciona una fecha"
        />

        {/* Monto Asegurado - Input numérico */}
        <StyledFormField
          label="Monto Asegurado"
          id="monto_asegurado"
          required
          type="number"
          step="0.01"
          value={formData.monto_asegurado}
          onChange={handleChange}
          placeholder="Ej: 15000.00"
        />

        {/* Prima - Input numérico */}
        <StyledFormField
          label="Prima"
          id="prima"
          required
          type="number"
          step="0.01"
          value={formData.prima}
          onChange={handleChange}
          placeholder="Ej: 500.00"
        />

        {/* Estado de Póliza - Selector */}
        <StyledFormField
          label="Estado de Póliza"
          htmlFor="estado"
          required
          type="select"
          options={ESTADO_POLIZA_OPTIONS}
          value={formData.estado}
          onValueChange={(value) => handleSelectChange('estado', value)}
          placeholder="Selecciona un estado"
        />

        {/* Cliente - Selector */}
        <StyledFormField
          label="Cliente"
          htmlFor="cliente_id"
          required
          type="select"
          options={clienteOptions}
          disabled={isLoadingClients}
          value={formData.cliente_id}
          onValueChange={(value) => handleSelectChange('cliente_id', value)}
          placeholder={isLoadingClients ? "Cargando clientes..." : "Selecciona un cliente"}
        />

        {/* Empresa Aseguradora - Selector */}
        <StyledFormField
          label="Empresa Aseguradora"
          htmlFor="empresa_aseguradora_id"
          required
          type="select"
          options={empresaOptions}
          disabled={isLoadingCompanies}
          value={formData.empresa_aseguradora_id}
          onValueChange={(value) => handleSelectChange('empresa_aseguradora_id', value)}
          placeholder={isLoadingCompanies ? "Cargando empresas..." : "Selecciona una empresa"}
        />

        {/* Asesor - Selector */}
        <StyledFormField
          label="Asesor"
          htmlFor="asesor_id"
          required 
          type="select"
          options={asesorOptions}
          disabled={isLoadingAdvisors}
          value={formData.asesor_id}
          onValueChange={(value) => handleSelectChange('asesor_id', value)}
          placeholder={isLoadingAdvisors ? "Cargando asesores..." : "Selecciona un asesor"}
        />

        {/* Observaciones - Input de texto */}
        <StyledFormField
          label="Observaciones"
          id="observaciones"
          type="text"
          value={formData.observaciones}
          onChange={handleChange}
          placeholder="Observaciones adicionales"
        />

        <div className="md:col-span-2 flex justify-end space-x-4 mt-6">
          {editingPoliza && (
            <SecondaryButton onClick={handleCancelEdit} type="button" disabled={isSubmitting}>
              Cancelar Edición
            </SecondaryButton>
          )}
          <PrimaryButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? (editingPoliza ? "Actualizando..." : "Creando...") : (editingPoliza ? "Actualizar Póliza" : "Crear Póliza")}
          </PrimaryButton>
        </div>
      </form>
    </FormContainer>
  );
}

export default PolizaForm;
