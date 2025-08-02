# app/routers/cliente.py
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import pandas as pd
from io import BytesIO
from sqlalchemy import func, select # Importar select y func

from app.db.database import get_db
from app.models.cliente import Cliente, ClienteCreate, ClienteRead, ClienteUpdate, PaginatedClientsRead
from app.models.user import User # Importar User para el current_user
from app.utils.auth import get_current_active_user # Importar dependencias de usuario

router = APIRouter(prefix="/clientes", tags=["Clientes"]) # Añadir prefijo y tags

# Ruta para crear un nuevo cliente
@router.post("/", response_model=ClienteRead, status_code=status.HTTP_201_CREATED, summary="Crear nuevo cliente")
async def create_cliente(
    cliente: ClienteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    print(f"DEBUG BACKEND: [CREATE_CLIENTE] Usuario '{current_user.username}' intentando crear cliente: {cliente.cedula}")

    # Validar que la cédula y el email sean únicos
    existing_cliente_cedula = db.execute(select(Cliente).filter(Cliente.cedula == cliente.cedula)).scalar_one_or_none()
    if existing_cliente_cedula:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="La cédula ya existe")
    
    existing_cliente_email = db.execute(select(Cliente).filter(Cliente.email == cliente.email)).scalar_one_or_none()
    if existing_cliente_email:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El email ya existe")

    db_cliente = Cliente(**cliente.model_dump())
    db.add(db_cliente)
    db.commit()
    db.refresh(db_cliente)
    print(f"DEBUG BACKEND: [CREATE_CLIENTE] Cliente '{db_cliente.nombre} {db_cliente.apellido}' creado exitosamente por '{current_user.username}'.")
    return ClienteRead.model_validate(db_cliente)

