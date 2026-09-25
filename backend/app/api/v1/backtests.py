from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.backtest import BacktestRun
from app.models.strategy import Strategy
from app.models.user import User
from app.schemas.backtest import BacktestRequest, BacktestResponse
from app.schemas.strategy import StrategyRulesSchema
from app.api.v1.deps import get_current_user
from app.services.market_data_service import MarketDataService
from app.services.backtest_engine import BacktestEngine

router = APIRouter(prefix="/backtests", tags=["Backtests"])

@router.post("/run", response_model=BacktestResponse)
async def trigger_backtest(
    req: BacktestRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validate strategy ownership
    stmt = select(Strategy).where(Strategy.id == req.strategy_id, Strategy.user_id == current_user.id)
    res = await db.execute(stmt)
    strat = res.scalar_one_or_none()
    if not strat:
        raise HTTPException(status_code=404, detail="Strategy not found")

    bt_run = BacktestRun(
        strategy_id=req.strategy_id,
        params_used=req.params or strat.params,
        start_date=req.start_date,
        end_date=req.end_date,
        initial_capital=req.initial_capital,
        status="RUNNING"
    )
    db.add(bt_run)
    await db.commit()
    await db.refresh(bt_run)

    # Synchronous inline execution for immediate UI response, with background Celery fallback
    try:
        rules_dict = strat.rules.copy()
        if req.params:
            rules_dict["params"] = req.params
        rules_schema = StrategyRulesSchema(**rules_dict)

        df = MarketDataService.get_historical_ohlc(
            symbol=strat.symbol,
            start_date=req.start_date,
            end_date=req.end_date,
            timeframe=strat.timeframe
        )

        bt_results = BacktestEngine.run_backtest(
            df=df,
            rules=rules_schema,
            initial_capital=req.initial_capital
        )

        bt_run.status = "COMPLETED"
        bt_run.metrics = bt_results["metrics"]
        bt_run.equity_curve = bt_results["equity_curve"]
        bt_run.trade_log = bt_results["trade_log"]
        strat.status = "BACKTESTED"
        await db.commit()
        await db.refresh(bt_run)

    except Exception as e:
        bt_run.status = "FAILED"
        bt_run.error_message = str(e)
        await db.commit()
        await db.refresh(bt_run)

    return bt_run

@router.get("/strategy/{strategy_id}", response_model=List[BacktestResponse])
async def list_strategy_backtests(
    strategy_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(BacktestRun).where(BacktestRun.strategy_id == strategy_id).order_by(BacktestRun.created_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/strategy/{strategy_id}/latest", response_model=BacktestResponse)
async def get_latest_strategy_backtest(
    strategy_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(BacktestRun).where(BacktestRun.strategy_id == strategy_id).order_by(BacktestRun.created_at.desc())
    res = await db.execute(stmt)
    bt = res.scalars().first()
    if not bt:
        raise HTTPException(status_code=404, detail="No backtest runs found")
    return bt


@router.get("/{backtest_id}", response_model=BacktestResponse)
async def get_backtest_by_id(
    backtest_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(BacktestRun).where(BacktestRun.id == backtest_id)
    res = await db.execute(stmt)
    bt = res.scalar_one_or_none()
    if not bt:
        raise HTTPException(status_code=404, detail="Backtest run not found")
    return bt


from fastapi import UploadFile, File, Form

@router.post("/upload-csv-run")
async def run_custom_csv_backtest(
    file: UploadFile = File(...),
    initial_capital: float = Form(100000.0),
    stop_loss_pct: float = Form(1.5),
    target_pct: float = Form(3.0),
    rsi_period: int = Form(14),
    rsi_oversold: float = Form(30.0)
):
    """
    Ingests any uploaded historical OHLC CSV file (from Zerodha, TradingView, or NSE)
    and executes full backtesting engine producing CAGR, Sharpe, Drawdown, Taxes & Trade Log.
    """
    content = await file.read()
    df = MarketDataService.parse_csv_to_df(content)

    rules_dict = {
        "logic_operator": "AND",
        "entry_conditions": [
            {"indicator": "RSI", "params": {"period": rsi_period}, "operator": "<", "value": rsi_oversold}
        ],
        "exit_conditions": [],
        "stop_loss_pct": stop_loss_pct,
        "target_pct": target_pct,
        "position_size_type": "fixed_cash",
        "position_size_value": initial_capital
    }
    rules_schema = StrategyRulesSchema(**rules_dict)

    results = BacktestEngine.run_backtest(
        df=df,
        rules=rules_schema,
        initial_capital=initial_capital
    )

    return {
        "filename": file.filename,
        "total_bars_processed": len(df),
        "results": results
    }
