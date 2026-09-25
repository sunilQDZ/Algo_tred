import asyncio
import json
import random
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router
from app.db.base import Base
from app.db.session import engine, AsyncSessionLocal
from app.models.strategy import StrategyTemplate
from app.models.user import User
from app.models.subscription import Subscription
from app.core.security import get_password_hash
from app.db.seed_templates import SEED_STRATEGY_TEMPLATES
from sqlalchemy import select

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    # Create DB tables if not exists
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed strategy templates & default demo user
    async with AsyncSessionLocal() as session:
        # Seed templates
        stmt = select(StrategyTemplate)
        res = await session.execute(stmt)
        templates = res.scalars().all()
        if not templates:
            for tpl_data in SEED_STRATEGY_TEMPLATES:
                tpl = StrategyTemplate(**tpl_data)
                session.add(tpl)
            await session.commit()

        # Seed default demo user trader@strykex.ai
        user_stmt = select(User).where(User.email == "trader@strykex.ai")
        user_res = await session.execute(user_stmt)
        if not user_res.scalar_one_or_none():
            hashed_pwd = get_password_hash("StrykeX123!")
            demo_user = User(
                email="trader@strykex.ai",
                hashed_password=hashed_pwd,
                full_name="Rajesh Sharma",
                phone="+919876543210",
                subscription_plan="PRO"
            )
            session.add(demo_user)
            await session.flush()
            sub = Subscription(user_id=demo_user.id, plan="PRO", status="ACTIVE")
            session.add(sub)
            await session.commit()

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health")
def health_check():
    return {"status": "ok", "app": settings.PROJECT_NAME}

# WebSocket for Streaming Live Ticks & Deployment P&L
@app.websocket("/ws/live/{deployment_id}")
async def websocket_live_deployment(websocket: WebSocket, deployment_id: str):
    await websocket.accept()
    try:
        base_ltp = 2450.0
        qty = 10
        avg_price = 2445.0
        realized_pnl = 120.0

        while True:
            fluc = round(random.uniform(-0.002, 0.002) * base_ltp, 2)
            current_ltp = round(base_ltp + fluc, 2)
            unrealized_pnl = round((current_ltp - avg_price) * qty, 2)
            total_pnl = round(realized_pnl + unrealized_pnl, 2)

            tick_payload = {
                "deployment_id": deployment_id,
                "symbol": "RELIANCE",
                "ltp": current_ltp,
                "qty": qty,
                "avg_price": avg_price,
                "unrealized_pnl": unrealized_pnl,
                "realized_pnl": realized_pnl,
                "total_pnl": total_pnl,
                "timestamp": asyncio.get_event_loop().time()
            }
            await websocket.send_text(json.dumps(tick_payload))
            await asyncio.sleep(1.0)
    except WebSocketDisconnect:
        pass
