from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.optimization import OptimizationRun
from app.models.strategy import Strategy
from app.models.user import User
from app.schemas.optimization import OptimizationRequest, OptimizationResponse
from app.api.v1.deps import get_current_user
from app.services.optimizer_service import OptimizerService
from app.services.ai_recommendation import AIRecommendationService

router = APIRouter(prefix="/optimizations", tags=["Optimizations"])

@router.post("/run", response_model=OptimizationResponse)
async def trigger_optimization(
    req: OptimizationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Strategy).where(Strategy.id == req.strategy_id, Strategy.user_id == current_user.id)
    res = await db.execute(stmt)
    strat = res.scalar_one_or_none()
    if not strat:
        raise HTTPException(status_code=404, detail="Strategy not found")

    opt_run = OptimizationRun(
        strategy_id=req.strategy_id,
        param_search_space=req.param_search_space,
        n_trials=req.n_trials,
        target_metric=req.target_metric,
        status="RUNNING"
    )
    db.add(opt_run)
    await db.commit()
    await db.refresh(opt_run)

    try:
        # Run Optuna Hyperparameter optimization
        top_n = OptimizerService.run_optuna_optimization(
            symbol=strat.symbol,
            base_rules_dict=strat.rules,
            param_search_space=req.param_search_space,
            n_trials=req.n_trials,
            target_metric=req.target_metric
        )

        # Generate Claude AI plain-English summary & risk recommendation
        ai_res = await AIRecommendationService.generate_strategy_recommendation(
            strategy_name=strat.name,
            symbol=strat.symbol,
            user_risk_profile=current_user.risk_profile,
            top_n_results=top_n
        )

        opt_run.top_n_results = top_n
        opt_run.ai_summary = ai_res["summary"]
        opt_run.ai_recommended_config_idx = ai_res.get("recommended_rank", 1)
        opt_run.status = "COMPLETED"
        await db.commit()
        await db.refresh(opt_run)

    except Exception as e:
        opt_run.status = "FAILED"
        await db.commit()
        await db.refresh(opt_run)

    return opt_run

@router.get("/strategy/{strategy_id}", response_model=List[OptimizationResponse])
async def list_strategy_optimizations(
    strategy_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(OptimizationRun).where(OptimizationRun.strategy_id == strategy_id).order_by(OptimizationRun.created_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/strategy/{strategy_id}/latest", response_model=OptimizationResponse)
async def get_latest_strategy_optimization(
    strategy_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(OptimizationRun).where(OptimizationRun.strategy_id == strategy_id).order_by(OptimizationRun.created_at.desc())
    res = await db.execute(stmt)
    opt = res.scalars().first()
    if not opt:
        raise HTTPException(status_code=404, detail="No optimization runs found")
    return opt

