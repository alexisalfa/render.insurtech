# app/init_models.py

# Importar SQLModel para la gestión de metadatos
from sqlmodel import SQLModel

# Importar el motor de la base de datos desde tu configuración
# Asegúrate de que 'engine' se exporte correctamente desde app/db/database.py
from app.db.database import engine

# --- ¡CRÍTICO! Importar TODOS tus modelos aquí ---
# Esto asegura que SQLModel.metadata.create_all() los descubra y registre.
# Aunque no usemos Mapped, necesitamos que las clases estén cargadas.
from app.models.user import User
from app.models.cliente import Cliente
from app.models.poliza import Poliza
from app.models.asesor import Asesor
from app.models.comision import ComisionAsesor
from app.models.reclamacion import Reclamacion
from app.models.empresa_aseguradora import EmpresaAseguradora
from app.models.historial_cambio import HistorialCambio


def init_model_metadata():
    """
    Función para inicializar los metadatos de SQLModel y crear las tablas
    en la base de datos si no existen.
    Esta función se invoca explícitamente durante el startup de FastAPI.
    """
    print("DEBUG: Ejecutando init_model_metadata()...") # Mensaje de depuración
    # --- ¡NUEVO! Limpiar el registro de metadatos antes de crear ---
    SQLModel.metadata.clear() # <--- ¡ESTA LÍNEA ES CLAVE!
    SQLModel.metadata.create_all(engine)
    print("DEBUG: Metadatos de modelos cargados y tablas verificadas/creadas.")

