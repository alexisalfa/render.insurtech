# app/models/user.py
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from app.db.database import Base # Importar Base
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timedelta, timezone


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    is_active = Column(Integer, default=1) # Usamos Integer para compatibilidad con SQLite (0 o 1)
    
    # Campos de Licencia
    license_start_date = Column(DateTime, nullable=True)
    license_end_date = Column(DateTime, nullable=True)
    is_trial = Column(Boolean, default=True, nullable=False) # True si es licencia de prueba (48h), False si es completa

    # Relaciones
    historial_cambios = relationship("HistorialCambio", back_populates="usuario")
    configuracion = relationship("Configuracion", back_populates="usuario", uselist=False)

# Pydantic Schemas para validación y serialización
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Nombre de usuario único.")
    email: str = Field(..., pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", description="Correo electrónico único.")
    
    
    model_config = ConfigDict(from_attributes=True) # Habilitar compatibilidad con ORM

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Contraseña del usuario.")
    master_license_key: str = Field(..., description="Clave de licencia maestra para activar la API.")

class UserRead(UserBase):
    id: int = Field(..., description="ID único del usuario.")
    is_active: bool = Field(..., description="Estado de activación del usuario.")
    license_start_date: Optional[datetime] = Field(None, description="Fecha de inicio de la licencia.")
    license_end_date: Optional[datetime] = Field(None, description="Fecha de fin de la licencia.")
    is_trial: bool = Field(..., description="Indica si la licencia es de prueba (48h) o completa.")

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class LicenseStatusResponse(BaseModel):
    is_license_active: bool
    message: str
