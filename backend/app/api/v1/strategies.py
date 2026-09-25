from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.strategy import StrategyTemplate, Strategy
from app.models.user import User
from app.schemas.strategy import (
    StrategyCreate, StrategyUpdate, StrategyResponse, StrategyTemplateResponse
)
from app.api.v1.deps import get_current_user
from app.db.seed_templates import SEED_STRATEGY_TEMPLATES

router = APIRouter(prefix="/strategies", tags=["Strategies"])

@router.get("/templates", response_model=List[StrategyTemplateResponse])
async def list_strategy_templates(db: AsyncSession = Depends(get_db)):
    stmt = select(StrategyTemplate)
    res = await db.execute(stmt)
    templates = res.scalars().all()

    # Auto seed templates if empty
    if not templates:
        for tpl_data in SEED_STRATEGY_TEMPLATES:
            tpl = StrategyTemplate(**tpl_data)
            db.add(tpl)
        await db.commit()
        
        stmt = select(StrategyTemplate)
        res = await db.execute(stmt)
        templates = res.scalars().all()

    return templates

@router.get("/", response_model=List[StrategyResponse])
async def list_user_strategies(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Strategy).where(Strategy.user_id == current_user.id).order_by(Strategy.updated_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/", response_model=StrategyResponse)
async def create_strategy(
    strat_in: StrategyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_strat = Strategy(
        user_id=current_user.id,
        template_id=strat_in.template_id,
        name=strat_in.name,
        description=strat_in.description,
        segment=strat_in.segment,
        symbol=strat_in.symbol,
        timeframe=strat_in.timeframe,
        rules=strat_in.rules.model_dump(),
        params=strat_in.params,
        status="DRAFT"
    )
    db.add(new_strat)
    await db.commit()
    await db.refresh(new_strat)
    return new_strat

@router.get("/{strategy_id}", response_model=StrategyResponse)
async def get_strategy(
    strategy_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Strategy).where(Strategy.id == strategy_id, Strategy.user_id == current_user.id)
    res = await db.execute(stmt)
    strat = res.scalar_one_or_none()
    if not strat:
        raise HTTPException(status_code=404, detail="Strategy not found")
    return strat

@router.put("/{strategy_id}", response_model=StrategyResponse)
async def update_strategy(
    strategy_id: str,
    strat_in: StrategyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Strategy).where(Strategy.id == strategy_id, Strategy.user_id == current_user.id)
    res = await db.execute(stmt)
    strat = res.scalar_one_or_none()
    if not strat:
        raise HTTPException(status_code=404, detail="Strategy not found")

    if strat_in.name is not None: strat.name = strat_in.name
    if strat_in.description is not None: strat.description = strat_in.description
    if strat_in.segment is not None: strat.segment = strat_in.segment
    if strat_in.symbol is not None: strat.symbol = strat_in.symbol
    if strat_in.timeframe is not None: strat.timeframe = strat_in.timeframe
    if strat_in.rules is not None: strat.rules = strat_in.rules.model_dump()
    if strat_in.params is not None: strat.params = strat_in.params
    if strat_in.status is not None: strat.status = strat_in.status

    await db.commit()
    await db.refresh(strat)
    return strat

@router.delete("/{strategy_id}")
async def delete_strategy(
    strategy_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Strategy).where(Strategy.id == strategy_id, Strategy.user_id == current_user.id)
    res = await db.execute(stmt)
    strat = res.scalar_one_or_none()
    if not strat:
        raise HTTPException(status_code=404, detail="Strategy not found")

    await db.delete(strat)
    await db.commit()
    return {"message": "Strategy deleted successfully"}

@router.post("/parse-prompt")
async def parse_natural_language_strategy(payload: dict):
    prompt = payload.get("prompt", "").strip()
    prompt_lower = prompt.lower()

    # Rule-based natural language parser & structured JSON compiler
    symbol = "RELIANCE"
    for s in ["NIFTY", "BANKNIFTY", "RELIANCE", "TCS", "HDFCBANK", "INFY", "TATAMOTORS", "ITC"]:
        if s.lower() in prompt_lower:
            symbol = s
            break

    timeframe = "15m"
    if "1m" in prompt_lower or "1 min" in prompt_lower: timeframe = "1m"
    elif "5m" in prompt_lower or "5 min" in prompt_lower: timeframe = "5m"
    elif "1h" in prompt_lower or "1 hour" in prompt_lower: timeframe = "1h"
    elif "daily" in prompt_lower or "1d" in prompt_lower: timeframe = "1d"

    entry_conds = []
    exit_conds = []

    if "sma" in prompt_lower or "moving average" in prompt_lower or "cross" in prompt_lower:
        entry_conds.append({"indicator": "SMA", "params": {"period": 6}, "operator": "crosses_above", "value": "SMA(30)"})
        exit_conds.append({"indicator": "SMA", "params": {"period": 6}, "operator": "crosses_below", "value": "SMA(30)"})
    elif "rsi" in prompt_lower:
        entry_conds.append({"indicator": "RSI", "params": {"period": 14}, "operator": "<", "value": 30})
        exit_conds.append({"indicator": "RSI", "params": {"period": 14}, "operator": ">", "value": 70})
    elif "supertrend" in prompt_lower:
        entry_conds.append({"indicator": "SUPERTREND", "params": {"period": 10, "multiplier": 3}, "operator": "bullish_flip", "value": 0})
        exit_conds.append({"indicator": "SUPERTREND", "params": {"period": 10, "multiplier": 3}, "operator": "bearish_flip", "value": 0})
    else:
        entry_conds.append({"indicator": "EMA", "params": {"period": 9}, "operator": ">", "value": "EMA(21)"})
        exit_conds.append({"indicator": "EMA", "params": {"period": 9}, "operator": "<", "value": "EMA(21)"})

    return {
        "name": f"AI Strategy ({symbol} {timeframe})",
        "symbol": symbol,
        "timeframe": timeframe,
        "segment": "EQUITY",
        "logic_operator": "AND",
        "entry_conditions": entry_conds,
        "exit_conditions": exit_conds,
        "stop_loss_pct": 1.5,
        "target_pct": 3.0,
        "trailing_stop_pct": 0.5,
        "automation_mode": "signal_only"
    }

