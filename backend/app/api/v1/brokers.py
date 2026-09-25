from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.broker import BrokerConnection
from app.models.user import User
from app.schemas.broker import BrokerConnectRequest, BrokerConnectionResponse
from app.api.v1.deps import get_current_user
from app.services.broker.factory import BrokerFactory

router = APIRouter(prefix="/brokers", tags=["Brokers"])

@router.get("/", response_model=List[BrokerConnectionResponse])
async def list_user_broker_connections(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(BrokerConnection).where(BrokerConnection.user_id == current_user.id)
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/connect", response_model=BrokerConnectionResponse)
async def connect_broker(
    req: BrokerConnectRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    broker_name = req.broker_name.upper()
    adapter = BrokerFactory.get_adapter(broker_name)

    cred_dict = {
        "api_key": req.api_key,
        "api_secret": req.api_secret,
        "access_token": req.access_token,
        "client_id": req.client_id
    }

    connected = await adapter.connect(cred_dict)

    # Check if connection already exists
    stmt = select(BrokerConnection).where(BrokerConnection.user_id == current_user.id, BrokerConnection.broker_name == broker_name)
    res = await db.execute(stmt)
    existing = res.scalar_one_or_none()

    if existing:
        existing.encrypted_tokens = cred_dict
        existing.status = "CONNECTED" if connected else "DISCONNECTED"
        await db.commit()
        await db.refresh(existing)
        return existing

    new_conn = BrokerConnection(
        user_id=current_user.id,
        broker_name=broker_name,
        account_id=req.client_id or f"{broker_name}_ACC_01",
        encrypted_tokens=cred_dict,
        status="CONNECTED" if connected else "DISCONNECTED"
    )
    db.add(new_conn)
    await db.commit()
    await db.refresh(new_conn)
    return new_conn
