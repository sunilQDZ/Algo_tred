import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, DateTime, Float, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.deployment import LiveDeployment

class Order(Base):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    client_order_id: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False) # For idempotency
    deployment_id: Mapped[str] = mapped_column(String(36), ForeignKey("live_deployments.id", ondelete="CASCADE"), nullable=False)
    broker_order_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    
    symbol: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    side: Mapped[str] = mapped_column(String(10), nullable=False) # BUY, SELL
    qty: Mapped[int] = mapped_column(Integer, nullable=False)
    price: Mapped[float] = mapped_column(Float, default=0.0) # Requested or execution price
    filled_price: Mapped[float] = mapped_column(Float, default=0.0)
    order_type: Mapped[str] = mapped_column(String(20), default="MARKET") # MARKET, LIMIT, SL, SL-M
    
    status: Mapped[str] = mapped_column(String(50), default="PENDING") # PENDING, PLACED, FILLED, CANCELLED, REJECTED
    reject_reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    placed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    filled_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    deployment: Mapped["LiveDeployment"] = relationship("LiveDeployment", back_populates="orders")
