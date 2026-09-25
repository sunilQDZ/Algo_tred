import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from app.schemas.strategy import StrategyRulesSchema, IndicatorCondition
from app.services.backtest_engine import BacktestEngine
from app.services.market_data_service import MarketDataService

def test_backtest_metrics_calculation():
    df = MarketDataService.get_historical_ohlc(symbol="RELIANCE", start_date="2023-01-01", end_date="2023-06-01", timeframe="15m")
    
    rules = StrategyRulesSchema(
        logic_operator="AND",
        entry_conditions=[
            IndicatorCondition(indicator="RSI", params={"period": 14}, operator="<", value=45)
        ],
        exit_conditions=[
            IndicatorCondition(indicator="RSI", params={"period": 14}, operator=">", value=65)
        ],
        stop_loss_pct=2.0,
        target_pct=4.0,
        position_size_type="fixed_cash",
        position_size_value=100000.0
    )

    res = BacktestEngine.run_backtest(df, rules, initial_capital=100000.0)
    
    assert "metrics" in res
    metrics = res["metrics"]
    assert "cagr_pct" in metrics
    assert "max_drawdown_pct" in metrics
    assert "sharpe_ratio" in metrics
    assert "win_rate_pct" in metrics
    assert len(res["equity_curve"]) > 0
