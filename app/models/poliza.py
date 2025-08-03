# app/models/poliza.py
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, date, timezone # Importar date y datetime
import enum
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

from app.db.database import Base # Importando la Base declarativa

# Importar esquemas de modelos relacionados para anidarlos en PolizaRead
from app.models.cliente import ClienteRead
from app.models.empresa_aseguradora import EmpresaAseguradoraRead
from app.models.asesor import AsesorRead
# Importar Comision para la relación si es necesario (generalmente no para la definición de la tabla, pero sí para Pydantic si se anida)
# from app.models.comision import ComisionRead # Descomentar si se va a anidar ComisionRead en PolizaRead

class TipoPoliza(str, enum.Enum):
    SALUD = "Salud"
    VIDA = "Vida"
    VEHICULO = "Vehículo"
    HOGAR = "Hogar"
    VIAJE = "Viaje"
    OTROS = "Otros"

class EstadoPoliza(str, enum.Enum):
    ACTIVA = "Activa"
    PENDIENTE = "Pendiente"
    VENCIDA = "Vencida"
    CANCELADA = "Cancelada"

class Poliza(Base):
    __tablename__ = "polizas"

    id = Column(Integer, primary_key=True, index=True)
    numero_poliza = Column(String, unique=True, index=True, nullable=False)
    tipo_poliza = Column(Enum(TipoPoliza), nullable=False)
    fecha_inicio = Column(DateTime, nullable=False)
    fecha_fin = Column(DateTime, nullable=False)
    monto_asegurado = Column(Float, nullable=False)
    prima = Column(Float, nullable=False)
    estado = Column(Enum(EstadoPoliza), default=EstadoPoliza.ACTIVA, nullable=False)
    observaciones = Column(String, nullable=True) # Campo de observaciones

    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    empresa_aseguradora_id = Column(Integer, ForeignKey("empresas_aseguradoras.id"), nullable=False)
    asesor_id = Column(Integer, ForeignKey("asesores.id"), nullable=True) # ¡CRÍTICO! Cambiado a nullable=True
    
    fecha_creacion = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relaciones
    cliente = relationship("Cliente", back_populates="polizas")
    empresa_aseguradora = relationship("EmpresaAseguradora", back_populates="polizas")
    asesor = relationship("Asesor", back_populates="polizas")
    reclamaciones = relationship("Reclamacion", back_populates="poliza")
    comisiones = relationship("Comision", back_populates="poliza") # ¡CRÍTICO! Añadida la relación con Comision

# Pydantic Schemas
class PolizaBase(BaseModel):
    numero_poliza: str = Field(..., min_length=1, max_length=50, description="Número único de la póliza.")
    tipo_poliza: TipoPoliza = Field(..., description="Tipo de póliza (Salud, Vida, Vehículo, Hogar, Viaje, Otros).")
    fecha_inicio: datetime = Field(..., description="Fecha de inicio de la vigencia de la póliza.")
    fecha_fin: datetime = Field(..., description="Fecha de fin de la vigencia de la póliza.")
    monto_asegurado: float = Field(..., gt=0, description="Monto total asegurado por la póliza.")
    prima: float = Field(..., gt=0, description="Costo de la prima de la póliza.")
    estado: EstadoPoliza = Field(EstadoPoliza.ACTIVA, description="Estado actual de la póliza.")
    observaciones: Optional[str] = Field(None, description="Observaciones adicionales de la póliza.")
    cliente_id: int = Field(..., description="ID del cliente asociado a la póliza.")
    empresa_aseguradora_id: int = Field(..., description="ID de la empresa aseguradora que emite la póliza.")
    asesor_id: Optional[int] = Field(None, description="ID del asesor que gestionó la póliza (opcional).") # ¡CRÍTICO! Cambiado a Optional

    model_config = ConfigDict(from_attributes=True)

class PolizaCreate(PolizaBase):
    pass

class PolizaUpdate(BaseModel): # PolizaUpdate permite campos opcionales para actualizaciones parciales
    numero_poliza: Optional[str] = Field(None, min_length=1, max_length=50, description="Número único de la póliza.")
    tipo_poliza: Optional[TipoPoliza] = Field(None, description="Tipo de póliza (Salud, Vida, Vehículo, Hogar, Viaje, Otros).")
    fecha_inicio: Optional[datetime] = Field(None, description="Fecha de inicio de la vigencia de la póliza.")
    fecha_fin: Optional[datetime] = Field(None, description="Fecha de fin de la vigencia de la póliza.")
    monto_asegurado: Optional[float] = Field(None, gt=0, description="Monto total asegurado por la póliza.")
    prima: Optional[float] = Field(None, gt=0, description="Costo de la prima de la póliza.")
    estado: Optional[EstadoPoliza] = None
    observaciones: Optional[str] = Field(None, max_length=500, description="Observaciones adicionales de la póliza.")
    cliente_id: Optional[int] = None
    empresa_aseguradora_id: Optional[int] = None
    asesor_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class PolizaRead(PolizaBase):
    id: int = Field(..., description="ID único de la póliza.")
    fecha_creacion: datetime = Field(..., description="Fecha y hora de creación de la póliza.")
    
    # Para incluir datos relacionados al leer (objetos anidados)
    cliente: Optional[ClienteRead] = None
    empresa_aseguradora: Optional[EmpresaAseguradoraRead] = None
    asesor: Optional[AsesorRead] = None

    # ¡CRÍTICO! Campos planos para facilitar la visualización en tablas del frontend
    cliente_nombre_completo: Optional[str] = None
    empresa_aseguradora_nombre: Optional[str] = None
    asesor_nombre_completo: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# Nuevo esquema Pydantic para la respuesta paginada
class PaginatedPolizasRead(BaseModel):
    items: List[PolizaRead]
    total: int
    page: int
    size: int

    model_config = ConfigDict(from_attributes=True)
