# app/main.py
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Any
from datetime import timedelta, datetime, timezone

# Importaciones de modelos y utilidades
from app.db.database import get_db, init_db
from app.models.user import User, UserCreate, UserRead, UserLogin, Token, LicenseStatusResponse
# Importar TODOS los routers que hemos creado. Es CRÍTICO que todos estén aquí.
# ¡Basado en tu main.py que funcionaba!
from app.routers import user, cliente, poliza, reclamacion, empresa_aseguradora, asesor, comision, historial_cambio, configuracion, dashboard
from app.utils.auth import authenticate_user, create_access_token, get_current_active_user, ACCESS_TOKEN_EXPIRE_MINUTES

# Importar CORSMiddleware
from starlette.middleware.cors import CORSMiddleware

app = FastAPI(
    title="API de Gestión de Seguros",
    description="API para la gestión de clientes, pólizas, reclamaciones, empresas aseguradoras, asesores y comisiones.",
    version="1.0.0",
)

@app.on_event("startup")
async def startup_event():
    """
    Evento que se ejecuta al iniciar la aplicación FastAPI.
    Se encarga de inicializar la base de datos, creando todas las tablas
    definidas en los modelos si no existen.
    También imprime todas las rutas registradas para depuración.
    """
    print("DEBUG BACKEND: [STARTUP] Inicializando base de datos...")
    init_db() # Llama a la función que crea las tablas
    print("DEBUG BACKEND: [STARTUP] Base de datos inicializada.")

    # --- INICIO DE CÓDIGO DE DEPURACIÓN DE RUTAS ---
    print("DEBUG BACKEND: [FASTAPI ROUTES] Rutas registradas:")
    for route in app.routes:
        # Manejar rutas directas de la aplicación
        if hasattr(route, 'path') and hasattr(route, 'methods'):
            print(f"  Path: {route.path}, Methods: {list(route.methods)}")
        # Manejar rutas dentro de routers incluidos
        elif hasattr(route, 'routes'):
            for sub_route in route.routes:
                if hasattr(sub_route, 'path') and hasattr(sub_route, 'methods'):
                    # Construir el path completo incluyendo el prefijo del router
                    full_path = f"{route.prefix}{sub_route.path}" if hasattr(route, 'prefix') else sub_route.path
                    print(f"  Path: {full_path}, Methods: {list(sub_route.methods)}")
    print("DEBUG BACKEND: [FASTAPI ROUTES] Fin de listado de rutas.")
    # --- FIN DE CÓDIGO DE DEPURACIÓN DE RUTAS ---


# Configuración de CORS
# Para desarrollo, permitimos todos los orígenes. En producción, esto debería ser más restrictivo.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permitir solicitudes de CUALQUIER origen (para desarrollo)
    allow_credentials=True,
    allow_methods=["*"],  # Permitir todos los métodos (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Permitir todos los headers
)

# Incluir routers
# ¡ES CRÍTICO QUE TODOS LOS ROUTERS CREADOS ESTÉN INCLUIDOS AQUÍ!
# Asegúrate de que el router de usuario incluya la ruta /license-status
app.include_router(user.router, prefix="/api/v1/auth", tags=["Autenticación"])
app.include_router(cliente.router, prefix="/api/v1", tags=["Clientes"])
app.include_router(poliza.router, prefix="/api/v1/polizas", tags=["Pólizas"]) # Aseguramos que este esté aquí
app.include_router(reclamacion.router, prefix="/api/v1/reclamaciones", tags=["Reclamaciones"])
app.include_router(empresa_aseguradora.router, prefix="/api/v1", tags=["Empresas Aseguradoras"])
# ¡CRÍTICO! Prefijo corregido para asesor para que sea consistente con clientes y empresas_aseguradoras
# Asegúrate de que SOLO haya UNA línea para incluir el router de 'asesor'
app.include_router(asesor.router, prefix="/api/v1", tags=["Asesores"])
app.include_router(comision.router, prefix="/api/v1/comisiones", tags=["Comisiones"])
app.include_router(historial_cambio.router, prefix="/api/v1/historial_cambio", tags=["Historial de Cambios"])
app.include_router(configuracion.router, prefix="/api/v1/configuracion", tags=["Configuración"])
app.include_router(dashboard.router, prefix="/api/v1", tags=["Estadísticas del Dashboard"])

@app.post("/api/v1/auth/token", response_model=Token, summary="Obtener token de autenticación")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Autentica a un usuario y devuelve un token JWT.
    """
    print(f"DEBUG BACKEND: [LOGIN] Intentando autenticar usuario: {form_data.username}")
    user_obj = authenticate_user(db, form_data.username, form_data.password) # Renombrado a user_obj para evitar conflicto con el módulo user
    if not user_obj:
        print(f"DEBUG BACKEND: [LOGIN] Autenticación fallida para usuario: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nombre de usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verificar si el usuario está activo
    if not user_obj.is_active:
        print(f"DEBUG BACKEND: [LOGIN] Usuario '{user_obj.username}' inactivo.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Usuario inactivo")

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Generar token con la información de licencia del usuario
    access_token = create_access_token(
        data={
            "sub": user_obj.username,
            "is_active": user_obj.is_active,
            "is_trial": user_obj.is_trial,
            "license_end_date": user_obj.license_end_date.isoformat() if user_obj.license_end_date else None
        },
        expires_delta=access_token_expires
    )
    print(f"DEBUG BACKEND: [LOGIN] Usuario '{user_obj.username}' autenticado exitosamente. Token generado.")
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/v1/protected-route/", summary="Ruta protegida para usuarios activos")
async def protected_route(current_user: User = Depends(get_current_active_user)):
    """
    Una ruta de ejemplo que requiere autenticación.
    """
    print(f"DEBUG BACKEND: [PROTECTED ROUTE] Acceso concedido a usuario: {current_user.username}")
    return {"message": f"Bienvenido, {current_user.username}! Eres un usuario activo."}

