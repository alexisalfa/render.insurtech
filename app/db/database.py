from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
from app.models.base import Base  # Asegúrate de que esta importación sea correcta

def init_db(database_url: str):
    """
    Inicializa la base de datos, crea todas las tablas y maneja la conexión de forma segura.
    
    Args:
        database_url: La URL de conexión a la base de datos.
    """
    try:
        # Crea el motor de la base de datos
        engine = create_engine(database_url)

        # Intenta conectar y crear las tablas
        print("DEBUG DB: [INIT_DB] Intentando crear todas las tablas...")
        
        # Usa un bloque de conexión segura con 'begin()' que maneja automáticamente el commit y rollback
        # Esto es más seguro y evita el error de 'commit'
        with engine.begin() as connection:
            Base.metadata.create_all(bind=connection)
            print("DEBUG DB: [INIT_DB] Tablas creadas correctamente.")

        # Opcional: crea una sesión para el resto de la aplicación
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        print("DEBUG BACKEND: [STARTUP] Base de datos inicializada.")

    except SQLAlchemyError as e:
        # Imprime el error si algo falla al crear las tablas
        print(f"ERROR DB: [INIT_DB] Error al crear las tablas: {e}")
    except Exception as e:
        # Maneja cualquier otro error inesperado
        print(f"ERROR DB: [INIT_DB] Error inesperado: {e}")

