# app/models/asesor.py
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

# Importar el esquema de EmpresaAseguradoraRead para la relación
from app.models.empresa_aseguradora import EmpresaAseguradoraRead

class Asesor(Base):
    __tablename__ = "asesores"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True, nullable=False)
    apellido = Column(String, index=True, nullable=False)
    cedula = Column(String, unique=True, index=True, nullable=False)
    telefono = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    fecha_contratacion = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    empresa_aseguradora_id = Column(Integer, ForeignKey("empresas_aseguradoras.id"), nullable=True) # Puede ser nulo si es independiente

    # Relaciones
    empresa_aseguradora = relationship("EmpresaAseguradora", back_populates="asesores")
    polizas = relationship("Poliza", back_populates="asesor")
    comisiones = relationship("Comision", back_populates="asesor") # Relación correcta con Comision

# Pydantic Schemas
class AsesorBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=100, description="Nombre del asesor.")
    apellido: str = Field(..., min_length=1, max_length=100, description="Apellido del asesor.")
    cedula: str = Field(..., min_length=5, max_length=20, description="Número de cédula del asesor, debe ser único.")
    telefono: Optional[str] = Field(None, max_length=20, description="Número de teléfono del asesor.")
    email: str = Field(..., pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", description="Correo electrónico del asesor, debe ser único.")
    empresa_aseguradora_id: Optional[int] = Field(None, description="ID de la empresa aseguradora asociada (opcional).")

    model_config = ConfigDict(from_attributes=True)

class AsesorCreate(AsesorBase):
    pass

class AsesorUpdate(AsesorBase):
    nombre: Optional[str] = Field(None, min_length=1, max_length=100, description="Nombre del asesor.")
    apellido: Optional[str] = Field(None, min_length=1, max_length=100, description="Apellido del asesor.")
    cedula: Optional[str] = Field(None, min_length=5, max_length=20, description="Número de cédula del asesor, debe ser único.")
    email: Optional[str] = Field(None, pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", description="Correo electrónico del asesor, debe ser único.")
    empresa_aseguradora_id: Optional[int] = Field(None, description="ID de la empresa aseguradora asociada (opcional).")


class AsesorRead(AsesorBase):
    id: int = Field(..., description="ID único del asesor.")
    fecha_contratacion: datetime = Field(..., description="Fecha de contratación del asesor.")
    
    # ¡CRÍTICO! Incluir la empresa aseguradora completa al leer
    empresa_aseguradora: Optional[EmpresaAseguradoraRead] = None

    model_config = ConfigDict(from_attributes=True)

# Nuevo esquema Pydantic para la respuesta paginada (similar a PaginatedResponse, pero específico si es necesario)
class PaginatedAsesoresRead(BaseModel):
    items: List[AsesorRead]
    total: int
    page: int
    size: int

    model_config = ConfigDict(from_attributes=True)
