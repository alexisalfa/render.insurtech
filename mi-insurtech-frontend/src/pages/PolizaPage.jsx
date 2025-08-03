// src/pages/PolizaPage.jsx
import React from 'react';
import PolizaForm from '@/components/PolizaForm'; // Asegúrate de que esta ruta sea correcta
// ClientList y EmpresaAseguradoraList no se importan aquí directamente, se pasan como props desde App.jsx a PolizaForm
// import PolizaList from '@/components/PolizaList'; // La lista se renderiza directamente en App.jsx

/**
 * Componente de página para la gestión de Pólizas.
 * Orquesta el formulario de creación/edición.
 *
 * @param {object} props - Las propiedades del componente.
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
function PolizaPage({
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
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Gestión de Pólizas</h1>
      <PolizaForm
        onPolizaSaved={onPolizaSaved}
        editingPoliza={editingPoliza}
        setEditingPoliza={setEditingPoliza}
        clientes={clientes}
        empresasAseguradoras={empresasAseguradoras}
        asesores={asesores}
        isLoadingClients={isLoadingClients}
        isLoadingCompanies={isLoadingCompanies}
        isLoadingAdvisors={isLoadingAdvisors}
        API_URL={API_URL}
        isAuthLoading={isAuthLoading} // Pasar isAuthLoading al formulario
      />
      {/* La lista de pólizas se renderiza directamente en App.jsx, no aquí */}
    </div>
  );
}

export default PolizaPage;
