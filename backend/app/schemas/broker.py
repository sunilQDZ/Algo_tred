from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class BrokerConnectRequest(BaseModel):
    broker_name: str # ZERODHA, DHAN, PAPER, ANGELONE
    api_key: Optional[str] = None
    api_secret: Optional[str] = None
    access_token: Optional[str] = None
    client_id: Optional[str] = None

class BrokerConnectionResponse(BaseModel):
    id: str
    user_id: str
    broker_name: str
    account_id: Optional[str] = None
    status: str
    linked_at: datetime
    last_synced_at: Optional[datetime] = None

    class Config:
        from_attributes = True
