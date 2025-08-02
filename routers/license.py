# app/routers/license.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import datetime, timedelta

from app.db.database import get_db
from app.models.user import User, UserRead, LicenseStatusResponse
from app.utils.auth import get_current_user

router = APIRouter()

# Constantes para la licencia (podrían ir en un archivo de configuración o .env)
MASTER_LICENSE_KEY = "LICENCIA_MAESTRA_2025" # Clave maestra para activar licencias de prueba
TRIAL_DAYS = 30 # Días de prueba iniciales

@router.get("/license/status/user", response_model=LicenseStatusResponse, tags=["Licencia"])
async def get_user_license_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtiene el estado de la licencia del usuario actual.
    """
    print(f"DEBUG: Verificando estado de licencia para usuario: {current_user.username}")

    is_trial_active = False
    days_remaining = 0
    is_license_active = False
    license_type = "Ninguna"

    now_utc = datetime.utcnow() # Usar UTC para consistencia

    if current_user.is_trial:
        if current_user.license_start_date:
            # Asegurar que license_start_date sea naive para la suma si now_utc es naive
            start_date_naive = current_user.license_start_date.replace(tzinfo=None) if current_user.license_start_date.tzinfo else current_user.license_start_date
            trial_end_date = start_date_naive + timedelta(days=TRIAL_DAYS)
            if now_utc < trial_end_date: # Comparar naive con naive
                is_trial_active = True
                days_remaining = (trial_end_date - now_utc).days
                license_type = "Prueba"
            else:
                # La prueba ha expirado
                pass
        else:
            # Si is_trial es True pero license_start_date es None, inicializarla
            current_user.license_start_date = now_utc # Almacenar en UTC
            db.add(current_user)
            db.commit()
            db.refresh(current_user)
            is_trial_active = True
            days_remaining = TRIAL_DAYS
            license_type = "Prueba (recién iniciada)"

    # Lógica para licencias de pago (si las implementas)
    if current_user.license_end_date:
        end_date_naive = current_user.license_end_date.replace(tzinfo=None) if current_user.license_end_date.tzinfo else current_user.license_end_date
        if now_utc < end_date_naive: # Comparar naive con naive
            is_license_active = True
            license_type = "Completa"
            is_trial_active = False
            days_remaining = (end_date_naive - now_utc).days


    # Si el usuario está bloqueado, la licencia no está activa
    if current_user.is_blocked:
        is_license_active = False
        is_trial_active = False
        license_type = "Bloqueada"
        days_remaining = 0

    response_data = LicenseStatusResponse(
        is_trial_active=is_trial_active,
        days_remaining=days_remaining,
        is_license_active=is_license_active,
        license_type=license_type
    )
    print(f"DEBUG: Estado de licencia retornado: {response_data.model_dump_json()}")
    return response_data

@router.post("/license/activate", response_model=LicenseStatusResponse, tags=["Licencia"])
async def activate_license(
    license_key: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Activa la licencia de un usuario.
    Si la clave maestra es correcta, inicia/reinicia la prueba.
    """
    print(f"DEBUG: Intentando activar licencia para usuario: {current_user.username} con clave: {license_key}")

    if license_key == MASTER_LICENSE_KEY:
        current_user.is_trial = True
        current_user.license_start_date = datetime.utcnow() # Almacenar en UTC
        current_user.license_end_date = None # Resetear cualquier licencia completa
        current_user.is_blocked = False # Desbloquear si estaba bloqueado
        current_user.login_attempts = 0 # Resetear intentos de login
        current_user.blocked_at = None

        db.add(current_user)
        db.commit()
        db.refresh(current_user)
        print(f"DEBUG: Licencia de prueba activada/reiniciada para {current_user.username}.")
        return await get_user_license_status(current_user, db)
    else:
        print(f"DEBUG: Intento de activación de licencia fallido para {current_user.username}: Clave incorrecta.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Clave de licencia incorrecta."
        )
