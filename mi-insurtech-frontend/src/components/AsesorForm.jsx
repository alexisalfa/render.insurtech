// src/components/AsesorForm.jsx
import React, { useState, useEffect } from 'react';
// Importar los nuevos componentes reutilizables
import FormContainer from './FormContainer';
import StyledFormField from './StyledFormField';
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';

// Importar useToast para notificaciones
import { useToast } from '@/lib/use-toast'; 

// Importar la clave del token desde constantes.jsx
import { ACCESS_TOKEN_KEY } from './constantes'; 

/**
 * Componente para crear y editar asesores.
 *
 * @param {object} props - Las propiedades del componente.
 * @param {function} props.onAsesorSaved - Callback que se ejecuta cuando un asesor es guardado/actualizado.
 * @param {object|null} props.editingAsesor - Objeto asesor si estamos editando, o null si estamos creando uno nuevo.
 * @param {function} props.setEditingAsesor - Función para actualizar el estado editingAsesor en el padre.
 * @param {Array<object>} props.empresasAseguradoras - Lista de empresas aseguradoras para el select.
 * @param {boolean} props.isLoadingCompanies - Indica si la lista de empresas aseguradoras está cargando.
 * @param {string} props.API_URL - URL base de la API.
 * @param {boolean} props.isAuthLoading - Indica si la autenticación aún está cargando.
 */
