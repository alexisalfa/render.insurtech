# app/routers/asesor.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, selectinload # Usar selectinload
from typing import List, Optional
from sqlalchemy import func, select # Importar select y func

from app.db.database import get_db
from app.models.asesor import Asesor, AsesorCreate, AsesorRead, AsesorUpdate, PaginatedAsesoresRead
from app.models.empresa_aseguradora import EmpresaAseguradora # Importar EmpresaAseguradora para validación
from app.models.user import User # Importar User para el current_user
from app.utils.auth import get_current_active_user # Importar dependencias de usuario

router = APIRouter(prefix="/asesores", tags=["Asesores"]) # Añadir prefijo y tags

# Función auxiliar para cargar asesor con relaciones y mapear a AsesorRead
def _get_asesor_with_relations_and_map(db_asesor: Asesor) -> AsesorRead:
    """Carga las relaciones de un asesor y mapea a AsesorRead, incluyendo campos planos."""
    asesor_read_item = AsesorRead.model_validate(db_asesor)
    
    # Aquí puedes añadir campos planos si EmpresaAseguradoraRead tiene un campo plano para el nombre
    # Por ejemplo:
    # if db_asesor.empresa_aseguradora:
    #     asesor_read_item.empresa_aseguradora_nombre = db_asesor.empresa_aseguradora.nombre
    
    return asesor_read_item

# Ruta para crear un nuevo asesor
@router.post("/", response_model=AsesorRead, status_code=status.HTTP_201_CREATED, summary="Crear nuevo asesor")
async def create_asesor(
    asesor: AsesorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    print(f"DEBUG BACKEND: [CREATE_ASESOR] Usuario '{current_user.username}' intentando crear asesor: {asesor.cedula}")

    # Validar que la cédula y el email sean únicos
    existing_asesor_cedula = db.execute(select(Asesor).filter(Asesor.cedula == asesor.cedula)).scalar_one_or_none()
    if existing_asesor_cedula:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="La cédula ya existe")
    
    existing_asesor_email = db.execute(select(Asesor).filter(Asesor.email == asesor.email)).scalar_one_or_none()
    if existing_asesor_email:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El email ya existe")

    # Validar que la empresa aseguradora exista si se proporciona
    if asesor.empresa_aseguradora_id:
        db_empresa = db.execute(select(EmpresaAseguradora).filter(EmpresaAseguradora.id == asesor.empresa_aseguradora_id)).scalar_one_or_none()
        if not db_empresa:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empresa Aseguradora no encontrada")

    db_asesor = Asesor(**asesor.model_dump())
    db.add(db_asesor)
    db.commit()
    db.refresh(db_asesor)

    # Cargar la relación para la respuesta
    asesor_with_relations = db.execute(
        select(Asesor)
        .options(selectinload(Asesor.empresa_aseguradora))
        .filter(Asesor.id == db_asesor.id)
    ).scalar_one()

    asesor_response = _get_asesor_with_relations_and_map(asesor_with_relations)

    print(f"DEBUG BACKEND: [CREATE_ASESOR] Asesor '{db_asesor.nombre} {db_asesor.apellido}' creado exitosamente por '{current_user.username}'.")
    return asesor_response

