# app/routers/user.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User, UserCreate, UserRead, Token, LicenseStatusResponse 
from app.utils.auth import get_password_hash, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, get_current_active_user
from datetime import timedelta, datetime, timezone # Necesario para la lógica de licencia

router = APIRouter()

# Clave maestra de licencia (debería estar en variables de entorno en producción)
MASTER_LICENSE_KEY = "KEYLA-ALEIKA-HIJAS-2025"

@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED, summary="Registrar un nuevo usuario")
async def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    print(f"DEBUG BACKEND: [REGISTER] Intentando registrar usuario: {user_data.username}, Email: {user_data.email}")

    # Verificar si el username o email ya existen
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nombre de usuario ya registrado")
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email ya registrado")

    hashed_password = get_password_hash(user_data.password)

    # Lógica de licencia basada en master_license_key
    is_trial_user = True
    license_start = datetime.now(timezone.utc)
    license_end = license_start + timedelta(hours=48) # Licencia de prueba por defecto (48 horas)

    if user_data.master_license_key == MASTER_LICENSE_KEY:
        is_trial_user = False
        license_end = license_start + timedelta(days=365) # Licencia completa por 365 días
        print(f"DEBUG BACKEND: [REGISTER] Usuario '{user_data.username}' registrado con licencia COMPLETA.")
    else:
        print(f"DEBUG BACKEND: [REGISTER] Usuario '{user_data.username}' registrado con licencia de PRUEBA (clave incorrecta o no proporcionada).")

    # Crear el nuevo usuario con los campos de licencia. NO SE ASIGNA ROL.
    db_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        is_active=1, # Por defecto activo
        license_start_date=license_start,
        license_end_date=license_end,
        is_trial=is_trial_user,
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    print(f"DEBUG BACKEND: [REGISTER] Usuario '{db_user.username}' (ID: {db_user.id}) registrado exitosamente.")
    return db_user

@router.get("/users/me/", response_model=UserRead, summary="Obtener información del usuario actual")
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """
    Obtiene la información del usuario actualmente autenticado.
    Requiere que el usuario esté autenticado y activo.
    """
    print(f"DEBUG BACKEND: [READ_USERS_ME] Usuario '{current_user.username}' solicitando su propia información.")
    return current_user

# RUTA DE ESTADO DE LICENCIA
@router.get("/license-status", response_model=LicenseStatusResponse, summary="Obtener estado de la licencia del usuario actual")
async def get_license_status(current_user: User = Depends(get_current_active_user)):
    """
    Devuelve el estado de la licencia del usuario actual.
    """
    print(f"DEBUG BACKEND: [LICENSE_STATUS_ENDPOINT] Solicitud recibida para usuario: {current_user.username}")
    
    is_license_active = False
    message = "Licencia inactiva."

    if current_user.is_active:
        now_utc = datetime.now(timezone.utc)
        
        if current_user.license_end_date:
            # Convertir license_end_date a UTC si no lo está.
            # Esto maneja tanto fechas naive como fechas ya aware (convirtiéndolas a UTC).
            license_end_aware = current_user.license_end_date
            if license_end_aware.tzinfo is None:
                # Si es naive, asumimos UTC para la comparación
                license_end_aware = license_end_aware.replace(tzinfo=timezone.utc)
            else:
                # Si ya es aware, la convertimos explícitamente a UTC para asegurar consistencia
                license_end_aware = license_end_aware.astimezone(timezone.utc)
            
            if current_user.is_trial:
                if now_utc < license_end_aware: # Esta comparación ahora debería funcionar
                    is_license_active = True
                    remaining_time = license_end_aware - now_utc
                    days = remaining_time.days
                    hours = remaining_time.seconds // 3600
                    minutes = (remaining_time.seconds % 3600) // 60
                    message = f"Licencia de prueba activa. Restan {days} días, {hours} horas y {minutes} minutos."
                else:
                    message = "Licencia de prueba expirada."
            else: # Licencia completa
                if now_utc < license_end_aware: # Esta comparación ahora debería funcionar
                    is_license_active = True
                    message = "Licencia completa activa."
                else:
                    message = "Licencia completa expirada."
        else: # Si license_end_date es None, la licencia no está definida correctamente
            message = "Licencia no definida o inválida."
    else:
        message = "Usuario inactivo."

    print(f"DEBUG BACKEND: [LICENSE_STATUS] Estado de licencia para '{current_user.username}': {message}")
    return {"is_license_active": is_license_active, "message": message}
