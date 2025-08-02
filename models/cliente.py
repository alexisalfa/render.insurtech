# app/models/cliente.py
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime, date, timezone
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True, nullable=False)
    apellido = Column(String, index=True, nullable=False)
    cedula = Column(String, unique=True, index=True, nullable=False)
    telefono = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    direccion = Column(String, nullable=True)
    fecha_nacimiento = Column(DateTime, nullable=True)
    fecha_registro = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relaciones
    polizas = relationship("Poliza", back_populates="cliente")
    reclamaciones = relationship("Reclamacion", back_populates="cliente")

# Pydantic Schemas
class ClienteBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=100, description="Nombre del cliente.")
    apellido: str = Field(..., min_length=1, max_length=100, description="Apellido del cliente.")
    cedula: str = Field(..., min_length=5, max_length=20, description="Número de cédula del cliente, debe ser único.")
    telefono: Optional[str] = Field(None, max_length=20, description="Número de teléfono del cliente.")
    email: str = Field(..., pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", description="Correo electrónico del cliente, debe ser único.")
    direccion: Optional[str] = Field(None, max_length=200, description="Dirección del cliente.")
    fecha_nacimiento: Optional[date] = Field(None, description="Fecha de nacimiento del cliente (YYYY-MM-DD).")

    model_config = ConfigDict(from_attributes=True)

class ClienteCreate(ClienteBase):
    pass

class ClienteUpdate(ClienteBase):
    nombre: Optional[str] = Field(None, min_length=1, max_length=100, description="Nombre del cliente.")
    apellido: Optional[str] = Field(None, min_length=1, max_length=100, description="Apellido del cliente.")
    cedula: Optional[str] = Field(None, min_length=5, max_length=20, description="Número de cédula del cliente, debe ser único.")
    telefono: Optional[str] = Field(None, max_length=20, description="Número de teléfono del cliente.")
    email: Optional[str] = Field(None, pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", description="Correo electrónico del cliente, debe ser único.")
    direccion: Optional[str] = Field(None, max_length=200, description="Dirección del cliente.")
    fecha_nacimiento: Optional[date] = Field(None, description="Fecha de nacimiento del cliente (YYYY-MM-DD).")

class ClienteRead(ClienteBase):
    id: int = Field(..., description="ID único del cliente.")
    fecha_registro: datetime = Field(..., description="Fecha y hora de registro del cliente.")

    model_config = ConfigDict(from_attributes=True)

# Nuevo esquema Pydantic para la respuesta paginada
class PaginatedClientsRead(BaseModel):
    items: List[ClienteRead]
    total: int
    page: int
    size: int

    model_config = ConfigDict(from_attributes=True)
