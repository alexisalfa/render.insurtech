# app/models/configuracion.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.db.database import Base # Importar Base
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class Configuracion(Base):
    __tablename__ = "configuraciones"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False) # Un usuario, una configuración
    pais_preferido = Column(String, nullable=True)
    moneda_preferida = Column(String, nullable=True)
    idioma_preferido = Column(String, nullable=True)
    configuracion_completa = Column(Boolean, default=False, nullable=False) # Indica si la configuración inicial está completa
    fecha_ultima_actualizacion = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relación con el usuario
    usuario = relationship("User", back_populates="configuracion")

# Pydantic Schemas
class ConfiguracionBase(BaseModel):
    pais_preferido: Optional[str] = Field(None, max_length=50, description="País preferido para la normalización de datos.")
    moneda_preferida: Optional[str] = Field(None, max_length=10, description="Moneda preferida para la visualización de valores monetarios.")
    idioma_preferido: Optional[str] = Field(None, max_length=10, description="Idioma preferido para la interfaz de usuario.")
    configuracion_completa: Optional[bool] = Field(None, description="Indica si el usuario ha completado la configuración inicial.")

    model_config = ConfigDict(from_attributes=True)

class ConfiguracionCreate(ConfiguracionBase):
    # Cuando se crea, el usuario_id se obtiene del token, no se envía aquí
    pass

class ConfiguracionUpdate(ConfiguracionBase):
    pass

class ConfiguracionRead(ConfiguracionBase):
    id: int = Field(..., description="ID único de la configuración.")
    usuario_id: int = Field(..., description="ID del usuario al que pertenece esta configuración.")
    fecha_ultima_actualizacion: datetime = Field(..., description="Fecha y hora de la última actualización de la configuración.")

    # Para incluir datos relacionados al leer (ej. el usuario)
    # usuario: Optional["UserRead"] = None # Descomentar si UserRead está importado y definido
