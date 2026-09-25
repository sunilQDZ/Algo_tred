import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple, List
from app.schemas.strategy import StrategyRulesSchema
from app.services.strategy_engine import StrategyEngine

class BacktestEngine:
    """
    Backtesting simulator calculating vectorized and bar-by-bar execution statistics.
    Produces CAGR, Sharpe Ratio, Max Drawdown %, Win Rate, Profit Factor, Expectancy, Equity Curve, and Trade Log.
    """

    @classmethod
    def run_backtest(
        cls,
        df: pd.DataFrame,
        rules: StrategyRulesSchema,
        initial_capital: float = 100000.0,
        slippage_pct: float = 0.05, # 0.05% slippage
        brokerage_per_trade: float = 20.0 # Zerodha / Dhan standard INR 20 flat fee
    ) -> Dict[str, Any]:
        """
        Executes backtest over df given strategy rules.
        """
        df = df.copy()
        entries, exits = StrategyEngine.generate_signals(df, rules)

        position = 0 # 0: Cash, 1: Long
        entry_price = 0.0
        entry_time = None
        entry_qty = 0

        capital = initial_capital
        equity_curve: List[Dict[str, Any]] = []
        trade_log: List[Dict[str, Any]] = []

        stop_loss_pct = rules.stop_loss_pct / 100.0
        target_pct = rules.target_pct / 100.0
        trailing_stop_pct = (rules.trailing_stop_pct / 100.0) if rules.trailing_stop_pct else None
        highest_price_since_entry = 0.0

        timestamps = df.index
        closes = df["close"].values
        highs = df["high"].values
        lows = df["low"].values

        total_bars = len(df)

        for i in range(total_bars):
            curr_time = timestamps[i].strftime("%Y-%m-%d %H:%M")
            curr_close = closes[i]
            curr_high = highs[i]
            curr_low = lows[i]

            is_entry = entries.iloc[i]
            is_exit = exits.iloc[i]

            # Check open position exit / stop loss / target
            if position == 1:
                highest_price_since_entry = max(highest_price_since_entry, curr_high)

                sl_price = entry_price * (1 - stop_loss_pct)
                target_price = entry_price * (1 + target_pct)
                trail_sl_price = highest_price_since_entry * (1 - trailing_stop_pct) if trailing_stop_pct else 0.0

                exit_reason = None
                exit_price = curr_close

                if curr_low <= sl_price:
                    exit_reason = "STOP_LOSS"
                    exit_price = sl_price
                elif curr_high >= target_price:
                    exit_reason = "TARGET_PROFIT"
                    exit_price = target_price
                elif trailing_stop_pct and curr_low <= trail_sl_price:
                    exit_reason = "TRAILING_STOP"
                    exit_price = trail_sl_price
                elif is_exit:
                    exit_reason = "RULE_EXIT"
                    exit_price = curr_close

                if exit_reason:
                    exit_price_adj = exit_price * (1 - slippage_pct / 100.0)
                    # Calculate exact Indian Statutory Charges
                    buy_turnover = entry_price * entry_qty
                    sell_turnover = exit_price_adj * entry_qty
                    total_turnover = buy_turnover + sell_turnover

                    # Brokerage: min(20 per leg, 0.03% of turnover per leg)
                    leg1_brokerage = min(brokerage_per_trade, buy_turnover * 0.0003)
                    leg2_brokerage = min(brokerage_per_trade, sell_turnover * 0.0003)
                    trade_brokerage = leg1_brokerage + leg2_brokerage

                    # STT (Securities Transaction Tax): 0.025% on Intraday Sell side
                    trade_stt = sell_turnover * 0.00025

                    # Exchange Txn Charges: 0.00345% of total turnover
                    trade_exchange = total_turnover * 0.0000345

                    # SEBI Turnover Charges: 0.0001% of total turnover
                    trade_sebi = total_turnover * 0.000001

                    # Stamp Duty: 0.003% on Buy turnover
                    trade_stamp = buy_turnover * 0.00003

                    # GST: 18% on (Brokerage + Exchange Txn Charges)
                    trade_gst = 0.18 * (trade_brokerage + trade_exchange)

                    trade_total_charges = round(trade_brokerage + trade_stt + trade_exchange + trade_sebi + trade_stamp + trade_gst, 2)

                    gross_pnl = (exit_price_adj - entry_price) * entry_qty
                    net_pnl = gross_pnl - trade_total_charges
                    pnl_pct = (net_pnl / buy_turnover) * 100.0 if buy_turnover > 0 else 0.0

                    capital += net_pnl

                    trade_log.append({
                        "trade_no": len(trade_log) + 1,
                        "entry_time": entry_time,
                        "exit_time": curr_time,
                        "side": "BUY",
                        "qty": entry_qty,
                        "entry_price": round(entry_price, 2),
                        "exit_price": round(exit_price_adj, 2),
                        "gross_pnl": round(gross_pnl, 2),
                        "total_charges": trade_total_charges,
                        "net_pnl": round(net_pnl, 2),
                        "pnl_pct": round(pnl_pct, 2),
                        "exit_reason": exit_reason
                    })

                    position = 0
                    entry_price = 0.0
                    entry_qty = 0

            # Check entry condition if in cash
            if position == 0 and is_entry:
                position = 1
                entry_time = curr_time
                entry_price = curr_close * (1 + slippage_pct / 100.0)
                highest_price_since_entry = entry_price

                # Position Sizing
                if rules.position_size_type == "fixed_cash":
                    alloc_cash = min(capital, rules.position_size_value)
                elif rules.position_size_type == "percentage_capital":
                    alloc_cash = capital * (rules.position_size_value / 100.0)
                else:
                    alloc_cash = min(capital, rules.position_size_value * entry_price)

                entry_qty = max(1, int(alloc_cash // entry_price))

            # Record daily/bar equity
            unrealized = (curr_close - entry_price) * entry_qty if position == 1 else 0.0
            curr_equity = capital + unrealized
            equity_curve.append({
                "date": curr_time,
                "equity": round(curr_equity, 2),
                "benchmark": round(initial_capital * (curr_close / closes[0]), 2)
            })

        # Calculate Performance Metrics
        df_equity = pd.DataFrame(equity_curve)
        if df_equity.empty:
            df_equity = pd.DataFrame([{"equity": initial_capital}])

        final_equity = df_equity["equity"].iloc[-1]
        total_return_pct = ((final_equity - initial_capital) / initial_capital) * 100.0

        # Calculate Max Drawdown
        df_equity["peak"] = df_equity["equity"].cummax()
        df_equity["drawdown"] = (df_equity["equity"] - df_equity["peak"]) / df_equity["peak"] * 100.0
        max_drawdown_pct = abs(df_equity["drawdown"].min()) if not df_equity["drawdown"].empty else 0.0

        # Calculate CAGR
        n_days = max(1, (timestamps[-1] - timestamps[0]).days)
        years = n_days / 365.25
        if years > 0 and final_equity > 0:
            cagr_pct = (((final_equity / initial_capital) ** (1 / years)) - 1) * 100.0
        else:
            cagr_pct = total_return_pct

        # Win Rate, Sharpe & Statutory Charges aggregation
        total_gross_pnl = sum(t["gross_pnl"] for t in trade_log)
        total_statutory_charges = round(sum(t["total_charges"] for t in trade_log), 2)
        total_net_pnl = round(final_equity - initial_capital, 2)

        if len(trade_log) > 0:
            winning_trades = [t for t in trade_log if t["net_pnl"] > 0]
            losing_trades = [t for t in trade_log if t["net_pnl"] <= 0]
            win_rate_pct = (len(winning_trades) / len(trade_log)) * 100.0

            total_win_amt = sum(t["net_pnl"] for t in winning_trades)
            total_loss_amt = abs(sum(t["net_pnl"] for t in losing_trades))
            profit_factor = round(total_win_amt / total_loss_amt, 2) if total_loss_amt > 0 else 99.0

            daily_returns = df_equity["equity"].pct_change().dropna()
            std_ret = daily_returns.std()
            sharpe_ratio = round((daily_returns.mean() / std_ret) * np.sqrt(252), 2) if std_ret > 0 else 0.0
        else:
            win_rate_pct = 0.0
            profit_factor = 0.0
            sharpe_ratio = 0.0

        metrics = {
            "initial_capital": initial_capital,
            "final_equity": round(final_equity, 2),
            "total_return_pct": round(total_return_pct, 2),
            "cagr_pct": round(cagr_pct, 2),
            "max_drawdown_pct": round(max_drawdown_pct, 2),
            "win_rate_pct": round(win_rate_pct, 2),
            "sharpe_ratio": sharpe_ratio,
            "profit_factor": profit_factor,
            "total_trades": len(trade_log),
            "winning_trades": len([t for t in trade_log if t["net_pnl"] > 0]),
            "losing_trades": len([t for t in trade_log if t["net_pnl"] <= 0]),
            "total_gross_pnl": round(total_gross_pnl, 2),
            "total_statutory_charges": total_statutory_charges,
            "total_net_pnl": total_net_pnl
        }

        # Downsample equity curve for fast UI charting if too large
        step = max(1, len(equity_curve) // 300)
        sampled_equity_curve = equity_curve[::step]

        return {
            "metrics": metrics,
            "equity_curve": sampled_equity_curve,
            "trade_log": trade_log
        }