function AsesorForm({
  onAsesorSaved,
  editingAsesor,
  setEditingAsesor,
  empresasAseguradoras,
  isLoadingCompanies,
  API_URL,
  isAuthLoading,
}) {
  const { toast } = useToast();

  // Estado inicial del formulario
  const initialFormData = {
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    cedula: '',
    fecha_contratacion: undefined,
    empresa_aseguradora_id: '',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Efecto para cargar los datos del asesor si estamos editando
  useEffect(() => {
    if (editingAsesor) {
      setFormData({
        nombre: editingAsesor.nombre || '',
        apellido: editingAsesor.apellido || '',
        email: editingAsesor.email || '',
        telefono: editingAsesor.telefono || '',
        cedula: editingAsesor.cedula || '',
        fecha_contratacion: editingAsesor.fecha_contratacion ? new Date(editingAsesor.fecha_contratacion) : undefined,
        // Asegurarse de que el ID de la empresa sea un string para el select
        empresa_aseguradora_id: String(editingAsesor.empresa_aseguradora_id || ''),
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [editingAsesor]);

  // Manejador de cambios genérico para inputs de texto
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Manejador de cambios específico para el calendario
  const handleDateChange = (date) => {
    setFormData((prev) => ({ ...prev, fecha_contratacion: date }));
    if (errors.fecha_contratacion) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.fecha_contratacion;
        return newErrors;
      });
    }
  };

  // ¡NUEVO! Manejador de cambios específico para el Select
  const handleSelectChange = (value) => {
    const name = "empresa_aseguradora_id";
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Función de validación del formulario
  const validateForm = () => {
    const newErrors = {};
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio.';
    }
    if (!formData.apellido.trim()) {
      newErrors.apellido = 'El apellido es obligatorio.';
    }
    if (!formData.cedula.trim()) {
      newErrors.cedula = 'La cédula es obligatoria.';
    } else if (!/^[0-9A-Z]{5,15}$/i.test(formData.cedula)) {
      newErrors.cedula = 'La cédula no tiene un formato válido (solo números/letras, 5-15 caracteres).';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'El email es obligatorio.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El formato del email no es válido.';
    }
    if (formData.telefono && !/^\+?[0-9\s-()]{7,20}$/.test(formData.telefono)) {
      newErrors.telefono = 'El formato del teléfono no es válido.';
    }
    if (!formData.fecha_contratacion) { 
      newErrors.fecha_contratacion = 'La fecha de contratación es obligatoria.';
    }
    // ¡CRÍTICO! Validar que el ID no sea una cadena vacía
    if (!formData.empresa_aseguradora_id) {
      newErrors.empresa_aseguradora_id = 'La empresa aseguradora es obligatoria.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({ title: "Errores de validación", description: "Por favor, corrige los campos marcados.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    
    // Convertir la fecha de contratación a string ISO para la API
    const dataToSend = {
      ...formData,
      fecha_contratacion: formData.fecha_contratacion ? formData.fecha_contratacion.toISOString().split('T')[0] : null,
      // Asegurarse de que el ID de la empresa sea un número para la API
      empresa_aseguradora_id: Number(formData.empresa_aseguradora_id),
    };

    const url = editingAsesor ? `${API_URL}/asesores/${editingAsesor.id}` : `${API_URL}/asesores/`;
    const method = editingAsesor ? 'PUT' : 'POST';

    try {
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
        throw new Error(errorData.detail || 'Error al guardar el asesor.');
      }
      
      const savedAsesor = await response.json();
      onAsesorSaved(savedAsesor);
      
      toast({
        title: "Éxito",
        description: editingAsesor ? "Asesor actualizado correctamente." : "Asesor creado correctamente.",
      });
      
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error inesperado al guardar el asesor.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingAsesor(null);
    setFormData(initialFormData);
  };

  return (
    <FormContainer title={editingAsesor ? `Editar Asesor: ${editingAsesor.nombre} ${editingAsesor.apellido}` : "Nuevo Asesor"}>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        {/* Campo Nombre */}
        <StyledFormField
          label="Nombre"
          id="nombre"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          placeholder="Ej: Juan"
          required
          error={errors.nombre}
          disabled={isSubmitting || isAuthLoading}
        />

        {/* Campo Apellido */}
        <StyledFormField
          label="Apellido"
          id="apellido"
          name="apellido"
          value={formData.apellido}
          onChange={handleChange}
          placeholder="Ej: Pérez"
          required
          error={errors.apellido}
          disabled={isSubmitting || isAuthLoading}
        />

        {/* Campo Cédula */}
        <StyledFormField
          label="Cédula"
          id="cedula"
          name="cedula"
          value={formData.cedula}
          onChange={handleChange}
          placeholder="V-12345678"
          required
          error={errors.cedula}
          disabled={isSubmitting || isAuthLoading}
        />

        {/* Campo Email */}
        <StyledFormField
          label="Email"
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="ejemplo@correo.com"
          required
          error={errors.email}
          disabled={isSubmitting || isAuthLoading}
        />

        {/* Campo Teléfono */}
        <StyledFormField
          label="Teléfono"
          id="telefono"
          name="telefono"
          type="tel"
          value={formData.telefono}
          onChange={handleChange}
          placeholder="Ej: +58 412-1234567"
          error={errors.telefono}
          disabled={isSubmitting || isAuthLoading}
        />

        {/* Campo Fecha de Contratación (con StyledFormField de tipo 'date') */}
        <StyledFormField
          label="Fecha de Contratación"
          id="fecha_contratacion"
          name="fecha_contratacion"
          type="date"
          value={formData.fecha_contratacion}
          onDateSelect={handleDateChange}
          placeholder="Selecciona una fecha"
          required
          error={errors.fecha_contratacion}
          disabled={isSubmitting || isAuthLoading}
        />

        {/* Campo Empresa Aseguradora (Select) */}
        <StyledFormField
          label="Empresa Aseguradora"
          id="empresa_aseguradora_id"
          name="empresa_aseguradora_id"
          type="select"
          value={formData.empresa_aseguradora_id}
          onValueChange={handleSelectChange}
          required
          error={errors.empresa_aseguradora_id}
          options={empresasAseguradoras.map(empresa => ({
            value: empresa.id,
            label: empresa.nombre,
          }))}
          placeholder="Selecciona una empresa"
          disabled={isLoadingCompanies || isAuthLoading || isSubmitting}
        />

        <div className="md:col-span-2 flex justify-end space-x-4 mt-6">
          <SecondaryButton
            type="button"
            onClick={handleCancelEdit}
            disabled={isSubmitting}
          >
            Cancelar Edición
          </SecondaryButton>
          <PrimaryButton
            type="submit"
            isLoading={isSubmitting}
          >
            {editingAsesor ? 'Actualizar Asesor' : 'Crear Asesor'}
          </PrimaryButton>
        </div>
      </form>
    </FormContainer>
  );
}

export default AsesorForm;