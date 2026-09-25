import uuid
from fastapi import APIRouter, Depends, HTTPException, Body
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.deployment import LiveDeployment
from app.models.order import Order
from app.models.position import Position
from app.services.broker.factory import BrokerFactory

router = APIRouter(prefix="/webhooks", tags=["Webhook Automation"])

@router.post("/tradingview/{deployment_id}")
async def receive_tradingview_alert(
    deployment_id: str,
    payload: Dict[str, Any] = Body(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Receives automated JSON webhook alerts from TradingView / custom signal bots.
    Sample Payload: {"action": "BUY", "symbol": "RELIANCE", "qty": 10, "passcode": "secret123"}
    """
    stmt = select(LiveDeployment).where(LiveDeployment.id == deployment_id)
    res = await db.execute(stmt)
    dep = res.scalar_one_or_none()

    if not dep:
        raise HTTPException(status_code=404, detail="Live deployment not found")

    if dep.status not in ["RUNNING"]:
        raise HTTPException(status_code=400, detail="Deployment is paused or killed")

    action = payload.get("action", "BUY").upper()
    symbol = payload.get("symbol", "RELIANCE")
    qty = int(payload.get("qty", 10))

    # Execute order via adapter
    broker = BrokerFactory.get_adapter(dep.mode)
    client_ord_id = f"TV_{uuid.uuid4().hex[:8].upper()}"

    ord_res = await broker.place_order(
        client_order_id=client_ord_id,
        symbol=symbol,
        side=action,
        qty=qty,
        order_type="MARKET"
    )

    db_order = Order(
        client_order_id=client_ord_id,
        deployment_id=dep.id,
        broker_order_id=ord_res.get("broker_order_id"),
        symbol=symbol,
        side=action,
        qty=qty,
        price=ord_res.get("filled_price", 2450.0),
        filled_price=ord_res.get("filled_price", 2450.0),
        status="FILLED"
    )
    db.add(db_order)
    await db.commit()

    return {
        "status": "SUCCESS",
        "client_order_id": client_order_id,
        "broker_order_id": ord_res.get("broker_order_id"),
        "filled_price": ord_res.get("filled_price"),
        "action": action,
        "symbol": symbol
    }
