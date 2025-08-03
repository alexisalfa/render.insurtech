import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Cargar variables de entorno desde un archivo .env si existe (solo para desarrollo local)
load_dotenv()

# Obtener la URL de la base de datos de la variable de entorno
# En Render, se usará la DATABASE_URL que configuraste.
# En local, se usará la que esté en tu archivo .env.
# Es CRUCIAL que el .env exista y tenga la variable, o se usará la URL por defecto.
DATABASE_URL = os.environ.get("DATABASE_URL")

# Si la variable de entorno no está definida, muestra un error
if not DATABASE_URL:
    raise ValueError("DATABASE_URL no está configurada. Por favor, define la variable de entorno.")

# Crear el motor de la base de datos
engine = create_engine(DATABASE_URL)

# Configurar la clase Base para la declaración de modelos
Base = declarative_base()

# Configurar SessionLocal para la creación de sesiones de base de datos
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """Dependencia para obtener una sesión de base de datos."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """
    Función para crear todas las tablas en la base de datos.
    Esta función solo se debe usar para la configuración inicial en Render.
    """
    print("DEBUG DB: [INIT_DB] Intentando crear todas las tablas...")
    try:
        # Aquí se crea una conexión real para ejecutar el DDL
        with engine.connect() as connection:
            connection.begin()
            Base.metadata.create_all(bind=connection)
            connection.commit()
        print("DEBUG DB: [INIT_DB] Tablas creadas exitosamente.")
    except Exception as e:
        print(f"ERROR DB: [INIT_DB] Error al crear las tablas: {e}")

