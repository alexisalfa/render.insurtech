# app/schemas/paginated_response.py
from typing import Generic, List, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int = Field(..., description="Total number of items available across all pages.") # Asegúrate que sea 'total'
    page: int = Field(..., description="The current page number (1-indexed).")
    size: int = Field(..., description="The number of items per page.")

    class Config:
        from_attributes = True

