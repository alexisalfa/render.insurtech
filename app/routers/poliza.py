# app/routers/poliza.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload, selectinload # Usar selectinload
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from sqlalchemy import func, or_, and_, select # Importar select y func

from app.db.database import get_db
from app.models.poliza import Poliza, PolizaCreate, PolizaRead, PolizaUpdate, PaginatedPolizasRead
from app.models.cliente import Cliente # Importar Cliente para validación si es necesario
from app.models.empresa_aseguradora import EmpresaAseguradora # Importar EmpresaAseguradora para validación
from app.models.asesor import Asesor # Importar Asesor para validación
from app.models.user import User # Importar User para el current_user
from app.utils.auth import get_current_active_user # Importar dependencias de usuario

router = APIRouter(prefix="/polizas", tags=["Pólizas"]) # Añadir prefijo y tags

# Función auxiliar para cargar póliza con relaciones y mapear a PolizaRead
def _get_poliza_with_relations_and_map(db_poliza: Poliza) -> PolizaRead:
    """Carga las relaciones de una póliza y mapea a PolizaRead, incluyendo campos planos."""
    poliza_read_item = PolizaRead.model_validate(db_poliza)
    
    # Añadir campos planos para facilitar la visualización en tablas del frontend
    if db_poliza.cliente:
        poliza_read_item.cliente_nombre_completo = f"{db_poliza.cliente.nombre} {db_poliza.cliente.apellido}"
    if db_poliza.empresa_aseguradora:
        poliza_read_item.empresa_aseguradora_nombre = db_poliza.empresa_aseguradora.nombre
    if db_poliza.asesor:
        poliza_read_item.asesor_nombre_completo = f"{db_poliza.asesor.nombre} {db_poliza.asesor.apellido}"
    
    return poliza_read_item

