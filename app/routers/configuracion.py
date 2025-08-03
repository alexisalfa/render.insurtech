# app/routers/configuracion.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.configuracion import Configuracion, ConfiguracionCreate, ConfiguracionRead, ConfiguracionUpdate
from app.models.user import User # Importar el modelo User
from app.utils.auth import get_current_active_user # Para proteger las rutas
from datetime import datetime, timezone

print("DEBUG BACKEND: [CONFIGURACION ROUTER] Archivo configuracion.py cargado.") # <-- ¡Mantén esta línea para depuración!

# CORRECCIÓN CRÍTICA: Añadir prefix y tags al APIRouter
router = APIRouter(prefix="/configuracion", tags=["Configuración"])

# Ruta para obtener la configuración del usuario actual
@router.get("/", response_model=ConfiguracionRead, summary="Obtener la configuración del usuario actual")
async def get_user_configuracion(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Obtiene la configuración específica para el usuario autenticado.
    Si no existe, se devuelve una configuración predeterminada vacía.
    """
    print(f"DEBUG BACKEND: [GET_CONFIGURACION] Usuario '{current_user.username}' (ID: {current_user.id}) solicitando configuración.")
    config = db.query(Configuracion).filter(Configuracion.user_id == current_user.id).first()
    if not config:
        # Si no hay configuración, devuelve una configuración predeterminada vacía
        print(f"DEBUG BACKEND: [GET_CONFIGURACION] No se encontró configuración para el usuario '{current_user.username}'. Devolviendo predeterminada.")
        return ConfiguracionRead(
            user_id=current_user.id,
            pais_region="Venezuela",
            idioma_interfaz="Español",
            simbolo_moneda="$ (Dólar Americano)",
            formato_fecha="DD/MM/YYYY",
            clave_licencia_frontend="" # No se almacena la clave maestra aquí, solo un placeholder
        )
    print(f"DEBUG BACKEND: [GET_CONFIGURACION] Configuración encontrada para el usuario '{current_user.username}'.")
    return config

# Ruta para actualizar o crear la configuración del usuario
@router.put("/", response_model=ConfiguracionRead, summary="Actualizar o crear la configuración del usuario")
async def update_user_configuracion(
    config_update: ConfiguracionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Actualiza la configuración del usuario actual. Si no existe, la crea.
    Requiere que el usuario esté autenticado.
    """
    print(f"DEBUG BACKEND: [UPDATE_CONFIGURACION] Usuario '{current_user.username}' (ID: {current_user.id}) intentando actualizar/crear configuración.")
    db_config = db.query(Configuracion).filter(Configuracion.user_id == current_user.id).first()

    if db_config:
        # Actualizar configuración existente
        for key, value in config_update.model_dump(exclude_unset=True).items():
            setattr(db_config, key, value)
        print(f"DEBUG BACKEND: [UPDATE_CONFIGURACION] Configuración actualizada para usuario '{current_user.username}'.")
    else:
        # Crear nueva configuración
        db_config = Configuracion(user_id=current_user.id, **config_update.model_dump())
        db.add(db_config)
        print(f"DEBUG BACKEND: [UPDATE_CONFIGURACION] Nueva configuración creada para usuario '{current_user.username}'.")

    db.commit()
    db.refresh(db_config)
    return db_config

# Ruta para eliminar la configuración del usuario (opcional, para reset)
@router.delete("/", status_code=status.HTTP_204_NO_CONTENT, summary="Eliminar la configuración del usuario")
async def delete_user_configuracion(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Elimina la configuración del usuario actual.
    Requiere que el usuario esté autenticado.
    """
    print(f"DEBUG BACKEND: [DELETE_CONFIGURACION] Usuario '{current_user.username}' (ID: {current_user.id}) intentando eliminar configuración.")
    db_config = db.query(Configuracion).filter(Configuracion.user_id == current_user.id).first()
    if not db_config:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Configuración no encontrada para este usuario")
    
    db.delete(db_config)
    db.commit()
    print(f"DEBUG BACKEND: [DELETE_CONFIGURACION] Configuración eliminada para usuario '{current_user.username}'.")
    return {"message": "Configuración eliminada exitosamente"}
