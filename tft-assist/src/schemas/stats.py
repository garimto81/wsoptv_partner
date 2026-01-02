"""Stats API schemas."""

from datetime import datetime

from pydantic import BaseModel

from src.schemas.augment import AugmentScoreResponse
from src.schemas.champion import ChampionScoreResponse
from src.schemas.trait import TraitScoreResponse


class StatsOverviewResponse(BaseModel):
    """Statistics overview response."""

    total_matches: int
    total_players: int
    total_augments: int
    total_champions: int
    total_traits: int
    top_augments: list[AugmentScoreResponse]
    top_champions: list[ChampionScoreResponse]
    top_traits: list[TraitScoreResponse]
    last_updated: datetime | None = None
