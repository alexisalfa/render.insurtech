# app/models/historial_cambio.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base # Importar Base
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class HistorialCambio(Base):
    __tablename__ = "historial_cambios"

    id = Column(Integer, primary_key=True, index=True)
    tabla_afectada = Column(String, nullable=False)
    registro_id = Column(Integer, nullable=False)
    campo_modificado = Column(String, nullable=False)
    valor_anterior = Column(String, nullable=True)
    valor_nuevo = Column(String, nullable=True)
    fecha_cambio = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    usuario_id = Column(Integer, ForeignKey("users.id"), nullable=False) # Clave foránea al usuario que hizo el cambio

    # Relaciones
    usuario = relationship("User", back_populates="historial_cambios") # <-- ¡CAMBIO AQUÍ!

# Pydantic Schemas
class HistorialCambioBase(BaseModel):
    tabla_afectada: str = Field(..., description="Nombre de la tabla que fue modificada.")
    registro_id: int = Field(..., description="ID del registro modificado en la tabla.")
    campo_modificado: str = Field(..., description="Nombre del campo que fue modificado.")
    valor_anterior: Optional[str] = Field(None, description="Valor anterior del campo.")
    valor_nuevo: Optional[str] = Field(None, description="Nuevo valor del campo.")
    usuario_id: int = Field(..., description="ID del usuario que realizó el cambio.")

    model_config = ConfigDict(from_attributes=True)

class HistorialCambioCreate(HistorialCambioBase):
    pass

class HistorialCambioRead(HistorialCambioBase):
    id: int = Field(..., description="ID único del registro de historial de cambio.")
    fecha_cambio: datetime = Field(..., description="Fecha y hora en que se realizó el cambio.")

    # Para incluir datos relacionados al leer
    # usuario: Optional["UserRead"] = None # Descomentar si UserRead está importado y definido
