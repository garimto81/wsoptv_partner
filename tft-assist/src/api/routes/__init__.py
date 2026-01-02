"""API routes module."""

from src.api.routes.augments import router as augments_router
from src.api.routes.champions import router as champions_router
from src.api.routes.health import router as health_router
from src.api.routes.stats import router as stats_router
from src.api.routes.traits import router as traits_router

__all__ = [
    "health_router",
    "augments_router",
    "champions_router",
    "stats_router",
    "traits_router",
]
