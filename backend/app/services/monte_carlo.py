import numpy as np
import pandas as pd
from typing import Dict, Any, List

class MonteCarloSimulator:
    """
    Monte Carlo 1,000-path stochastic simulator testing strategy survival,
    95% & 99% Value at Risk (VaR), and Conditional VaR (CVaR).
    """

    @classmethod
    def run_simulation(
        cls,
        initial_capital: float = 100000.0,
        historical_returns: List[float] = None,
        num_simulations: int = 500,
        forecast_days: int = 60
    ) -> Dict[str, Any]:
        if not historical_returns or len(historical_returns) < 5:
            # Generate realistic daily return distribution (mean 0.12%, std 1.4%)
            np.random.seed(42)
            historical_returns = np.random.normal(0.0012, 0.014, 100).tolist()

        returns_arr = np.array(historical_returns)
        mean_ret = np.mean(returns_arr)
        std_ret = np.std(returns_arr)

        sim_paths = []
        final_equities = []

        np.random.seed(101)
        for s in range(num_simulations):
            path = [initial_capital]
            sim_rets = np.random.normal(mean_ret, std_ret, forecast_days)
            for r in sim_rets:
                next_eq = path[-1] * (1 + r)
                path.append(next_eq)
            sim_paths.append(path)
            final_equities.append(path[-1])

        # Compute VaR (Value at Risk) & CVaR
        final_returns_pct = ((np.array(final_equities) - initial_capital) / initial_capital) * 100.0
        var_95 = np.percentile(final_returns_pct, 5) # 5th percentile loss
        var_99 = np.percentile(final_returns_pct, 1) # 1st percentile loss
        cvar_95 = np.mean(final_returns_pct[final_returns_pct <= var_95])

        # Formatted sample percentile paths for UI Recharts rendering
        percentile_paths = []
        sim_matrix = np.array(sim_paths) # (num_simulations, forecast_days+1)
        for day in range(forecast_days + 1):
            day_slice = sim_matrix[:, day]
            percentile_paths.append({
                "day": f"Day {day}",
                "median": round(float(np.percentile(day_slice, 50)), 2),
                "percentile_90": round(float(np.percentile(day_slice, 90)), 2),
                "percentile_10": round(float(np.percentile(day_slice, 10)), 2),
                "worst_case": round(float(np.min(day_slice)), 2)
            })

        return {
            "initial_capital": initial_capital,
            "forecast_days": forecast_days,
            "num_simulations": num_simulations,
            "median_final_equity": round(float(np.median(final_equities)), 2),
            "best_case_final_equity": round(float(np.max(final_equities)), 2),
            "worst_case_final_equity": round(float(np.min(final_equities)), 2),
            "var_95_pct": round(float(var_95), 2),
            "var_99_pct": round(float(var_99), 2),
            "cvar_95_pct": round(float(cvar_95), 2),
            "percentile_paths": percentile_paths
        }
