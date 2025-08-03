# app/models/__init__.py
# Este archivo es crucial para manejar las importaciones y relaciones de modelos en SQLAlchemy y Pydantic.

from .user import User, UserCreate, UserRead, UserLogin, Token, LicenseStatusResponse
from .cliente import Cliente, ClienteCreate, ClienteRead, ClienteUpdate
from .poliza import Poliza, PolizaCreate, PolizaRead, PolizaUpdate, TipoPoliza, EstadoPoliza
from .reclamacion import Reclamacion, ReclamacionCreate, ReclamacionRead, ReclamacionUpdate, EstadoReclamacion
from .empresa_aseguradora import EmpresaAseguradora, EmpresaAseguradoraCreate, EmpresaAseguradoraRead, EmpresaAseguradoraUpdate
from .asesor import Asesor, AsesorCreate, AsesorRead, AsesorUpdate
from .comision import Comision, ComisionCreate, ComisionRead, ComisionUpdate, TipoComision, EstatusPago
from .historial_cambio import HistorialCambio, HistorialCambioCreate, HistorialCambioRead

# Reconstruir modelos Pydantic para resolver referencias circulares de relaciones
# Es vital llamar a .model_rebuild() DESPUÉS de que todos los modelos relacionados
# hayan sido importados, para que Pydantic pueda resolver correctamente los Field(..., forward_ref="OtroModelo")

# Reconstruir PolizaRead para que pueda resolver ClienteRead, EmpresaAseguradoraRead, AsesorRead
PolizaRead.model_rebuild()

# Reconstruir ReclamacionRead para que pueda resolver PolizaRead y ClienteRead
ReclamacionRead.model_rebuild()

# Reconstruir AsesorRead para que pueda resolver EmpresaAseguradoraRead
AsesorRead.model_rebuild()

# Reconstruir ComisionRead para que pueda resolver PolizaRead y AsesorRead
ComisionRead.model_rebuild()

# Reconstruir HistorialCambioRead para que pueda resolver UserRead y ClienteRead
HistorialCambioRead.model_rebuild()

# Si tienes modelos con relaciones que aún no se resuelven,
# añade aquí sus correspondientes llamadas a .model_rebuild()
from .configuracion import Configuracion, ConfiguracionCreate, ConfiguracionRead, ConfiguracionUpdate