from fastapi import APIRouter, Query, Body
from typing import Dict, Any, List
from app.services.options_engine import OptionsEngine

router = APIRouter(prefix="/options", tags=["Options Derivative Engine"])

@router.get("/greeks")
async def get_greeks(
    spot: float = Query(19500.0),
    strike: float = Query(19500.0),
    days_to_expiry: float = Query(7.0),
    volatility: float = Query(0.16),
    option_type: str = Query("CE")
):
    return OptionsEngine.calculate_greeks(
        spot=spot,
        strike=strike,
        days_to_expiry=days_to_expiry,
        volatility=volatility,
        option_type=option_type
    )

@router.post("/payoff-matrix")
async def calculate_payoff(
    spot_price: float = Body(19500.0),
    legs: List[Dict[str, Any]] = Body(...)
):
    return OptionsEngine.generate_payoff_matrix(spot_price=spot_price, legs=legs)
