# app/routers/empresa_aseguradora.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from sqlalchemy import func, select # Importar select y func

from app.db.database import get_db
from app.models.empresa_aseguradora import EmpresaAseguradora, EmpresaAseguradoraCreate, EmpresaAseguradoraRead, EmpresaAseguradoraUpdate, PaginatedEmpresasAseguradorasRead
from app.models.user import User # Importar User para el current_user
from app.utils.auth import get_current_active_user # Importar dependencias de usuario

router = APIRouter(prefix="/empresas_aseguradoras", tags=["Empresas Aseguradoras"]) # Añadir prefijo y tags

# Ruta para crear una nueva empresa aseguradora
@router.post("/", response_model=EmpresaAseguradoraRead, status_code=status.HTTP_201_CREATED, summary="Crear nueva empresa aseguradora")
async def create_empresa_aseguradora(
    empresa: EmpresaAseguradoraCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    print(f"DEBUG BACKEND: [CREATE_EMPRESA] Usuario '{current_user.username}' intentando crear empresa: {empresa.nombre}")

    # Validar que el RIF sea único
    existing_empresa = db.execute(select(EmpresaAseguradora).filter(EmpresaAseguradora.rif == empresa.rif)).scalar_one_or_none()
    if existing_empresa:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El RIF ya existe")

    db_empresa = EmpresaAseguradora(**empresa.model_dump())
    db.add(db_empresa)
    db.commit()
    db.refresh(db_empresa)
    print(f"DEBUG BACKEND: [CREATE_EMPRESA] Empresa '{db_empresa.nombre}' creada exitosamente por '{current_user.username}'.")
    return EmpresaAseguradoraRead.model_validate(db_empresa)

# Ruta para obtener todas las empresas aseguradoras con paginación y filtro de búsqueda
@router.get("/", response_model=PaginatedEmpresasAseguradorasRead, summary="Obtener lista de empresas aseguradoras")
async def read_empresas_aseguradoras(
    offset: int = Query(0, ge=0, description="Número de elementos a omitir"),
    limit: int = Query(10, ge=1, description="Número máximo de elementos a devolver"), # ¡CRÍTICO! Eliminado le=100
    search_term: Optional[str] = Query(None, description="Término de búsqueda por nombre o RIF"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    print(f"DEBUG BACKEND: [GET_EMPRESAS] Usuario '{current_user.username}' solicitando empresas con offset={offset}, limit={limit}, search_term='{search_term}'.")

    query = select(EmpresaAseguradora)
    count_query = select(func.count()).select_from(EmpresaAseguradora)

    if search_term:
        search_pattern = f"%{search_term.lower()}%"
        query = query.filter(
            (func.lower(EmpresaAseguradora.nombre).like(search_pattern)) |
            (func.lower(EmpresaAseguradora.rif).like(search_pattern))
        )
        count_query = count_query.filter(
            (func.lower(EmpresaAseguradora.nombre).like(search_pattern)) |
            (func.lower(EmpresaAseguradora.rif).like(search_pattern))
        )

    total = db.execute(count_query).scalar_one()
    print(f"DEBUG BACKEND: [GET_EMPRESAS] Total de empresas encontradas (con filtro): {total}")

    empresas_db = db.execute(query.offset(offset).limit(limit)).scalars().all()
    print(f"DEBUG BACKEND: [GET_EMPRESAS] Se encontraron {len(empresas_db)} empresas para la página actual.")
    
    return PaginatedEmpresasAseguradorasRead(
        items=[EmpresaAseguradoraRead.model_validate(empresa) for empresa in empresas_db],
        total=total,
        page=offset // limit + 1,
        size=limit
    )

# Ruta para obtener una empresa aseguradora por ID
@router.get("/{empresa_id}/", response_model=EmpresaAseguradoraRead, summary="Obtener empresa aseguradora por ID")
async def get_empresa_aseguradora_by_id(empresa_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    print(f"DEBUG BACKEND: [GET_EMPRESA_BY_ID] Usuario '{current_user.username}' solicitando empresa ID: {empresa_id}")
    empresa = db.execute(select(EmpresaAseguradora).filter(EmpresaAseguradora.id == empresa_id)).scalar_one_or_none()
    if not empresa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empresa Aseguradora no encontrada")
    print(f"DEBUG BACKEND: [GET_EMPRESA_BY_ID] Empresa '{empresa.nombre}' (ID: {empresa_id}) encontrada.")
    return EmpresaAseguradoraRead.model_validate(empresa)

# Ruta para actualizar una empresa aseguradora
@router.put("/{empresa_id}/", response_model=EmpresaAseguradoraRead, summary="Actualizar empresa aseguradora por ID")
async def update_empresa_aseguradora(
    empresa_id: int,
    empresa_update: EmpresaAseguradoraUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    print(f"DEBUG BACKEND: [UPDATE_EMPRESA] Usuario '{current_user.username}' intentando actualizar empresa ID: {empresa_id}")

    db_empresa = db.execute(select(EmpresaAseguradora).filter(EmpresaAseguradora.id == empresa_id)).scalar_one_or_none()
    if not db_empresa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empresa Aseguradora no encontrada")

    # Validar que el RIF no se duplique si se está actualizando
    if empresa_update.rif and empresa_update.rif != db_empresa.rif:
        existing_empresa = db.execute(select(EmpresaAseguradora).filter(EmpresaAseguradora.rif == empresa_update.rif)).scalar_one_or_none()
        if existing_empresa:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El nuevo RIF ya existe para otra empresa")

    for key, value in empresa_update.model_dump(exclude_unset=True).items():
        setattr(db_empresa, key, value)

    db.add(db_empresa)
    db.commit()
    db.refresh(db_empresa)
    print(f"DEBUG BACKEND: [UPDATE_EMPRESA] Empresa ID: {empresa_id} actualizada exitosamente por '{current_user.username}'.")
    return EmpresaAseguradoraRead.model_validate(db_empresa)

# Ruta para eliminar una empresa aseguradora
@router.delete("/{empresa_id}/", status_code=status.HTTP_204_NO_CONTENT, summary="Eliminar empresa aseguradora por ID")
async def delete_empresa_aseguradora(empresa_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    print(f"DEBUG BACKEND: [DELETE_EMPRESA] Usuario '{current_user.username}' intentando eliminar empresa ID: {empresa_id}")

    db_empresa = db.execute(select(EmpresaAseguradora).filter(EmpresaAseguradora.id == empresa_id)).scalar_one_or_none()
    if not db_empresa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empresa Aseguradora no encontrada")

    db.delete(db_empresa)
    db.commit()
    print(f"DEBUG BACKEND: [DELETE_EMPRESA] Empresa ID: {empresa_id} eliminada exitosamente por '{current_user.username}'.")
    return {"message": "Empresa Aseguradora eliminada exitosamente"}
