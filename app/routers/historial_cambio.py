# app/routers/historial_cambio.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

from app.db.database import get_db
from app.models.historial_cambio import HistorialCambio, HistorialCambioCreate, HistorialCambioRead
from app.models.user import User # Necesario para la dependencia de usuario
from app.utils.auth import get_current_active_user # Dependencia para usuario autenticado

router = APIRouter()

# Ruta para crear un nuevo registro de historial de cambio
# Nota: Esta ruta no suele ser llamada directamente por el frontend,
# sino internamente por otras operaciones del backend (ej. al actualizar un cliente/poliza).
@router.post("/", response_model=HistorialCambioRead, status_code=status.HTTP_201_CREATED, summary="Registrar un cambio en el historial")
async def create_historial_cambio(historial_data: HistorialCambioCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """
    Crea un nuevo registro de historial de cambios.
    Requiere que el usuario esté autenticado.
    """
    # Eliminamos la referencia a 'Rol' en el print de depuración
    print(f"DEBUG BACKEND: [CREATE_HISTORIAL_CAMBIO] Usuario '{current_user.username}' registrando cambio en tabla: {historial_data.tabla_afectada}, ID: {historial_data.registro_id}")

    db_historial = HistorialCambio(**historial_data.model_dump())
    db.add(db_historial)
    db.commit()
    db.refresh(db_historial)
    print(f"DEBUG BACKEND: [CREATE_HISTORIAL_CAMBIO] Registro de historial creado exitosamente por '{current_user.username}'.")
    return db_historial

# Ruta para obtener todos los registros de historial de cambio
@router.get("/", response_model=List[HistorialCambioRead], summary="Obtener todos los registros de historial de cambio")
async def get_all_historial_cambios(
    skip: int = 0,
    limit: int = 100,
    tabla_afectada: Optional[str] = None,
    registro_id: Optional[int] = None,
    usuario_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Obtiene una lista de todos los registros de historial de cambio, con opciones de filtrado.
    Requiere que el usuario esté autenticado.
    """
    # Eliminamos la referencia a 'Rol' en el print de depuración
    print(f"DEBUG BACKEND: [GET_HISTORIAL_CAMBIOS] Usuario '{current_user.username}' solicitando historial de cambios con filtros: Tabla={tabla_afectada}, Registro ID={registro_id}, Usuario ID={usuario_id}")

    query = db.query(HistorialCambio)

    if tabla_afectada:
        query = query.filter(HistorialCambio.tabla_afectada == tabla_afectada)
    if registro_id:
        query = query.filter(HistorialCambio.registro_id == registro_id)
    if usuario_id:
        query = query.filter(HistorialCambio.usuario_id == usuario_id)

    historial_cambios = query.offset(skip).limit(limit).all()
    return historial_cambios

# Ruta para obtener un registro de historial de cambio por ID
@router.get("/{historial_id}", response_model=HistorialCambioRead, summary="Obtener registro de historial de cambio por ID")
async def get_historial_cambio_by_id(historial_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """
    Obtiene la información de un registro de historial de cambio específico por su ID.
    Requiere que el usuario esté autenticado.
    """
    # Eliminamos la referencia a 'Rol' en el print de depuración
    print(f"DEBUG BACKEND: [GET_HISTORIAL_CAMBIO_BY_ID] Usuario '{current_user.username}' solicitando historial ID: {historial_id}")

    historial = db.query(HistorialCambio).filter(HistorialCambio.id == historial_id).first()
    if not historial:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registro de historial de cambio no encontrado")
    return historial

# NO hay ruta PUT o DELETE para HistorialCambio, ya que los registros de historial son inmutables.
