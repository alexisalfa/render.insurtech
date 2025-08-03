from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# URL de la base de datos PostgreSQL
# Asegúrate de que esta URL coincida con tu configuración de PostgreSQL
# Formato: "postgresql://usuario:contraseña@host:puerto/nombre_base_de_datos"
DATABASE_URL = "postgresql://postgres:2424@localhost:5432/insurtech_db" # ¡CAMBIO CRÍTICO!

# Crear el motor de la base de datos
engine = create_engine(DATABASE_URL)

# Crear una clase Base para los modelos declarativos
Base = declarative_base()

# Crear una sesión de base de datos
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Función para obtener la sesión de la base de datos (dependencia para FastAPI)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Función para inicializar la base de datos (crear todas las tablas)
def init_db():
    """
    Crea todas las tablas definidas en los modelos de SQLAlchemy.
    Debe llamarse solo una vez al iniciar la aplicación,
    o después de borrar y recrear la base de datos en desarrollo.
    """
    print("DEBUG DB: [INIT_DB] Intentando crear todas las tablas...")
    Base.metadata.create_all(bind=engine)
    print("DEBUG DB: [INIT_DB] Tablas creadas (o ya existentes).")