# Ruta para obtener todos los asesores con paginación y filtro de búsqueda
@router.get("/", response_model=PaginatedAsesoresRead, summary="Obtener lista de asesores")
async def read_asesores(
    offset: int = Query(0, ge=0, description="Número de elementos a omitir"),
    limit: int = Query(10, ge=1, description="Número máximo de elementos a devolver"), # ¡CRÍTICO! Eliminado le=100
    search_term: Optional[str] = Query(None, description="Término de búsqueda por nombre, apellido, cédula o email"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    print(f"DEBUG BACKEND: [GET_ASESORES] Usuario '{current_user.username}' solicitando asesores con offset={offset}, limit={limit}, search_term='{search_term}'.")

    query = select(Asesor).options(selectinload(Asesor.empresa_aseguradora))
    count_query = select(func.count()).select_from(Asesor)

    if search_term:
        search_pattern = f"%{search_term.lower()}%"
        query = query.filter(
            (func.lower(Asesor.nombre).like(search_pattern)) |
            (func.lower(Asesor.apellido).like(search_pattern)) |
            (func.lower(Asesor.cedula).like(search_pattern)) |
            (func.lower(Asesor.email).like(search_pattern))
        )
        count_query = count_query.filter(
            (func.lower(Asesor.nombre).like(search_pattern)) |
            (func.lower(Asesor.apellido).like(search_pattern)) |
            (func.lower(Asesor.cedula).like(search_pattern)) |
            (func.lower(Asesor.email).like(search_pattern))
        )

    total = db.execute(count_query).scalar_one()
    print(f"DEBUG BACKEND: [GET_ASESORES] Total de asesores encontrados (con filtro): {total}")

    asesores_db = db.execute(query.offset(offset).limit(limit)).scalars().all()
    print(f"DEBUG BACKEND: [GET_ASESORES] Se encontraron {len(asesores_db)} asesores para la página actual.")
    
    asesores_response_items = []
    for asesor in asesores_db:
        asesores_response_items.append(_get_asesor_with_relations_and_map(asesor))
            
    return PaginatedAsesoresRead(
        items=asesores_response_items,
        total=total,
        page=offset // limit + 1,
        size=limit
    )

# Ruta para obtener un asesor por ID
@router.get("/{asesor_id}", response_model=AsesorRead, summary="Obtener asesor por ID")
async def get_asesor_by_id(asesor_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    print(f"DEBUG BACKEND: [GET_ASESOR_BY_ID] Usuario '{current_user.username}' solicitando asesor ID: {asesor_id}")
    
    asesor = db.execute(
        select(Asesor)
        .options(selectinload(Asesor.empresa_aseguradora))
        .filter(Asesor.id == asesor_id)
    ).scalar_one_or_none()

    if not asesor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asesor no encontrado")
    
    asesor_response = _get_asesor_with_relations_and_map(asesor)
    print(f"DEBUG BACKEND: [GET_ASESOR_BY_ID] Asesor '{asesor.nombre} {asesor.apellido}' (ID: {asesor_id}) encontrado.")
    return asesor_response

# Ruta para actualizar un asesor
@router.put("/{asesor_id}", response_model=AsesorRead, summary="Actualizar asesor por ID")
async def update_asesor(
    asesor_id: int,
    asesor_update: AsesorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    print(f"DEBUG BACKEND: [UPDATE_ASESOR] Usuario '{current_user.username}' intentando actualizar asesor ID: {asesor_id}")

    db_asesor = db.execute(select(Asesor).filter(Asesor.id == asesor_id)).scalar_one_or_none()
    if not db_asesor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asesor no encontrado")

    # Validar que la cédula o el email no se dupliquen si se están actualizando
    if asesor_update.cedula and asesor_update.cedula != db_asesor.cedula:
        existing_asesor_cedula = db.execute(select(Asesor).filter(Asesor.cedula == asesor_update.cedula)).scalar_one_or_none()
        if existing_asesor_cedula:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="La nueva cédula ya existe para otro asesor")

    if asesor_update.email and asesor_update.email != db_asesor.email:
        existing_asesor_email = db.execute(select(Asesor).filter(Asesor.email == asesor_update.email)).scalar_one_or_none()
        if existing_asesor_email:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El nuevo email ya existe para otro asesor")

    # Validar que la empresa aseguradora exista si se proporciona
    if asesor_update.empresa_aseguradora_id is not None:
        db_empresa = db.execute(select(EmpresaAseguradora).filter(EmpresaAseguradora.id == asesor_update.empresa_aseguradora_id)).scalar_one_or_none()
        if not db_empresa:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empresa Aseguradora no encontrada")

    # Actualizar campos
    for key, value in asesor_update.model_dump(exclude_unset=True).items():
        setattr(db_asesor, key, value)

    db.add(db_asesor)
    db.commit()
    db.refresh(db_asesor)

    # Cargar la relación para la respuesta
    asesor_with_relations = db.execute(
        select(Asesor)
        .options(selectinload(Asesor.empresa_aseguradora))
        .filter(Asesor.id == db_asesor.id)
    ).scalar_one()

    updated_asesor_response = _get_asesor_with_relations_and_map(asesor_with_relations)

    print(f"DEBUG BACKEND: [UPDATE_ASESOR] Asesor ID: {asesor_id} actualizado exitosamente por '{current_user.username}'.")
    return updated_asesor_response

# Ruta para eliminar un asesor
@router.delete("/{asesor_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Eliminar asesor por ID")
async def delete_asesor(asesor_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    print(f"DEBUG BACKEND: [DELETE_ASESOR] Usuario '{current_user.username}' intentando eliminar asesor ID: {asesor_id}")

    db_asesor = db.execute(select(Asesor).filter(Asesor.id == asesor_id)).scalar_one_or_none()
    if not db_asesor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asesor no encontrado")

    db.delete(db_asesor)
    db.commit()
    print(f"DEBUG BACKEND: [DELETE_ASESOR] Asesor ID: {asesor_id} eliminado exitosamente por '{current_user.username}'.")
    return {"message": "Asesor eliminado exitosamente"}