# Ruta para crear una nueva póliza
@router.post("/", response_model=PolizaRead, status_code=status.HTTP_201_CREATED, summary="Crear nueva póliza") # ¡CRÍTICO! Ruta corregida
async def create_poliza(
    poliza: PolizaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    print(f"DEBUG BACKEND: [CREATE_POLIZA] Usuario '{current_user.username}' intentando crear póliza: {poliza.numero_poliza}")

    # Validar unicidad del número de póliza
    existing_poliza = db.execute(select(Poliza).filter(Poliza.numero_poliza == poliza.numero_poliza)).scalar_one_or_none()
    if existing_poliza:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El número de póliza ya existe")

    # Validar que el cliente exista
    db_cliente = db.execute(select(Cliente).filter(Cliente.id == poliza.cliente_id)).scalar_one_or_none()
    if not db_cliente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")

    # Validar que la empresa aseguradora exista
    db_empresa = db.execute(select(EmpresaAseguradora).filter(EmpresaAseguradora.id == poliza.empresa_aseguradora_id)).scalar_one_or_none()
    if not db_empresa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empresa Aseguradora no encontrada")

    # Validar que el asesor exista
    if poliza.asesor_id: # El asesor puede ser opcional
        db_asesor = db.execute(select(Asesor).filter(Asesor.id == poliza.asesor_id)).scalar_one_or_none()
        if not db_asesor:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asesor no encontrado")

    db_poliza = Poliza(**poliza.model_dump())
    db.add(db_poliza)
    db.commit()
    db.refresh(db_poliza)

    # Cargar las relaciones para la respuesta
    poliza_with_relations = db.execute(
        select(Poliza)
        .options(
            selectinload(Poliza.cliente),
            selectinload(Poliza.empresa_aseguradora),
            selectinload(Poliza.asesor)
        )
        .filter(Poliza.id == db_poliza.id)
    ).scalar_one()

    poliza_response = _get_poliza_with_relations_and_map(poliza_with_relations)

    print(f"DEBUG BACKEND: [CREATE_POLIZA] Póliza '{db_poliza.numero_poliza}' creada exitosamente por '{current_user.username}'.")
    return poliza_response

# Ruta para obtener todas las pólizas con paginación y filtros
@router.get("/", response_model=PaginatedPolizasRead, summary="Obtener lista de pólizas") # ¡CRÍTICO! Ruta corregida
async def read_polizas(
    offset: int = Query(0, ge=0, description="Número de elementos a omitir"),
    limit: int = Query(10, ge=1, description="Número máximo de elementos a devolver"),
    search_term: Optional[str] = Query(None, description="Término de búsqueda por número de póliza, nombre o cédula de cliente/asesor"),
    tipo_poliza: Optional[str] = Query(None, description="Filtrar por tipo de póliza"),
    estado: Optional[str] = Query(None, description="Filtrar por estado de póliza"),
    cliente_id: Optional[int] = Query(None, description="Filtrar por ID de cliente"),
    empresa_id: Optional[int] = Query(None, description="Filtrar por ID de empresa aseguradora"),
    asesor_id: Optional[int] = Query(None, description="Filtrar por ID de asesor"),
    fecha_inicio_filter: Optional[datetime] = Query(None, description="Filtrar pólizas que inician en o después de esta fecha"),
    fecha_fin_filter: Optional[datetime] = Query(None, description="Filtrar pólizas que finalizan en o antes de esta fecha"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    print(f"DEBUG BACKEND: [GET_POLIZAS] Usuario '{current_user.username}' solicitando pólizas con offset={offset}, limit={limit}, search_term='{search_term}', tipo='{tipo_poliza}', estado='{estado}', cliente_id='{cliente_id}', empresa_id='{empresa_id}', asesor_id='{asesor_id}', fecha_inicio_filter='{fecha_inicio_filter}', fecha_fin_filter='{fecha_fin_filter}'.")

    query = select(Poliza).options(
        selectinload(Poliza.cliente),
        selectinload(Poliza.empresa_aseguradora),
        selectinload(Poliza.asesor)
    )
    count_query = select(func.count()).select_from(Poliza)

    filters = []

    if search_term:
        search_pattern = f"%{search_term.lower()}%"
        # Buscar en número de póliza, nombre/apellido/cédula de cliente, nombre/apellido/cédula de asesor
        filters.append(
            or_(
                func.lower(Poliza.numero_poliza).like(search_pattern),
                # Búsqueda por cliente
                and_(
                    Poliza.cliente_id.isnot(None),
                    or_(
                        func.lower(Poliza.cliente.has(func.lower(Cliente.nombre).like(search_pattern))),
                        func.lower(Poliza.cliente.has(func.lower(Cliente.apellido).like(search_pattern))),
                        func.lower(Poliza.cliente.has(func.lower(Cliente.cedula).like(search_pattern)))
                    )
                ),
                # Búsqueda por asesor
                and_(
                    Poliza.asesor_id.isnot(None),
                    or_(
                        func.lower(Poliza.asesor.has(func.lower(Asesor.nombre).like(search_pattern))),
                        func.lower(Poliza.asesor.has(func.lower(Asesor.apellido).like(search_pattern))),
                        func.lower(Poliza.asesor.has(func.lower(Asesor.cedula).like(search_pattern)))
                    )
                )
            )
        )

    if tipo_poliza:
        filters.append(Poliza.tipo_poliza == tipo_poliza)
    if estado:
        filters.append(Poliza.estado == estado)
    if cliente_id:
        filters.append(Poliza.cliente_id == cliente_id)
    if empresa_id:
        filters.append(Poliza.empresa_aseguradora_id == empresa_id)
    if asesor_id:
        filters.append(Poliza.asesor_id == asesor_id)
    if fecha_inicio_filter:
        filters.append(Poliza.fecha_inicio >= fecha_inicio_filter)
    if fecha_fin_filter:
        filters.append(Poliza.fecha_fin <= fecha_fin_filter)

    if filters:
        query = query.filter(and_(*filters))
        count_query = count_query.filter(and_(*filters))

    total = db.execute(count_query).scalar_one()
    print(f"DEBUG BACKEND: [GET_POLIZAS] Total de pólizas encontradas (con filtro): {total}")

    polizas_db = db.execute(query.offset(offset).limit(limit)).scalars().all()
    print(f"DEBUG BACKEND: [GET_POLIZAS] Se encontraron {len(polizas_db)} pólizas para la página actual.")
    
    polizas_response_items = []
    for poliza in polizas_db:
        polizas_response_items.append(_get_poliza_with_relations_and_map(poliza))

    return PaginatedPolizasRead(
        items=polizas_response_items,
        total=total,
        page=offset // limit + 1,
        size=limit
    )

# Ruta para obtener una póliza por ID
@router.get("/{poliza_id}", response_model=PolizaRead, summary="Obtener póliza por ID") # ¡CRÍTICO! Ruta corregida
async def get_poliza_by_id(poliza_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    print(f"DEBUG BACKEND: [GET_POLIZA_BY_ID] Usuario '{current_user.username}' solicitando póliza ID: {poliza_id}")
    
    poliza = db.execute(
        select(Poliza)
        .options(
            selectinload(Poliza.cliente),
            selectinload(Poliza.empresa_aseguradora),
            selectinload(Poliza.asesor)
        )
        .filter(Poliza.id == poliza_id)
    ).scalar_one_or_none()

    if not poliza:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Póliza no encontrada")
    
    poliza_response = _get_poliza_with_relations_and_map(poliza)
    print(f"DEBUG BACKEND: [GET_POLIZA_BY_ID] Póliza '{poliza.numero_poliza}' (ID: {poliza_id}) encontrada.")
    return poliza_response

# Ruta para actualizar una póliza
@router.put("/{poliza_id}", response_model=PolizaRead, summary="Actualizar póliza por ID") # ¡CRÍTICO! Ruta corregida
async def update_poliza(
    poliza_id: int,
    poliza_update: PolizaUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    print(f"DEBUG BACKEND: [UPDATE_POLIZA] Usuario '{current_user.username}' intentando actualizar póliza ID: {poliza_id}")

    db_poliza = db.execute(select(Poliza).filter(Poliza.id == poliza_id)).scalar_one_or_none()
    if not db_poliza:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Póliza no encontrada")

    # Validar unicidad del número de póliza si se está actualizando
    if poliza_update.numero_poliza and poliza_update.numero_poliza != db_poliza.numero_poliza:
        existing_poliza = db.execute(select(Poliza).filter(Poliza.numero_poliza == poliza_update.numero_poliza)).scalar_one_or_none()
        if existing_poliza:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El nuevo número de póliza ya existe")

    # Validar que el cliente exista si se proporciona
    if poliza_update.cliente_id is not None:
        db_cliente = db.execute(select(Cliente).filter(Cliente.id == poliza_update.cliente_id)).scalar_one_or_none()
        if not db_cliente:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")

    # Validar que la empresa aseguradora exista si se proporciona
    if poliza_update.empresa_aseguradora_id is not None:
        db_empresa = db.execute(select(EmpresaAseguradora).filter(EmpresaAseguradora.id == poliza_update.empresa_aseguradora_id)).scalar_one_or_none()
        if not db_empresa:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empresa Aseguradora no encontrada")

    # Validar que el asesor exista si se proporciona
    if poliza_update.asesor_id is not None:
        db_asesor = db.execute(select(Asesor).filter(Asesor.id == poliza_update.asesor_id)).scalar_one_or_none()
        if not db_asesor:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asesor no encontrado")

    for key, value in poliza_update.model_dump(exclude_unset=True).items():
        setattr(db_poliza, key, value)

    db.add(db_poliza)
    db.commit()
    db.refresh(db_poliza)

    # Cargar las relaciones para la respuesta
    poliza_with_relations = db.execute(
        select(Poliza)
        .options(
            selectinload(Poliza.cliente),
            selectinload(Poliza.empresa_aseguradora),
            selectinload(Poliza.asesor)
        )
        .filter(Poliza.id == db_poliza.id)
    ).scalar_one()

    updated_poliza_response = _get_poliza_with_relations_and_map(poliza_with_relations)

    print(f"DEBUG BACKEND: [UPDATE_POLIZA] Póliza ID: {poliza_id} actualizada exitosamente por '{current_user.username}'.")
    return updated_poliza_response

# Ruta para eliminar una póliza
@router.delete("/{poliza_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Eliminar póliza por ID") # ¡CRÍTICO! Ruta corregida
async def delete_poliza(poliza_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    print(f"DEBUG BACKEND: [DELETE_POLIZA] Usuario '{current_user.username}' intentando eliminar póliza ID: {poliza_id}")

    db_poliza = db.query(Poliza).filter(Poliza.id == poliza_id).first()
    if not db_poliza:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Póliza no encontrada")

    db.delete(db_poliza)
    db.commit()
    print(f"DEBUG BACKEND: [DELETE_POLIZA] Póliza ID: {poliza_id} eliminada exitosamente por '{current_user.username}'.")
    return {"message": "Póliza eliminada exitosamente"}

# Ruta para obtener pólizas próximas a vencer
@router.get("/proximas_a_vencer/", response_model=List[PolizaRead], summary="Obtener pólizas próximas a vencer") # ¡CRÍTICO! Ruta corregida
async def get_polizas_proximas_a_vencer(
    dias_restantes: int = 30,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Obtiene las pólizas que están próximas a vencer en un número de días especificado.
    Requiere que el usuario esté autenticado.
    """
    # Eliminamos la referencia a 'Rol' en el print de depuración
    print(f"DEBUG BACKEND: [POLIZAS_VENCER] Usuario '{current_user.username}' solicitando pólizas próximas a vencer en {dias_restantes} días.")

    fecha_limite = datetime.now(timezone.utc) + timedelta(days=dias_restantes)

    polizas_proximas = db.execute(
        select(Poliza)
        .options(
            selectinload(Poliza.cliente),
            selectinload(Poliza.empresa_aseguradora),
            selectinload(Poliza.asesor)
        )
        .filter(Poliza.fecha_fin <= fecha_limite, Poliza.estado == "Activa")
        .offset(skip)
        .limit(limit)
    ).scalars().all()

    polizas_response_items = []
    for poliza in polizas_proximas:
        polizas_response_items.append(_get_poliza_with_relations_and_map(poliza))
        
    print(f"DEBUG BACKEND: [POLIZAS_VENCER] Se encontraron {len(polizas_response_items)} pólizas próximas a vencer.")
    return polizas_response_items
