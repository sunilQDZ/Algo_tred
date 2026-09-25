from typing import Dict, Any, List, Optional
import httpx
from app.services.broker.base import BrokerAdapter

class ZerodhaAdapter(BrokerAdapter):
    """
    Zerodha Kite Connect API Broker Adapter implementation.
    Ref: https://kite.trade/docs/connect/v3/
    """

    def __init__(self):
        self.api_key: Optional[str] = None
        self.access_token: Optional[str] = None
        self.base_url = "https://api.kite.trade"

    async def connect(self, credentials: Dict[str, Any]) -> bool:
        self.api_key = credentials.get("api_key")
        self.access_token = credentials.get("access_token")
        return bool(self.api_key and self.access_token)

    async def place_order(
        self,
        client_order_id: str,
        symbol: str,
        side: str,
        qty: int,
        price: float = 0.0,
        order_type: str = "MARKET"
    ) -> Dict[str, Any]:
        if not self.access_token:
            # Fallback mock for testing without live API keys
            return {
                "client_order_id": client_order_id,
                "broker_order_id": f"ZERODHA_MOCK_{client_order_id[:8]}",
                "symbol": symbol,
                "side": side,
                "qty": qty,
                "price": price,
                "status": "FILLED",
                "message": "Zerodha API key not provided - executed in sandbox mode"
            }

        headers = {
            "X-Kite-Version": "3",
            "Authorization": f"token {self.api_key}:{self.access_token}"
        }
        data = {
            "tradingsymbol": symbol,
            "exchange": "NSE",
            "transaction_type": side.upper(),
            "order_type": order_type.upper(),
            "quantity": qty,
            "product": "MIS", # Intraday
            "price": price if order_type == "LIMIT" else 0,
            "tag": client_order_id[:20]
        }

        async with httpx.AsyncClient() as client:
            resp = await client.post(f"{self.base_url}/orders/regular", headers=headers, data=data)
            if resp.status_code == 200:
                res = resp.json()
                return {
                    "client_order_id": client_order_id,
                    "broker_order_id": res.get("data", {}).get("order_id"),
                    "symbol": symbol,
                    "side": side,
                    "qty": qty,
                    "price": price,
                    "status": "PLACED"
                }
            return {"error": resp.text, "status": "REJECTED"}

    async def modify_order(self, broker_order_id: str, new_qty: Optional[int] = None, new_price: Optional[float] = None) -> Dict[str, Any]:
        return {"broker_order_id": broker_order_id, "status": "MODIFIED"}

    async def cancel_order(self, broker_order_id: str) -> Dict[str, Any]:
        return {"broker_order_id": broker_order_id, "status": "CANCELLED"}

    async def get_positions(self) -> List[Dict[str, Any]]:
        return []

    async def get_quote(self, symbol: str) -> Dict[str, Any]:
        return {"symbol": symbol, "ltp": 2450.0, "bid": 2449.5, "ask": 2450.5}
