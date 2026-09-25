from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.strategies import router as strategies_router
from app.api.v1.backtests import router as backtests_router
from app.api.v1.optimizations import router as optimizations_router
from app.api.v1.deployments import router as deployments_router
from app.api.v1.brokers import router as brokers_router
from app.api.v1.market_data import router as market_data_router
from app.api.v1.billing import router as billing_router
from app.api.v1.options import router as options_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.webhooks import router as webhooks_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(strategies_router)
api_router.include_router(backtests_router)
api_router.include_router(optimizations_router)
api_router.include_router(deployments_router)
api_router.include_router(brokers_router)
api_router.include_router(market_data_router)
api_router.include_router(billing_router)
api_router.include_router(options_router)
api_router.include_router(analytics_router)
api_router.include_router(webhooks_router)
