# app/crud/cliente.py

from sqlmodel import Session, select
from typing import List, Optional # Asegúrate de que Optional esté importado

# Importa tu modelo de base de datos
from app.models.cliente import Cliente

# Importa tus esquemas Pydantic que acabamos de definir/actualizar
from app.schemas.cliente import ClienteCreate, ClienteUpdate, ClienteRead # Asegúrate de importar ClienteCreate y ClienteUpdate

# --- FUNCIONES DE CREACIÓN (CREATE) ---

def crear_cliente(session: Session, cliente_data: ClienteCreate) -> Cliente:
    """Crea un nuevo cliente en la base de datos a partir de los datos del esquema ClienteCreate."""
    # Convertimos el esquema Pydantic a una instancia del modelo de base de datos
    db_cliente = Cliente.model_validate(cliente_data) # Usa model_validate para crear la instancia del modelo
    session.add(db_cliente)
    session.commit()
    session.refresh(db_cliente) # Refresca para obtener el ID y fecha_registro generados por la DB
    return db_cliente

# --- FUNCIONES DE LECTURA (READ) ---

def obtener_cliente_por_id(session: Session, cliente_id: int) -> Optional[Cliente]: # Usamos Optional aquí para mayor claridad
    """Obtiene un cliente específico por su ID."""
    return session.get(Cliente, cliente_id)

def listar_clientes(session: Session) -> List[Cliente]: # Usamos List de typing para el tipo hint
    """Obtiene todos los clientes de la base de datos."""
    statement = select(Cliente)
    return session.exec(statement).all()

# --- FUNCIONES DE ACTUALIZACIÓN (UPDATE) ---

def actualizar_cliente(session: Session, cliente_id: int, cliente_data: ClienteUpdate) -> Optional[Cliente]:
    """Actualiza un cliente existente por su ID con los datos proporcionados en ClienteUpdate."""
    db_cliente = session.get(Cliente, cliente_id)
    if not db_cliente:
        return None # Cliente no encontrado

    # Iteramos sobre los datos recibidos en cliente_data (del esquema ClienteUpdate)
    # y actualizamos solo los campos que vienen con un valor (exclude_unset=True)
    # y que no son None (exclude_none=True), para no sobreescribir con Nones si no se envían.
    # Si quieres permitir que un cliente envíe 'None' explícitamente para borrar un campo,
    # remueve 'exclude_none=True'. Para actualizar, 'exclude_unset' es clave.
    update_data = cliente_data.model_dump(exclude_unset=True) # Solo incluye los campos que fueron definidos en el JSON enviado

    for key, value in update_data.items():
        setattr(db_cliente, key, value) # Actualiza el atributo correspondiente en el objeto Cliente

    session.add(db_cliente) # Vuelve a añadirlo a la sesión para que SQLModel detecte los cambios
    session.commit()
    session.refresh(db_cliente) # Refresca para obtener los datos actualizados de la DB
    return db_cliente

# --- FUNCIONES DE ELIMINACIÓN (DELETE) ---

def eliminar_cliente(session: Session, cliente_id: int) -> bool:
    """Elimina un cliente por su ID. Retorna True si se eliminó, False si no se encontró."""
    cliente = session.get(Cliente, cliente_id)
    if cliente:
        session.delete(cliente)
        session.commit()
        return True
    return False