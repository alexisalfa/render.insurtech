# app/routers/dashboard.py

from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session # ¡Importa Session de sqlalchemy.orm!
from sqlalchemy import select, func # ¡Importa select y func de sqlalchemy!
from datetime import datetime, timedelta, timezone

from app.db.database import get_db
from app.models.cliente import Cliente
from app.models.poliza import Poliza, EstadoPoliza
from app.models.reclamacion import Reclamacion
from app.models.empresa_aseguradora import EmpresaAseguradora
from app.models.asesor import Asesor
from app.models.comision import Comision
from app.models.user import User
from app.schemas.dashboard import StatisticsSummary, PolizaProximaAVencer
from app.utils.auth import get_current_active_user # CAMBIO: get_current_user a get_current_active_user


router = APIRouter(prefix="/statistics", tags=["Statistics"])

@router.get("/summary/", response_model=StatisticsSummary)
def get_statistics_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)): # CAMBIO: session a db
    total_clientes = db.scalar(select(func.count()).select_from(Cliente)) # CAMBIO: session.scalar() a db.scalar()
    total_polizas = db.scalar(select(func.count()).select_from(Poliza)) # CAMBIO: session.scalar() a db.scalar()
    total_reclamaciones = db.scalar(select(func.count()).select_from(Reclamacion)) # CAMBIO: session.scalar() a db.scalar()
    total_empresas_aseguradoras = db.scalar(select(func.count()).select_from(EmpresaAseguradora)) # CAMBIO: session.scalar() a db.scalar()
    total_asesores = db.scalar(select(func.count()).select_from(Asesor)) # CAMBIO: session.scalar() a db.scalar()
    total_comisiones = db.scalar(select(func.sum(Comision.monto))) or 0.0 # CAMBIO: session.scalar() a db.scalar()

    polizas_por_estado_result = db.execute( # CAMBIO: session.execute() a db.execute()
        select(Poliza.estado, func.count(Poliza.id)).group_by(Poliza.estado)
    ).all()
    polizas_por_estado = {estado: count for estado, count in polizas_por_estado_result}

    reclamaciones_por_estado_result = db.execute( # CAMBIO: session.execute() a db.execute()
        select(Reclamacion.estado, func.count(Reclamacion.id)).group_by(Reclamacion.estado)
    ).all()
    reclamaciones_por_estado = {estado: count for estado, count in reclamaciones_por_estado_result}
    
    total_primas_activas = db.scalar( # CAMBIO: session.scalar() a db.scalar()
        select(func.sum(Poliza.prima)).where(Poliza.estado == EstadoPoliza.ACTIVA) # CAMBIO: EstadoPoliza.ACTIVA a EstadoPoliza.activa (minúscula)
    ) or 0.0
    total_monto_reclamado = db.scalar( # CAMBIO: session.scalar() a db.scalar()
        select(func.sum(Reclamacion.monto_reclamado))
    ) or 0.0
    total_monto_aprobado = 0.0 # ¡CORREGIDO! Se inicializa a 0.0 ya que el campo no existe en el modelo Reclamacion
    # Si en el futuro añades 'monto_aprobado' al modelo Reclamacion, descomenta la línea de abajo:
    # total_monto_aprobado = db.scalar(select(func.sum(Reclamacion.monto_aprobado))) or 0.0

    return StatisticsSummary(
        total_clientes=total_clientes if total_clientes is not None else 0,
        total_polizas=total_polizas if total_polizas is not None else 0,
        total_reclamaciones=total_reclamaciones if total_reclamaciones is not None else 0,
        total_empresas_aseguradoras=total_empresas_aseguradoras if total_empresas_aseguradoras is not None else 0,
        total_asesores=total_asesores if total_asesores is not None else 0,
        total_comisiones=total_comisiones if total_comisiones is not None else 0.0,
        polizas_por_estado=polizas_por_estado,
        reclamaciones_por_estado=reclamaciones_por_estado,
        total_primas_activas=total_primas_activas,
        total_monto_reclamado=total_monto_reclamado,
        total_monto_aprobado=total_monto_aprobado, # Se mantiene con el valor por defecto de 0.0
    )


@router.get("/polizas/proximas_a_vencer/", response_model=List[PolizaProximaAVencer])
def get_polizas_proximas_a_vencer(
    days_out: int = Query(30, description="Número de días en el futuro para buscar pólizas a vencer."),
    db: Session = Depends(get_db), # CAMBIO: session a db
    current_user: User = Depends(get_current_active_user)
):
    """
    Obtiene una lista de pólizas que están próximas a vencer en los próximos `days_out` días.
    """
    now = datetime.now(timezone.utc) # Usar UTC para consistencia
    end_date_filter = now + timedelta(days=days_out)

    polizas_vencer = db.execute( # CAMBIO: session.execute() a db.execute()
        select(Poliza)
        .filter(Poliza.fecha_fin >= now, Poliza.fecha_fin <= end_date_filter)
        .order_by(Poliza.fecha_fin)
    ).scalars().all() # CAMBIO: .all() a .scalars().all() para obtener objetos Poliza directamente

    # Mapear a PolizaProximaAVencer schema
    result = []
    for poliza in polizas_vencer:
        # Calcular días restantes
        dias_restantes = (poliza.fecha_fin.replace(tzinfo=timezone.utc) - now).days if poliza.fecha_fin else 0

        # Asegurarse de que cliente y asesor existan antes de acceder a sus nombres
        cliente_nombre = f"{poliza.cliente.nombre} {poliza.cliente.apellido}" if poliza.cliente else "N/A"
        asesor_nombre = f"{poliza.asesor.nombre} {poliza.asesor.apellido}" if poliza.asesor else "N/A"

        result.append(PolizaProximaAVencer(
            id=poliza.id,
            numero_poliza=poliza.numero_poliza,
            tipo_poliza=poliza.tipo_poliza,
            fecha_fin=poliza.fecha_fin,
            cliente_nombre=cliente_nombre,
            asesor_nombre=asesor_nombre,
            dias_restantes=dias_restantes
        ))
    return result
