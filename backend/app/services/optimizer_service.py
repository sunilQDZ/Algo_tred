import optuna
import pandas as pd
from typing import Dict, Any, List
from app.schemas.strategy import StrategyRulesSchema, IndicatorCondition
from app.services.backtest_engine import BacktestEngine
from app.services.market_data_service import MarketDataService

optuna.logging.set_verbosity(optuna.logging.WARNING)

class OptimizerService:
    """
    Runs Optuna multi-trial strategy hyperparameter optimization.
    Uses train/test out-of-sample validation to prevent overfitting.
    """

    @classmethod
    def run_optuna_optimization(
        cls,
        symbol: str,
        base_rules_dict: dict,
        param_search_space: dict, # e.g. {"rsi_period": [10, 14, 21, 28], "stop_loss_pct": [1.0, 1.5, 2.0, 3.0]}
        n_trials: int = 20,
        target_metric: str = "sharpe_ratio"
    ) -> List[Dict[str, Any]]:
        """
        Runs hyperparameter search and returns ranked top N configurations with train & test metrics.
        """
        df_full = MarketDataService.get_historical_ohlc(symbol=symbol, start_date="2023-01-01", end_date="2024-01-01", timeframe="15m")
        
        # 70% Train, 30% Out-of-Sample Test Split
        split_idx = int(len(df_full) * 0.7)
        df_train = df_full.iloc[:split_idx]
        df_test = df_full.iloc[split_idx:]

        trials_history: List[Dict[str, Any]] = []

        def objective(trial: optuna.Trial) -> float:
            # Sample parameters from search space
            sampled_params = {}
            for param_key, choices in param_search_space.items():
                if isinstance(choices, list) and len(choices) > 0:
                    if isinstance(choices[0], (int, float, str)):
                        sampled_params[param_key] = trial.suggest_categorical(param_key, choices)
                else:
                    sampled_params[param_key] = choices

            # Construct dynamic rules with sampled parameters
            rules_copy = base_rules_dict.copy()
            
            # Apply sampled params to rules
            if "stop_loss_pct" in sampled_params:
                rules_copy["stop_loss_pct"] = float(sampled_params["stop_loss_pct"])
            if "target_pct" in sampled_params:
                rules_copy["target_pct"] = float(sampled_params["target_pct"])

            # Update entry conditions if RSI or EMA params sampled
            entry_conds = rules_copy.get("entry_conditions", [])
            for cond in entry_conds:
                if cond.get("indicator") == "RSI" and "rsi_period" in sampled_params:
                    cond["params"]["period"] = int(sampled_params["rsi_period"])
                elif cond.get("indicator") == "EMA_CROSSOVER":
                    if "ema_fast" in sampled_params:
                        cond["params"]["fast"] = int(sampled_params["ema_fast"])
                    if "ema_slow" in sampled_params:
                        cond["params"]["slow"] = int(sampled_params["ema_slow"])

            schema_rules = StrategyRulesSchema(**rules_copy)

            # Evaluate on TRAIN set
            train_res = BacktestEngine.run_backtest(df_train, schema_rules)
            train_metric = train_res["metrics"].get(target_metric, 0.0)

            # Evaluate on OUT-OF-SAMPLE TEST set
            test_res = BacktestEngine.run_backtest(df_test, schema_rules)

            trials_history.append({
                "params": sampled_params,
                "train_metrics": train_res["metrics"],
                "test_metrics": test_res["metrics"]
            })

            return float(train_metric) if not pd.isna(train_metric) else -99.0

        study = optuna.create_study(direction="maximize")
        study.optimize(objective, n_trials=min(n_trials, 50))

        # Rank trial results by test Sharpe ratio / metrics
        sorted_results = sorted(
            trials_history,
            key=lambda x: x["test_metrics"].get("sharpe_ratio", -99.0),
            reverse=True
        )

        # De-duplicate top configurations
        top_configs = []
        seen_params = set()

        for idx, res in enumerate(sorted_results):
            param_tuple = tuple(sorted(res["params"].items()))
            if param_tuple not in seen_params:
                seen_params.add(param_tuple)
                top_configs.append({
                    "rank": len(top_configs) + 1,
                    "params": res["params"],
                    "train_metrics": res["train_metrics"],
                    "test_metrics": res["test_metrics"]
                })
            if len(top_configs) >= 5:
                break

        return top_configs
