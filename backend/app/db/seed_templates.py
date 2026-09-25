from typing import List, Dict, Any

SEED_STRATEGY_TEMPLATES: List[Dict[str, Any]] = [
    {
        "id": "tpl-rsi-mean-reversion",
        "name": "RSI Oversold/Overbought Mean Reversion",
        "category": "MEAN_REVERSION",
        "description": "Enters LONG when RSI drops below oversold threshold (30) and exits when RSI crosses overbought threshold (70) or hits profit target.",
        "indicator_list": ["RSI"],
        "default_params": {"rsi_period": 14, "rsi_oversold": 30, "rsi_overbought": 70, "stop_loss_pct": 1.5, "target_pct": 3.0},
        "default_rules": {
            "logic_operator": "AND",
            "entry_conditions": [{"indicator": "RSI", "params": {"period": 14}, "operator": "<", "value": 30}],
            "exit_conditions": [{"indicator": "RSI", "params": {"period": 14}, "operator": ">", "value": 70}],
            "stop_loss_pct": 1.5,
            "target_pct": 3.0,
            "position_size_type": "fixed_cash",
            "position_size_value": 100000.0
        }
    },
    {
        "id": "tpl-ema-crossover",
        "name": "Golden EMA 9/21 Trend Crossover",
        "category": "TREND_FOLLOWING",
        "description": "Rides strong momentum by entering long when 9-period EMA crosses above 21-period EMA.",
        "indicator_list": ["EMA", "EMA_CROSSOVER"],
        "default_params": {"ema_fast": 9, "ema_slow": 21, "stop_loss_pct": 2.0, "target_pct": 5.0},
        "default_rules": {
            "logic_operator": "AND",
            "entry_conditions": [{"indicator": "EMA_CROSSOVER", "params": {"fast": 9, "slow": 21}, "operator": "CROSSES_ABOVE", "value": None}],
            "exit_conditions": [{"indicator": "EMA_CROSSOVER", "params": {"fast": 9, "slow": 21}, "operator": "CROSSES_BELOW", "value": None}],
            "stop_loss_pct": 2.0,
            "target_pct": 5.0,
            "position_size_type": "fixed_cash",
            "position_size_value": 100000.0
        }
    },
    {
        "id": "tpl-supertrend-momentum",
        "name": "Supertrend Intraday Trend Follower",
        "category": "TREND_FOLLOWING",
        "description": "Captures institutional intraday trends when Supertrend indicator flips to bullish (GREEN).",
        "indicator_list": ["SUPERTREND"],
        "default_params": {"st_period": 10, "st_multiplier": 3.0, "stop_loss_pct": 1.2, "target_pct": 3.5},
        "default_rules": {
            "logic_operator": "AND",
            "entry_conditions": [{"indicator": "SUPERTREND", "params": {"period": 10, "multiplier": 3.0}, "operator": "EQUALS", "value": "GREEN"}],
            "exit_conditions": [{"indicator": "SUPERTREND", "params": {"period": 10, "multiplier": 3.0}, "operator": "EQUALS", "value": "RED"}],
            "stop_loss_pct": 1.2,
            "target_pct": 3.5,
            "position_size_type": "fixed_cash",
            "position_size_value": 100000.0
        }
    },
    {
        "id": "tpl-bollinger-squeeze",
        "name": "Bollinger Bands Lower Band Rebound",
        "category": "MEAN_REVERSION",
        "description": "Buys when stock price pierces below lower Bollinger Band (20, 2.0) and bounces back.",
        "indicator_list": ["BOLLINGER"],
        "default_params": {"bb_period": 20, "bb_std": 2.0, "stop_loss_pct": 1.0, "target_pct": 2.5},
        "default_rules": {
            "logic_operator": "AND",
            "entry_conditions": [{"indicator": "BOLLINGER", "params": {"period": 20, "std_dev": 2.0}, "operator": "CROSSES_BELOW_LOWER", "value": None}],
            "exit_conditions": [],
            "stop_loss_pct": 1.0,
            "target_pct": 2.5,
            "position_size_type": "fixed_cash",
            "position_size_value": 100000.0
        }
    },
    {
        "id": "tpl-vwap-breakout",
        "name": "VWAP Institutional Breakout",
        "category": "BREAKOUT",
        "description": "Executes long positions when price breaks above Volume Weighted Average Price (VWAP) with high volume.",
        "indicator_list": ["VWAP", "RSI"],
        "default_params": {"stop_loss_pct": 1.5, "target_pct": 4.0},
        "default_rules": {
            "logic_operator": "AND",
            "entry_conditions": [
                {"indicator": "VWAP", "params": {}, "operator": ">", "value": 0},
                {"indicator": "RSI", "params": {"period": 14}, "operator": ">", "value": 50}
            ],
            "exit_conditions": [],
            "stop_loss_pct": 1.5,
            "target_pct": 4.0,
            "position_size_type": "fixed_cash",
            "position_size_value": 100000.0
        }
    },
    {
        "id": "tpl-macd-histogram",
        "name": "MACD Zero Line Crossover",
        "category": "TREND_FOLLOWING",
        "description": "Trades MACD line crossing over signal line (12, 26, 9) above zero axis.",
        "indicator_list": ["MACD"],
        "default_params": {"fast": 12, "slow": 26, "signal": 9, "stop_loss_pct": 2.0, "target_pct": 4.5},
        "default_rules": {
            "logic_operator": "AND",
            "entry_conditions": [{"indicator": "MACD", "params": {"fast": 12, "slow": 26, "signal": 9}, "operator": "CROSSES_ABOVE", "value": None}],
            "exit_conditions": [{"indicator": "MACD", "params": {"fast": 12, "slow": 26, "signal": 9}, "operator": "CROSSES_BELOW", "value": None}],
            "stop_loss_pct": 2.0,
            "target_pct": 4.5,
            "position_size_type": "fixed_cash",
            "position_size_value": 100000.0
        }
    }
]
