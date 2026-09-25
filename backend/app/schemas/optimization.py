from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class OptimizationRequest(BaseModel):
    strategy_id: str
    param_search_space: Dict[str, List[Any]] # e.g. {"rsi_period": [10, 14, 21], "ema_fast": [5, 9, 15]}
    n_trials: int = Field(default=20, ge=5, le=100)
    target_metric: str = "sharpe_ratio" # sharpe_ratio, cagr, win_rate

class OptimizationResponse(BaseModel):
    id: str
    strategy_id: str
    param_search_space: Dict[str, Any]
    method: str
    n_trials: int
    target_metric: str
    status: str
    top_n_results: List[Dict[str, Any]]
    ai_summary: Optional[str] = None
    ai_recommended_config_idx: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True
