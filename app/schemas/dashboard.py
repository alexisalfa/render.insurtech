# app/schemas/dashboard.py

from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import datetime

# Importa los esquemas de modelos necesarios para PolizaProximaAVencer
# Asegúrate de que ClienteRead y AsesorRead existan y sean importables desde app.models
from app.models.cliente import ClienteRead
from app.models.asesor import AsesorRead
from app.models.empresa_aseguradora import EmpresaAseguradoraRead
from app.models.poliza import EstadoPoliza, TipoPoliza # Para asegurar que los Enums están disponibles

# Esquema para las pólizas próximas a vencer
class PolizaProximaAVencer(BaseModel):
    id: int
    numero_poliza: str
    tipo_poliza: TipoPoliza # Usar el Enum
    fecha_inicio: datetime
    fecha_fin: datetime
    monto_asegurado: float
    prima: float
    estado: EstadoPoliza # Usar el Enum
    cliente_id: Optional[int] = None
    asesor_id: Optional[int] = None
    empresa_aseguradora_id: Optional[int] = None
    # Incluir los datos básicos de las relaciones si se cargan en el endpoint
    cliente: Optional[ClienteRead] = None
    asesor: Optional[AsesorRead] = None # CAMBIO: asesor_obj a asesor
    empresa_aseguradora: Optional[EmpresaAseguradoraRead] = None

    class Config:
        from_attributes = True # Permite la creación desde instancias ORM

# Esquema para el resumen de estadísticas del dashboard
class StatisticsSummary(BaseModel):
    total_clientes: int
    total_polizas: int
    total_reclamaciones: int
    total_empresas_aseguradoras: int
    total_asesores: int
    total_comisiones: float
    polizas_por_estado: Dict[str, int] # Ejemplo: {"Activa": 10, "Vencida": 5}
    reclamaciones_por_estado: Dict[str, int] # Ejemplo: {"Pendiente": 3, "Aprobada": 7}
    total_primas_activas: float
    total_monto_reclamado: float
    total_monto_aprobado: float
    # Puedes añadir más campos si tu dashboard los necesita
    # polizas_proximas_a_vencer: List[PolizaProximaAVencer] # Si decides incluir esto aquí