# Ruta para obtener todos los clientes con paginación y filtro de búsqueda
@router.get("/", response_model=PaginatedClientsRead, summary="Obtener lista de clientes")
async def read_clientes(
    offset: int = Query(0, ge=0, description="Número de elementos a omitir"),
    limit: int = Query(10, ge=1, description="Número máximo de elementos a devolver"), # ¡CRÍTICO! Eliminado le=100
    search_term: Optional[str] = Query(None, description="Término de búsqueda por nombre, apellido, cédula o email"),
    email: Optional[str] = Query(None, description="Filtrar por correo electrónico exacto"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    print(f"DEBUG BACKEND: [GET_CLIENTES] Usuario '{current_user.username}' solicitando clientes con offset={offset}, limit={limit}, search_term='{search_term}', email='{email}'.")

    query = select(Cliente)
    count_query = select(func.count()).select_from(Cliente)

    if search_term:
        search_pattern = f"%{search_term.lower()}%"
        query = query.filter(
            (func.lower(Cliente.nombre).like(search_pattern)) |
            (func.lower(Cliente.apellido).like(search_pattern)) |
            (func.lower(Cliente.cedula).like(search_pattern)) |
            (func.lower(Cliente.email).like(search_pattern))
        )
        count_query = count_query.filter(
            (func.lower(Cliente.nombre).like(search_pattern)) |
            (func.lower(Cliente.apellido).like(search_pattern)) |
            (func.lower(Cliente.cedula).like(search_pattern)) |
            (func.lower(Cliente.email).like(search_pattern))
        )
    
    if email:
        query = query.filter(func.lower(Cliente.email) == email.lower())
        count_query = count_query.filter(func.lower(Cliente.email) == email.lower())

    total = db.execute(count_query).scalar_one()
    print(f"DEBUG BACKEND: [GET_CLIENTES] Total de clientes encontrados (con filtro): {total}")

    clientes_db = db.execute(query.offset(offset).limit(limit)).scalars().all()
    print(f"DEBUG BACKEND: [GET_CLIENTES] Se encontraron {len(clientes_db)} clientes para la página actual.")
    
    return PaginatedClientsRead(
        items=[ClienteRead.model_validate(cliente) for cliente in clientes_db],
        total=total,
        page=offset // limit + 1,
        size=limit
    )

# Ruta para obtener un cliente por ID
@router.get("/{cliente_id}", response_model=ClienteRead, summary="Obtener cliente por ID")
async def get_cliente_by_id(cliente_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    print(f"DEBUG BACKEND: [GET_CLIENTE_BY_ID] Usuario '{current_user.username}' solicitando cliente ID: {cliente_id}")
    cliente = db.execute(select(Cliente).filter(Cliente.id == cliente_id)).scalar_one_or_none()
    if not cliente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")
    print(f"DEBUG BACKEND: [GET_CLIENTE_BY_ID] Cliente '{cliente.nombre} {cliente.apellido}' (ID: {cliente_id}) encontrado.")
    return ClienteRead.model_validate(cliente)

# Ruta para actualizar un cliente
@router.put("/{cliente_id}", response_model=ClienteRead, summary="Actualizar cliente por ID")
async def update_cliente(
    cliente_id: int,
    cliente_update: ClienteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    print(f"DEBUG BACKEND: [UPDATE_CLIENTE] Usuario '{current_user.username}' intentando actualizar cliente ID: {cliente_id}")

    db_cliente = db.execute(select(Cliente).filter(Cliente.id == cliente_id)).scalar_one_or_none()
    if not db_cliente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")

    # Validar que la cédula o el email no se dupliquen si se están actualizando
    if cliente_update.cedula and cliente_update.cedula != db_cliente.cedula:
        existing_cliente_cedula = db.execute(select(Cliente).filter(Cliente.cedula == cliente_update.cedula)).scalar_one_or_none()
        if existing_cliente_cedula:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="La nueva cédula ya existe para otro cliente")

    if cliente_update.email and cliente_update.email != db_cliente.email:
        existing_cliente_email = db.execute(select(Cliente).filter(Cliente.email == cliente_update.email)).scalar_one_or_none()
        if existing_cliente_email:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El nuevo email ya existe para otro cliente")


    for key, value in cliente_update.model_dump(exclude_unset=True).items():
        setattr(db_cliente, key, value)

    db.add(db_cliente)
    db.commit()
    db.refresh(db_cliente)
    print(f"DEBUG BACKEND: [UPDATE_CLIENTE] Cliente ID: {cliente_id} actualizado exitosamente por '{current_user.username}'.")
    return ClienteRead.model_validate(db_cliente)

# Ruta para eliminar un cliente
@router.delete("/{cliente_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Eliminar cliente por ID")
async def delete_cliente(cliente_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    print(f"DEBUG BACKEND: [DELETE_CLIENTE] Usuario '{current_user.username}' intentando eliminar cliente ID: {cliente_id}")

    db_cliente = db.execute(select(Cliente).filter(Cliente.id == cliente_id)).scalar_one_or_none()
    if not db_cliente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")

    db.delete(db_cliente)
    db.commit()
    print(f"DEBUG BACKEND: [DELETE_CLIENTE] Cliente ID: {cliente_id} eliminado exitosamente por '{current_user.username}'.")
    return {"message": "Cliente eliminado exitosamente"}

# Ruta para importar clientes desde CSV
@router.post("/import/csv/", summary="Importar clientes desde archivo CSV")
async def import_clientes_csv(
    file: UploadFile = File(..., description="Archivo CSV para importar clientes"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    print(f"DEBUG BACKEND: [IMPORT_CLIENTES] Usuario '{current_user.username}' intentando importar clientes desde CSV.")
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Formato de archivo no válido. Se espera un archivo CSV.")

    try:
        content = await file.read()
        df = pd.read_csv(BytesIO(content))

        imported_count = 0
        errors = []

        # Validar y procesar cada fila del CSV
        for index, row in df.iterrows():
            try:
                cliente_data = ClienteCreate(
                    nombre=row["nombre"],
                    apellido=row["apellido"],
                    cedula=str(row["cedula"]), # Asegurar que sea string
                    telefono=str(row.get("telefono", "")), # Opcional, con valor por defecto
                    email=row["email"],
                    direccion=row.get("direccion", ""), # Opcional
                    fecha_nacimiento=pd.to_datetime(row["fecha_nacimiento"]).isoformat() if pd.notna(row["fecha_nacimiento"]) else None # Convertir a ISO
                )
                
                # Verificar unicidad de cédula y email antes de añadir
                existing_cedula = db.execute(select(Cliente).filter(Cliente.cedula == cliente_data.cedula)).scalar_one_or_none()
                existing_email = db.execute(select(Cliente).filter(Cliente.email == cliente_data.email)).scalar_one_or_none()

                if existing_cedula:
                    errors.append(f"Fila {index+1}: Cédula '{cliente_data.cedula}' ya existe.")
                    continue
                if existing_email:
                    errors.append(f"Fila {index+1}: Email '{cliente_data.email}' ya existe.")
                    continue

                db_cliente = Cliente(**cliente_data.model_dump())
                db.add(db_cliente)
                db.commit()
                db.refresh(db_cliente)
                imported_count += 1
            except Exception as e:
                db.rollback() # Hacer rollback en caso de error en una fila
                errors.append(f"Fila {index+1}: Error al procesar - {e}")
                print(f"DEBUG BACKEND: [IMPORT_CLIENTES] Error en fila {index+1}: {e}")

        if errors:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Se importaron {imported_count} clientes con errores en algunas filas: {'; '.join(errors)}"
            )

        print(f"DEBUG BACKEND: [IMPORT_CLIENTES] Se importaron {imported_count} clientes exitosamente.")
        return {"message": f"Se importaron {imported_count} clientes exitosamente."}

    except Exception as e:
        print(f"DEBUG BACKEND: [IMPORT_CLIENTES] Error general en la importación: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error al procesar el archivo CSV: {e}")

