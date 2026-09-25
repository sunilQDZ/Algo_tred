from fastapi import APIRouter, Query, Body
from typing import Dict, Any, List
from app.services.monte_carlo import MonteCarloSimulator

router = APIRouter(prefix="/analytics", tags=["Analytics & Risk Simulation"])

@router.post("/monte-carlo")
async def run_monte_carlo(
    initial_capital: float = Body(100000.0),
    forecast_days: int = Body(60),
    num_simulations: int = Body(500)
):
    return MonteCarloSimulator.run_simulation(
        initial_capital=initial_capital,
        forecast_days=forecast_days,
        num_simulations=num_simulations
    )

@router.get("/market-radar")
async def get_market_radar():
    """NSE Market Sentiment, Sector Heatmap, and Top Breakouts Radar."""
    return {
        "sentiment_index": {
            "score": 68,
            "status": "GREED",
            "india_vix": 14.85,
            "fii_dii_net_inr_cr": "+1,420 Cr"
        },
        "sectors": [
            {"name": "NIFTY IT", "change_pct": +1.85, "status": "BULLISH"},
            {"name": "NIFTY BANK", "change_pct": +0.45, "status": "NEUTRAL"},
            {"name": "NIFTY AUTO", "change_pct": +1.12, "status": "BULLISH"},
            {"name": "NIFTY METAL", "change_pct": -0.65, "status": "BEARISH"},
            {"name": "NIFTY PHARMA", "change_pct": +0.30, "status": "NEUTRAL"}
        ],
        "volume_breakouts": [
            {"symbol": "RELIANCE", "ltp": 2488.40, "change_pct": +2.10, "volume_spike_ratio": 2.8},
            {"symbol": "INFY", "ltp": 1545.00, "change_pct": +1.95, "volume_spike_ratio": 3.1},
            {"symbol": "TATASTEEL", "ltp": 124.50, "change_pct": -0.80, "volume_spike_ratio": 1.4}
        ]
    }
