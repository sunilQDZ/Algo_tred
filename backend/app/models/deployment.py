import uuid
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, DateTime, JSON, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.strategy import Strategy
    from app.models.broker import BrokerConnection
    from app.models.order import Order
    from app.models.position import Position

class LiveDeployment(Base):
    __tablename__ = "live_deployments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    strategy_id: Mapped[str] = mapped_column(String(36), ForeignKey("strategies.id", ondelete="CASCADE"), nullable=False)
    broker_connection_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("broker_connections.id", ondelete="SET NULL"), nullable=True)
    
    mode: Mapped[str] = mapped_column(String(50), default="PAPER") # PAPER, LIVE
    status: Mapped[str] = mapped_column(String(50), default="RUNNING") # RUNNING, PAUSED, STOPPED, KILLED
    capital_allocated: Mapped[float] = mapped_column(Float, default=100000.0)
    current_equity: Mapped[float] = mapped_column(Float, default=100000.0)
    realized_pnl: Mapped[float] = mapped_column(Float, default=0.0)
    unrealized_pnl: Mapped[float] = mapped_column(Float, default=0.0)
    
    risk_settings: Mapped[dict] = mapped_column(JSON, default=lambda: {"max_daily_loss_pct": 3.0, "max_position_size": 200000.0, "kill_switch_triggered": False})
    
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    stopped_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="deployments")
    strategy: Mapped["Strategy"] = relationship("Strategy", back_populates="deployments")
    broker_connection: Mapped[Optional["BrokerConnection"]] = relationship("BrokerConnection")
    orders: Mapped[List["Order"]] = relationship("Order", back_populates="deployment", cascade="all, delete-orphan")
    positions: Mapped[List["Position"]] = relationship("Position", back_populates="deployment", cascade="all, delete-orphan")
