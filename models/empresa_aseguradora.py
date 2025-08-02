# app/models/empresa_aseguradora.py
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

class EmpresaAseguradora(Base):
    __tablename__ = "empresas_aseguradoras"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True, nullable=False)
    rif = Column(String, unique=True, index=True, nullable=False)
    direccion = Column(String, nullable=True)
    telefono = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    fecha_registro = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relaciones
    polizas = relationship("Poliza", back_populates="empresa_aseguradora")
    asesores = relationship("Asesor", back_populates="empresa_aseguradora")

# Pydantic Schemas
class EmpresaAseguradoraBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=100, description="Nombre de la empresa aseguradora.")
    rif: str = Field(..., min_length=5, max_length=20, description="Número de RIF de la empresa, debe ser único.")
    direccion: Optional[str] = Field(None, max_length=200, description="Dirección de la empresa.")
    telefono: Optional[str] = Field(None, max_length=20, description="Número de teléfono de la empresa.")
    email: str = Field(..., pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", description="Correo electrónico de la empresa, debe ser único.")

    model_config = ConfigDict(from_attributes=True)

class EmpresaAseguradoraCreate(EmpresaAseguradoraBase):
    pass

class EmpresaAseguradoraUpdate(EmpresaAseguradoraBase):
    nombre: Optional[str] = Field(None, min_length=1, max_length=100, description="Nombre de la empresa aseguradora.")
    rif: Optional[str] = Field(None, min_length=5, max_length=20, description="Número de RIF de la empresa, debe ser único.")
    direccion: Optional[str] = Field(None, max_length=200, description="Dirección de la empresa.")
    telefono: Optional[str] = Field(None, max_length=20, description="Número de teléfono de la empresa.")
    email: Optional[str] = Field(None, pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", description="Correo electrónico de la empresa, debe ser único.")

class EmpresaAseguradoraRead(EmpresaAseguradoraBase):
    id: int = Field(..., description="ID único de la empresa aseguradora.")
    fecha_registro: datetime = Field(..., description="Fecha y hora de registro de la empresa.")

    model_config = ConfigDict(from_attributes=True)

# Nuevo esquema Pydantic para la respuesta paginada
class PaginatedEmpresasAseguradorasRead(BaseModel):
    items: List[EmpresaAseguradoraRead]
    total: int
    page: int
    size: int

    model_config = ConfigDict(from_attributes=True)
