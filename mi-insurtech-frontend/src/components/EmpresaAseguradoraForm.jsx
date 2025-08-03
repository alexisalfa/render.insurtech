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
  onCancelEdit, // Recibe onCancelEdit del padre
}) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Sincronizar formData cuando editingEmpresaAseguradora cambia (manejo en el padre)
  useEffect(() => {
    console.log("DEBUG: EmpresaAseguradoraForm - editingEmpresaAseguradora changed:", editingEmpresaAseguradora);
    // El setFormData ya se hace en el padre (EmpresasAseguradorasPage)
    // Este useEffect es más para depuración si es necesario ver el valor inicial aquí.
    // La lógica de inicialización y reset ya está en EmpresasAseguradorasPage.
  }, [editingEmpresaAseguradora]);

  // DEBUG: Log formData cada vez que cambia (para verificar que se actualiza desde el padre)
  useEffect(() => {
    console.log("DEBUG: EmpresaAseguradoraForm - formData updated (from parent prop):", formData);
  }, [formData]);

  const handleChange = useCallback((e) => {
    const { id, value } = e.target;
    console.log(`DEBUG: EmpresaAseguradoraForm - handleChange - id: ${id}, value: ${value}`);
    setFormData((prevData) => {
      const newData = {
        ...prevData,
        [id]: value,
      };
      console.log("DEBUG: EmpresaAseguradoraForm - handleChange - newData (after update):", newData);
      return newData;
    });
    // Limpiar errores específicos al cambiar el campo
    if (error && error.includes('nombre') && id === 'nombre') setError(null);
    if (error && error.includes('RIF') && id === 'rif') setError(null);
    if (error && error.includes('email') && id === 'email') setError(null);
    if (error && error.includes('teléfono') && id === 'telefono') setError(null);
    if (error && error.includes('dirección') && id === 'direccion') setError(null);
  }, [setFormData, error]);

  const validateForm = useCallback(() => {
    if (!formData.nombre || formData.nombre.trim() === '') {
      setError('El nombre de la empresa es obligatorio.');
      toast({ title: "Validación", description: "El nombre de la empresa es obligatorio.", variant: "destructive" });
      return false;
    }
    if (!formData.rif || formData.rif.trim() === '') {
      setError('El RIF de la empresa es obligatorio.');
      toast({ title: "Validación", description: "El RIF de la empresa es obligatorio.", variant: "destructive" });
      return false;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Formato de email inválido.');
      toast({ title: "Validación", description: "El formato del email es inválido.", variant: "destructive" });
      return false;
    }
    if (!formData.telefono || formData.telefono.trim() === '') {
      setError('El teléfono de la empresa es obligatorio.');
      toast({ title: "Validación", description: "El teléfono de la empresa es obligatorio.", variant: "destructive" });
      return false;
    }
    if (!formData.direccion || formData.direccion.trim() === '') {
      setError('La dirección de la empresa es obligatoria.');
      toast({ title: "Validación", description: "La dirección de la empresa es obligatoria.", variant: "destructive" });
      return false;
    }
    setError(null);
    return true;
  }, [formData, toast]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) {
      setError('No autorizado: No se encontró el token de acceso.');
      toast({
        title: "Error de autenticación",
        description: "No se encontró el token de acceso. Por favor, inicie sesión nuevamente.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    const method = editingEmpresaAseguradora ? 'PUT' : 'POST';
    // URL CORREGIDA: Usar la ruta completa del backend
    const url = editingEmpresaAseguradora
      ? `${API_URL}/empresas_aseguradoras/empresas_aseguradoras/${editingEmpresaAseguradora.id}/`
      : `${API_URL}/empresas_aseguradoras/empresas_aseguradoras/`;

    console.log(`DEBUG: EmpresaAseguradoraForm - handleSubmit - Enviando ${method} a: ${url}`);
    console.log("DEBUG: EmpresaAseguradoraForm - handleSubmit - Payload:", formData);

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      console.log(`DEBUG: EmpresaAseguradoraForm - handleSubmit - Respuesta HTTP Status: ${response.status}`);
      const result = await response.json();
      console.log("DEBUG: EmpresaAseguradoraForm - handleSubmit - Respuesta API:", result);

      if (!response.ok) {
        throw new Error(result.detail || result.message || 'Error al guardar la empresa aseguradora.');
      }

      toast({
        title: editingEmpresaAseguradora ? "Empresa Actualizada" : "Empresa Registrada",
        description: `La empresa ${formData.nombre} ha sido ${editingEmpresaAseguradora ? 'actualizada' : 'registrada'} exitosamente.`,
        variant: "success",
      });

      // Notificar al padre para que recargue la lista y limpie el formulario
      onEmpresaAseguradoraSaved();

    } catch (err) {
      console.error('ERROR: EmpresaAseguradoraForm - Error saving empresa aseguradora:', err);
      setError(err.message || 'Ocurrió un error inesperado al procesar la solicitud.');
      toast({
        title: "Error",
        description: err.message || "No se pudo guardar la empresa aseguradora.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, editingEmpresaAseguradora, validateForm, API_URL, onEmpresaAseguradoraSaved, toast]);

  return (
    <FormContainer title={editingEmpresaAseguradora ? "Editar Empresa Aseguradora" : "Registrar Nueva Empresa Aseguradora"}>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Campo Nombre */}
        <StyledFormField
          label="Nombre de la Empresa"
          id="nombre"
          type="text"
          placeholder="Ej: Seguros Bolívar"
          value={formData.nombre || ''} // Asegurar que siempre sea string
          onChange={handleChange}
          disabled={isAuthLoading || isSubmitting}
          error={error && error.includes('nombre') ? error : null}
        />

        {/* Campo RIF */}
        <StyledFormField
          label="RIF"
          id="rif"
          type="text"
          placeholder="Ej: J-12345678-9"
          value={formData.rif || ''} // Asegurar que siempre sea string
          onChange={handleChange}
          disabled={isAuthLoading || isSubmitting}
          error={error && error.includes('RIF') ? error : null}
        />

        {/* Campo Email */}
        <StyledFormField
          label="Email"
          id="email"
          type="email"
          placeholder="Ej: info@segurosbolivar.com"
          value={formData.email || ''} // Asegurar que siempre sea string
          onChange={handleChange}
          error={error && error.includes('email') ? error : null}
          disabled={isAuthLoading || isSubmitting}
        />
        {/* Campo Teléfono */}
        <StyledFormField
          label="Teléfono"
          id="telefono"
          type="tel"
          placeholder="Número de teléfono (Ej: +584123456789)"
          value={formData.telefono || ''} // Asegurar que siempre sea string
          onChange={handleChange}
          disabled={isAuthLoading || isSubmitting}
          error={error && error.includes('teléfono') ? error : null}
        />

        {/* Campo Dirección */}
        <StyledFormField
          label="Dirección"
          id="direccion"
          type="text"
          placeholder="Dirección completa de la empresa"
          value={formData.direccion || ''} // Asegurar que siempre sea string
          onChange={handleChange}
          disabled={isAuthLoading || isSubmitting}
          className="md:col-span-2"
          error={error && error.includes('dirección') ? error : null}
        />

        {error && <p className="text-red-500 text-sm md:col-span-2">{error}</p>}

        <div className="md:col-span-2 flex justify-end space-x-4 mt-6">
          {editingEmpresaAseguradora && (
            <SecondaryButton onClick={onCancelEdit} type="button" disabled={isSubmitting || isAuthLoading}>
              Cancelar Edición
            </SecondaryButton>
          )}
          <PrimaryButton type="submit" disabled={isSubmitting || isAuthLoading}>
            {isSubmitting ? 'Guardando...' : (editingEmpresaAseguradora ? 'Actualizar Empresa' : 'Registrar Empresa')}
          </PrimaryButton>
        </div>
      </form>
    </FormContainer>
  );
}

export default EmpresaAseguradoraForm;
