# app/routers/__init__.py
# Este archivo agrupa las importaciones de todos tus routers para facilitar el acceso.

# Importa el objeto 'router' de cada módulo de rutas y le asigna un nombre específico
from .user import router as user_router
from .cliente import router as cliente_router
from .poliza import router as poliza_router
from .asesor import router as asesor_router
from .comision import router as comision_router
from .empresa_aseguradora import router as empresa_aseguradora_router
from .historial_cambio import router as historial_cambio_router
from .reclamacion import router as reclamacion_router
from .dashboard import router as dashboard_router # Si tienes un router de dashboard
from .license import router as license_router # Si tienes un router de licencia
from .configuracion import router as configuracion_router # <-- ¡NUEVA LÍNEA AÑADIDA!

# Exporta los routers para que puedan ser incluidos en main.py
# Esto permite que otros archivos hagan 'from app.routers import user_router'
__all__ = [
    "user_router",
    "cliente_router",
    "poliza_router",
    "asesor_router",
    "comision_router",
    "empresa_aseguradora_router",
    "historial_cambio_router",
    "reclamacion_router",
    "dashboard_router",
    "license_router",
    "configuracion_router", # <-- ¡AÑADIDO A LA LISTA!
]
