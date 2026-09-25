import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User

class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    plan: Mapped[str] = mapped_column(String(50), default="FREE") # FREE, PRO, INSTITUTIONAL
    billing_cycle: Mapped[str] = mapped_column(String(20), default="MONTHLY") # MONTHLY, ANNUAL
    status: Mapped[str] = mapped_column(String(50), default="ACTIVE") # ACTIVE, CANCELLED, PAST_DUE
    razorpay_subscription_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    current_period_end: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="subscription")
