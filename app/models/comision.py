# app/models/comision.py
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime, timezone
import enum
from typing import Optional, List # Asegurarse de que List esté importado si aún se usa, pero usaremos 'list'

from pydantic import BaseModel, Field, ConfigDict

# Importar esquemas de modelos relacionados para anidarlos en ComisionRead
from app.models.poliza import PolizaRead
from app.models.asesor import AsesorRead

# ¡CRÍTICO! Heredar de str, enum.Enum para serialización correcta
class EstatusPago(str, enum.Enum):
    PENDIENTE = "Pendiente"
    PAGADO = "Pagado"
    ANULADO = "Anulado"

# ¡CRÍTICO! Heredar de str, enum.Enum para serialización correcta
class TipoComision(str, enum.Enum):
    VENTA_NUEVA = "Venta Nueva"
    RENOVACION = "Renovación"
    SERVICIO_ADICIONAL = "Servicio Adicional"

class Comision(Base):
    __tablename__ = "comisiones"

    id = Column(Integer, primary_key=True, index=True)
    poliza_id = Column(Integer, ForeignKey("polizas.id"), nullable=False)
    asesor_id = Column(Integer, ForeignKey("asesores.id"), nullable=False)
    monto = Column(Float, nullable=False)
    porcentaje_comision = Column(Float, nullable=False)
    fecha_calculo = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    estatus_pago = Column(Enum(EstatusPago), default=EstatusPago.PENDIENTE, nullable=False)
    fecha_pago = Column(DateTime, nullable=True)
    tipo_comision = Column(Enum(TipoComision), nullable=False)
    observaciones = Column(String, nullable=True)

    # Relaciones
    poliza = relationship("Poliza", back_populates="comisiones")
    asesor = relationship("Asesor", back_populates="comisiones")

# Pydantic Schemas para validación y serialización
class ComisionBase(BaseModel):
    poliza_id: int = Field(..., description="ID de la póliza asociada a la comisión.")
    asesor_id: int = Field(..., description="ID del asesor asociado a la comisión.")
    monto: float = Field(..., gt=0, description="Monto de la comisión.")
    porcentaje_comision: float = Field(..., gt=0, le=100, description="Porcentaje de comisión sobre el monto (0-100).")
    estatus_pago: EstatusPago = Field(EstatusPago.PENDIENTE, description="Estatus de pago de la comisión.")
    fecha_pago: Optional[datetime] = Field(None, description="Fecha en que se realizó el pago de la comisión.")
    tipo_comision: TipoComision = Field(..., description="Tipo de comisión (Venta Nueva, Renovación, etc.).")
    observaciones: Optional[str] = Field(None, max_length=500, description="Observaciones adicionales sobre la comisión.")

    model_config = ConfigDict(from_attributes=True) # Habilitar compatibilidad con ORM

class ComisionCreate(ComisionBase):
    pass

class ComisionUpdate(ComisionBase):
    poliza_id: Optional[int] = Field(None, description="ID de la póliza asociada a la comisión.")
    asesor_id: Optional[int] = Field(None, description="ID del asesor asociado a la comisión.")
    monto: Optional[float] = Field(None, gt=0, description="Monto de la comisión.")
    porcentaje_comision: Optional[float] = Field(None, gt=0, le=100, description="Porcentaje de comisión sobre el monto (0-100).")
    estatus_pago: Optional[EstatusPago] = Field(None, description="Estatus de pago de la comisión.")
    tipo_comision: Optional[TipoComision] = Field(None, description="Tipo de comisión (Venta Nueva, Renovación, etc.).")
    observaciones: Optional[str] = Field(None, max_length=500, description="Observaciones adicionales sobre la comisión.")

# ¡CRÍTICO! Mover ComisionRead ANTES de PaginatedComisionesRead
class ComisionRead(ComisionBase):
    id: int = Field(..., description="ID único de la comisión.")
    fecha_calculo: datetime = Field(..., description="Fecha y hora en que se calculó la comisión.")

    # Para incluir datos relacionados al leer (objetos anidados)
    poliza_obj: Optional[PolizaRead] = Field(None, alias="poliza") # Usar alias para mapear 'poliza' de ORM a 'poliza_obj'
    asesor_obj: Optional[AsesorRead] = Field(None, alias="asesor") # Usar alias para mapear 'asesor' de ORM a 'asesor_obj'

    # ¡CRÍTICO! Campos planos para facilitar la visualización en tablas del frontend
    poliza_numero_poliza: Optional[str] = None
    asesor_nombre_completo: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# Nuevo esquema Pydantic para la respuesta paginada
class PaginatedComisionesRead(BaseModel):
    items: list[ComisionRead] # ¡CRÍTICO! Ahora ComisionRead ya está definido
    total: int
    page: int
    size: int
    pages: int

    model_config = ConfigDict(from_attributes=True)
