from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class BacktestRequest(BaseModel):
    strategy_id: str
    start_date: str = "2023-01-01"
    end_date: str = "2024-01-01"
    initial_capital: float = Field(default=100000.0, gt=0)
    params: Optional[Dict[str, Any]] = None

class BacktestResponse(BaseModel):
    id: str
    strategy_id: str
    params_used: Dict[str, Any]
    start_date: str
    end_date: str
    initial_capital: float
    status: str
    error_message: Optional[str] = None
    metrics: Dict[str, Any]
    equity_curve: List[Dict[str, Any]]
    trade_log: List[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True
