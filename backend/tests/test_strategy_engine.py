import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
import pandas as pd
from app.schemas.strategy import StrategyRulesSchema, IndicatorCondition
from app.services.strategy_engine import StrategyEngine
from app.services.market_data_service import MarketDataService

def test_compute_indicators_and_evaluate():
    df = MarketDataService.get_historical_ohlc(symbol="RELIANCE", start_date="2023-01-01", end_date="2023-02-01", timeframe="15m")
    
    rules = StrategyRulesSchema(
        logic_operator="AND",
        entry_conditions=[
            IndicatorCondition(indicator="RSI", params={"period": 14}, operator="<", value=40),
            IndicatorCondition(indicator="EMA_CROSSOVER", params={"fast": 9, "slow": 21}, operator="CROSSES_ABOVE", value=None)
        ],
        exit_conditions=[
            IndicatorCondition(indicator="RSI", params={"period": 14}, operator=">", value=70)
        ],
        stop_loss_pct=1.5,
        target_pct=3.0,
        position_size_type="fixed_cash",
        position_size_value=100000.0
    )

    df_ind = StrategyEngine.compute_indicators(df, rules)
    assert "RSI_14" in df_ind.columns
    assert "EMA_9" in df_ind.columns
    assert "EMA_21" in df_ind.columns

    entries, exits = StrategyEngine.generate_signals(df, rules)
    assert len(entries) == len(df)
    assert len(exits) == len(df)
