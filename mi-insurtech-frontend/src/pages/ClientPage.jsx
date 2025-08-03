// src/pages/ClientPage.jsx
import React from 'react';
import ClientForm from '@/components/ClientForm'; // Asegúrate de que esta ruta sea correcta
import ClientList from '@/components/ClientList'; // Asegúrate de que esta ruta sea correcta

/**
 * Componente de página para la gestión de Clientes.
 * Orquesta el formulario de creación/edición y la lista de visualización.
 *
 * @param {object} props - Las propiedades del componente.
 * @param {function} props.onClientSaved - Callback que se llama cuando un cliente es guardado (creado/actualizado).
 * @param {object|null} props.editingClient - Objeto del cliente a editar, o null si es un nuevo registro.
 * @param {function} props.setEditingClient - Setter para limpiar el estado de edición en el padre.
 * @param {string} props.API_URL - URL base de la API.
 * @param {boolean} props.isAuthLoading - Indica si la autenticación aún está cargando.
 */
function ClientPage({ onClientSaved, editingClient, setEditingClient, API_URL, isAuthLoading }) {
  // Las props de clientes, paginación, búsqueda, etc., se manejan en App.jsx y se pasan a ClientList en App.jsx
  // Este componente ClientPage solo necesita el formulario y sus props
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Gestión de Clientes</h1>
      <ClientForm
        onClientSaved={onClientSaved}
        editingClient={editingClient}
        setEditingClient={setEditingClient}
        API_URL={API_URL}
        isAuthLoading={isAuthLoading} // Pasar isAuthLoading al formulario
      />
      {/* La lista de clientes se renderiza directamente en App.jsx, no aquí */}
    </div>
  );
}

export default ClientPage;
