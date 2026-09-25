import uuid
import random
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.services.broker.base import BrokerAdapter

class PaperBroker(BrokerAdapter):
    """
    Simulated Paper Trading broker adapter.
    Executes trades with realistic simulated fills, slippage, and P&L tracking.
    """

    def __init__(self):
        self.orders: Dict[str, Dict[str, Any]] = {}
        self.positions: Dict[str, Dict[str, Any]] = {}
        self.connected = True

    async def connect(self, credentials: Dict[str, Any]) -> bool:
        self.connected = True
        return True

    async def place_order(
        self,
        client_order_id: str,
        symbol: str,
        side: str,
        qty: int,
        price: float = 0.0,
        order_type: str = "MARKET"
    ) -> Dict[str, Any]:
        
        # Idempotency check
        if client_order_id in self.orders:
            return self.orders[client_order_id]

        broker_order_id = f"PAPER_{uuid.uuid4().hex[:10].upper()}"
        
        # Get simulated current market price
        quote = await self.get_quote(symbol)
        ltp = quote["ltp"]

        # Add minor slippage
        slippage = ltp * (0.0005 if side == "BUY" else -0.0005)
        filled_price = round(price if order_type == "LIMIT" and price > 0 else (ltp + slippage), 2)

        order_record = {
            "client_order_id": client_order_id,
            "broker_order_id": broker_order_id,
            "symbol": symbol,
            "side": side,
            "qty": qty,
            "price": price,
            "filled_price": filled_price,
            "order_type": order_type,
            "status": "FILLED",
            "placed_at": datetime.utcnow().isoformat(),
            "filled_at": datetime.utcnow().isoformat()
        }

        self.orders[client_order_id] = order_record

        # Update position
        current_pos = self.positions.get(symbol, {
            "symbol": symbol, "qty": 0, "avg_price": 0.0, "realized_pnl": 0.0, "unrealized_pnl": 0.0
        })

        if side == "BUY":
            new_qty = current_pos["qty"] + qty
            new_total_cost = (current_pos["qty"] * current_pos["avg_price"]) + (qty * filled_price)
            new_avg = new_total_cost / new_qty if new_qty > 0 else 0.0
            current_pos["qty"] = new_qty
            current_pos["avg_price"] = round(new_avg, 2)
        else: # SELL
            new_qty = current_pos["qty"] - qty
            pnl = (filled_price - current_pos["avg_price"]) * qty
            current_pos["realized_pnl"] += pnl
            current_pos["qty"] = new_qty
            if new_qty == 0:
                current_pos["avg_price"] = 0.0

        self.positions[symbol] = current_pos
        return order_record

    async def modify_order(self, broker_order_id: str, new_qty: Optional[int] = None, new_price: Optional[float] = None) -> Dict[str, Any]:
        for ord_data in self.orders.values():
            if ord_data["broker_order_id"] == broker_order_id:
                if new_qty: ord_data["qty"] = new_qty
                if new_price: ord_data["price"] = new_price
                return ord_data
        return {"error": "Order not found"}

    async def cancel_order(self, broker_order_id: str) -> Dict[str, Any]:
        for ord_data in self.orders.values():
            if ord_data["broker_order_id"] == broker_order_id:
                ord_data["status"] = "CANCELLED"
                return ord_data
        return {"error": "Order not found"}

    async def get_positions(self) -> List[Dict[str, Any]]:
        # Update unrealized PnL
        result = []
        for sym, pos in self.positions.items():
            if pos["qty"] != 0:
                quote = await self.get_quote(sym)
                ltp = quote["ltp"]
                pos["unrealized_pnl"] = round((ltp - pos["avg_price"]) * pos["qty"], 2)
                pos["current_price"] = ltp
            result.append(pos)
        return result

    async def get_quote(self, symbol: str) -> Dict[str, Any]:
        base_prices = {
            "RELIANCE": 2450.0, "NIFTY50": 19600.0, "BANKNIFTY": 44200.0,
            "INFY": 1520.0, "TATASTEEL": 122.0, "HDFCBANK": 1610.0
        }
        base = base_prices.get(symbol.upper(), 1000.0)
        fluctuation = round(random.uniform(-0.003, 0.003) * base, 2)
        ltp = max(1.0, round(base + fluctuation, 2))
        return {
            "symbol": symbol,
            "ltp": ltp,
            "bid": round(ltp - 0.25, 2),
            "ask": round(ltp + 0.25, 2),
            "volume": random.randint(10000, 500000)
        }
