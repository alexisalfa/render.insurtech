// src/App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import ClientForm from './components/ClientForm';
import ClientList from './components/ClientList';
import PolizaForm from './components/PolizaForm';
import PolizaList from './components/PolizaList';
import ReclamacionForm from './components/ReclamacionForm';
import ReclamacionList from './components/ReclamacionList';
import Dashboard from './components/Dashboard';
import SettingsPage from './components/SettingsPage';
import ClienteImport from './components/ClienteImport';
import AsesorForm from './components/AsesorForm';
import AsesorList from './components/AsesorList';
import ComisionList from './components/ComisionList';
import ComisionForm from './components/ComisionForm';

// Páginas de gestión
import ClientPage from './pages/ClientPage';
import PolizaPage from './pages/PolizaPage';
import ReclamacionesPage from './pages/ReclamacionesPage';
import EmpresasAseguradorasPage from './pages/EmpresasAseguradorasPage';
import AsesoresPage from './pages/AsesoresPage';
import ComisionesPage from './pages/ComisionesPage';


import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/lib/use-toast';
import { ConfirmationProvider } from './components/ConfirmationContext';
import { saveAs } from 'file-saver';
import { Loader2, XCircle } from 'lucide-react';
import { ToastProvider } from './components/ToastContext';

// Importar jsPDF y jspdf-autotable
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Importar las constantes
import {
  CLIENTES_PER_PAGE, POLIZAS_PER_PAGE, RECLAMACIONES_PER_PAGE,
  EMPRESAS_ASEGURADORAS_PER_PAGE, ASESORES_PER_PAGE, COMISIONES_PER_PAGE,
  LANGUAGE_OPTIONS, DATE_FORMAT_OPTIONS, CURRENCY_SYMBOL_OPTIONS,
  COUNTRY_OPTIONS, MASTER_LICENSE_KEY
} from './components/constantes';

// Importar el hook de licencia
import useLicenseStatus from './hooks/useLicenseStatus';

