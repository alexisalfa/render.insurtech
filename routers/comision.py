# app/routers/comision.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime, date, timezone
from sqlalchemy import func, and_

from app.db.database import get_db
from app.models.comision import Comision, ComisionCreate, ComisionRead, ComisionUpdate, TipoComision, EstatusPago, PaginatedComisionesRead
from app.models.poliza import Poliza
from app.models.asesor import Asesor
from app.models.user import User
from app.utils.auth import get_current_active_user

# ¡CORRECCIÓN CRÍTICA! Se ha eliminado el 'prefix="/comisiones"'.
# El prefijo ya lo establece el main.py, así se evita la duplicidad.
router = APIRouter(tags=["Comisiones"])

# Ruta para crear una nueva comisión
@router.post("/", response_model=ComisionRead, status_code=status.HTTP_201_CREATED, summary="Crear nueva comisión")
async def create_comision(comision_data: ComisionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """
    Crea una nueva comisión en la base de datos.
    Requiere que el usuario esté autenticado.
    """
    print(f"DEBUG BACKEND: [CREATE_COMISION] Usuario '{current_user.username}' intentando crear comisión para póliza: {comision_data.poliza_id}, asesor: {comision_data.asesor_id}")

    db_poliza = db.query(Poliza).filter(Poliza.id == comision_data.poliza_id).first()
    if not db_poliza:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Póliza no encontrada")

    db_asesor = db.query(Asesor).filter(Asesor.id == comision_data.asesor_id).first()
    if not db_asesor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asesor no encontrado")

    db_comision = Comision(**comision_data.model_dump())
    db.add(db_comision)
    db.commit()
    db.refresh(db_comision)
    
    # Recargamos la instancia con las relaciones para una respuesta completa
    db.refresh(db_comision)
    db_comision = db.query(Comision).options(
        joinedload(Comision.poliza),
        joinedload(Comision.asesor)
    ).filter(Comision.id == db_comision.id).first()

    # Asignamos valores aplanados para la respuesta (si existen las relaciones)
    if db_comision.poliza:
        db_comision.poliza_numero_poliza = db_comision.poliza.numero_poliza
    if db_comision.asesor:
        db_comision.asesor_nombre_completo = f"{db_comision.asesor.nombre} {db_comision.asesor.apellido or ''}".strip()
    
    print(f"DEBUG BACKEND: [CREATE_COMISION] Comisión ID: {db_comision.id} creada exitosamente por '{current_user.username}'.")
    return db_comision

# Ruta para obtener todas las comisiones con paginación y filtros
@router.get("/", response_model=PaginatedComisionesRead, summary="Obtener todas las comisiones con filtros")
async def read_comisiones(
    offset: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    asesor_id_filter: Optional[int] = Query(None, description="Filtrar por ID de asesor."),
    estatus_pago: Optional[EstatusPago] = Query(None, description="Filtrar por estatus de pago."),
    fecha_inicio_filter: Optional[datetime] = Query(None, description="Filtrar comisiones generadas desde esta fecha (ISO 8601)."),
    fecha_fin_filter: Optional[datetime] = Query(None, description="Filtrar comisiones generadas hasta esta fecha (ISO 8601)."),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)):
    """
    Recupera una lista paginada de comisiones, con opciones de filtrado.
    """
    query = db.query(Comision).options(
        joinedload(Comision.poliza),
        joinedload(Comision.asesor)
    )

    filters = []
    if asesor_id_filter:
        filters.append(Comision.asesor_id == asesor_id_filter)
    if estatus_pago:
        filters.append(Comision.estatus_pago == estatus_pago)
    if fecha_inicio_filter:
        filters.append(Comision.fecha_generacion >= fecha_inicio_filter)
    if fecha_fin_filter:
        filters.append(Comision.fecha_generacion <= fecha_fin_filter)

    if filters:
        query = query.filter(and_(*filters))

    total_comisiones = query.count()
    comisiones = query.order_by(Comision.id.desc()).offset(offset).limit(limit).all()

    for comision in comisiones:
        if comision.poliza:
            comision.poliza_numero_poliza = comision.poliza.numero_poliza
        if comision.asesor:
            comision.asesor_nombre_completo = f"{comision.asesor.nombre} {comision.asesor.apellido or ''}".strip()

    return PaginatedComisionesRead(
        items=comisiones,
        total=total_comisiones,
        page=(offset // limit) + 1,
        size=len(comisiones),
        pages=(total_comisiones + limit - 1) // limit if limit > 0 else 0
    )

# Ruta para obtener una comisión por ID
@router.get("/{comision_id}", response_model=ComisionRead, summary="Obtener comisión por ID")
async def read_comision(comision_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_comision = db.query(Comision).options(
        joinedload(Comision.poliza),
        joinedload(Comision.asesor)
    ).filter(Comision.id == comision_id).first()

    if not db_comision:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comisión no encontrada")

    if db_comision.poliza:
        db_comision.poliza_numero_poliza = db_comision.poliza.numero_poliza
    if db_comision.asesor:
        db_comision.asesor_nombre_completo = f"{db_comision.asesor.nombre} {db_comision.asesor.apellido or ''}".strip()

    return db_comision

# Ruta para actualizar una comisión
@router.put("/{comision_id}", response_model=ComisionRead, summary="Actualizar comisión por ID")
async def update_comision(comision_id: int, comision_update: ComisionUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_comision = db.query(Comision).filter(Comision.id == comision_id).first()
    if not db_comision:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comisión no encontrada")

    update_data = comision_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_comision, key, value)

    db.commit()
    db.refresh(db_comision)

    db.refresh(db_comision)
    db_comision = db.query(Comision).options(
        joinedload(Comision.poliza),
        joinedload(Comision.asesor)
    ).filter(Comision.id == db_comision.id).first()

    if db_comision.poliza:
        db_comision.poliza_numero_poliza = db_comision.poliza.numero_poliza
    if db_comision.asesor:
        db_comision.asesor_nombre_completo = f"{db_comision.asesor.nombre} {db_comision.asesor.apellido or ''}".strip()

    return db_comision

# Ruta para eliminar una comisión
@router.delete("/{comision_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Eliminar comisión por ID")
async def delete_comision(comision_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """
    Elimina una comisión del sistema.
    Requiere que el usuario esté autenticado.
    Una respuesta 204 NO DEBE tener cuerpo.
    """
    db_comision = db.query(Comision).filter(Comision.id == comision_id).first()
    if not db_comision:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comisión no encontrada")

    db.delete(db_comision)
    db.commit()
    
    # ¡CORRECCIÓN! No devolver nada en una respuesta 204.
    return None
