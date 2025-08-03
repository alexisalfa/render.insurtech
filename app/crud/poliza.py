# app/crud/poliza.py

from typing import List, Optional
from sqlmodel import Session, select
from app.models.poliza import Poliza
from app.schemas.poliza import PolizaCreate, PolizaUpdate

# --- Función para Crear una Póliza ---
def crear_poliza(session: Session, poliza_data: PolizaCreate) -> Poliza:
    """Crea una nueva póliza en la base de datos."""
    db_poliza = Poliza.model_validate(poliza_data)
    session.add(db_poliza)
    session.commit()
    session.refresh(db_poliza)
    return db_poliza

# --- Función para Obtener una Póliza por ID ---
def obtener_poliza_por_id(session: Session, poliza_id: int) -> Optional[Poliza]:
    """Obtiene una póliza específica por su ID."""
    return session.get(Poliza, poliza_id)

# --- Función para Listar Pólizas (todas) ---
def listar_polizas(session: Session) -> List[Poliza]:
    """Obtiene una lista de todas las pólizas."""
    statement = select(Poliza)
    return session.exec(statement).all()

# --- Función para Actualizar una Póliza ---
def actualizar_poliza(session: Session, poliza_id: int, poliza_data: PolizaUpdate) -> Optional[Poliza]:
    """Actualiza una póliza existente por su ID."""
    db_poliza = session.get(Poliza, poliza_id)
    if not db_poliza:
        return None

    # Excluimos cliente_id de la actualización si no se envía o es None
    # ya que la reasignación de cliente_id debe manejarse con cuidado si se permite
    update_data = poliza_data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(db_poliza, key, value)

    session.add(db_poliza)
    session.commit()
    session.refresh(db_poliza)
    return db_poliza

# --- Función para Eliminar una Póliza ---
def eliminar_poliza(session: Session, poliza_id: int) -> bool:
    """Elimina una póliza por su ID. Retorna True si se eliminó, False si no se encontró."""
    poliza = session.get(Poliza, poliza_id)
    if poliza:
        session.delete(poliza)
        session.commit()
        return True
    return False