from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# La URL de tu base de datos, que se carga desde una variable de entorno.
# Asegúrate de que esta variable 'DATABASE_URL' esté configurada en Render.
DATABASE_URL = "postgresql://user:password@host:port/dbname" 

# Crea el motor de la base de datos
# El 'echo=True' es opcional, muestra las sentencias SQL en la consola para depuración
engine = create_engine(DATABASE_URL, pool_pre_ping=True, echo=False)

# Crea una sesión local. Esta es la clase que se usará para crear sesiones.
# El 'autocommit=False' asegura que las transacciones no se guarden automáticamente
# El 'autoflush=False' desactiva el vaciado automático de la sesión
# El 'bind=engine' conecta la sesión al motor de la base de datos
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Crea una clase base declarativa.
# Esta es la base de la que heredarán todos tus modelos (tablas)
Base = declarative_base()
