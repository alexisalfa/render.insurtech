// src/components/Dashboard.jsx
import React, { useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line
} from 'recharts';

// Importar íconos de Lucide React, que ya estabas usando y encajan perfecto
import {
  Users,
  FileText,
  ClipboardList,
  Building,
  UserCheck,
  DollarSign,
  CheckCircle,
  Clock,
  CalendarDays,
  Loader2,
  AlertCircle,
  TrendingUp, // Ícono para tendencia
} from 'lucide-react';

// Colores consistentes para los gráficos, adaptados al nuevo tema oscuro
const CHART_COLORS = ['#06B6D4', '#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444', '#EC4899', '#6B7280'];

/**
 * Componente de tarjeta de estadística modernizado.
 * @param {object} props - Propiedades del componente.
 * @param {React.ReactNode} props.icon - El ícono a mostrar.
 * @param {string} props.title - El título de la tarjeta.
 * @param {string|number} props.value - El valor a mostrar.
 * @param {string} props.description - Texto descriptivo opcional.
 * @param {string} [props.className] - Clases adicionales para estilizar.
 */
const StatCard = ({ icon, title, value, description, className = '' }) => (
  <div className={`rounded-2xl p-[1px] bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 shadow-lg hover:shadow-cyan-400/30 transition-shadow duration-300 ${className}`}>
    <div className="bg-slate-900/70 backdrop-blur-md rounded-2xl h-full flex flex-col justify-between p-5">
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium text-gray-300">{title}</p>
        <div className="text-cyan-400">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-4xl font-bold text-white mt-2">{value}</p>
        {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
      </div>
    </div>
  </div>
);


/**
 * Componente del Dashboard que muestra un resumen de las estadísticas de la aplicación con un diseño moderno.
 *
 * @param {object|null} props.statistics - Objeto completo de estadísticas del backend.
 * @param {Array<Object>} props.upcomingPolicies - Lista de pólizas próximas a vencer.
 * @param {boolean} props.isLoadingStats - Indica si las estadísticas están cargando.
 * @param {boolean} props.isLoadingUpcoming - Indica si las pólizas próximas a vencer están cargando.
 * @param {string} props.currencySymbol - Símbolo de moneda configurado globalmente.
 * @param {string} props.dateFormat - Formato de fecha configurado globalmente.
 * @param {function} props.getDateFormatOptions - Función para obtener opciones de formato de fecha.
 */
function Dashboard({
  statistics,
  upcomingPolicies,
  isLoadingStats,
  isLoadingUpcoming,
  currencySymbol,
  dateFormat,
  getDateFormatOptions
}) {
  const defaultStats = {
    total_clientes: 0,
    total_polizas: 0,
    total_reclamaciones: 0,
    total_empresas_aseguradoras: 0,
    total_asesores: 0,
    total_comisiones: 0,
    total_primas_activas: 0,
    total_monto_reclamado: 0,
    total_monto_aprobado: 0,
    reclamaciones_pendientes: 0,
    polizas_por_estado: {},
    reclamaciones_por_estado: {},
  };

  const stats = statistics || defaultStats;

  const formatCurrency = useCallback((amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return `${currencySymbol || '$'} 0,00`;
    }
    const formatted = new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    if (currencySymbol && currencySymbol !== 'Bs') {
      return formatted.replace('Bs', currencySymbol);
    }
    return formatted;
  }, [currencySymbol]);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('es-ES', getDateFormatOptions(dateFormat));
  }, [dateFormat, getDateFormatOptions]);

  const polizasPorEstadoData = Object.entries(stats.polizas_por_estado || {}).map(([estado, count]) => ({ name: estado, value: count }));
  const reclamacionesPorEstadoData = Object.entries(stats.reclamaciones_por_estado || {}).map(([estado, count]) => ({ name: estado, value: count }));
  
  const financialData = [
    { name: 'Primas Activas', value: stats.total_primas_activas || 0 },
    { name: 'Monto Reclamado', value: stats.total_monto_reclamado || 0 },
    { name: 'Monto Aprobado', value: stats.total_monto_aprobado || 0 },
  ];
  
  const samplePolicyTrendData = [
    { name: 'Ene', 'Pólizas Creadas': 40 },
    { name: 'Feb', 'Pólizas Creadas': 30 },
    { name: 'Mar', 'Pólizas Creadas': 50 },
    { name: 'Abr', 'Pólizas Creadas': 45 },
    { name: 'May', 'Pólizas Creadas': 60 },
    { name: 'Jun', 'Pólizas Creadas': 55 },
  ];

  if (isLoadingStats) {
    return (
      <div className="flex justify-center items-center h-96 bg-gray-900 rounded-lg">
        <Loader2 className="h-12 w-12 animate-spin text-cyan-400" />
        <p className="text-xl font-semibold text-gray-300 animate-pulse ml-4">Cargando Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-8 bg-gradient-to-br from-gray-900 to-slate-800 text-gray-200 rounded-lg">
      <h1 className="text-4xl font-extrabold text-white text-center mb-6 drop-shadow-lg">Panel de Control de Gestión Vital</h1>

      {statistics && stats.total_clientes === 0 && stats.total_polizas === 0 && (
        <div className="bg-yellow-500/10 border-l-4 border-yellow-400 text-yellow-300 p-4 mb-6 rounded-lg shadow-md" role="alert">
          <p className="font-bold">¡Bienvenido a Gestión Vital!</p>
          <p>Parece que es tu primera vez aquí. Comienza añadiendo clientes, pólizas y asesores para ver tus estadísticas.</p>
        </div>
      )}

      {/* --- NUEVA SECCIÓN DE TARJETAS DE ESTADÍSTICAS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <StatCard icon={<Users size={28} />} title="Total Clientes" value={stats.total_clientes} description="Clientes activos en el sistema" />
        <StatCard icon={<FileText size={28} />} title="Total Pólizas" value={stats.total_polizas} description="Pólizas gestionadas" />
        <StatCard icon={<ClipboardList size={28} />} title="Total Reclamaciones" value={stats.total_reclamaciones} description="Historial de reclamaciones" />
        <StatCard icon={<Building size={28} />} title="Empresas Aseguradoras" value={stats.total_empresas_aseguradoras} description="Compañías asociadas" />
        <StatCard icon={<UserCheck size={28} />} title="Total Asesores" value={stats.total_asesores} description="Asesores en tu equipo" />
        <StatCard icon={<DollarSign size={28} />} title="Prima Total Anual" value={formatCurrency(stats.total_primas_activas)} description="Ingresos por primas activas" />
        <StatCard icon={<CheckCircle size={28} />} title="Monto Aprobado Rec. Anual" value={formatCurrency(stats.total_monto_aprobado)} description="Pagos de reclamaciones aprobadas" />
        <StatCard icon={<Clock size={28} />} title="Reclamaciones Pendientes" value={stats.reclamaciones_pendientes || 0} description="Reclamaciones esperando resolución" />
      </div>

      <Separator className="my-8 bg-gray-700" />

      {/* --- SECCIÓN MODERNIZADA: PÓLIZAS PRÓXIMAS A VENCER --- */}
      <div className="rounded-2xl p-[1px] bg-gradient-to-br from-amber-400 via-orange-500 to-red-600 shadow-lg">
        <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-6">
          <CardHeader className="p-0 flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-2xl font-bold flex items-center gap-2 text-white">
              <CalendarDays className="mr-3 text-amber-400" size={28} />
              Pólizas Próximas a Vencer (30 Días)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 mt-4">
            {isLoadingUpcoming ? (
              <div className="flex justify-center items-center h-24">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                <p className="ml-3 text-gray-300">Cargando pólizas...</p>
              </div>
            ) : upcomingPolicies && upcomingPolicies.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300">Nro. Póliza</TableHead>
                      <TableHead className="text-gray-300">Cliente</TableHead>
                      <TableHead className="text-gray-300">Fecha Fin</TableHead>
                      <TableHead className="text-gray-300 text-right">Días Restantes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingPolicies.map((poliza) => (
                      <TableRow key={poliza.id} className="border-gray-800 hover:bg-slate-800/60 transition-colors">
                        <TableCell className="font-medium text-white">{poliza.numero_poliza}</TableCell>
                        <TableCell className="text-gray-400">{poliza.cliente_obj ? `${poliza.cliente_obj.nombre} ${poliza.cliente_obj.apellido}` : 'N/A'}</TableCell>
                        <TableCell className="text-gray-400">{formatDate(poliza.fecha_fin)}</TableCell>
                        <TableCell className="text-right font-bold text-lg text-amber-400">{poliza.dias_restantes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center text-gray-400 p-4 flex flex-col items-center">
                <AlertCircle className="h-12 w-12 mb-3 text-gray-500" />
                <p className="text-lg font-semibold text-gray-300">No hay pólizas por vencer en 30 días.</p>
                <p className="text-sm">Todo en orden por aquí.</p>
              </div>
            )}
          </CardContent>
        </div>
      </div>

      <Separator className="my-8 bg-gray-700" />

      {/* --- GRÁFICOS MODERNIZADOS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contenedor de Gráfico con el nuevo estilo */}
        <div className="rounded-2xl p-[1px] bg-gradient-to-b from-blue-500 to-slate-800">
          <Card className="bg-slate-900/80 backdrop-blur-md rounded-2xl border-none text-white shadow-xl h-full">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Distribución de Pólizas</CardTitle>
            </CardHeader>
            <CardContent className="h-80 w-full">
              {polizasPorEstadoData.length > 0 && polizasPorEstadoData.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={polizasPorEstadoData} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value" labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                      {polizasPorEstadoData.map((entry, index) => <Cell key={`cell-poliza-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: '1px solid #4B5563', color: '#E5E7EB' }} />
                    <Legend wrapperStyle={{ color: '#E5E7EB' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-gray-500 italic text-center pt-16">No hay datos de pólizas para mostrar.</p>}
            </CardContent>
          </Card>
        </div>

        {/* Contenedor de Gráfico con el nuevo estilo */}
        <div className="rounded-2xl p-[1px] bg-gradient-to-b from-cyan-500 to-slate-800">
          <Card className="bg-slate-900/80 backdrop-blur-md rounded-2xl border-none text-white shadow-xl h-full">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Reclamaciones por Estado</CardTitle>
            </CardHeader>
            <CardContent className="h-80 w-full">
              {reclamacionesPorEstadoData.length > 0 && reclamacionesPorEstadoData.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reclamacionesPorEstadoData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                    <XAxis dataKey="name" tick={{ fill: '#9CA3AF' }} />
                    <YAxis tick={{ fill: '#9CA3AF' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: '1px solid #4B5563' }} cursor={{fill: 'rgba(107, 114, 128, 0.2)'}}/>
                    <Legend wrapperStyle={{ color: '#E5E7EB' }}/>
                    <Bar dataKey="value" fill={CHART_COLORS[0]} name="Cantidad" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-gray-500 italic text-center pt-16">No hay datos de reclamaciones para mostrar.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Gráfico Financiero y de Tendencia */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="rounded-2xl p-[1px] bg-gradient-to-b from-purple-500 to-slate-800">
           <Card className="bg-slate-900/80 backdrop-blur-md rounded-2xl border-none text-white shadow-xl h-full">
             <CardHeader>
               <CardTitle className="text-xl font-bold">Resumen Financiero</CardTitle>
             </CardHeader>
             <CardContent className="h-80 w-full">
               {financialData.some(d => d.value > 0) ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={financialData}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                     <XAxis dataKey="name" tick={{ fill: '#9CA3AF' }} />
                     <YAxis tick={{ fill: '#9CA3AF' }} tickFormatter={(value) => `${currencySymbol}${value/1000}k`} />
                     <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: '1px solid #4B5563' }} formatter={(value) => formatCurrency(value)} />
                     <Legend wrapperStyle={{ color: '#E5E7EB' }}/>
                     <Bar dataKey="value" fill={CHART_COLORS[2]} name="Monto" />
                   </BarChart>
                 </ResponsiveContainer>
               ) : <p className="text-gray-500 italic text-center pt-16">No hay datos financieros para mostrar.</p>}
             </CardContent>
           </Card>
        </div>
        <div className="rounded-2xl p-[1px] bg-gradient-to-b from-red-500 to-slate-800">
           <Card className="bg-slate-900/80 backdrop-blur-md rounded-2xl border-none text-white shadow-xl h-full">
             <CardHeader>
               <CardTitle className="text-xl font-bold">Tendencia de Pólizas (Ejemplo)</CardTitle>
             </CardHeader>
             <CardContent className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={samplePolicyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4B5563"/>
                    <XAxis dataKey="name" tick={{ fill: '#9CA3AF' }} />
                    <YAxis tick={{ fill: '#9CA3AF' }}/>
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: '1px solid #4B5563' }} />
                    <Legend wrapperStyle={{ color: '#E5E7EB' }}/>
                    <Line type="monotone" dataKey="Pólizas Creadas" stroke={CHART_COLORS[3]} strokeWidth={2} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;