import asyncio
from app.workers.celery_app import celery_app
from app.db.session import AsyncSessionLocal
from app.models.backtest import BacktestRun
from app.models.optimization import OptimizationRun
from app.models.strategy import Strategy
from app.schemas.strategy import StrategyRulesSchema
from app.services.market_data_service import MarketDataService
from app.services.backtest_engine import BacktestEngine
from app.services.optimizer_service import OptimizerService
from app.services.ai_recommendation import AIRecommendationService
from sqlalchemy import select

def run_async(coro):
    """Helper to run async code inside Celery synchronous worker threads."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()

@celery_app.task(name="run_backtest_task")
def run_backtest_task(backtest_id: str):
    """Celery background task for running strategy backtests."""
    async def _impl():
        async with AsyncSessionLocal() as session:
            stmt = select(BacktestRun).where(BacktestRun.id == backtest_id)
            res = await session.execute(stmt)
            bt_run = res.scalar_one_or_none()
            if not bt_run:
                return

            bt_run.status = "RUNNING"
            await session.commit()

            # Load Strategy
            strat_stmt = select(Strategy).where(Strategy.id == bt_run.strategy_id)
            strat_res = await session.execute(strat_stmt)
            strat = strat_res.scalar_one_or_none()

            if not strat:
                bt_run.status = "FAILED"
                bt_run.error_message = "Strategy not found"
                await session.commit()
                return

            try:
                # Merge parameters into rules if specified
                rules_dict = strat.rules.copy()
                if bt_run.params_used:
                    rules_dict["params"] = bt_run.params_used

                rules_schema = StrategyRulesSchema(**rules_dict)

                # Fetch market data & run backtest
                df = MarketDataService.get_historical_ohlc(
                    symbol=strat.symbol,
                    start_date=bt_run.start_date,
                    end_date=bt_run.end_date,
                    timeframe=strat.timeframe
                )

                bt_results = BacktestEngine.run_backtest(
                    df=df,
                    rules=rules_schema,
                    initial_capital=bt_run.initial_capital
                )

                bt_run.status = "COMPLETED"
                bt_run.metrics = bt_results["metrics"]
                bt_run.equity_curve = bt_results["equity_curve"]
                bt_run.trade_log = bt_results["trade_log"]
                await session.commit()

            except Exception as e:
                bt_run.status = "FAILED"
                bt_run.error_message = str(e)
                await session.commit()

    run_async(_impl())

@celery_app.task(name="run_optimization_task")
def run_optimization_task(optimization_id: str, user_risk_profile: dict):
    """Celery background task for Optuna parameter optimization + Claude AI recommendation."""
    async def _impl():
        async with AsyncSessionLocal() as session:
            stmt = select(OptimizationRun).where(OptimizationRun.id == optimization_id)
            res = await session.execute(stmt)
            opt_run = res.scalar_one_or_none()
            if not opt_run:
                return

            opt_run.status = "RUNNING"
            await session.commit()

            # Load Strategy
            strat_stmt = select(Strategy).where(Strategy.id == opt_run.strategy_id)
            strat_res = await session.execute(strat_stmt)
            strat = strat_res.scalar_one_or_none()

            if not strat:
                opt_run.status = "FAILED"
                await session.commit()
                return

            try:
                # Run Optuna Hyperparameter optimization
                top_n = OptimizerService.run_optuna_optimization(
                    symbol=strat.symbol,
                    base_rules_dict=strat.rules,
                    param_search_space=opt_run.param_search_space,
                    n_trials=opt_run.n_trials,
                    target_metric=opt_run.target_metric
                )

                # Query Claude API for strategy recommendation
                ai_res = await AIRecommendationService.generate_strategy_recommendation(
                    strategy_name=strat.name,
                    symbol=strat.symbol,
                    user_risk_profile=user_risk_profile,
                    top_n_results=top_n
                )

                opt_run.top_n_results = top_n
                opt_run.ai_summary = ai_res["summary"]
                opt_run.ai_recommended_config_idx = ai_res.get("recommended_rank", 1)
                opt_run.status = "COMPLETED"
                await session.commit()

            except Exception as e:
                opt_run.status = "FAILED"
                await session.commit()

    run_async(_impl())
