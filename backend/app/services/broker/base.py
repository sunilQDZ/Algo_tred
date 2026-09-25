from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional

class BrokerAdapter(ABC):
    """
    Abstract interface for stock broker API integrations (Zerodha, Dhan, Paper Trading, etc.).
    Enforces standardized order execution, position tracking, and quote retrieval.
    """

    @abstractmethod
    async def connect(self, credentials: Dict[str, Any]) -> bool:
        """Authenticate with the broker API."""
        pass

    @abstractmethod
    async def place_order(
        self,
        client_order_id: str,
        symbol: str,
        side: str, # BUY, SELL
        qty: int,
        price: float = 0.0,
        order_type: str = "MARKET" # MARKET, LIMIT, SL, SL-M
    ) -> Dict[str, Any]:
        """Place an order with client idempotency key."""
        pass

    @abstractmethod
    async def modify_order(self, broker_order_id: str, new_qty: Optional[int] = None, new_price: Optional[float] = None) -> Dict[str, Any]:
        """Modify an existing open order."""
        pass

    @abstractmethod
    async def cancel_order(self, broker_order_id: str) -> Dict[str, Any]:
        """Cancel an open order."""
        pass

    @abstractmethod
    async def get_positions(self) -> List[Dict[str, Any]]:
        """Fetch current open and closed positions from broker."""
        pass

    @abstractmethod
    async def get_quote(self, symbol: str) -> Dict[str, Any]:
        """Fetch real-time ticker quote (LTP, bid, ask, volume)."""
        pass
