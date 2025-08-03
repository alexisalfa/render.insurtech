# app/models/reclamacion.py
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from app.db.database import Base # Importar Base
from datetime import datetime, timezone
import enum
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

# Importar esquemas de modelos relacionados para anidarlos en ReclamacionRead
from app.models.poliza import PolizaRead
from app.models.cliente import ClienteRead

class EstadoReclamacion(str, enum.Enum):
    PENDIENTE = "Pendiente"
    APROBADA = "Aprobada"
    RECHAZADA = "Rechazada"
    EN_PROCESO = "En Proceso" # Asegurarse de que este valor sea consistente con el frontend
    CERRADA = "Cerrada"

class Reclamacion(Base):
    __tablename__ = "reclamaciones"

    id = Column(Integer, primary_key=True, index=True)
    poliza_id = Column(Integer, ForeignKey("polizas.id"), nullable=False)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    fecha_reclamacion = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    descripcion = Column(Text, nullable=False)
    estado = Column(Enum(EstadoReclamacion), default=EstadoReclamacion.PENDIENTE, nullable=False)
    monto_reclamado = Column(Float, nullable=True) # Opcional, si se aplica un monto
    monto_aprobado = Column(Float, nullable=True) # Opcional, si se aplica un monto
    fecha_resolucion = Column(DateTime, nullable=True)
    observaciones = Column(Text, nullable=True)

    # Relaciones
    poliza = relationship("Poliza", back_populates="reclamaciones")
    cliente = relationship("Cliente", back_populates="reclamaciones")

# Pydantic Schemas
class ReclamacionBase(BaseModel):
    poliza_id: int = Field(..., description="ID de la póliza asociada a la reclamación.")
    cliente_id: int = Field(..., description="ID del cliente que presenta la reclamación.")
    fecha_reclamacion: datetime = Field(..., description="Fecha en que se presentó la reclamación.")
    descripcion: str = Field(..., min_length=10, description="Descripción detallada de la reclamación.")
    estado: EstadoReclamacion = Field(EstadoReclamacion.PENDIENTE, description="Estado actual de la reclamación.")
    monto_reclamado: Optional[float] = Field(None, description="Monto reclamado (opcional).")
    monto_aprobado: Optional[float] = Field(None, description="Monto aprobado (opcional).")
    fecha_resolucion: Optional[datetime] = Field(None, description="Fecha de resolución de la reclamación (opcional).")
    observaciones: Optional[str] = Field(None, max_length=1000, description="Observaciones adicionales sobre la reclamación.")

    model_config = ConfigDict(from_attributes=True)

class ReclamacionCreate(ReclamacionBase):
    pass

class ReclamacionUpdate(BaseModel):
    poliza_id: Optional[int] = Field(None, description="ID de la póliza asociada a la reclamación.")
    cliente_id: Optional[int] = Field(None, description="ID del cliente que presenta la reclamación.")
    fecha_reclamacion: Optional[datetime] = Field(None, description="Fecha en que se presentó la reclamación.")
    descripcion: Optional[str] = Field(None, min_length=10, description="Descripción detallada de la reclamación.")
    estado: Optional[EstadoReclamacion] = Field(None, description="Estado actual de la reclamación.")
    monto_reclamado: Optional[float] = Field(None, description="Monto reclamado (opcional).")
    monto_aprobado: Optional[float] = Field(None, description="Monto aprobado (opcional).")
    fecha_resolucion: Optional[datetime] = Field(None, description="Fecha de resolución de la reclamación (opcional).")
    observaciones: Optional[str] = Field(None, max_length=1000, description="Observaciones adicionales sobre la reclamación.")

    model_config = ConfigDict(from_attributes=True)

class ReclamacionRead(ReclamacionBase):
    id: int = Field(..., description="ID único de la reclamación.")
    fecha_reclamacion: datetime = Field(..., description="Fecha y hora en que se presentó la reclamación.")
    
    # Para incluir datos relacionados al leer
    poliza: Optional[PolizaRead] = None
    cliente: Optional[ClienteRead] = None

    # ¡CRÍTICO! Campos planos para facilitar la visualización en tablas del frontend
    poliza_numero_poliza: Optional[str] = None
    cliente_nombre_completo: Optional[str] = None
    estado_display: Optional[str] = None # Campo para el estado formateado

    model_config = ConfigDict(from_attributes=True)

# Nuevo esquema Pydantic para la respuesta paginada
class PaginatedReclamacionesRead(BaseModel):
    items: List[ReclamacionRead]
    total: int
    page: int
    size: int

    model_config = ConfigDict(from_attributes=True)
