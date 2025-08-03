# app/db/database.py
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# Obtiene la URL de la base de datos de la variable de entorno de Render
DATABASE_URL = os.getenv("DATABASE_URL")

# Si no se encuentra la URL, levanta un error
if not DATABASE_URL:
    raise ValueError("DATABASE_URL no está configurada. Por favor, revisa las variables de entorno de Render.")

# Crea el motor de la base de datos, usando un pool_pre_ping para mantener la conexión
engine = create_engine(
    DATABASE_URL, 
    pool_pre_ping=True
)

# Configura la clase de sesión que tu aplicación usará para interactuar con la base de datos
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Crea la clase base de la que heredarán todos tus modelos (tablas)
Base = declarative_base()
