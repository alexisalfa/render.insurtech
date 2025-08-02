# app/crud/reclamacion.py

from typing import List, Optional
from sqlmodel import Session, select
from app.models.reclamacion import Reclamacion
from app.schemas.reclamacion import ReclamacionCreate, ReclamacionUpdate

def crear_reclamacion(session: Session, reclamacion_data: ReclamacionCreate) -> Reclamacion:
    """Crea una nueva reclamación en la base de datos."""
    db_reclamacion = Reclamacion.model_validate(reclamacion_data)
    session.add(db_reclamacion)
    session.commit()
    session.refresh(db_reclamacion)
    return db_reclamacion

def obtener_reclamacion_por_id(session: Session, reclamacion_id: int) -> Optional[Reclamacion]:
    """Obtiene una reclamación específica por su ID."""
    return session.get(Reclamacion, reclamacion_id)

def listar_reclamaciones(session: Session) -> List[Reclamacion]:
    """Obtiene una lista de todas las reclamaciones."""
    statement = select(Reclamacion)
    return session.exec(statement).all()

def actualizar_reclamacion(session: Session, reclamacion_id: int, reclamacion_data: ReclamacionUpdate) -> Optional[Reclamacion]:
    """Actualiza una reclamación existente por su ID."""
    db_reclamacion = session.get(Reclamacion, reclamacion_id)
    if not db_reclamacion:
        return None

    update_data = reclamacion_data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(db_reclamacion, key, value)

    session.add(db_reclamacion)
    session.commit()
    session.refresh(db_reclamacion)
    return db_reclamacion

def eliminar_reclamacion(session: Session, reclamacion_id: int) -> bool:
    """Elimina una reclamación por su ID. Retorna True si se eliminó, False si no se encontró."""
    reclamacion = session.get(Reclamacion, reclamacion_id)
    if reclamacion:
        session.delete(reclamacion)
        session.commit()
        return True
    return False