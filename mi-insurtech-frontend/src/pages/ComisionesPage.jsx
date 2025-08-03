// src/pages/ComisionesPage.jsx
import React from 'react';
import ComisionForm from '@/components/ComisionForm'; // Asegúrate de que esta ruta sea correcta
// ComisionList no se importa aquí directamente, se pasa como prop desde App.jsx a ComisionForm

/**
 * Componente de página para la gestión de Comisiones.
 * Orquesta el formulario de creación/edición.
 *
 * @param {object} props - Las propiedades del componente.
 * @param {function} props.onComisionSaved - Callback que se llama cuando una comisión es guardada (creada/actualizada).
 * @param {object|null} props.editingComision - Objeto de la comisión a editar, o null si es un nuevo registro.
 * @param {function} props.setEditingComision - Setter para limpiar el estado de edición en el padre.
 * @param {Array<object>} props.asesores - Lista de asesores para el select.
 * @param {Array<object>} props.polizas - Lista de pólizas para el select.
 * @param {boolean} props.isLoadingAdvisors - Indica si la lista de asesores está cargando.
 * @param {boolean} props.isLoadingPolicies - Indica si la lista de pólizas está cargando.
 * @param {string} props.API_URL - URL base de la API.
 * @param {boolean} props.isAuthLoading - Indica si la autenticación aún está cargando.
 * @param {string} props.token - El token de autenticación del usuario. // ¡CRÍTICO! Añadido token a las props
 */
function ComisionesPage({
  onComisionSaved,
  editingComision,
  setEditingComision,
  asesores,
  polizas,
  isLoadingAdvisors,
  isLoadingPolicies,
  API_URL,
  isAuthLoading,
  token, // ¡CRÍTICO! Recibir token
}) {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Gestión de Comisiones</h1>
      <ComisionForm
        onComisionSaved={onComisionSaved}
        editingComision={editingComision}
        setEditingComision={setEditingComision}
        asesores={asesores}
        polizas={polizas}
        isLoadingAdvisors={isLoadingAdvisors}
        isLoadingPolicies={isLoadingPolicies}
        API_URL={API_URL}
        isAuthLoading={isAuthLoading} // Pasar isAuthLoading al formulario
        token={token} // ¡CRÍTICO! Pasar token al formulario
      />
      {/* La lista de comisiones se renderiza directamente en App.jsx, no aquí */}
    </div>
  );
}

export default ComisionesPage;
