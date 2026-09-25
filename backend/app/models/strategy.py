import uuid
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, DateTime, JSON, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.backtest import BacktestRun
    from app.models.optimization import OptimizationRun
    from app.models.deployment import LiveDeployment

class StrategyTemplate(Base):
    __tablename__ = "strategy_templates"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(100), default="TREND_FOLLOWING") # TREND_FOLLOWING, MEAN_REVERSION, BREAKOUT, OPTIONS_DELTA_NEUTRAL
    default_rules: Mapped[dict] = mapped_column(JSON, nullable=False)
    default_params: Mapped[dict] = mapped_column(JSON, nullable=False)
    indicator_list: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Strategy(Base):
    __tablename__ = "strategies"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    template_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("strategy_templates.id", ondelete="SET NULL"), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    segment: Mapped[str] = mapped_column(String(50), default="EQUITY") # EQUITY, FUTURES, OPTIONS
    symbol: Mapped[str] = mapped_column(String(50), default="RELIANCE")
    timeframe: Mapped[str] = mapped_column(String(20), default="15m") # 1m, 5m, 15m, 1h, 1d
    
    rules: Mapped[dict] = mapped_column(JSON, nullable=False)
    params: Mapped[dict] = mapped_column(JSON, default=dict)
    
    status: Mapped[str] = mapped_column(String(50), default="DRAFT") # DRAFT, BACKTESTED, PAPER, LIVE
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="strategies")
    backtest_runs: Mapped[List["BacktestRun"]] = relationship("BacktestRun", back_populates="strategy", cascade="all, delete-orphan")
    optimization_runs: Mapped[List["OptimizationRun"]] = relationship("OptimizationRun", back_populates="strategy", cascade="all, delete-orphan")
    deployments: Mapped[List["LiveDeployment"]] = relationship("LiveDeployment", back_populates="strategy", cascade="all, delete-orphan")
