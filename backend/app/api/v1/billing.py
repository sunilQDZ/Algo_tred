from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.subscription import Subscription
from app.models.user import User
from app.api.v1.deps import get_current_user

router = APIRouter(prefix="/billing", tags=["Billing"])

@router.get("/subscription")
async def get_user_subscription(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Subscription).where(Subscription.user_id == current_user.id)
    res = await db.execute(stmt)
    sub = res.scalar_one_or_none()
    
    if not sub:
        sub = Subscription(user_id=current_user.id, plan="FREE", status="ACTIVE")
        db.add(sub)
        await db.commit()
        await db.refresh(sub)

    plan_limits = {
        "FREE": {"max_deployments": 1, "max_backtests_per_day": 10, "optuna_trials": 15},
        "PRO": {"max_deployments": 5, "max_backtests_per_day": 100, "optuna_trials": 50},
        "INSTITUTIONAL": {"max_deployments": 25, "max_backtests_per_day": 1000, "optuna_trials": 100}
    }

    return {
        "id": sub.id,
        "plan": sub.plan,
        "billing_cycle": sub.billing_cycle,
        "status": sub.status,
        "limits": plan_limits.get(sub.plan, plan_limits["FREE"]),
        "current_period_end": sub.current_period_end
    }

@router.post("/create-razorpay-subscription")
async def create_razorpay_subscription(
    plan: str = "PRO",
    billing_cycle: str = "MONTHLY",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Simulated Razorpay order creation for Indian UPI/Netbanking payment integration
    mock_order_id = f"rzp_order_{current_user.id[:8]}_{plan.lower()}"
    return {
        "razorpay_order_id": mock_order_id,
        "plan": plan,
        "billing_cycle": billing_cycle,
        "amount_inr": 2999 if plan == "PRO" else 9999,
        "currency": "INR",
        "key_id": "rzp_test_placeholder_key"
    }

@router.post("/verify-payment")
async def verify_payment(
    payment_id: str,
    order_id: str,
    plan: str = "PRO",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Subscription).where(Subscription.user_id == current_user.id)
    res = await db.execute(stmt)
    sub = res.scalar_one_or_none()

    if sub:
        sub.plan = plan
        sub.status = "ACTIVE"
        current_user.subscription_plan = plan
        await db.commit()

    return {"status": "SUCCESS", "plan": plan, "message": "Subscription upgraded successfully"}
