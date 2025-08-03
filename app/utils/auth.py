# app/utils/auth.py
from datetime import datetime, timedelta, timezone
from typing import Optional, Type, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

# Lazy import para evitar dependencia circular
from app.db.database import get_db
from app.models.user import User as UserModel # Importar el modelo User como UserModel

# Configuración de seguridad
SECRET_KEY = "tu_super_secreto_ultra_seguro_y_largo" # ¡CAMBIA ESTO EN PRODUCCIÓN POR UNA VARIABLE DE ENTORNO SEGURA!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # Token expira en 7 días (ajustable)

# Usando argon2
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token") # Asegúrate de que la URL coincida con tu ruta de login

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica si una contraseña en texto plano coincide con una hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Genera el hash de una contraseña."""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Crea un token de acceso JWT."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Reincorporando authenticate_user
def authenticate_user(db: Session, username: str, password: str) -> Optional[UserModel]:
    """
    Autentica a un usuario verificando sus credenciales.
    """
    user = db.execute(select(UserModel).where(UserModel.username == username)).scalar_one_or_none()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Any:
    """Obtiene el usuario actual a partir del token JWT."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            print("DEBUG BACKEND: [GET CURRENT USER] Payload no contiene 'sub'.") # DEBUG
            raise credentials_exception
        # Verificar la expiración del token
        expire_timestamp = payload.get("exp")
        if expire_timestamp is None:
            print("DEBUG BACKEND: [GET CURRENT USER] Payload no contiene 'exp'.") # DEBUG
            raise credentials_exception
        
        current_time = datetime.now(timezone.utc).timestamp()
        if current_time > expire_timestamp:
            print(f"DEBUG BACKEND: [GET CURRENT USER] Token expirado para {username}. Current: {current_time}, Exp: {expire_timestamp}") # DEBUG
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token expirado. Por favor, inicie sesión de nuevo.",
                headers={"WWW-Authenticate": "Bearer"},
            )

    except JWTError as e:
        print(f"DEBUG BACKEND: [GET CURRENT USER] Error JWT: {e}") # DEBUG
        raise credentials_exception
    except Exception as e:
        print(f"DEBUG BACKEND: [GET CURRENT USER] Error inesperado: {e}") # DEBUG
        raise credentials_exception

    user = db.execute(select(UserModel).where(UserModel.username == username)).scalar_one_or_none()
    if user is None:
        print(f"DEBUG BACKEND: [GET CURRENT USER] Usuario '{username}' no encontrado en DB.") # DEBUG
        raise credentials_exception
    print(f"DEBUG BACKEND: [GET CURRENT USER] Usuario '{user.username}' obtenido exitosamente.")
    return user

async def get_current_active_user(current_user: Any = Depends(get_current_user)) -> Any:
    """Obtiene el usuario activo actual."""
    print(f"DEBUG AUTH: [get_current_active_user] Verificando si usuario '{current_user.username}' está activo y no bloqueado.")
    if not current_user.is_active:
        print(f"DEBUG AUTH: [get_current_active_user] Usuario '{current_user.username}' inactivo.") # DEBUG
        raise HTTPException(status_code=400, detail="Usuario inactivo")
    # No hay 'is_blocked' en el modelo User actual, así que lo eliminamos si no lo has añadido.
    # if current_user.is_blocked:
    #     print(f"DEBUG AUTH: [get_current_active_user] Usuario '{current_user.username}' bloqueado.") # DEBUG
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tu cuenta ha sido bloqueada.")
    print(f"DEBUG AUTH: [get_current_active_user] Usuario '{current_user.username}' activo y no bloqueado. Permiso concedido.")
    return current_user

# ¡FUNCIÓN get_current_admin_user ELIMINADA! (Si existía)
