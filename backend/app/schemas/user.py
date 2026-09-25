from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from datetime import datetime

class RiskProfileSchema(BaseModel):
    tolerance: str = "moderate" # conservative, moderate, aggressive
    max_drawdown_limit: float = 15.0
    investment_horizon: str = "medium" # short, medium, long

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    risk_profile: Optional[RiskProfileSchema] = None

class UserResponse(UserBase):
    id: str
    kyc_status: str
    risk_profile: Dict[str, Any]
    subscription_plan: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
