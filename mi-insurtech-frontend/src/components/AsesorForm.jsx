// src/components/AsesorForm.jsx
import React, { useState, useEffect } from 'react';
// Importar los nuevos componentes reutilizables
import FormContainer from './FormContainer';
import StyledFormField from './StyledFormField'; // Asegúrate de que esta ruta sea correcta
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
  const { toast } = useToast(); // Hook para usar las notificaciones de Toast

  // Estado inicial del formulario
  const initialFormData = {
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    cedula: '',
    fecha_contratacion: undefined, // ¡CRÍTICO! Usar undefined o null para el DatePicker
    empresa_aseguradora_id: '', // ¡CRÍTICO! Usar string vacío para el Select
  };

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({}); // Estado para errores de validación de campos
  const [isSubmitting, setIsSubmitting] = useState(false); // Estado para controlar el envío del formulario

  // Efecto para cargar los datos del asesor si estamos editando
  useEffect(() => {
    if (editingAsesor) {
      setFormData({
        nombre: editingAsesor.nombre || '',
        apellido: editingAsesor.apellido || '',
        email: editingAsesor.email || '',
        telefono: editingAsesor.telefono || '',
        cedula: editingAsesor.cedula || '',
        // ¡CRÍTICO! Convertir la fecha de string ISO a objeto Date si existe, o undefined
        fecha_contratacion: editingAsesor.fecha_contratacion ? new Date(editingAsesor.fecha_contratacion) : undefined,
        // ¡CRÍTICO! Asegurarse de que el ID de la empresa sea un string para el select
        empresa_aseguradora_id: String(editingAsesor.empresa_aseguradora_id || ''),
      });
    } else {
      // Reiniciar el formulario si no estamos editando o se ha guardado uno nuevo
      setFormData(initialFormData);
    }
    setErrors({}); // Limpiar errores al cambiar de asesor
  }, [editingAsesor]); // Dependencia: re-ejecutar cuando editingAsesor cambie

  // ¡CRÍTICO! Manejador de cambios genérico para todos los campos
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // DEBUG: Log para ver el cambio en el formulario
    console.log(`DEBUG AsesorForm: handleChange - name: ${name}, value:`, value);

    setFormData((prev) => ({ ...prev, [name]: value }));
    // Limpiar el error del campo cuando el usuario empieza a escribir
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
    // ¡CRÍTICO! Validar que fecha_contratacion sea un objeto Date válido
    if (!(formData.fecha_contratacion instanceof Date) || isNaN(formData.fecha_contratacion)) {
      newErrors.fecha_contratacion = 'La fecha de contratación es obligatoria y debe ser válida.';
    }
    if (!formData.empresa_aseguradora_id) {
      newErrors.empresa_aseguradora_id = 'La empresa aseguradora es obligatoria.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Retorna true si no hay errores
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Errores de Formulario",
        description: "Por favor, corrige los errores en el formulario antes de guardar.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    // OBTENER EL TOKEN DEL LOCALSTORAGE
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

    // Preparar los datos para enviar al API
    const dataToSend = {
      ...formData,
      // Asegurarse de que empresa_aseguradora_id sea un número o null
      empresa_aseguradora_id: formData.empresa_aseguradora_id ? Number(formData.empresa_aseguradora_id) : null,
      // Convertir el objeto Date a string ISO si existe y es válido, o null si es undefined/inválido
      fecha_contratacion: (formData.fecha_contratacion instanceof Date && !isNaN(formData.fecha_contratacion)) 
                          ? formData.fecha_contratacion.toISOString() 
                          : null,
    };

    const url = editingAsesor
      ? `${API_URL}/asesores/${editingAsesor.id}/` // URL para PUT (con barra final)
      : `${API_URL}/asesores/`; // URL para POST (con barra final)
    const method = editingAsesor ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Error desconocido en el servidor.' }));
        const errorMessage = errorData.detail || `Error ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      setFormData(initialFormData); // Limpiar el formulario
      setEditingAsesor(null); // Desactivar modo edición
      onAsesorSaved(); // Recargar la lista de asesores en el componente padre

      toast({
        title: "Asesor Guardado",
        description: `El asesor ha sido ${editingAsesor ? 'actualizado' : 'creado'} con éxito.`,
        variant: "success",
      });

    } catch (err) {
      console.error('Error al guardar asesor:', err);
      toast({
        title: "Error de Conexión/API",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingAsesor(null);
    setFormData(initialFormData); // Resetear a los valores iniciales
    setErrors({}); // Limpiar errores
  };

  return (
    <FormContainer
      title={editingAsesor ? 'Editar Asesor' : 'Crear Nuevo Asesor'}
      className="mb-8"
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Campo Nombre */}
        <StyledFormField
          label="Nombre"
          id="nombre"
          name="nombre"
          type="text"
          value={formData.nombre} // ¡CRÍTICO! Pasar el valor del estado
          onChange={handleChange} // ¡CRÍTICO! Pasar el manejador de cambios
          placeholder="Nombre del asesor"
          required
          error={errors.nombre}
        />

        {/* Campo Apellido */}
        <StyledFormField
          label="Apellido"
          id="apellido"
          name="apellido"
          type="text"
          value={formData.apellido} // ¡CRÍTICO! Pasar el valor del estado
          onChange={handleChange} // ¡CRÍTICO! Pasar el manejador de cambios
          placeholder="Apellido del asesor"
          required
          error={errors.apellido}
        />

        {/* Campo Cédula */}
        <StyledFormField
          label="Cédula"
          id="cedula"
          name="cedula"
          type="text"
          value={formData.cedula} // ¡CRÍTICO! Pasar el valor del estado
          onChange={handleChange} // ¡CRÍTICO! Pasar el manejador de cambios
          placeholder="Cédula de identidad (Ej: V12345678)"
          required
          error={errors.cedula}
        />

        {/* Campo Email */}
        <StyledFormField
          label="Email"
          id="email"
          name="email"
          type="email"
          value={formData.email} // ¡CRÍTICO! Pasar el valor del estado
          onChange={handleChange} // ¡CRÍTICO! Pasar el manejador de cambios
          placeholder="email@ejemplo.com"
          required
          error={errors.email}
        />

        {/* Campo Teléfono */}
        <StyledFormField
          label="Teléfono"
          id="telefono"
          name="telefono"
          type="tel"
          value={formData.telefono} // ¡CRÍTICO! Pasar el valor del estado
          onChange={handleChange} // ¡CRÍTICO! Pasar el manejador de cambios
          placeholder="Ej: +584123456789"
          error={errors.telefono}
        />

        {/* Campo Fecha de Contratación */}
        <StyledFormField
          label="Fecha de Contratación"
          id="fecha_contratacion"
          name="fecha_contratacion"
          type="date"
          value={formData.fecha_contratacion} // ¡CRÍTICO! Pasar el objeto Date o undefined/null
          onChange={handleChange} // ¡CRÍTICO! Pasar el manejador de cambios
          placeholder="Selecciona una fecha"
          required
          error={errors.fecha_contratacion}
        />

        {/* Campo Empresa Aseguradora (Select) */}
        <StyledFormField
          label="Empresa Aseguradora"
          id="empresa_aseguradora_id"
          name="empresa_aseguradora_id"
          type="select" // Indicar que es un select
          value={formData.empresa_aseguradora_id} // ¡CRÍTICO! Pasar el ID (string o number)
          onChange={handleChange} // ¡CRÍTICO! Pasar el manejador de cambios
          required
          error={errors.empresa_aseguradora_id}
          options={empresasAseguradoras.map(empresa => ({
            value: empresa.id,
            label: empresa.nombre,
          }))}
          placeholder="Selecciona una empresa"
          disabled={isLoadingCompanies || isAuthLoading} // Deshabilitar si las empresas están cargando o la autenticación está en curso
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