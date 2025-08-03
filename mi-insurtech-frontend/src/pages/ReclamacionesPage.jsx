// src/pages/ReclamacionesPage.jsx
import React from 'react';
import ReclamacionForm from '@/components/ReclamacionForm'; // Asegúrate de que esta ruta sea correcta
// ReclamacionList no se importa aquí directamente, se pasa como prop desde App.jsx a ReclamacionForm

/**
 * Componente de página para la gestión de Reclamaciones.
 * Orquesta el formulario de creación/edición.
 *
 * @param {object} props - Las propiedades del componente.
 * @param {function} props.onReclamacionSaved - Callback que se llama cuando una reclamación es guardada (creada/actualizada).
 * @param {object|null} props.editingReclamacion - Objeto de la reclamación a editar, o null si es un nuevo registro.
 * @param {function} props.setEditingReclamacion - Setter para limpiar el estado de edición en el padre.
 * @param {Array<object>} props.polizas - Lista de pólizas para el select.
 * @param {Array<object>} props.clientes - Lista de clientes para el select.
 * @param {boolean} props.isLoadingPolicies - Indica si la lista de pólizas está cargando.
 * @param {boolean} props.isLoadingClients - Indica si la lista de clientes está cargando.
 * @param {string} props.API_URL - URL base de la API.
 * @param {boolean} props.isAuthLoading - Indica si la autenticación aún está cargando.
 * @param {string} props.token - El token de autenticación del usuario. // ¡CRÍTICO! Añadido token a las props
 */
function ReclamacionesPage({
  onReclamacionSaved,
  editingReclamacion,
  setEditingReclamacion,
  polizas,
  clientes,
  isLoadingPolicies,
  isLoadingClients,
  API_URL,
  isAuthLoading,
  token, // ¡CRÍTICO! Recibir token
}) {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Gestión de Reclamaciones</h1>
      <ReclamacionForm
        onReclamacionSaved={onReclamacionSaved}
        editingReclamacion={editingReclamacion}
        setEditingReclamacion={setEditingReclamacion}
        polizas={polizas}
        clientes={clientes}
        isLoadingPolicies={isLoadingPolicies}
        isLoadingClients={isLoadingClients}
        API_URL={API_URL}
        isAuthLoading={isAuthLoading} // Pasar isAuthLoading al formulario
        token={token} // ¡CRÍTICO! Pasar token al formulario
      />
      {/* La lista de reclamaciones se renderiza directamente en App.jsx, no aquí */}
    </div>
  );
}

export default ReclamacionesPage;
