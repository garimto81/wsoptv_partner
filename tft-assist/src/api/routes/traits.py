"""Trait API endpoints."""

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, func, select

from src.api.deps import get_db
from src.db.models import TraitScore
from src.schemas.trait import TraitScoreListResponse, TraitScoreResponse

router = APIRouter()


@router.get("", response_model=TraitScoreListResponse)
async def get_traits(
    session: Session = Depends(get_db),
    limit: int = Query(default=50, le=100, ge=1),
    offset: int = Query(default=0, ge=0),
    sort_by: Literal["score", "pick_count", "win_rate"] = Query(default="score"),
) -> TraitScoreListResponse:
    """Get all trait scores.

    Args:
        session: Database session
        limit: Maximum number of results
        offset: Number of results to skip
        sort_by: Sort field

    Returns:
        List of trait scores
    """
    # Build query
    statement = select(TraitScore)

    # Apply sorting
    if sort_by == "score":
        statement = statement.order_by(TraitScore.weighted_score.desc())
    elif sort_by == "pick_count":
        statement = statement.order_by(TraitScore.pick_count.desc())
    elif sort_by == "win_rate":
        statement = statement.order_by(TraitScore.win_rate.desc())

    # Apply pagination
    statement = statement.offset(offset).limit(limit)

    results = session.exec(statement).all()

    # Get total count
    count_statement = select(func.count()).select_from(TraitScore)
    total = session.exec(count_statement).one()

    # Get last updated
    last_updated_statement = select(func.max(TraitScore.updated_at))
    last_updated = session.exec(last_updated_statement).first()

    items = [
        TraitScoreResponse(
            trait_id=r.trait_id,
            name=r.name,
            score=r.weighted_score,
            pick_count=r.pick_count,
            avg_placement=r.avg_placement,
            win_rate=r.win_rate,
            avg_tier=r.avg_tier,
        )
        for r in results
    ]

    return TraitScoreListResponse(
        items=items,
        total=total,
        last_updated=last_updated,
    )


@router.get("/{trait_id}", response_model=TraitScoreResponse)
async def get_trait_detail(
    trait_id: str,
    session: Session = Depends(get_db),
) -> TraitScoreResponse:
    """Get specific trait score.

    Args:
        trait_id: Trait ID
        session: Database session

    Returns:
        Trait score details
    """
    statement = select(TraitScore).where(TraitScore.trait_id == trait_id)
    result = session.exec(statement).first()

    if not result:
        raise HTTPException(status_code=404, detail="Trait not found")

    return TraitScoreResponse(
        trait_id=result.trait_id,
        name=result.name,
        score=result.weighted_score,
        pick_count=result.pick_count,
        avg_placement=result.avg_placement,
        win_rate=result.win_rate,
        avg_tier=result.avg_tier,
    )


@router.get("/tier/{tier}", response_model=TraitScoreListResponse)
async def get_traits_by_tier(
    tier: Literal["S+", "S", "A", "B", "C"],
    session: Session = Depends(get_db),
) -> TraitScoreListResponse:
    """Get traits by tier.

    Args:
        tier: Tier level
        session: Database session

    Returns:
        List of traits in the specified tier
    """
    # Define tier score ranges
    tier_ranges = {
        "S+": (8.5, 10.0),
        "S": (7.5, 8.5),
        "A": (6.5, 7.5),
        "B": (5.0, 6.5),
        "C": (0.0, 5.0),
    }

    min_score, max_score = tier_ranges[tier]

    statement = (
        select(TraitScore)
        .where(TraitScore.weighted_score >= min_score)
        .where(TraitScore.weighted_score < max_score)
        .order_by(TraitScore.weighted_score.desc())
    )

    # Handle S+ tier upper bound
    if tier == "S+":
        statement = (
            select(TraitScore)
            .where(TraitScore.weighted_score >= min_score)
            .order_by(TraitScore.weighted_score.desc())
        )

    results = session.exec(statement).all()

    items = [
        TraitScoreResponse(
            trait_id=r.trait_id,
            name=r.name,
            score=r.weighted_score,
            pick_count=r.pick_count,
            avg_placement=r.avg_placement,
            win_rate=r.win_rate,
            avg_tier=r.avg_tier,
        )
        for r in results
    ]

    return TraitScoreListResponse(
        items=items,
        total=len(items),
        last_updated=None,
    )
