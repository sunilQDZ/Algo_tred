from typing import Dict, Any, List, Optional
import httpx
from app.services.broker.base import BrokerAdapter

class DhanAdapter(BrokerAdapter):
    """
    Dhan API Broker Adapter implementation.
    Ref: https://dhanhq.co/docs/v2/
    """

    def __init__(self):
        self.client_id: Optional[str] = None
        self.access_token: Optional[str] = None
        self.base_url = "https://api.dhan.co"

    async def connect(self, credentials: Dict[str, Any]) -> bool:
        self.client_id = credentials.get("client_id")
        self.access_token = credentials.get("access_token")
        return bool(self.client_id and self.access_token)

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
            return {
                "client_order_id": client_order_id,
                "broker_order_id": f"DHAN_MOCK_{client_order_id[:8]}",
                "symbol": symbol,
                "side": side,
                "qty": qty,
                "price": price,
                "status": "FILLED",
                "message": "Dhan access token not provided - sandbox mode"
            }

        headers = {
            "access-token": self.access_token,
            "client-id": self.client_id,
            "Content-Type": "application/json"
        }
        data = {
            "dhanClientId": self.client_id,
            "correlationId": client_order_id[:25],
            "transactionType": side.upper(),
            "exchangeSegment": "NSE_EQ",
            "productType": "INTRADAY",
            "orderType": order_type.upper(),
            "validity": "DAY",
            "tradingSymbol": symbol,
            "quantity": qty,
            "price": price
        }

        async with httpx.AsyncClient() as client:
            resp = await client.post(f"{self.base_url}/orders", headers=headers, json=data)
            if resp.status_code == 200:
                res = resp.json()
                return {
                    "client_order_id": client_order_id,
                    "broker_order_id": res.get("orderId"),
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
