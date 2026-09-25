import uuid
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, DateTime, JSON, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.broker import BrokerConnection
    from app.models.strategy import Strategy
    from app.models.deployment import LiveDeployment
    from app.models.subscription import Subscription

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    kyc_status: Mapped[str] = mapped_column(String(50), default="PENDING")
    risk_profile: Mapped[dict] = mapped_column(JSON, default=lambda: {"tolerance": "moderate", "max_drawdown_limit": 15, "investment_horizon": "medium"})
    subscription_plan: Mapped[str] = mapped_column(String(50), default="FREE")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    broker_connections: Mapped[List["BrokerConnection"]] = relationship("BrokerConnection", back_populates="user", cascade="all, delete-orphan")
    strategies: Mapped[List["Strategy"]] = relationship("Strategy", back_populates="user", cascade="all, delete-orphan")
    deployments: Mapped[List["LiveDeployment"]] = relationship("LiveDeployment", back_populates="user", cascade="all, delete-orphan")
    subscription: Mapped[Optional["Subscription"]] = relationship("Subscription", back_populates="user", uselist=False, cascade="all, delete-orphan")
