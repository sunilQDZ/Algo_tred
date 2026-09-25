import uuid
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.deployment import LiveDeployment
from app.models.order import Order
from app.models.position import Position
from app.models.strategy import Strategy
from app.models.user import User
from app.schemas.deployment import DeploymentCreate, DeploymentResponse, OrderResponse, PositionResponse
from app.api.v1.deps import get_current_user
from app.services.broker.factory import BrokerFactory

router = APIRouter(prefix="/deployments", tags=["Deployments"])

@router.post("/", response_model=DeploymentResponse)
async def create_deployment(
    req: DeploymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify strategy ownership
    stmt = select(Strategy).where(Strategy.id == req.strategy_id, Strategy.user_id == current_user.id)
    res = await db.execute(stmt)
    strat = res.scalar_one_or_none()
    if not strat:
        raise HTTPException(status_code=404, detail="Strategy not found")

    new_dep = LiveDeployment(
        user_id=current_user.id,
        strategy_id=req.strategy_id,
        broker_connection_id=req.broker_connection_id,
        mode=req.mode,
        status="RUNNING",
        capital_allocated=req.capital_allocated,
        current_equity=req.capital_allocated,
        risk_settings={
            "max_daily_loss_pct": req.max_daily_loss_pct,
            "max_position_size": req.capital_allocated * 2,
            "kill_switch_triggered": False
        }
    )
    db.add(new_dep)
    strat.status = req.mode # PAPER or LIVE
    await db.commit()
    await db.refresh(new_dep)

    # Place initial seed paper order to verify deployment lifecycle
    broker = BrokerFactory.get_adapter(req.mode)
    client_ord_id = f"INIT_{uuid.uuid4().hex[:8]}"
    ord_res = await broker.place_order(
        client_order_id=client_ord_id,
        symbol=strat.symbol,
        side="BUY",
        qty=10,
        order_type="MARKET"
    )

    db_order = Order(
        client_order_id=client_ord_id,
        deployment_id=new_dep.id,
        broker_order_id=ord_res.get("broker_order_id"),
        symbol=strat.symbol,
        side="BUY",
        qty=10,
        price=ord_res.get("filled_price", 2450.0),
        filled_price=ord_res.get("filled_price", 2450.0),
        status=ord_res.get("status", "FILLED")
    )
    db.add(db_order)

    db_pos = Position(
        deployment_id=new_dep.id,
        symbol=strat.symbol,
        qty=10,
        avg_price=ord_res.get("filled_price", 2450.0),
        current_price=ord_res.get("filled_price", 2450.0),
        unrealized_pnl=0.0
    )
    db.add(db_pos)

    await db.commit()
    await db.refresh(new_dep)
    return new_dep

@router.get("/", response_model=List[DeploymentResponse])
async def list_deployments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(LiveDeployment).where(LiveDeployment.user_id == current_user.id).order_by(LiveDeployment.started_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/{deployment_id}/kill", response_model=DeploymentResponse)
async def emergency_kill_switch(
    deployment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Emergency kill-switch: stops deployment, triggers position exit, and locks trading."""
    stmt = select(LiveDeployment).where(LiveDeployment.id == deployment_id, LiveDeployment.user_id == current_user.id)
    res = await db.execute(stmt)
    dep = res.scalar_one_or_none()
    if not dep:
        raise HTTPException(status_code=404, detail="Deployment not found")

    dep.status = "KILLED"
    risk_cfg = dep.risk_settings.copy()
    risk_cfg["kill_switch_triggered"] = True
    dep.risk_settings = risk_cfg

    # Close open positions
    pos_stmt = select(Position).where(Position.deployment_id == deployment_id, Position.qty != 0)
    pos_res = await db.execute(pos_stmt)
    open_positions = pos_res.scalars().all()

    broker = BrokerFactory.get_adapter(dep.mode)

    for pos in open_positions:
        close_side = "SELL" if pos.qty > 0 else "BUY"
        client_ord_id = f"KILL_{uuid.uuid4().hex[:8]}"
        ord_res = await broker.place_order(
            client_order_id=client_ord_id,
            symbol=pos.symbol,
            side=close_side,
            qty=abs(pos.qty),
            order_type="MARKET"
        )
        order_rec = Order(
            client_order_id=client_ord_id,
            deployment_id=dep.id,
            broker_order_id=ord_res.get("broker_order_id"),
            symbol=pos.symbol,
            side=close_side,
            qty=abs(pos.qty),
            price=ord_res.get("filled_price", pos.avg_price),
            filled_price=ord_res.get("filled_price", pos.avg_price),
            status="FILLED"
        )
        db.add(order_rec)
        pos.realized_pnl += (ord_res.get("filled_price", pos.avg_price) - pos.avg_price) * pos.qty
        pos.qty = 0
        pos.unrealized_pnl = 0.0

    await db.commit()
    await db.refresh(dep)
    return dep

@router.get("/{deployment_id}/orders", response_model=List[OrderResponse])
async def list_deployment_orders(
    deployment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Order).where(Order.deployment_id == deployment_id).order_by(Order.placed_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/{deployment_id}/positions", response_model=List[PositionResponse])
async def list_deployment_positions(
    deployment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Position).where(Position.deployment_id == deployment_id)
    res = await db.execute(stmt)
    return res.scalars().all()
