"""Trait API schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, computed_field

from src.core.constants import get_tier_from_score


class TraitScoreResponse(BaseModel):
    """Single trait score response."""

    model_config = ConfigDict(from_attributes=True)

    trait_id: str
    name: str
    score: float
    pick_count: int
    avg_placement: float
    win_rate: float
    avg_tier: float  # Average activation tier (unique to traits)

    @computed_field
    @property
    def tier(self) -> str:
        """Calculate tier from score."""
        return get_tier_from_score(self.score)


class TraitScoreListResponse(BaseModel):
    """List of trait scores response."""

    items: list[TraitScoreResponse]
    total: int
    last_updated: datetime | None = None