// ¡CRÍTICO! Definición de la URL base de tu API FastAPI en el puerto 8001
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';
export const ACCESS_TOKEN_KEY = 'insurtech_access_token';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem(ACCESS_TOKEN_KEY));
  const [isAuthLoading, setIsAuthLoading] = useState(true); // Controla la carga inicial de autenticación
  const [activeTab, setActiveTab] = useState(token ? 'dashboard' : 'login'); // Pestaña activa

  // Estados para la edición de formularios
  const [editingClient, setEditingClient] = useState(null);
  const [editingPoliza, setEditingPoliza] = useState(null);
  const [editingReclamacion, setEditingReclamacion] = useState(null);
  const [editingEmpresaAseguradora, setEditingEmpresaAseguradora] = useState(null);
  const [editingAsesor, setEditingAsesor] = useState(null);
  const [editingComision, setEditingComision] = useState(null);

  // Estados para datos de listas (usados por los componentes de lista)
  const [clientes, setClientes] = useState([]);
  const [polizas, setPolizas] = useState([]);
  const [reclamaciones, setReclamaciones] = useState([]);
  const [empresasAseguradoras, setEmpresasAseguradoras] = useState([]); // Lista de empresas
  const [asesores, setAsesores] = useState([]);
  const [comisiones, setComisiones] = useState([]);

  // ESTADOS DE CARGA para las listas auxiliares que alimentan los Selects
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true); // Para empresas aseguradoras
  const [isLoadingAdvisors, setIsLoadingAdvisors] = useState(true);
  const [isLoadingPolicies, setIsLoadingPolicies] = useState(true);
  const [isLoadingReclamaciones, setIsLoadingReclamaciones] = useState(true);
  const [isLoadingComisiones, setIsLoadingComisiones] = useState(true);

  // Estados para las estadísticas detalladas del dashboard
  const [statisticsSummaryData, setStatisticsSummaryData] = useState(null);
  const [isLoadingStatisticsSummary, setIsLoadingStatisticsSummary] = useState(true);
  const [polizasProximasAVencer, setPolizasProximasAVencer] = useState([]);
  const [isLoadingPolizasProximasAVencer, setIsLoadingPolizasProximasAVencer] = useState(true);

  // Estados para los TOTALES específicos de cada lista (para paginación)
  const [totalClients, setTotalClients] = useState(0);
  const [totalPolizas, setTotalPolizas] = useState(0);
  const [totalReclamaciones, setTotalReclamaciones] = useState(0);
  const [totalEmpresasAseguradoras, setTotalEmpresasAseguradoras] = useState(0); // Total para paginación de empresas
  const [totalAsesores, setTotalAsesores] = useState(0);
  const [totalComisiones, setTotalComisiones] = useState(0);

  const { toast } = useToast();
  const [showRegisterForm, setShowRegisterForm] = useState(false);

  // Estados para filtros y búsqueda de Clientes
  const [clienteSearchTerm, setClienteSearchTerm] = useState('');
  const [clienteEmailFilter, setClienteEmailFilter] = useState('');
  const [clienteCurrentPage, setClienteCurrentPage] = useState(1);

  // Estados para filtros y búsqueda de Pólizas
  const [polizaSearchTerm, setPolizaSearchTerm] = useState('');
  const [polizaTipoFilter, setPolizaTipoFilter] = useState('');
  const [polizaEstadoFilter, setPolizaEstadoFilter] = useState('');
  const [polizaClienteIdFilter, setPolizaClienteIdFilter] = useState('');
  const [polizaFechaInicioFilter, setPolizaFechaInicioFilter] = useState('');
  const [polizaFechaFinFilter, setPolizaFechaFinFilter] = useState('');
  const [polizaCurrentPage, setPolizaCurrentPage] = useState(1);

  // Estados para filtros y búsqueda de Reclamaciones
  const [reclamacionSearchTerm, setReclamacionSearchTerm] = useState('');
  const [reclamacionEstadoFilter, setReclamacionEstadoFilter] = useState('');
  const [reclamacionClienteIdFilter, setReclamacionClienteIdFilter] = useState('');
  const [reclamacionPolizaIdFilter, setReclamacionPolizaIdFilter] = useState('');
  const [reclamacionFechaReclamacionInicioFilter, setReclamacionFechaReclamacionInicioFilter] = useState('');
  const [reclamacionFechaReclamacionFinFilter, setReclamacionFechaReclamacionFinFilter] = useState('');
  const [reclamacionCurrentPage, setReclamacionCurrentPage] = useState(1);

  // Estados para filtros y búsqueda de Empresas Aseguradoras (consolidados)
  const [empresaAseguradoraSearchTerm, setEmpresaAseguradoraSearchTerm] = useState('');
  const [empresaAseguradoraCurrentPage, setEmpresaAseguradoraCurrentPage] = useState(1);

  // Estados para paginación de Asesores
  const [asesorSearchTerm, setAsesorSearchTerm] = useState('');
  const [asesorCurrentPage, setAsesorCurrentPage] = useState(1);

  // Nuevos estados para filtros y búsqueda de Comisiones
  const [comisionAsesorIdFilter, setComisionAsesorIdFilter] = useState('');
  const [comisionEstadoPagoFilter, setComisionEstadoPagoFilter] = useState('');
  const [comisionFechaInicioFilter, setComisionFechaInicioFilter] = useState('');
  const [comisionFechaFinFilter, setComisionFechaFinFilter] = useState('');
  const [comisionCurrentPage, setComisionCurrentPage] = useState(1);

  // ESTADOS PARA LA CONFIGURACIÓN GLOBAL (ahora solo lectura de localStorage)
  const [selectedLanguage, setSelectedLanguage] = useState(localStorage.getItem('selectedLanguage') || 'es');
  const [currencySymbol, setCurrencySymbol] = useState(localStorage.getItem('currencySymbol') || 'USD');
  const [dateFormat, setDateFormat] = useState(localStorage.getItem('dateFormat') || 'dd/MM/yyyy');
  const [selectedCountry, setSelectedCountry] = useState(localStorage.getItem('selectedCountry') || 'VE');
  const [licenseKey, setLicenseKey] = useState(localStorage.getItem('licenseKey') || '');

  // --- Funciones de Autenticación (definidas PRIMERO para que estén disponibles) ---
  const handleLogout = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    console.log("Logout: Token removido de localStorage.");
    setToken(null);
    setCurrentUser(null); // Limpiar currentUser al cerrar sesión
    setActiveTab('login');
    toast({
      title: "Sesión Cerrada",
      description: "Has cerrado tu sesión exitosamente.",
      variant: "info",
    });
  }, [toast]);

  const handleLogin = useCallback((newToken) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, newToken);
    setToken(newToken);
    // El useEffect que observa 'token' se encargará de cargar el currentUser y redirigir
  }, []);

  // USO DEL NUEVO HOOK useLicenseStatus
  const {
    licenseStatus,
    isLoading: isLoadingLicense,
    fetchLicenseStatus,
    handleActivateLicense,
  } = useLicenseStatus(API_BASE_URL, token, handleLogout); // Asegúrate de pasar handleLogout

  // Efecto para cargar configuraciones desde localStorage al inicio
  useEffect(() => {
    const savedLanguage = localStorage.getItem('selectedLanguage');
    const savedCurrencySymbol = localStorage.getItem('currencySymbol');
    const savedDateFormat = localStorage.getItem('dateFormat');
    const savedSelectedCountry = localStorage.getItem('selectedCountry');
    const savedLicenseKey = localStorage.getItem('licenseKey');

    if (savedLanguage) setSelectedLanguage(savedLanguage);
    if (savedCurrencySymbol) setCurrencySymbol(savedCurrencySymbol);
    if (savedDateFormat) setDateFormat(savedDateFormat);
    if (savedSelectedCountry) {
      const countryData = COUNTRY_OPTIONS.find(country => country.id === savedSelectedCountry);
      if (countryData) {
        setSelectedLanguage(countryData.defaultLanguage);
        setCurrencySymbol(countryData.defaultCurrencySymbol);
        setDateFormat(countryData.defaultDateFormat);
      }
      setSelectedCountry(savedSelectedCountry);
    }
    if (savedLicenseKey) setLicenseKey(savedLicenseKey);

  }, []);

  // Función para guardar configuraciones en localStorage
  const saveSettings = useCallback(async ({ language, currency_symbol, date_format, country }) => {
    try {
      localStorage.setItem('selectedLanguage', language);
      localStorage.setItem('currencySymbol', currency_symbol);
      localStorage.setItem('dateFormat', date_format);
      localStorage.setItem('selectedCountry', country);

      setSelectedLanguage(language);
      setCurrencySymbol(currency_symbol);
      setDateFormat(date_format);
      setSelectedCountry(country);

      toast({
        title: "Configuración Guardada",
        description: "Los ajustes han sido guardados exitosamente.",
        variant: "success",
      });
    } catch (error) {
      console.error("Error al guardar configuración:", error);
      toast({
        title: "Error al Guardar",
        description: `No se pudieron guardar tus preferencias: ${error.message}`,
        variant: "destructive",
      });
    }
  }, [toast, setSelectedLanguage, setCurrencySymbol, setDateFormat, setSelectedCountry]);

  // --- Interceptor Global de Fetch ---
  // Este interceptor asegura que todas las solicitudes salientes (excepto auth/token y auth/register)
  // incluyan el token de autorización. También maneja el logout automático en 401/403.
  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (input, init = {}) => {
      const url = typeof input === 'string' ? input : input.url;
      const isAuthEndpoint = url.includes('/token') || url.includes('/register');

      if (!isAuthEndpoint) {
        const currentToken = localStorage.getItem(ACCESS_TOKEN_KEY);
        if (currentToken) {
          console.log(`Interceptor: Añadiendo Authorization header para ${url}`);
          init.headers = {
            ...init.headers,
            'Authorization': `Bearer ${currentToken}`,
          };
        } else {
          console.warn(`Interceptor: No se encontró token para ${url}. La solicitud podría fallar.`);
        }
      }

      try {
        const response = await originalFetch(input, init);

        if ((response.status === 401 || response.status === 403) && !isAuthEndpoint) {
          console.error(`Interceptor: Solicitud a ${url} falló con ${response.status}. Forzando logout.`);
          handleLogout();
        }
        return response;
      } catch (error) {
        console.error(`Interceptor: Error en la solicitud a ${url}:`, error);
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [handleLogout]);


  // --- Funciones de Carga de Datos (CRÍTICO: DEFINICIONES AQUÍ) ---

  const fetchStatisticsSummaryData = useCallback(async () => {
    if (!token) return;
    setIsLoadingStatisticsSummary(true);
    try {
      const response = await fetch(`${API_BASE_URL}/statistics/summary/`);
      if (!response.ok) throw new Error('Failed to fetch summary statistics');
      const data = await response.json();
      setStatisticsSummaryData(data);
    } catch (error) {
      console.error("Error fetching summary statistics:", error);
      toast({ title: "Error de Carga", description: "No se pudieron cargar las estadísticas del resumen.", variant: "destructive" });
    } finally {
      setIsLoadingStatisticsSummary(false);
    }
  }, [API_BASE_URL, token, toast]);

  const fetchUpcomingPoliciesData = useCallback(async (daysOut = 30) => {
    if (!token) return;
    setIsLoadingPolizasProximasAVencer(true);
    try {
      // ¡CRÍTICO! La ruta correcta es /polizas/polizas/proximas_a_vencer/
      const response = await fetch(`${API_BASE_URL}/polizas/polizas/proximas_a_vencer/?dias_restantes=${daysOut}`);
      if (!response.ok) throw new Error('Failed to fetch upcoming policies');
      const data = await response.json();
      setPolizasProximasAVencer(data);
    } catch (error) {
      console.error("Error fetching upcoming policies:", error);
      toast({ title: "Error de Carga", description: "No se pudieron cargar las pólizas próximas a vencer.", variant: "destructive" });
    } finally {
      setIsLoadingPolizasProximasAVencer(false);
    }
  }, [API_BASE_URL, token, toast]);

  const fetchClientsData = useCallback(async (offset = 0, limit = CLIENTES_PER_PAGE, searchTerm = '', emailFilter = '') => {
    if (!token) return;
    setIsLoadingClients(true);
    try {
      const queryParams = new URLSearchParams({
        offset: offset,
        limit: limit,
      });
      if (searchTerm) queryParams.append('search_term', searchTerm);
      if (emailFilter) queryParams.append('email', emailFilter);

      const response = await fetch(`${API_BASE_URL}/clientes/?${queryParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch clients');
      const data = await response.json();
      setClientes(data.items);
      setTotalClients(data.total);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast({ title: "Error de Carga", description: "No se pudieron cargar los clientes.", variant: "destructive" });
    } finally {
      setIsLoadingClients(false);
    }
  }, [API_BASE_URL, token, toast]);

  const fetchEmpresasAseguradoras = useCallback(async (offset = 0, limit = EMPRESAS_ASEGURADORAS_PER_PAGE, searchTerm = '') => {
    if (!token) return;
    setIsLoadingCompanies(true);
    try {
      const queryParams = new URLSearchParams({
        offset: offset,
        limit: limit,
      });
      if (searchTerm) queryParams.append('search_term', searchTerm);

      const response = await fetch(`${API_BASE_URL}/empresas_aseguradoras/?${queryParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch companies');
      const data = await response.json();
      setEmpresasAseguradoras(data.items);
      setTotalEmpresasAseguradoras(data.total);
    } catch (error) {
      console.error("Error fetching companies:", error);
      toast({ title: "Error de Carga", description: "No se pudieron cargar las empresas aseguradoras.", variant: "destructive" });
    } finally {
      setIsLoadingCompanies(false);
    }
  }, [API_BASE_URL, token, toast]);

  const fetchAdvisorsData = useCallback(async (offset = 0, limit = ASESORES_PER_PAGE, searchTerm = '') => {
    if (!token) return;
    setIsLoadingAdvisors(true);
    try {
      const queryParams = new URLSearchParams({
        offset: offset,
        limit: limit,
      });
      if (searchTerm) queryParams.append('search_term', searchTerm);

      const response = await fetch(`${API_BASE_URL}/asesores/?${queryParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch advisors');
      const data = await response.json();
      setAsesores(data.items);
      setTotalAsesores(data.total);
    } catch (error) {
      console.error("Error fetching advisors:", error);
      toast({ title: "Error de Carga", description: "No se pudieron cargar los asesores.", variant: "destructive" });
    } finally {
      setIsLoadingAdvisors(false);
    }
  }, [API_BASE_URL, token, toast]);

  const fetchPoliciesData = useCallback(async (
    offset = 0,
    limit = POLIZAS_PER_PAGE,
    searchTerm = '',
    tipoFilter = '',
    estadoFilter = '',
    clienteIdFilter = '',
    fechaInicioFilter = '',
    fechaFinFilter = ''
  ) => {
    if (!token) return;
    setIsLoadingPolicies(true);
    try {
      const queryParams = new URLSearchParams({
        offset: offset,
        limit: limit,
      });
      if (searchTerm) queryParams.append('search_term', searchTerm);
      if (tipoFilter) queryParams.append('tipo_poliza', tipoFilter);
      if (estadoFilter) queryParams.append('estado', estadoFilter);
      if (clienteIdFilter) queryParams.append('cliente_id', clienteIdFilter);
      if (fechaInicioFilter) queryParams.append('fecha_inicio_filter', fechaInicioFilter);
      if (fechaFinFilter) queryParams.append('fecha_fin_filter', fechaFinFilter);

      // ¡CRÍTICO! La ruta correcta es /polizas/polizas/
      const response = await fetch(`${API_BASE_URL}/polizas/polizas/?${queryParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch policies');
      const data = await response.json();
      setPolizas(data.items);
      setTotalPolizas(data.total);
    } catch (error) {
      console.error("Error fetching policies:", error);
      toast({ title: "Error de Carga", description: "No se pudieron cargar las pólizas.", variant: "destructive" });
    } finally {
      setIsLoadingPolicies(false);
    }
  }, [API_BASE_URL, token, toast]);

  const fetchClaimsData = useCallback(async (
    offset = 0,
    limit = RECLAMACIONES_PER_PAGE,
    searchTerm = '',
    estadoFilter = '',
    clienteIdFilter = '',
    polizaIdFilter = '',
    fechaReclamacionInicioFilter = '',
    fechaReclamacionFinFilter = ''
  ) => {
    if (!token) return;
    setIsLoadingReclamaciones(true);
    try {
      const queryParams = new URLSearchParams({
        offset: offset,
        limit: limit,
      });
      if (searchTerm) queryParams.append('search_term', searchTerm);
      if (estadoFilter) queryParams.append('estado', estadoFilter);
      if (clienteIdFilter) queryParams.append('cliente_id', clienteIdFilter);
      if (polizaIdFilter) queryParams.append('poliza_id', polizaIdFilter);
      if (fechaReclamacionInicioFilter) queryParams.append('fecha_reclamacion_inicio_filter', fechaReclamacionInicioFilter);
      if (fechaReclamacionFinFilter) queryParams.append('fecha_reclamacion_fin_filter', fechaReclamacionFinFilter);

      const response = await fetch(`${API_BASE_URL}/reclamaciones/?${queryParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch claims');
      const data = await response.json();
      setReclamaciones(data.items);
      setTotalReclamaciones(data.total);
    } catch (error) {
      console.error("Error fetching claims:", error);
      toast({ title: "Error de Carga", description: "No se pudieron cargar las reclamaciones.", variant: "destructive" });
    } finally {
      setIsLoadingReclamaciones(false);
    }
  }, [API_BASE_URL, token, toast]);

  const fetchCommissionsData = useCallback(async (
    offset = 0,
    limit = COMISIONES_PER_PAGE,
    asesorIdFilter = '',
    estadoPagoFilter = '',
    fechaInicioFilter = '',
    fechaFinFilter = ''
  ) => {
    if (!token) return;
    setIsLoadingComisiones(true);
    try {
      const queryParams = new URLSearchParams({
        offset: offset,
        limit: limit,
      });
      if (asesorIdFilter) queryParams.append('asesor_id', asesorIdFilter);
      if (estadoPagoFilter) queryParams.append('estado_pago', estadoPagoFilter);
      if (fechaInicioFilter) queryParams.append('fecha_inicio_filter', fechaInicioFilter);
      if (fechaFinFilter) queryParams.append('fecha_fin_filter', fechaFinFilter);

      // ¡CRÍTICO! La ruta correcta es /comisiones/
      const response = await fetch(`${API_BASE_URL}/comisiones/?${queryParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch commissions');
      const data = await response.json();
      setComisiones(data.items);
      setTotalComisiones(data.total);
    } catch (error) {
      console.error("Error fetching commissions:", error);
      toast({ title: "Error de Carga", description: "No se pudieron cargar las comisiones.", variant: "destructive" });
    } finally {
      setIsLoadingComisiones(false);
    }
  }, [API_BASE_URL, token, toast]);


  // --- useEffect PRINCIPAL para cargar datos del usuario y manejar autenticación ---
  // Este useEffect se encarga de:
  // 1. Cargar el currentUser cuando el token cambia.
  // 2. Manejar el estado de carga de autenticación (isAuthLoading).
  // 3. Redirigir al login si el token no es válido o hay un error.
  useEffect(() => {
    console.log("App.jsx useEffect principal: Token actual en estado:", token);
    const fetchCurrentUser = async () => {
      setIsAuthLoading(true); // Iniciar carga de autenticación
      if (token) {
        try {
          // ¡CRÍTICO! Esta es la URL para obtener los datos del usuario en FastAPI
          const response = await fetch(`${API_BASE_URL}/auth/users/me/`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const user = await response.json();
            setCurrentUser(user);
            console.log("App.jsx useEffect principal: Datos de currentUser cargados:", user);
            setActiveTab('dashboard'); // Navegar al dashboard después de cargar el usuario
          } else {
            console.error("App.jsx useEffect principal: Error al obtener currentUser:", response.statusText);
            setToken(null); // Limpiar token si no es válido
            localStorage.removeItem(ACCESS_TOKEN_KEY);
            setCurrentUser(null);
            setActiveTab('login'); // Redirigir a login si el token no es válido
            toast({
              title: "Sesión Expirada",
              description: "Tu sesión ha expirado o es inválida. Por favor, inicia sesión nuevamente.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("App.jsx useEffect principal: Error en fetchCurrentUser (catch):", error);
          setToken(null);
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          setCurrentUser(null);
          setActiveTab('login'); // Redirigir a login si hay un error de red o similar
          toast({
            title: "Error de Conexión",
            description: "No se pudo conectar con el servidor. Por favor, verifica tu conexión o inténtalo más tarde.",
            variant: "destructive",
          });
        }
      } else {
        setCurrentUser(null);
        console.log("App.jsx useEffect principal: Usuario no autenticado o token no encontrado. No se cargan datos.");
        setActiveTab('login'); // Asegurarse de que la pestaña sea login si no hay token
      }
      setIsAuthLoading(false); // Finalizar carga de autenticación
    };
    // Llamar a fetchCurrentUser cuando el token cambia, o al inicio si ya hay un token
    fetchCurrentUser();
  }, [token, API_BASE_URL, setToken, toast, setCurrentUser, setActiveTab]); // Dependencias: token, API_BASE_URL, setToken, toast, setCurrentUser, setActiveTab


  useEffect(() => {
    if (activeTab === 'dashboard' && token && !isAuthLoading) {
      fetchStatisticsSummaryData();
      fetchUpcomingPoliciesData();
    }
  }, [activeTab, token, isAuthLoading, fetchStatisticsSummaryData, fetchUpcomingPoliciesData]);

  useEffect(() => {
    if (activeTab === 'configuracion' && token && !isAuthLoading) {
      // fetchConfiguracion(); // Si tienes una función fetchConfiguracion, actívala aquí
    }
  }, [activeTab, token, isAuthLoading]); // Añadir fetchConfiguracion si existe

  useEffect(() => {
    if (activeTab === 'clientes' && token && !isAuthLoading) {
      fetchClientsData(
        (clienteCurrentPage - 1) * CLIENTES_PER_PAGE,
        CLIENTES_PER_PAGE,
        clienteSearchTerm,
        clienteEmailFilter
      );
    }
  }, [activeTab, token, isAuthLoading, clienteCurrentPage, clienteSearchTerm, clienteEmailFilter, fetchClientsData]);

  useEffect(() => {
    if (activeTab === 'polizas' && token && !isAuthLoading) {
      console.log("DEBUG App.jsx: activeTab es 'polizas'. Iniciando carga de datos.");
      fetchPoliciesData(
        (polizaCurrentPage - 1) * POLIZAS_PER_PAGE,
        POLIZAS_PER_PAGE,
        polizaSearchTerm,
        polizaTipoFilter,
        polizaEstadoFilter,
        polizaClienteIdFilter,
        polizaFechaInicioFilter,
        polizaFechaFinFilter
      );
      // Las pólizas necesitan la lista de clientes, empresas aseguradoras y asesores para los selects
      // Cargar TODOS los clientes/empresas/asesores pasando un límite grande (o ajusta según necesidad)
      fetchClientsData(0, 9999, '', ''); // Cargar todos los clientes para los selects
      fetchEmpresasAseguradoras(0, 9999, ''); // Cargar todas las empresas (offset 0 para asegurar primera página)
      fetchAdvisorsData(0, 9999, ''); // Cargar todos los asesores
    }
  }, [
    activeTab, token, isAuthLoading, polizaCurrentPage, polizaSearchTerm, polizaTipoFilter, polizaEstadoFilter,
    polizaClienteIdFilter, polizaFechaInicioFilter, polizaFechaFinFilter,
    fetchPoliciesData, fetchClientsData, fetchEmpresasAseguradoras, fetchAdvisorsData
  ]);

  useEffect(() => {
    if (activeTab === 'reclamaciones' && token && !isAuthLoading) {
      fetchClaimsData(
        (reclamacionCurrentPage - 1) * RECLAMACIONES_PER_PAGE,
        RECLAMACIONES_PER_PAGE,
        reclamacionSearchTerm,
        reclamacionEstadoFilter,
        reclamacionPolizaIdFilter,
        reclamacionFechaReclamacionInicioFilter,
        reclamacionFechaReclamacionFinFilter
      );
      // Las reclamaciones necesitan la lista de pólizas y clientes
      fetchPoliciesData(0, 9999, '', '', '', '', '', ''); // Cargar todas las pólizas
      fetchClientsData(0, 9999, '', ''); // Cargar todos los clientes
    }
  }, [activeTab, token, isAuthLoading, reclamacionCurrentPage, reclamacionSearchTerm, reclamacionEstadoFilter, reclamacionPolizaIdFilter, reclamacionFechaReclamacionInicioFilter, reclamacionFechaReclamacionFinFilter, fetchClaimsData, fetchPoliciesData, fetchClientsData]);

  useEffect(() => {
    if (activeTab === 'empresas_aseguradoras' && token && !isAuthLoading) {
      console.log("DEBUG: App.jsx - activeTab es 'empresas_aseguradoras'. Llamando fetchEmpresasAseguradoras.");
      fetchEmpresasAseguradoras(
        (empresaAseguradoraCurrentPage - 1) * EMPRESAS_ASEGURADORAS_PER_PAGE, // offset
        EMPRESAS_ASEGURADORAS_PER_PAGE,
        empresaAseguradoraSearchTerm // Usar el estado de término de búsqueda
      );
    }
  }, [activeTab, token, isAuthLoading, empresaAseguradoraCurrentPage, empresaAseguradoraSearchTerm, fetchEmpresasAseguradoras]);

  useEffect(() => {
    if (activeTab === 'asesores' && token && !isAuthLoading) {
      fetchAdvisorsData(
        (asesorCurrentPage - 1) * ASESORES_PER_PAGE,
        ASESORES_PER_PAGE,
        asesorSearchTerm
      );
      fetchEmpresasAseguradoras(0, 9999, ''); // Los asesores necesitan la lista de empresas (offset 0 para asegurar primera página)
    }
  }, [activeTab, token, isAuthLoading, asesorCurrentPage, asesorSearchTerm, fetchAdvisorsData, fetchEmpresasAseguradoras]);

  useEffect(() => {
    if (activeTab === 'comisiones' && token && !isAuthLoading) {
      fetchCommissionsData(
        (comisionCurrentPage - 1) * COMISIONES_PER_PAGE,
        COMISIONES_PER_PAGE,
        comisionAsesorIdFilter,
        comisionEstadoPagoFilter,
        comisionFechaInicioFilter,
        comisionFechaFinFilter
      );
      fetchAdvisorsData(0, 9999, ''); // Las comisiones necesitan la lista de asesores
      fetchPoliciesData(0, 9999, '', '', '', '', '', ''); // Y la lista de pólizas
    }
  }, [
    activeTab, token, isAuthLoading, comisionCurrentPage, comisionAsesorIdFilter, comisionEstadoPagoFilter,
    comisionFechaInicioFilter, comisionFechaFinFilter,
    fetchCommissionsData, fetchAdvisorsData, fetchPoliciesData
  ]);


  // Paginación y búsqueda/filtros para Clientes
  const handleClientePageChange = useCallback((page) => {
    setClienteCurrentPage(page);
  }, []);
  const handleClienteSearch = useCallback((searchTerm, emailFilter) => {
    setClienteSearchTerm(searchTerm);
    setClienteEmailFilter(emailFilter);
    setClienteCurrentPage(1);
  }, []);
  const handleClientSaved = useCallback(() => {
    setEditingClient(null);
    setClienteCurrentPage(1);
    fetchClientsData(0, CLIENTES_PER_PAGE, clienteSearchTerm, clienteEmailFilter);
    fetchStatisticsSummaryData();
    fetchUpcomingPoliciesData();
    // Recargar también las listas que dependen de clientes
    fetchPoliciesData((polizaCurrentPage - 1) * POLIZAS_PER_PAGE, POLIZAS_PER_PAGE, polizaSearchTerm, polizaTipoFilter, polizaEstadoFilter, polizaClienteIdFilter, polizaFechaInicioFilter, polizaFechaFinFilter);
    fetchClaimsData((reclamacionCurrentPage - 1) * RECLAMACIONES_PER_PAGE, RECLAMACIONES_PER_PAGE, reclamacionSearchTerm, reclamacionEstadoFilter, reclamacionPolizaIdFilter, reclamacionFechaReclamacionInicioFilter, reclamacionFechaReclamacionFinFilter);
  }, [clienteSearchTerm, clienteEmailFilter, fetchClientsData, fetchStatisticsSummaryData, fetchUpcomingPoliciesData, fetchPoliciesData, polizaCurrentPage, polizaSearchTerm, polizaTipoFilter, polizaEstadoFilter, polizaClienteIdFilter, polizaFechaInicioFilter, polizaFechaFinFilter, fetchClaimsData, reclamacionCurrentPage, reclamacionSearchTerm, reclamacionEstadoFilter, reclamacionPolizaIdFilter, reclamacionFechaReclamacionInicioFilter, reclamacionFechaReclamacionFinFilter]);

  const handleClientDelete = useCallback(async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/clientes/${id}`, { // URL corregida
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }, // Usar token del estado
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Error desconocido en el servidor.' }));
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }
      toast({ title: "Cliente Eliminado", description: "El cliente ha sido eliminado con éxito.", variant: "success" });
      setClienteCurrentPage(1); // Resetear a la primera página
      fetchClientsData(0, CLIENTES_PER_PAGE, clienteSearchTerm, clienteEmailFilter);
      fetchStatisticsSummaryData();
      fetchUpcomingPoliciesData();
      // Recargar también las listas que dependen de clientes
      fetchPoliciesData((polizaCurrentPage - 1) * POLIZAS_PER_PAGE, POLIZAS_PER_PAGE, polizaSearchTerm, polizaTipoFilter, polizaEstadoFilter, polizaClienteIdFilter, polizaFechaInicioFilter, polizaFechaFinFilter);
      fetchClaimsData((reclamacionCurrentPage - 1) * RECLAMACIONES_PER_PAGE, RECLAMACIONES_PER_PAGE, reclamacionSearchTerm, reclamacionEstadoFilter, reclamacionPolizaIdFilter, reclamacionFechaReclamacionInicioFilter, reclamacionFechaReclamacionFinFilter);
    } catch (error) {
      console.error("Error al eliminar cliente:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  }, [API_BASE_URL, token, clienteSearchTerm, clienteEmailFilter, fetchClientsData, fetchStatisticsSummaryData, fetchUpcomingPoliciesData, fetchPoliciesData, polizaCurrentPage, polizaSearchTerm, polizaTipoFilter, polizaEstadoFilter, polizaClienteIdFilter, polizaFechaInicioFilter, polizaFechaFinFilter, fetchClaimsData, reclamacionCurrentPage, reclamacionSearchTerm, reclamacionEstadoFilter, reclamacionPolizaIdFilter, reclamacionFechaReclamacionInicioFilter, reclamacionFechaReclamacionFinFilter, toast]);

  // Paginación y búsqueda/filtros para Pólizas
  const handlePolizaPageChange = useCallback((page) => {
    setPolizaCurrentPage(page);
  }, []);
  const handlePolizaSearch = useCallback((searchTerm, tipoFilter, estadoFilter, clienteIdFilter, fechaInicioFilter, fechaFinFilter) => {
    setPolizaSearchTerm(searchTerm);
    setPolizaTipoFilter(tipoFilter);
    setPolizaEstadoFilter(estadoFilter);
    setPolizaClienteIdFilter(clienteIdFilter);
    setPolizaFechaInicioFilter(fechaInicioFilter);
    setPolizaFechaFinFilter(fechaFinFilter);
    setPolizaCurrentPage(1);
  }, []);
  const handlePolizaSaved = useCallback(() => {
    setEditingPoliza(null);
    // Recargar la lista de pólizas con los filtros y paginación actuales
    fetchPoliciesData(
      (polizaCurrentPage - 1) * POLIZAS_PER_PAGE,
      POLIZAS_PER_PAGE,
      polizaSearchTerm,
      polizaTipoFilter,
      polizaEstadoFilter,
      polizaClienteIdFilter,
      polizaFechaInicioFilter,
      polizaFechaFinFilter
    );
    fetchStatisticsSummaryData(); // Recargar estadísticas del dashboard
    fetchUpcomingPoliciesData(); // Recargar pólizas próximas a vencer
    fetchClaimsData((reclamacionCurrentPage - 1) * RECLAMACIONES_PER_PAGE, RECLAMACIONES_PER_PAGE, reclamacionSearchTerm, reclamacionEstadoFilter, reclamacionPolizaIdFilter, reclamacionFechaReclamacionInicioFilter, reclamacionFechaReclamacionFinFilter); // Recargar reclamaciones por si las pólizas cambiaron
  }, [polizaCurrentPage, polizaSearchTerm, polizaTipoFilter, polizaEstadoFilter, polizaClienteIdFilter, polizaFechaInicioFilter, polizaFechaFinFilter, fetchPoliciesData, fetchStatisticsSummaryData, fetchUpcomingPoliciesData, fetchClaimsData, reclamacionCurrentPage, reclamacionSearchTerm, reclamacionEstadoFilter, reclamacionPolizaIdFilter, reclamacionFechaReclamacionInicioFilter, reclamacionFechaReclamacionFinFilter]);

  const handlePolizaDelete = useCallback(async (id) => {
    try {
      // ¡CRÍTICO! La ruta correcta es /polizas/polizas/{id}
      const response = await fetch(`${API_BASE_URL}/polizas/polizas/${id}`, { 
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }, // Usar token del estado
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Error desconocido en el servidor.' }));
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }
      toast({ title: "Póliza Eliminada", description: "La póliza ha sido eliminada con éxito.", variant: "success" });
      // Recargar la lista de pólizas con los filtros y paginación actuales
      fetchPoliciesData(
        (polizaCurrentPage - 1) * POLIZAS_PER_PAGE,
        POLIZAS_PER_PAGE,
        polizaSearchTerm,
        polizaTipoFilter,
        polizaEstadoFilter,
        polizaClienteIdFilter,
        polizaFechaInicioFilter,
        polizaFechaFinFilter
      );
      fetchStatisticsSummaryData(); // Recargar estadísticas del dashboard
      fetchUpcomingPoliciesData(); // Recargar pólizas próximas a vencer
      fetchClaimsData((reclamacionCurrentPage - 1) * RECLAMACIONES_PER_PAGE, RECLAMACIONES_PER_PAGE, reclamacionSearchTerm, reclamacionEstadoFilter, reclamacionPolizaIdFilter, reclamacionFechaReclamacionInicioFilter, reclamacionFechaReclamacionFinFilter); // Recargar reclamaciones por si las pólizas cambiaron
    } catch (error) {
      console.error("Error al eliminar póliza:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  }, [API_BASE_URL, token, polizaCurrentPage, polizaSearchTerm, polizaTipoFilter, polizaEstadoFilter, polizaClienteIdFilter, polizaFechaInicioFilter, polizaFechaFinFilter, fetchPoliciesData, fetchStatisticsSummaryData, fetchUpcomingPoliciesData, fetchClaimsData, reclamacionCurrentPage, reclamacionSearchTerm, reclamacionEstadoFilter, reclamacionPolizaIdFilter, reclamacionFechaReclamacionInicioFilter, reclamacionFechaReclamacionFinFilter, toast]);

  // Paginación y búsqueda/filtros para Reclamaciones
  const handleReclamacionPageChange = useCallback((page) => {
    setReclamacionCurrentPage(page);
  }, []);
  const handleReclamacionSearch = useCallback((searchTerm, estadoFilter, clienteIdFilter, polizaIdFilter, fechaReclamacionInicioFilter, fechaReclamacionFinFilter) => {
    setReclamacionSearchTerm(searchTerm);
    setReclamacionEstadoFilter(estadoFilter);
    setReclamacionClienteIdFilter(clienteIdFilter);
    setReclamacionPolizaIdFilter(polizaIdFilter);
    setReclamacionFechaReclamacionInicioFilter(fechaReclamacionInicioFilter);
    setReclamacionFechaReclamacionFinFilter(fechaReclamacionFinFilter);
    setReclamacionCurrentPage(1);
  }, []);
  const handleReclamacionSaved = useCallback(() => {
    setEditingReclamacion(null);
    fetchClaimsData(
      (reclamacionCurrentPage - 1) * RECLAMACIONES_PER_PAGE,
      RECLAMACIONES_PER_PAGE,
      reclamacionSearchTerm,
      reclamacionEstadoFilter,
      reclamacionPolizaIdFilter,
      reclamacionFechaReclamacionInicioFilter,
      reclamacionFechaReclamacionFinFilter
    );
    fetchStatisticsSummaryData();
  }, [reclamacionCurrentPage, reclamacionSearchTerm, reclamacionEstadoFilter, reclamacionPolizaIdFilter, reclamacionFechaReclamacionInicioFilter, reclamacionFechaReclamacionFinFilter, fetchClaimsData, fetchStatisticsSummaryData]);

  const handleReclamacionDelete = useCallback(async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/reclamaciones/${id}`, { // URL corregida
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }, // Usar token del estado
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Error desconocido en el servidor.' }));
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }
      toast({ title: "Reclamación Eliminada", description: "La reclamación ha sido eliminada con éxito.", "variant": "success" });
      fetchClaimsData(
        (reclamacionCurrentPage - 1) * RECLAMACIONES_PER_PAGE,
        RECLAMACIONES_PER_PAGE,
        reclamacionSearchTerm,
        reclamacionEstadoFilter,
        reclamacionPolizaIdFilter,
        reclamacionFechaReclamacionInicioFilter,
        reclamacionFechaReclamacionFinFilter
      );
      fetchStatisticsSummaryData();
    } catch (error) {
      console.error("Error al eliminar reclamación:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  }, [API_BASE_URL, token, reclamacionCurrentPage, reclamacionSearchTerm, reclamacionEstadoFilter, reclamacionPolizaIdFilter, reclamacionFechaReclamacionInicioFilter, reclamacionFechaReclamacionFinFilter, fetchClaimsData, fetchStatisticsSummaryData, toast]);

  // Paginación de Empresas Aseguradoras
  const handleEmpresaAseguradoraPageChange = useCallback((page) => {
    setEmpresaAseguradoraCurrentPage(page);
  }, []);
  const handleEmpresaAseguradoraSearch = useCallback((searchTerm) => {
    setEmpresaAseguradoraSearchTerm(searchTerm);
    setEmpresaAseguradoraCurrentPage(1);
  }, []);
  const handleEmpresaAseguradoraSaved = useCallback(() => {
    console.log("DEBUG: handleEmpresaAseguradoraSaved - Empresa guardada, intentando recargar lista de empresas y otras dependencias.");
    setEditingEmpresaAseguradora(null);
    
    // Forzar la recarga de la página 1 sin término de búsqueda para ver el nuevo registro
    fetchEmpresasAseguradoras(0, EMPRESAS_ASEGURADORAS_PER_PAGE, ''); // Recargar la primera página sin búsqueda
    
    fetchStatisticsSummaryData();
    fetchPoliciesData((polizaCurrentPage - 1) * POLIZAS_PER_PAGE, POLIZAS_PER_PAGE, polizaSearchTerm, polizaTipoFilter, polizaEstadoFilter, polizaClienteIdFilter, polizaFechaInicioFilter, polizaFechaFinFilter);
    fetchAdvisorsData((asesorCurrentPage - 1) * ASESORES_PER_PAGE, ASESORES_PER_PAGE, asesorSearchTerm);
  }, [fetchEmpresasAseguradoras, fetchStatisticsSummaryData, fetchPoliciesData, polizaCurrentPage, polizaSearchTerm, polizaTipoFilter, polizaEstadoFilter, polizaClienteIdFilter, polizaFechaInicioFilter, polizaFechaFinFilter, fetchAdvisorsData, asesorCurrentPage, asesorSearchTerm, setEditingEmpresaAseguradora]);

  const handleEmpresaAseguradoraDelete = useCallback(async (id) => {
    console.log(`handleEmpresaAseguradoraDelete: Intentando eliminar empresa con ID: ${id}`);
    try {
      // ¡CRÍTICO! URL corregida para eliminar empresas aseguradoras
      const response = await fetch(`${API_BASE_URL}/empresas_aseguradoras/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }, // Usar token del estado
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Error desconocido en el servidor.' }));
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }
      toast({ title: "Empresa Eliminada", description: "La empresa aseguradora ha sido eliminada con éxito.", variant: "success" });
      console.log("handleEmpresaAseguradoraDelete: Empresa eliminada exitosamente en backend. Recargando lista.");
      fetchEmpresasAseguradoras(
        (empresaAseguradoraCurrentPage - 1) * EMPRESAS_ASEGURADORAS_PER_PAGE,
        EMPRESAS_ASEGURADORAS_PER_PAGE,
        empresaAseguradoraSearchTerm
      );
      fetchStatisticsSummaryData();
      fetchPoliciesData((polizaCurrentPage - 1) * POLIZAS_PER_PAGE, POLIZAS_PER_PAGE, polizaSearchTerm, polizaTipoFilter, polizaEstadoFilter, polizaClienteIdFilter, polizaFechaInicioFilter, polizaFechaFinFilter);
      fetchAdvisorsData((asesorCurrentPage - 1) * ASESORES_PER_PAGE, ASESORES_PER_PAGE, asesorSearchTerm);
    } catch (error) {
      console.error("Error al eliminar empresa aseguradora:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  }, [API_BASE_URL, token, empresaAseguradoraCurrentPage, empresaAseguradoraSearchTerm, fetchEmpresasAseguradoras, fetchStatisticsSummaryData, fetchPoliciesData, polizaCurrentPage, polizaSearchTerm, polizaTipoFilter, polizaEstadoFilter, polizaClienteIdFilter, polizaFechaInicioFilter, polizaFechaFinFilter, fetchAdvisorsData, asesorCurrentPage, asesorSearchTerm, toast]);


  // Paginación de Asesores
  const handleAsesorPageChange = useCallback((page) => {
    setAsesorCurrentPage(page);
  }, []);
  const handleAsesorSearch = useCallback((searchTerm) => {
    setAsesorSearchTerm(searchTerm);
    setAsesorCurrentPage(1);
  }, []);
  const handleAsesorSaved = useCallback(() => {
    setEditingAsesor(null);
    fetchAdvisorsData(
      (asesorCurrentPage - 1) * ASESORES_PER_PAGE,
      ASESORES_PER_PAGE,
      asesorSearchTerm
    );
    fetchStatisticsSummaryData();
    fetchPoliciesData((polizaCurrentPage - 1) * POLIZAS_PER_PAGE, POLIZAS_PER_PAGE, polizaSearchTerm, polizaTipoFilter, polizaEstadoFilter, polizaClienteIdFilter, polizaFechaInicioFilter, polizaFechaFinFilter);
  }, [asesorCurrentPage, asesorSearchTerm, fetchAdvisorsData, fetchStatisticsSummaryData, fetchPoliciesData, polizaCurrentPage, polizaSearchTerm, polizaTipoFilter, polizaEstadoFilter, polizaClienteIdFilter, polizaFechaInicioFilter, polizaFechaFinFilter]);

  const handleAsesorDelete = useCallback(async (id) => {
    try {
      // ¡CRÍTICO! URL corregida para eliminar asesores
      const response = await fetch(`${API_BASE_URL}/asesores/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }, // Usar token del estado
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Error desconocido en el servidor.' }));
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }
      toast({ title: "Asesor Eliminado", description: "El asesor ha sido eliminado con éxito.", variant: "success" });
      fetchAdvisorsData(
        (asesorCurrentPage - 1) * ASESORES_PER_PAGE,
        ASESORES_PER_PAGE,
        asesorSearchTerm
      );
      fetchStatisticsSummaryData();
      fetchPoliciesData((polizaCurrentPage - 1) * POLIZAS_PER_PAGE, POLIZAS_PER_PAGE, polizaSearchTerm, polizaTipoFilter, polizaEstadoFilter, polizaClienteIdFilter, polizaFechaInicioFilter, polizaFechaFinFilter);
    } catch (error) {
      console.error("Error al eliminar asesor:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  }, [API_BASE_URL, token, asesorCurrentPage, asesorSearchTerm, fetchAdvisorsData, fetchStatisticsSummaryData, fetchPoliciesData, polizaCurrentPage, polizaSearchTerm, polizaTipoFilter, polizaEstadoFilter, polizaClienteIdFilter, polizaFechaInicioFilter, polizaFechaFinFilter, toast]);

  // Paginación y filtros para Comisiones
  const handleComisionPageChange = useCallback((page) => {
    setComisionCurrentPage(page);
  }, []);

  const handleComisionSearch = useCallback((asesorId, estadoPago, fechaInicio, fechaFin) => {
    setComisionAsesorIdFilter(asesorId);
    setComisionEstadoPagoFilter(estadoPago);
    setComisionFechaInicioFilter(fechaInicio);
    setComisionFechaFinFilter(fechaFin);
    setComisionCurrentPage(1); // Resetear a la primera página al aplicar nuevos filtros
  }, []);

  const handleComisionSaved = useCallback(() => {
    setEditingComision(null); // Limpiar el estado de edición
    fetchCommissionsData(
      (comisionCurrentPage - 1) * COMISIONES_PER_PAGE,
      COMISIONES_PER_PAGE,
      comisionAsesorIdFilter,
      comisionEstadoPagoFilter,
      comisionFechaInicioFilter,
      comisionFechaFinFilter
    );
    fetchStatisticsSummaryData();
  }, [comisionCurrentPage, comisionAsesorIdFilter, comisionEstadoPagoFilter, comisionFechaInicioFilter, comisionFechaFinFilter, fetchCommissionsData, fetchStatisticsSummaryData]);


  // Función para eliminar una comisión (si es necesario)
  const handleComisionDelete = useCallback(async (id) => {
    try {
      // ¡CRÍTICO! La URL correcta para comisiones es /comisiones/comisiones/{id}
      const response = await fetch(`${API_BASE_URL}/comisiones/comisiones/${id}`, { 
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }, // Usar token del estado
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Error desconocido en el servidor.' }));
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }
      toast({ title: "Comisión Eliminada", description: "La comisión ha sido eliminada con éxito.", variant: "success" });
      fetchCommissionsData(
        (comisionCurrentPage - 1) * COMISIONES_PER_PAGE,
        COMISIONES_PER_PAGE,
        comisionAsesorIdFilter,
        comisionEstadoPagoFilter,
        comisionFechaInicioFilter,
        comisionFechaFinFilter
      );
      fetchStatisticsSummaryData();
    } catch (error) {
      console.error("Error al eliminar comisión:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  }, [API_BASE_URL, token, comisionCurrentPage, comisionAsesorIdFilter, comisionEstadoPagoFilter, comisionFechaInicioFilter, comisionFechaFinFilter, fetchCommissionsData, fetchStatisticsSummaryData, toast]);


  // Función auxiliar para obtener las opciones de formato de fecha para toLocaleDateString
  const getDateFormatOptions = useCallback((format) => {
    switch (format) {
      case 'dd/MM/yyyy': // Formato para date-fns
        return { day: '2-digit', month: '2-digit', year: 'numeric' };
      case 'MM/dd/yyyy': // Formato para date-fns
        return { month: '2-digit', day: '2-digit', year: 'numeric' };
      case 'yyyy-MM-dd': // Formato para date-fns
        return { year: 'numeric', month: '2-digit', day: '2-digit' };
      default:
        return { day: '2-digit', month: '2-digit', year: 'numeric' };
    }
  }, []);

  // Función genérica para exportar a CSV
  const exportToCsv = useCallback((data, filename, headers) => {
    if (!data || data.length === 0) {
      toast({
        title: "No hay datos para exportar",
        description: "La tabla está vacía, no hay datos para generar el CSV.",
        variant: "warning",
      });
      return;
    }

    const csvHeaders = headers.map(h => h.label).join(',');

    const getNestedValue = (obj, path) => {
      return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined) ? acc[part] : null, obj);
    };

    const csvRows = data.map(row => {
      return headers.map(header => {
        let value = getNestedValue(row, header.key);
        // Asegurarse de que las fechas se formateen correctamente para CSV
        if (header.type === 'date' && value) {
            // Usar el formato de fecha configurado globalmente
            value = new Date(value).toLocaleDateString(selectedLanguage === 'en' ? 'en-US' : 'es-ES', getDateFormatOptions(dateFormat));
        }
        // Si el header tiene un formatter, aplicarlo
        if (header.formatter) {
          value = header.formatter(value);
        }
        return `"${String(value || '').replace(/"/g, '""')}"`;
      }).join(',');
    });

    const csvContent = [csvHeaders, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}.csv`);

    toast({
      title: "Exportación a CSV",
      description: `Los datos de ${filename} han sido exportados con éxito.`,
      variant: "success",
    });
  }, [toast, dateFormat, selectedLanguage, getDateFormatOptions]);

  // Función genérica para exportar a PDF
  const exportToPdf = useCallback((data, filename, headers, title) => {
    if (!data || data.length === 0) {
      toast({
        title: "No hay datos para exportar",
        description: "La tabla está vacía, no hay datos para generar el PDF.",
        variant: "warning",
      });
      return;
    }

    const doc = new jsPDF();
    
    // Título del documento
    doc.setFontSize(18);
    doc.text(title, 14, 22);

    const tableColumn = headers.map(h => h.label);
    const tableRows = [];

    data.forEach(item => {
      const rowData = headers.map(header => {
        // Manejar rutas anidadas para obtener valores
        let value = header.key.split('.').reduce((o, i) => (o ? o[i] : ''), item);

        if (header.type === 'date' && value) {
          // Usar el formato de fecha configurado globalmente
          value = new Date(value).toLocaleDateString(selectedLanguage === 'en' ? 'en-US' : 'es-ES', getDateFormatOptions(dateFormat));
        }
        // Si el header tiene un formatter, aplicarlo
        if (header.formatter) {
          value = header.formatter(value);
        }
        return String(value || '');
      });
      tableRows.push(rowData);
    });

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 30,
        styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        tableWidth: 'auto',
        margin: { left: 10, right: 10 },
    });
    doc.save(`${filename}.pdf`);

    toast({
      title: "Exportación a PDF",
      description: `Los datos de ${filename} han sido exportados con éxito.`,
      variant: "success",
    });
  }, [toast, dateFormat, selectedLanguage, getDateFormatOptions]);


  if (!token || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
        <div className="bg-gradient-to-br from-blue-700 to-indigo-800 text-white p-8 rounded-lg shadow-xl w-full max-w-md transform transition duration-300 hover:scale-[1.01]">
          <h2 className="text-2xl font-bold text-center mb-6 text-white">
            {showRegisterForm ? "Gestión Vital - Regístrate" : "Gestión Vital - Inicia Sesión"}
          </h2>

          {showRegisterForm ? (
            <RegisterForm
            setToken={setToken}
            setCurrentUser={setCurrentUser}
            setShowRegister={setShowRegisterForm}
            API_URL={API_BASE_URL}
            setActiveTab={setActiveTab}
          />
          ) : (
            <LoginForm
            setToken={setToken}
            setCurrentUser={setCurrentUser}
            onLoginSuccess={handleLogin}
            API_URL={API_BASE_URL}
          />
          )}

          <div className="text-center mt-4">
            <p className="text-gray-200">
              {showRegisterForm ? '¿Ya tienes una cuenta?' : '¿No tienes una cuenta?'}
              {' '}
              <button
                type="button" // Asegúrate de que sea un botón para evitar submits
                onClick={() => setShowRegisterForm(!showRegisterForm)}
                className="px-0 py-0 h-auto text-blue-300 hover:text-blue-100 underline" // Añadido underline para simular link
              >
                {showRegisterForm ? 'Inicia Sesión' : 'Regístrate'}
              </button>
            </p>
          </div>
        </div>
        <Toaster theme="dark" />
      </div>
    );
  }
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        <p className="ml-4 text-white text-lg">Cargando aplicación...</p>
      </div>
    );
  }

  return (
    // ¡CRÍTICO! Mueve ToastProvider para que envuelva TODO el contenido de la aplicación
    <ToastProvider>
      <ConfirmationProvider>
        {token ? (
          <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
            {/* Barra de Navegación Superior */}
            <Navbar
              currentUser={currentUser}
              setToken={setToken}
              setCurrentUser={setCurrentUser}
              currentPage={activeTab}
              onPageChange={setActiveTab}
            />
            {/* Mensaje de Bienvenida en la parte superior derecha del contenido */}
            {currentUser && (
              <div className="text-right px-8 pt-4 pb-2">
                <span className="text-xl font-semibold text-gray-700">
                  Bienvenido, <span className="font-bold text-blue-800">{currentUser.username}</span>
                </span>
              </div>
            )}
            
            {/* Notificación de error de licencia (si aplica) */}
            {licenseStatus && licenseStatus.is_license_active === false && licenseStatus.is_trial_active === false && (
              <div className="fixed bottom-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg flex items-center space-x-3 z-50">
                <XCircle className="h-6 w-6" />
                <div>
                  <h3 className="font-bold text-lg">Error de Licencia</h3>
                  <p>No se pudo obtener el estado de la licencia: {licenseStatus.message}.</p>
                  <p>Por favor, activa tu licencia en Configuración.</p>
                </div>
              </div>
            )}

            {/* Contenido Principal - envuelto en <main> */}
            <main className="flex-1 p-8">
              {activeTab === 'dashboard' && (
                <Dashboard
                  statistics={statisticsSummaryData}
                  upcomingPolicies={polizasProximasAVencer}
                  isLoadingStats={isLoadingStatisticsSummary}
                  isLoadingUpcoming={isLoadingPolizasProximasAVencer}
                  currencySymbol={currencySymbol}
                  dateFormat={dateFormat}
                  getDateFormatOptions={getDateFormatOptions}
                />
              )}

              {activeTab === 'clientes' && (
                <div className="container mx-auto px-4 py-8">
                  <h2 className="text-3xl font-bold text-gray-800 mb-6">Gestión de Clientes</h2>
                  <ClientPage
                    onClientSaved={handleClientSaved}
                    editingClient={editingClient}
                    setEditingClient={setEditingClient}
                    API_URL={API_BASE_URL}
                    isAuthLoading={isAuthLoading} // Pasar isAuthLoading
                  />
                  <ClienteImport
                    onImportComplete={() => handleClientSaved()}
                    API_URL={API_BASE_URL}
                  />
                  <ClientList
                    clients={clientes}
                    onEditClient={setEditingClient}
                    onDeleteClient={handleClientDelete}
                    searchTerm={clienteSearchTerm}
                    emailFilter={clienteEmailFilter}
                    setSearchTerm={setClienteSearchTerm}
                    setEmailFilter={setClienteEmailFilter}
                    onSearch={handleClienteSearch}
                    currentPage={clienteCurrentPage}
                    itemsPerPage={CLIENTES_PER_PAGE}
                    totalItems={totalClients}
                    onPageChange={handleClientePageChange}
                    onExport={exportToCsv}
                    onExportPdf={exportToPdf}
                    dateFormat={dateFormat}
                    getDateFormatOptions={getDateFormatOptions}
                  />
                </div>
              )}

              {activeTab === 'polizas' && (
                <div className="container mx-auto px-4 py-8">
                  <h2 className="text-3xl font-bold text-gray-800 mb-6">Gestión de Pólizas</h2>
                  <PolizaPage
                    onPolizaSaved={handlePolizaSaved}
                    editingPoliza={editingPoliza}
                    setEditingPoliza={setEditingPoliza}
                    clientes={clientes}
                    empresasAseguradoras={empresasAseguradoras}
                    asesores={asesores}
                    isLoadingClients={isLoadingClients}
                    isLoadingCompanies={isLoadingCompanies}
                    isLoadingAdvisors={isLoadingAdvisors}
                    API_URL={API_BASE_URL}
                    isAuthLoading={isAuthLoading} // Pasar isAuthLoading
                  />
                  <PolizaList
                    polizas={polizas}
                    onEditPoliza={setEditingPoliza}
                    onDeletePoliza={handlePolizaDelete}
                    searchTerm={polizaSearchTerm}
                    tipoFilter={polizaTipoFilter}
                    estadoFilter={polizaEstadoFilter}
                    clienteIdFilter={polizaClienteIdFilter}
                    fechaInicioFilter={polizaFechaInicioFilter}
                    fechaFinFilter={polizaFechaFinFilter}
                    setSearchTerm={setPolizaSearchTerm}
                    setTipoFilter={setPolizaTipoFilter}
                    setEstadoFilter={setPolizaEstadoFilter}
                    setClienteIdFilter={setPolizaClienteIdFilter}
                    setFechaInicioFilter={setPolizaFechaInicioFilter}
                    setFechaFinFilter={setPolizaFechaFinFilter}
                    onSearch={handlePolizaSearch}
                    currentPage={polizaCurrentPage}
                    itemsPerPage={POLIZAS_PER_PAGE}
                    totalItems={totalPolizas}
                    onPageChange={handlePolizaPageChange}
                    onExport={exportToCsv}
                    onExportPdf={exportToPdf}
                    clients={clientes}
                    currencySymbol={currencySymbol}
                    dateFormat={dateFormat}
                    getDateFormatOptions={getDateFormatOptions}
                  />
                </div>
              )}

              {activeTab === 'reclamaciones' && (
                <div className="container mx-auto px-4 py-8">
                  <h2 className="text-3xl font-bold text-gray-800 mb-6">Gestión de Reclamaciones</h2>
                  <ReclamacionesPage
                    onReclamacionSaved={handleReclamacionSaved}
                    editingReclamacion={editingReclamacion}
                    setEditingReclamacion={setEditingReclamacion}
                    polizas={polizas}
                    clientes={clientes}
                    isLoadingPolicies={isLoadingPolicies}
                    isLoadingClients={isLoadingClients}
                    API_URL={API_BASE_URL}
                    isAuthLoading={isAuthLoading} // Pasar isAuthLoading
                    token={token}
                  />
                  <ReclamacionList
                    reclamaciones={reclamaciones}
                    onEditReclamacion={setEditingReclamacion}
                    onDeleteReclamacion={handleReclamacionDelete}
                    searchTerm={reclamacionSearchTerm}
                    estadoFilter={reclamacionEstadoFilter}
                    clienteIdFilter={reclamacionClienteIdFilter}
                    polizaIdFilter={reclamacionPolizaIdFilter}
                    fechaReclamacionInicioFilter={reclamacionFechaReclamacionInicioFilter}
                    fechaReclamacionFinFilter={reclamacionFechaReclamacionFinFilter}
                    setSearchTerm={setReclamacionSearchTerm}
                    setEstadoFilter={setReclamacionEstadoFilter}
                    setClienteIdFilter={setReclamacionClienteIdFilter}
                    setPolizaIdFilter={setReclamacionPolizaIdFilter}
                    setFechaReclamacionInicioFilter={setReclamacionFechaReclamacionInicioFilter}
                    setFechaReclamacionFinFilter={setReclamacionFechaReclamacionFinFilter}
                    onSearch={handleReclamacionSearch}
                    currentPage={reclamacionCurrentPage}
                    itemsPerPage={RECLAMACIONES_PER_PAGE}
                    totalItems={totalReclamaciones}
                    onPageChange={handleReclamacionPageChange}
                    onExport={exportToCsv}
                    onExportPdf={exportToPdf}
                    clients={clientes}
                    polizas={polizas}
                    isLoadingPolicies={isLoadingPolicies}
                    isLoadingClients={isLoadingClients}
                    isLoadingReclamaciones={isLoadingReclamaciones}
                    currencySymbol={currencySymbol}
                    dateFormat={dateFormat}
                    getDateFormatOptions={getDateFormatOptions}
                  />
                </div>
              )}

              {activeTab === 'empresas_aseguradoras' && (
                <EmpresasAseguradorasPage
                  key={empresasAseguradoras.length > 0 ? 'empresas-loaded' : 'empresas-empty'}
                  API_URL={API_BASE_URL}
                  token={token}
                  empresas={empresasAseguradoras}
                  currentPage={empresaAseguradoraCurrentPage}
                  itemsPerPage={EMPRESAS_ASEGURADORAS_PER_PAGE}
                  totalItems={totalEmpresasAseguradoras}
                  onPageChange={handleEmpresaAseguradoraPageChange}
                  searchTerm={empresaAseguradoraSearchTerm}
                  setSearchTerm={setEmpresaAseguradoraSearchTerm}
                  onSearch={handleEmpresaAseguradoraSearch}
                  onExport={exportToCsv}
                  onExportPdf={exportToPdf}
                  dateFormat={dateFormat}
                  getDateFormatOptions={getDateFormatOptions}
                  onEmpresaAseguradoraSaved={handleEmpresaAseguradoraSaved}
                  editingEmpresaAseguradora={editingEmpresaAseguradora}
                  setEditingEmpresaAseguradora={setEditingEmpresaAseguradora}
                  isAuthLoading={isAuthLoading}
                />
              )}

              {activeTab === 'asesores' && (
                <div className="container mx-auto px-4 py-8">
                  <h2 className="text-3xl font-bold text-gray-800 mb-6">Gestión de Asesores</h2>
                  <AsesoresPage
                    onAsesorSaved={handleAsesorSaved}
                    editingAsesor={editingAsesor}
                    setEditingAsesor={setEditingAsesor}
                    empresasAseguradoras={empresasAseguradoras}
                    isLoadingCompanies={isLoadingCompanies}
                    API_URL={API_BASE_URL}
                    isAuthLoading={isAuthLoading}
                  >
                    {/* Pasar AsesorList como children */}
                    <AsesorList
                      asesores={asesores}
                      onEditAsesor={setEditingAsesor}
                      onDeleteAsesor={handleAsesorDelete}
                      currentPage={asesorCurrentPage}
                      itemsPerPage={ASESORES_PER_PAGE}
                      totalItems={totalAsesores}
                      onPageChange={handleAsesorPageChange}
                      searchTerm={asesorSearchTerm}
                      setSearchTerm={setAsesorSearchTerm}
                      onSearch={handleAsesorSearch}
                      onExport={exportToCsv}
                      onExportPdf={exportToPdf}
                      dateFormat={dateFormat}
                      getDateFormatOptions={getDateFormatOptions}
                    />
                  </AsesoresPage>
                </div>
              )}

              {activeTab === 'comisiones' && (
                <div className="container mx-auto px-4 py-8">
                  <h2 className="text-3xl font-bold text-gray-800 mb-6">Gestión de Comisiones</h2>
                  <ComisionesPage
                    onComisionSaved={handleComisionSaved}
                    editingComision={editingComision}
                    setEditingComision={setEditingComision}
                    asesores={asesores}
                    polizas={polizas}
                    isLoadingAdvisors={isLoadingAdvisors}
                    isLoadingPolicies={isLoadingPolicies}
                    API_URL={API_BASE_URL}
                    isAuthLoading={isAuthLoading}
                    token={token}
                  />
                  <ComisionList
                    comisiones={comisiones}
                    asesores={asesores}
                    polizas={polizas}
                    onDeleteComision={handleComisionDelete}
                    onSearch={handleComisionSearch}
                    currentPage={comisionCurrentPage}
                    itemsPerPage={COMISIONES_PER_PAGE}
                    totalItems={totalComisiones}
                    onPageChange={handleComisionPageChange}
                    isLoadingComisiones={isLoadingComisiones}
                    isLoadingAdvisors={isLoadingAdvisors}
                    isLoadingPolicies={isLoadingPolicies}
                    currencySymbol={currencySymbol}
                    dateFormat={dateFormat}
                    getDateFormatOptions={getDateFormatOptions}
                    onExport={exportToCsv}
                    onExportPdf={exportToPdf}
                    asesorIdFilter={comisionAsesorIdFilter}
                    estadoPagoFilter={comisionEstadoPagoFilter}
                    fechaInicioFilter={comisionFechaInicioFilter}
                    fechaFinFilter={comisionFechaFinFilter}
                    setAsesorIdFilter={setComisionAsesorIdFilter}
                    setEstadoPagoFilter={setComisionEstadoPagoFilter}
                    setFechaInicioFilter={setComisionFechaInicioFilter}
                    setFechaFinFilter={setComisionFechaFinFilter}
                    API_URL={API_BASE_URL}
                  />
                </div>
              )}

              {activeTab === 'configuracion' && (
                <div className="container mx-auto px-4 py-8">
                  <h2 className="text-3xl font-bold text-gray-800 mb-6">Configuración de la Aplicación</h2>
                  <SettingsPage
                    selectedLanguage={selectedLanguage}
                    currencySymbol={currencySymbol}
                    dateFormat={dateFormat}
                    selectedCountry={selectedCountry}
                    licenseKey={licenseKey}
                    isLicenseValid={licenseStatus.is_license_active || licenseStatus.is_trial_active}
                    setSelectedLanguage={setSelectedLanguage}
                    setCurrencySymbol={setCurrencySymbol}
                    setDateFormat={setDateFormat}
                    setSelectedCountry={setSelectedCountry}
                    setLicenseKey={setLicenseKey}
                    onSaveSettings={saveSettings}
                    languageOptions={LANGUAGE_OPTIONS}
                    currencyOptions={CURRENCY_SYMBOL_OPTIONS}
                    dateFormatOptions={DATE_FORMAT_OPTIONS}
                    countryOptions={COUNTRY_OPTIONS}
                    masterLicenseKey={MASTER_LICENSE_KEY}
                    licenseStatus={licenseStatus}
                    isLoadingLicense={isLoadingLicense}
                    onActivateLicense={handleActivateLicense}
                  />
                </div>
              )}
            </main>
          </div>
        ) : ( // Si no hay token, mostrar la página de login
          <LoginForm onLoginSuccess={handleLogin} API_BASE_URL={API_BASE_URL} />
        )}
      </ConfirmationProvider>
      {/* ¡CRÍTICO! Mueve Toaster aquí, dentro de ToastProvider */}
      <Toaster theme="dark" />
    </ToastProvider>
  );
}

export default App;
