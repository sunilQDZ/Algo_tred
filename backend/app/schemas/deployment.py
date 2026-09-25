from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class DeploymentCreate(BaseModel):
    strategy_id: str
    broker_connection_id: Optional[str] = None
    mode: str = "PAPER" # PAPER, LIVE
    capital_allocated: float = Field(default=100000.0, gt=0)
    max_daily_loss_pct: float = Field(default=3.0, gt=0, le=20.0)

class OrderResponse(BaseModel):
    id: str
    client_order_id: str
    broker_order_id: Optional[str] = None
    symbol: str
    side: str
    qty: int
    price: float
    filled_price: float
    order_type: str
    status: str
    reject_reason: Optional[str] = None
    placed_at: datetime
    filled_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PositionResponse(BaseModel):
    id: str
    symbol: str
    qty: int
    avg_price: float
    current_price: float
    unrealized_pnl: float
    realized_pnl: float
    updated_at: datetime

    class Config:
        from_attributes = True

class DeploymentResponse(BaseModel):
    id: str
    user_id: str
    strategy_id: str
    broker_connection_id: Optional[str] = None
    mode: str
    status: str
    capital_allocated: float
    current_equity: float
    realized_pnl: float
    unrealized_pnl: float
    risk_settings: Dict[str, Any]
    started_at: datetime
    stopped_at: Optional[datetime] = None

    class Config:
        from_attributes = True
