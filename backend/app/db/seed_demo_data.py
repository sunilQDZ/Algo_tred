import asyncio
import uuid
from datetime import datetime, timedelta
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.broker import BrokerConnection
from app.models.strategy import StrategyTemplate, Strategy
from app.models.backtest import BacktestRun
from app.models.optimization import OptimizationRun
from app.models.deployment import LiveDeployment
from app.models.order import Order
from app.models.position import Position
from app.models.subscription import Subscription
from app.core.security import get_password_hash
from app.db.seed_templates import SEED_STRATEGY_TEMPLATES

async def seed_rich_demo_data():
    async with AsyncSessionLocal() as session:
        print("Seeding rich demo data for StrykeX platform...")

        # 1. Seed Templates
        stmt = select(StrategyTemplate)
        res = await session.execute(stmt)
        templates = res.scalars().all()
        if not templates:
            for tpl_data in SEED_STRATEGY_TEMPLATES:
                tpl = StrategyTemplate(**tpl_data)
                session.add(tpl)
            await session.commit()
            stmt = select(StrategyTemplate)
            res = await session.execute(stmt)
            templates = res.scalars().all()

        # 2. Seed User trader@strykex.ai
        user_stmt = select(User).where(User.email == "trader@strykex.ai")
        user_res = await session.execute(user_stmt)
        user = user_res.scalar_one_or_none()

        if not user:
            hashed_pwd = get_password_hash("StrykeX123!")
            user = User(
                email="trader@strykex.ai",
                hashed_password=hashed_pwd,
                full_name="Rajesh Sharma",
                phone="+919876543210",
                kyc_status="VERIFIED",
                risk_profile={
                    "tolerance": "moderate",
                    "max_drawdown_limit": 12.0,
                    "investment_horizon": "medium"
                },
                subscription_plan="PRO"
            )
            session.add(user)
            await session.flush()

            sub = Subscription(user_id=user.id, plan="PRO", billing_cycle="MONTHLY", status="ACTIVE")
            session.add(sub)
            await session.commit()

        # 3. Seed Broker Connections
        b_stmt = select(BrokerConnection).where(BrokerConnection.user_id == user.id)
        b_res = await session.execute(b_stmt)
        existing_brokers = b_res.scalars().all()

        if not existing_brokers:
            b1 = BrokerConnection(
                user_id=user.id,
                broker_name="ZERODHA",
                account_id="ZERODHA_KITE_6820",
                encrypted_tokens={"api_key": "kite_key_prod", "access_token": "kite_token_active"},
                status="CONNECTED"
            )
            b2 = BrokerConnection(
                user_id=user.id,
                broker_name="DHAN",
                account_id="DHAN_ACC_9921",
                encrypted_tokens={"client_id": "dhan_9921", "access_token": "dhan_token_active"},
                status="CONNECTED"
            )
            b3 = BrokerConnection(
                user_id=user.id,
                broker_name="PAPER",
                account_id="PAPER_SIM_001",
                encrypted_tokens={},
                status="CONNECTED"
            )
            session.add_all([b1, b2, b3])
            await session.commit()

        # 4. Seed Strategies
        s_stmt = select(Strategy).where(Strategy.user_id == user.id)
        s_res = await session.execute(s_stmt)
        strategies = s_res.scalars().all()

        if not strategies:
            strat1 = Strategy(
                user_id=user.id,
                name="Golden EMA 9/21 Trend Crossover",
                description="Institutional trend following algorithm riding 9/21 EMA momentum on Reliance Industries.",
                segment="EQUITY",
                symbol="RELIANCE",
                timeframe="15m",
                rules={
                    "logic_operator": "AND",
                    "entry_conditions": [{"indicator": "EMA_CROSSOVER", "params": {"fast": 9, "slow": 21}, "operator": "CROSSES_ABOVE", "value": None}],
                    "exit_conditions": [{"indicator": "EMA_CROSSOVER", "params": {"fast": 9, "slow": 21}, "operator": "CROSSES_BELOW", "value": None}],
                    "stop_loss_pct": 1.5,
                    "target_pct": 3.5,
                    "trailing_stop_pct": 0.5,
                    "position_size_type": "fixed_cash",
                    "position_size_value": 200000.0
                },
                status="LIVE"
            )

            strat2 = Strategy(
                user_id=user.id,
                name="RSI Oversold Mean Reversion (Nifty 50)",
                description="Buys Nifty 50 ETF index on extreme RSI dips below 30 and exits on mean reversion above 68.",
                segment="EQUITY",
                symbol="NIFTY50",
                timeframe="15m",
                rules={
                    "logic_operator": "AND",
                    "entry_conditions": [{"indicator": "RSI", "params": {"period": 14}, "operator": "<", "value": 30}],
                    "exit_conditions": [{"indicator": "RSI", "params": {"period": 14}, "operator": ">", "value": 68}],
                    "stop_loss_pct": 1.2,
                    "target_pct": 2.8,
                    "position_size_type": "fixed_cash",
                    "position_size_value": 100000.0
                },
                status="PAPER"
            )

            strat3 = Strategy(
                user_id=user.id,
                name="Supertrend Intraday Momentum",
                description="Fast scalping algorithm following Supertrend indicator trend direction on BankNifty futures.",
                segment="FUTURES",
                symbol="BANKNIFTY",
                timeframe="5m",
                rules={
                    "logic_operator": "AND",
                    "entry_conditions": [{"indicator": "SUPERTREND", "params": {"period": 10, "multiplier": 3.0}, "operator": "EQUALS", "value": "GREEN"}],
                    "exit_conditions": [{"indicator": "SUPERTREND", "params": {"period": 10, "multiplier": 3.0}, "operator": "EQUALS", "value": "RED"}],
                    "stop_loss_pct": 1.0,
                    "target_pct": 2.5,
                    "position_size_type": "fixed_cash",
                    "position_size_value": 150000.0
                },
                status="BACKTESTED"
            )

            session.add_all([strat1, strat2, strat3])
            await session.commit()
            
            s_stmt = select(Strategy).where(Strategy.user_id == user.id)
            s_res = await session.execute(s_stmt)
            strategies = s_res.scalars().all()

        strat1 = strategies[0]

        # 5. Seed Backtest Runs for Strat 1
        bt_stmt = select(BacktestRun).where(BacktestRun.strategy_id == strat1.id)
        bt_res = await session.execute(bt_stmt)
        if not bt_res.scalars().all():
            # Generate 90-day realistic equity curve
            equity_curve = []
            curr_eq = 200000.0
            bench = 200000.0
            start_t = datetime(2023, 1, 1)

            for day in range(90):
                d_str = (start_t + timedelta(days=day)).strftime("%Y-%m-%d 15:30")
                # Simulated positive trend with realistic drawdowns
                ret = 0.0035 + (0.008 if (day % 4 != 0) else -0.006)
                curr_eq = curr_eq * (1 + ret)
                bench = bench * (1 + 0.0012)
                equity_curve.append({
                    "date": d_str,
                    "equity": round(curr_eq, 2),
                    "benchmark": round(bench, 2)
                })

            trade_log = []
            for i in range(1, 25):
                is_win = i % 3 != 0
                gross = 4500.0 if is_win else -1800.0
                net = gross - 40.0
                trade_log.append({
                    "trade_no": i,
                    "entry_time": (start_t + timedelta(days=i*3)).strftime("%Y-%m-%d 09:30"),
                    "exit_time": (start_t + timedelta(days=i*3+1)).strftime("%Y-%m-%d 14:15"),
                    "side": "BUY",
                    "qty": 50,
                    "entry_price": 2400.0 + (i * 2),
                    "exit_price": (2400.0 + (i * 2)) + (90.0 if is_win else -36.0),
                    "gross_pnl": gross,
                    "net_pnl": net,
                    "pnl_pct": round((net / 120000.0) * 100, 2),
                    "exit_reason": "TARGET_PROFIT" if is_win else "STOP_LOSS"
                })

            bt_run = BacktestRun(
                strategy_id=strat1.id,
                params_used=strat1.params,
                start_date="2023-01-01",
                end_date="2024-01-01",
                initial_capital=200000.0,
                status="COMPLETED",
                metrics={
                    "initial_capital": 200000.0,
                    "final_equity": round(curr_eq, 2),
                    "total_return_pct": round(((curr_eq - 200000.0) / 200000.0) * 100, 2),
                    "cagr_pct": 28.4,
                    "max_drawdown_pct": 7.8,
                    "win_rate_pct": 68.5,
                    "sharpe_ratio": 2.15,
                    "profit_factor": 2.4,
                    "total_trades": len(trade_log),
                    "winning_trades": 16,
                    "losing_trades": 8
                },
                equity_curve=equity_curve,
                trade_log=trade_log
            )
            session.add(bt_run)
            await session.commit()

        # 6. Seed Optimization Runs for Strat 1
        opt_stmt = select(OptimizationRun).where(OptimizationRun.strategy_id == strat1.id)
        opt_res = await session.execute(opt_stmt)
        if not opt_res.scalars().all():
            top_n = [
                {
                    "rank": 1,
                    "params": {"rsi_period": 14, "stop_loss_pct": 1.5, "target_pct": 3.5},
                    "train_metrics": {"cagr_pct": 32.1, "max_drawdown_pct": 6.9, "sharpe_ratio": 2.35},
                    "test_metrics": {"cagr_pct": 28.4, "max_drawdown_pct": 7.8, "sharpe_ratio": 2.15}
                },
                {
                    "rank": 2,
                    "params": {"rsi_period": 21, "stop_loss_pct": 2.0, "target_pct": 4.0},
                    "train_metrics": {"cagr_pct": 35.8, "max_drawdown_pct": 11.2, "sharpe_ratio": 1.95},
                    "test_metrics": {"cagr_pct": 24.1, "max_drawdown_pct": 12.4, "sharpe_ratio": 1.72}
                },
                {
                    "rank": 3,
                    "params": {"rsi_period": 10, "stop_loss_pct": 1.0, "target_pct": 2.5},
                    "train_metrics": {"cagr_pct": 22.4, "max_drawdown_pct": 5.2, "sharpe_ratio": 1.80},
                    "test_metrics": {"cagr_pct": 19.8, "max_drawdown_pct": 6.1, "sharpe_ratio": 1.65}
                }
            ]

            claude_summary = """
### 1. Plain-English Strategy Analysis & Trade-offs
We evaluated top hyperparameter sets for **Golden EMA 9/21 Trend Crossover (RELIANCE)** using Optuna 35-trial search and a 70/30 out-of-sample train/test split:
- **Rank #1**: Optimal balanced parameters (`stop_loss_pct: 1.5%`, `target_pct: 3.5%`). Maintains high out-of-sample Sharpe Ratio of **2.15** with modest peak drawdown of **-7.8%**.
- **Rank #2**: Higher target profit (4.0%), but experienced increased drawdown (-12.4%) and noticeable drop between train (35.8%) and test (24.1%) metrics, indicating mild overfitting.

### 2. Personalized Configuration Recommendation
Based on your **MODERATE** risk profile (max drawdown limit: 12.0%), **Rank #1** is explicitly recommended. It delivers top-tier risk-adjusted returns while keeping portfolio drawdowns well within your safety threshold.

### 3. Risk Warning & Overfitting Flag
> [!NOTE]
> Out-of-sample test consistency is high (only 11% performance decay). Slippage of 0.05% and standard INR 20 broker fees were included in all calculations.

```json
{
  "recommended_rank": 1,
  "confidence_score": 94,
  "risk_rating": "MODERATE",
  "summary_headline": "Rank #1 offers superior out-of-sample stability matching your 12% max drawdown tolerance."
}
```
"""

            opt_run = OptimizationRun(
                strategy_id=strat1.id,
                param_search_space={"rsi_period": [10, 14, 21], "stop_loss_pct": [1.0, 1.5, 2.0], "target_pct": [2.5, 3.5, 4.0]},
                n_trials=35,
                target_metric="sharpe_ratio",
                status="COMPLETED",
                top_n_results=top_n,
                ai_summary=claude_summary,
                ai_recommended_config_idx=1
            )
            session.add(opt_run)
            await session.commit()

        # 7. Seed Live Deployments
        dep_stmt = select(LiveDeployment).where(LiveDeployment.user_id == user.id)
        dep_res = await session.execute(dep_stmt)
        deployments = dep_res.scalars().all()

        if not deployments:
            d1 = LiveDeployment(
                user_id=user.id,
                strategy_id=strat1.id,
                mode="LIVE",
                status="RUNNING",
                capital_allocated=200000.0,
                current_equity=218000.0,
                realized_pnl=14580.0,
                unrealized_pnl=3420.0,
                risk_settings={"max_daily_loss_pct": 3.0, "max_position_size": 300000.0, "kill_switch_triggered": False}
            )
            d2 = LiveDeployment(
                user_id=user.id,
                strategy_id=strategies[1].id,
                mode="PAPER",
                status="RUNNING",
                capital_allocated=100000.0,
                current_equity=108455.0,
                realized_pnl=6200.0,
                unrealized_pnl=2255.0,
                risk_settings={"max_daily_loss_pct": 3.0, "max_position_size": 150000.0, "kill_switch_triggered": False}
            )
            session.add_all([d1, d2])
            await session.commit()

            dep_stmt = select(LiveDeployment).where(LiveDeployment.user_id == user.id)
            dep_res = await session.execute(dep_stmt)
            deployments = dep_res.scalars().all()

        d1 = deployments[0]

        # 8. Seed Positions & Orders for Live Deployment
        pos_stmt = select(Position).where(Position.deployment_id == d1.id)
        pos_res = await session.execute(pos_stmt)
        if not pos_res.scalars().all():
            pos1 = Position(
                deployment_id=d1.id,
                symbol="RELIANCE",
                qty=50,
                avg_price=2420.00,
                current_price=2488.40,
                unrealized_pnl=3420.00,
                realized_pnl=14580.00
            )
            session.add(pos1)

            # Orders Audit Trail
            for i in range(1, 6):
                ord_buy = Order(
                    client_order_id=f"ORD_LIVE_{uuid.uuid4().hex[:8].upper()}",
                    deployment_id=d1.id,
                    broker_order_id=f"240907{100000+i}",
                    symbol="RELIANCE",
                    side="BUY",
                    qty=50,
                    price=2410.0 + (i * 5),
                    filled_price=2410.0 + (i * 5),
                    order_type="MARKET",
                    status="FILLED",
                    placed_at=datetime.utcnow() - timedelta(days=6-i)
                )
                session.add(ord_buy)

            await session.commit()

        print("Successfully seeded rich demo data!")

if __name__ == "__main__":
    asyncio.run(seed_rich_demo_data())
