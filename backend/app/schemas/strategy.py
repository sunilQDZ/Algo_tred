from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime

class IndicatorCondition(BaseModel):
    indicator: str # RSI, EMA_CROSSOVER, SUPERTREND, BOLLINGER, VWAP, MACD, SMA
    params: Dict[str, Any] = Field(default_factory=dict)
    operator: str # "<", ">", "==", "CROSSES_ABOVE", "CROSSES_BELOW", "EQUALS"
    value: Union[float, int, str, None] = None

class StrategyRulesSchema(BaseModel):
    logic_operator: str = "AND" # AND / OR
    entry_conditions: List[IndicatorCondition]
    exit_conditions: List[IndicatorCondition] = Field(default_factory=list)
    stop_loss_pct: float = Field(default=1.5, ge=0.1, le=50.0)
    target_pct: float = Field(default=3.0, ge=0.1, le=200.0)
    trailing_stop_pct: Optional[float] = Field(default=None, ge=0.0, le=20.0)
    position_size_type: str = "fixed_cash" # fixed_cash, percentage_capital, fixed_qty
    position_size_value: float = Field(default=100000.0, gt=0)

class StrategyBase(BaseModel):
    name: str
    description: Optional[str] = None
    segment: str = "EQUITY" # EQUITY, FUTURES, OPTIONS
    symbol: str = "RELIANCE"
    timeframe: str = "15m" # 1m, 5m, 15m, 1h, 1d
    rules: StrategyRulesSchema
    params: Dict[str, Any] = Field(default_factory=dict)

class StrategyCreate(StrategyBase):
    template_id: Optional[str] = None

class StrategyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    segment: Optional[str] = None
    symbol: Optional[str] = None
    timeframe: Optional[str] = None
    rules: Optional[StrategyRulesSchema] = None
    params: Optional[Dict[str, Any]] = None
    status: Optional[str] = None

class StrategyResponse(StrategyBase):
    id: str
    user_id: str
    template_id: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class StrategyTemplateResponse(BaseModel):
    id: str
    name: str
    description: str
    category: str
    default_rules: Dict[str, Any]
    default_params: Dict[str, Any]
    indicator_list: List[str]
    created_at: datetime

    class Config:
        from_attributes = True
