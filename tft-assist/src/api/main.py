"""FastAPI application."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.routes import (
    augments_router,
    champions_router,
    health_router,
    stats_router,
    traits_router,
)
from src.db.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    init_db()
    yield
    # Shutdown (if needed)


app = FastAPI(
    title="TFT Overlay Guide API",
    description="TFT augment and champion score API based on challenger data",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health_router, prefix="/api/health", tags=["Health"])
app.include_router(augments_router, prefix="/api/augments", tags=["Augments"])
app.include_router(champions_router, prefix="/api/champions", tags=["Champions"])
app.include_router(stats_router, prefix="/api/stats", tags=["Stats"])
app.include_router(traits_router, prefix="/api/traits", tags=["Traits"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "TFT Overlay Guide API",
        "version": "0.1.0",
        "docs": "/docs",
    }
