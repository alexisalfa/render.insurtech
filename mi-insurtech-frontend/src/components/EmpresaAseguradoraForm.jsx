// src/components/EmpresaAseguradoraForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/lib/use-toast';

// Importar los componentes de estilo reutilizables
import FormContainer from './FormContainer';
import StyledFormField from './StyledFormField';
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';

const ACCESS_TOKEN_KEY = 'insurtech_access_token';

/**
 * Componente de formulario para crear o editar una Empresa Aseguradora.
 * Recibe los datos y funciones de manejo de estado desde el componente padre.
 *
 * @param {object} props - Las propiedades del componente.
 * @param {object} props.formData - El objeto de datos del formulario, manejado por el padre.
 * @param {function} props.setFormData - La función para actualizar los datos del formulario, manejada por el padre.
 * @param {function} props.onEmpresaAseguradoraSaved - Callback que se llama cuando una empresa es guardada (creada/actualizada).
 * @param {object|null} props.editingEmpresaAseguradora - Objeto de la empresa a editar, o null si es un nuevo registro.
 * @param {function} props.setEditingEmpresaAseguradora - Setter para limpiar el estado de edición en el padre.
 * @param {string} props.API_URL - La URL base de la API.
 * @param {boolean} props.isAuthLoading - Indicador de si la autenticación está en curso.
 * @param {function} props.onCancelEdit - Callback para cancelar la edición.
 */
function EmpresaAseguradoraForm({
  formData,
  setFormData,
  onEmpresaAseguradoraSaved,
  editingEmpresaAseguradora,
  setEditingEmpresaAseguradora,
  API_URL,
  isAuthLoading,
  onCancelEdit,
}) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Estado inicial del formulario. Es importante que todos los campos del modelo de la API estén aquí.
  const initialFormData = {
    nombre: '',
    rif: '',
    email: '',
    telefono: '',
    direccion: '',
    fecha_contratacion: undefined,
  };

  // Efecto para cargar los datos de la empresa si estamos editando
  useEffect(() => {
    // Si estamos editando, cargamos los datos existentes en el estado del formulario
    if (editingEmpresaAseguradora) {
      setFormData({
        ...editingEmpresaAseguradora,
        // Convertimos el string de fecha ISO a un objeto Date para el componente de calendario
        fecha_contratacion: editingEmpresaAseguradora.fecha_contratacion
          ? new Date(editingEmpresaAseguradora.fecha_contratacion)
          : undefined,
      });
    } else {
      // Si no estamos editando, reiniciamos el formulario
      setFormData(initialFormData);
    }
  }, [editingEmpresaAseguradora, setFormData]);

  // Manejador genérico de cambios para los inputs de tipo texto
  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (error) setError(null);
    },
    [setFormData, error]
  );
  
  // Manejador específico para el componente de fecha
  const handleDateChange = useCallback(
    (date) => {
      setFormData((prev) => ({ ...prev, fecha_contratacion: date }));
      if (error) setError(null);
    },
    [setFormData, error]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) {
      setError("No hay token de autenticación. Por favor, inicia sesión.");
      setIsSubmitting(false);
      return;
    }

    const url = editingEmpresaAseguradora
      ? `${API_URL}/empresas_aseguradoras/${editingEmpresaAseguradora.id}`
      : `${API_URL}/empresas_aseguradoras/`;

    const method = editingEmpresaAseguradora ? 'PUT' : 'POST';

    // Preparamos los datos para el envío
    const dataToSend = {
      ...formData,
      // Convertimos el objeto Date a un string ISO para la API
      fecha_contratacion: formData.fecha_contratacion ? formData.fecha_contratacion.toISOString() : undefined,
    };
    
    try {
      console.log('Datos que se enviarán al backend:', dataToSend);

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al guardar la empresa aseguradora.');
      }

      const savedEmpresa = await response.json();
      onEmpresaAseguradoraSaved(savedEmpresa);

      toast({
        title: 'Éxito',
        description: editingEmpresaAseguradora
          ? 'Empresa aseguradora actualizada correctamente.'
          : 'Empresa aseguradora creada correctamente.',
      });
    } catch (err) {
      console.error('ERROR:', err);
      setError(err.message);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormContainer
      title={editingEmpresaAseguradora ? 'Editar Empresa Aseguradora' : 'Registrar Empresa Aseguradora'}
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        {/* Campo Nombre */}
        <StyledFormField
          label="Nombre"
          id="nombre"
          name="nombre"
          type="text"
          placeholder="Nombre de la empresa"
          value={formData.nombre || ''}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          className="md:col-span-2"
          error={error && error.includes('nombre') ? error : null}
        />

        {/* Campo RIF */}
        <StyledFormField
          label="RIF"
          id="rif"
          name="rif"
          type="text"
          placeholder="Ej: J-123456789"
          value={formData.rif || ''}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          error={error && error.includes('RIF') ? error : null}
        />

        {/* Campo Email */}
        <StyledFormField
          label="Email"
          id="email"
          name="email"
          type="email"
          placeholder="email@ejemplo.com"
          value={formData.email || ''}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          error={error && error.includes('email') ? error : null}
        />

        {/* Campo Teléfono */}
        <StyledFormField
          label="Teléfono"
          id="telefono"
          name="telefono"
          type="tel"
          placeholder="Número de teléfono (Ej: +584123456789)"
          value={formData.telefono || ''}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          error={error && error.includes('teléfono') ? error : null}
        />

        {/* Campo Dirección */}
        <StyledFormField
          label="Dirección"
          id="direccion"
          name="direccion"
          type="text"
          placeholder="Dirección completa de la empresa"
          value={formData.direccion || ''}
          onChange={handleChange}
          disabled={isSubmitting}
          className="md:col-span-2"
          error={error && error.includes('dirección') ? error : null}
        />

        {/* Campo Fecha de Contratación */}
        <StyledFormField
          label="Fecha de Contratación"
          id="fecha_contratacion"
          name="fecha_contratacion"
          type="date"
          value={formData.fecha_contratacion}
          onDateSelect={handleDateChange}
          placeholder="Selecciona una fecha"
          required
          disabled={isSubmitting}
          error={error && error.includes('fecha') ? error : null}
        />

        {error && <p className="text-red-500 text-sm md:col-span-2">{error}</p>}

        <div className="md:col-span-2 flex justify-end space-x-4 mt-6">
          {editingEmpresaAseguradora && (
            <SecondaryButton onClick={onCancelEdit} type="button" disabled={isSubmitting}>
              Cancelar Edición
            </SecondaryButton>
          )}
          <PrimaryButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : (editingEmpresaAseguradora ? 'Actualizar Empresa' : 'Registrar Empresa')}
          </PrimaryButton>
        </div>
      </form>
    </FormContainer>
  );
}

export default EmpresaAseguradoraForm;
