// src/components/ClientForm.jsx
import React, { useState, useEffect } from 'react';
// Importar los nuevos componentes reutilizables
import FormContainer from './FormContainer';
import StyledFormField from './StyledFormField';
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';

// Importar useToast para notificaciones
import { useToast } from '@/lib/use-toast'; 

// Importar la clave del token desde constantes.jsx
import { ACCESS_TOKEN_KEY } from './constantes'; // <-- ¡AÑADIR ESTA LÍNEA!
/**
 * Componente para crear y editar clientes.
 *
 * @param {object} props - Las propiedades del componente.
 * @param {function} props.onClientSaved - Callback que se ejecuta cuando un cliente es guardado/actualizado.
 * @param {object|null} props.editingClient - Objeto cliente si estamos editando, o null si estamos creando uno nuevo.
 * @param {function} props.setEditingClient - Función para actualizar el estado editingClient en el padre.
 * @param {string} props.API_URL - URL base de la API.
 */
function ClientForm({ onClientSaved, editingClient, setEditingClient, API_URL }) {
  const { toast } = useToast(); // Hook para usar las notificaciones de Toast

  // Estado inicial del formulario
  const initialFormData = {
    nombre: '',
    apellido: '',
    cedula: '',
    email: '',
    telefono: '',
    fecha_nacimiento: undefined, // Usar undefined para un estado inicial más limpio para el Date picker
    direccion: '',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({}); // Estado para errores de validación de campos
  const [isSubmitting, setIsSubmitting] = useState(false); // Cambiado de 'loading' a 'isSubmitting' para claridad


  // Efecto para cargar los datos del cliente si estamos editando
  useEffect(() => {
    if (editingClient) {
      setFormData({
        nombre: editingClient.nombre || '',
        apellido: editingClient.apellido || '',
        cedula: editingClient.cedula || '',
        email: editingClient.email || '',
        telefono: editingClient.telefono || '',
        // Convertir la fecha de string ISO a objeto Date si existe
        fecha_nacimiento: editingClient.fecha_nacimiento ? new Date(editingClient.fecha_nacimiento) : undefined,
        direccion: editingClient.direccion || '',
      });
    } else {
      // Reiniciar el formulario si no estamos editando o se ha guardado uno nuevo
      setFormData(initialFormData);
    }
    setErrors({}); // Limpiar errores al cambiar de cliente
  }, [editingClient]); // Dependencia: re-ejecutar cuando cambia el cliente a editar

  // Manejador de cambios genérico para inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Limpiar el error si el campo se modifica
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
    setFormData((prev) => ({ ...prev, fecha_nacimiento: date }));
    // Limpiar el error si el campo se modifica
    if (errors.fecha_nacimiento) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.fecha_nacimiento;
        return newErrors;
      });
    }
  };

  // Función de validación del formulario
  const validateForm = () => {
    const newErrors = {};
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio.';
    if (!formData.apellido.trim()) newErrors.apellido = 'El apellido es obligatorio.';
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
    if (!formData.fecha_nacimiento) {
        newErrors.fecha_nacimiento = 'La fecha de nacimiento es obligatoria.';
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

    // Convertir la fecha a string ISO para la API
    const dataToSend = {
      ...formData,
      fecha_nacimiento: formData.fecha_nacimiento ? formData.fecha_nacimiento.toISOString().split('T')[0] : null,
    };

    // CORRECCIÓN: Ajustar la URL para que sea /clientes/ al crear uno nuevo
    const url = editingClient ? `${API_URL}/clientes/${editingClient.id}` : `${API_URL}/clientes/`;
    const method = editingClient ? 'PUT' : 'POST';

    // *** INICIO de logs de depuración ***
    console.log("Datos a enviar:", dataToSend);
    console.log("Método HTTP:", method);
    console.log("URL de la solicitud:", url);
    // *** FIN de logs de depuración ***

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
        throw new Error(errorData.detail || 'Error al guardar cliente.');
      }
      
      const savedClient = await response.json();
      onClientSaved(savedClient); // Llamar al callback para actualizar la lista en el padre
      
      toast({
        title: "Éxito",
        description: editingClient ? "Cliente actualizado correctamente." : "Cliente creado correctamente.",
      });
      
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error inesperado al guardar el cliente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingClient(null);
    setFormData(initialFormData);
  };

  return (
    <FormContainer title={editingClient ? `Editar Cliente: ${editingClient.nombre} ${editingClient.apellido}` : "Nuevo Cliente"}>
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
        />

        {/* Campo Dirección */}
        <StyledFormField
          label="Dirección"
          id="direccion"
          name="direccion"
          type="text" // Usar type="text" para Input normal
          value={formData.direccion}
          onChange={handleChange}
          placeholder="Dirección completa"
        />

        {/* Campo Fecha de Nacimiento (con StyledFormField de tipo 'date') */}
        <StyledFormField
          label="Fecha de Nacimiento"
          id="fecha_nacimiento"
          name="fecha_nacimiento"
          type="date"
          value={formData.fecha_nacimiento}
          onDateSelect={handleDateChange} // Asegúrate de que handleDateChange reciba el objeto Date
          placeholder="Selecciona una fecha"
          required
          error={errors.fecha_nacimiento}
          // No necesitamos pasar dateFormat ni getDateFormatOptions aquí si ya están en StyledFormField
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
            {editingClient ? 'Actualizar Cliente' : 'Crear Cliente'}
          </PrimaryButton>
        </div>
      </form>
    </FormContainer>
  );
}


export default ClientForm;
