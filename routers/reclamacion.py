# app/routers/reclamacion.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime, timezone, date

from app.db.database import get_db
from app.models.reclamacion import Reclamacion, ReclamacionCreate, ReclamacionRead, ReclamacionUpdate, EstadoReclamacion, PaginatedReclamacionesRead # Importar PaginatedReclamacionesRead
from app.models.poliza import Poliza # Importar Poliza para validación
from app.models.cliente import Cliente # Importar Cliente para validación
from app.models.user import User # Importar User para el current_user
from app.utils.auth import get_current_active_user # Importar dependencias de usuario

router = APIRouter()

# Ruta para crear una nueva reclamación
@router.post("/", response_model=ReclamacionRead, status_code=status.HTTP_201_CREATED, summary="Crear nueva reclamación")
async def create_reclamacion(reclamacion: ReclamacionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """
    Crea una nueva reclamación en la base de datos.
    Requiere que el usuario esté autenticado.
    """
    print(f"DEBUG BACKEND: [CREATE_RECLAMACION] Usuario '{current_user.username}' intentando crear reclamación para póliza: {reclamacion.poliza_id}")

    # Validar que la póliza exista
    db_poliza = db.query(Poliza).filter(Poliza.id == reclamacion.poliza_id).first()
    if not db_poliza:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Póliza no encontrada")

    # Validar que el cliente exista
    db_cliente = db.query(Cliente).filter(Cliente.id == reclamacion.cliente_id).first()
    if not db_cliente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")

    db_reclamacion = Reclamacion(**reclamacion.model_dump())
    db.add(db_reclamacion)
    db.commit()
    db.refresh(db_reclamacion)
    print(f"DEBUG BACKEND: [CREATE_RECLAMACION] Reclamación ID: {db_reclamacion.id} creada exitosamente por '{current_user.username}'.")
    return db_reclamacion

# Ruta para obtener todas las reclamaciones con paginación y filtros
@router.get("/", response_model=PaginatedReclamacionesRead, summary="Obtener todas las reclamaciones con paginación y filtros")
async def get_all_reclamaciones(
    offset: int = 0,
    limit: int = Query(10, gt=0, le=100),
    search_term: Optional[str] = Query(None, description="Término de búsqueda para descripción de reclamación."),
    estado_filter: Optional[EstadoReclamacion] = Query(None, alias="estado", description="Filtrar por estado de la reclamación."),
    cliente_id_filter: Optional[int] = Query(None, alias="cliente_id", description="Filtrar por ID de cliente."),
    poliza_id_filter: Optional[int] = Query(None, alias="poliza_id", description="Filtrar por ID de póliza."),
    fecha_reclamacion_inicio_filter: Optional[date] = Query(None, alias="fecha_reclamacion_inicio", description="Filtrar reclamaciones desde esta fecha (YYYY-MM-DD)."),
    fecha_reclamacion_fin_filter: Optional[date] = Query(None, alias="fecha_reclamacion_fin", description="Filtrar reclamaciones hasta esta fecha (YYYY-MM-DD)."),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Obtiene una lista paginada de todas las reclamaciones, con opciones de filtrado.
    Requiere que el usuario esté autenticado.
    """
    print(f"DEBUG BACKEND: [GET_RECLAMACIONES] Usuario '{current_user.username}' solicitando reclamaciones con offset={offset}, limit={limit}, search_term='{search_term}', estado='{estado_filter}', cliente_id='{cliente_id_filter}', poliza_id='{poliza_id_filter}', fecha_inicio_filter='{fecha_reclamacion_inicio_filter}', fecha_fin_filter='{fecha_reclamacion_fin_filter}'.")

    query = db.query(Reclamacion).options(
        joinedload(Reclamacion.poliza),
        joinedload(Reclamacion.cliente)
    )

    if search_term:
        query = query.filter(Reclamacion.descripcion.ilike(f"%{search_term}%"))
    if estado_filter:
        query = query.filter(Reclamacion.estado == estado_filter)
    if cliente_id_filter:
        query = query.filter(Reclamacion.cliente_id == cliente_id_filter)
    if poliza_id_filter:
        query = query.filter(Reclamacion.poliza_id == poliza_id_filter)
    
    if fecha_reclamacion_inicio_filter:
        # Asegurarse de que la comparación sea con la parte de la fecha, ignorando la hora
        query = query.filter(Reclamacion.fecha_reclamacion >= fecha_reclamacion_inicio_filter)
    if fecha_reclamacion_fin_filter:
        # Para incluir todo el día, se suma un día y se busca menor estricto
        query = query.filter(Reclamacion.fecha_reclamacion < fecha_reclamacion_fin_filter + timedelta(days=1))

    total_reclamaciones = query.count()
    reclamaciones_db = query.offset(offset).limit(limit).all()

    # Construir la lista de ReclamacionRead con campos aplanados
    reclamaciones_read = []
    for rec in reclamaciones_db:
        rec_read = ReclamacionRead.model_validate(rec)
        rec_read.poliza_numero_poliza = rec.poliza.numero_poliza if rec.poliza else None
        rec_read.cliente_nombre_completo = f"{rec.cliente.nombre} {rec.cliente.apellido}" if rec.cliente else None
        rec_read.estado_display = rec.estado.value # Usar el valor del enum para display
        reclamaciones_read.append(rec_read)

    print(f"DEBUG BACKEND: [GET_RECLAMACIONES] Total de reclamaciones encontradas (con filtro): {total_reclamaciones}")
    print(f"DEBUG BACKEND: [GET_RECLAMACIONES] Se encontraron {len(reclamaciones_read)} reclamaciones para la página actual.")

    return PaginatedReclamacionesRead(
        items=reclamaciones_read,
        total=total_reclamaciones,
        page=offset // limit + 1,
        size=len(reclamaciones_read)
    )

# Ruta para obtener una reclamación por ID
@router.get("/{reclamacion_id}", response_model=ReclamacionRead, summary="Obtener reclamación por ID")
async def get_reclamacion_by_id(reclamacion_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """
    Obtiene la información de una reclamación específica por su ID.
    Requiere que el usuario esté autenticado.
    """
    print(f"DEBUG BACKEND: [GET_RECLAMACION_BY_ID] Usuario '{current_user.username}' solicitando reclamación ID: {reclamacion_id}")

    reclamacion = db.query(Reclamacion).options(
        joinedload(Reclamacion.poliza),
        joinedload(Reclamacion.cliente)
    ).filter(Reclamacion.id == reclamacion_id).first()
    if not reclamacion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reclamación no encontrada")
    
    # Rellenar campos aplanados para la respuesta
    reclamacion_read = ReclamacionRead.model_validate(reclamacion)
    reclamacion_read.poliza_numero_poliza = reclamacion.poliza.numero_poliza if reclamacion.poliza else None
    reclamacion_read.cliente_nombre_completo = f"{reclamacion.cliente.nombre} {reclamacion.cliente.apellido}" if reclamacion.cliente else None
    reclamacion_read.estado_display = reclamacion.estado.value
    
    return reclamacion_read

# Ruta para actualizar una reclamación
@router.put("/{reclamacion_id}", response_model=ReclamacionRead, summary="Actualizar reclamación por ID")
async def update_reclamacion(reclamacion_id: int, reclamacion_update: ReclamacionUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """
    Actualiza la información de una reclamación existente.
    Requiere que el usuario esté autenticado.
    """
    print(f"DEBUG BACKEND: [UPDATE_RECLAMACION] Usuario '{current_user.username}' intentando actualizar reclamación ID: {reclamacion_id}")

    db_reclamacion = db.query(Reclamacion).filter(Reclamacion.id == reclamacion_id).first()
    if not db_reclamacion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reclamación no encontrada")

    # Validar que la póliza exista si se proporciona
    if reclamacion_update.poliza_id is not None:
        db_poliza = db.query(Poliza).filter(Poliza.id == reclamacion_update.poliza_id).first()
        if not db_poliza:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Póliza no encontrada")

    # Validar que el cliente exista si se proporciona
    if reclamacion_update.cliente_id is not None:
        db_cliente = db.query(Cliente).filter(Cliente.id == reclamacion_update.cliente_id).first()
        if not db_cliente:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")

    # Actualizar campos
    for key, value in reclamacion_update.model_dump(exclude_unset=True).items():
        setattr(db_reclamacion, key, value)

    db.commit()
    db.refresh(db_reclamacion)

    # Rellenar campos aplanados para la respuesta
    reclamacion_read = ReclamacionRead.model_validate(db_reclamacion)
    reclamacion_read.poliza_numero_poliza = db_reclamacion.poliza.numero_poliza if db_reclamacion.poliza else None
    reclamacion_read.cliente_nombre_completo = f"{db_reclamacion.cliente.nombre} {db_reclamacion.cliente.apellido}" if db_reclamacion.cliente else None
    reclamacion_read.estado_display = db_reclamacion.estado.value

    print(f"DEBUG BACKEND: [UPDATE_RECLAMACION] Reclamación ID: {reclamacion_id} actualizada exitosamente por '{current_user.username}'.")
    return reclamacion_read

# Ruta para eliminar una reclamación
@router.delete("/{reclamacion_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Eliminar reclamación por ID")
async def delete_reclamacion(reclamacion_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """
    Elimina una reclamación del sistema.
    Requiere que el usuario esté autenticado.
    """
    print(f"DEBUG BACKEND: [DELETE_RECLAMACION] Usuario '{current_user.username}' intentando eliminar reclamación ID: {reclamacion_id}")

    db_reclamacion = db.query(Reclamacion).filter(Reclamacion.id == reclamacion_id).first()
    if not db_reclamacion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reclamación no encontrada")

    db.delete(db_reclamacion)
    db.commit()
    print(f"DEBUG BACKEND: [DELETE_RECLAMACION] Reclamación ID: {reclamacion_id} eliminada exitosamente por '{current_user.username}'.")
    return {"message": "Reclamación eliminada exitosamente"}
