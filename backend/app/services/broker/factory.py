from app.services.broker.base import BrokerAdapter
from app.services.broker.paper_broker import PaperBroker
from app.services.broker.zerodha import ZerodhaAdapter
from app.services.broker.dhan import DhanAdapter

class BrokerFactory:
    """
    Factory for instantiating broker adapters.
    """

    _paper_instance = None

    @classmethod
    def get_adapter(cls, broker_name: str) -> BrokerAdapter:
        name = (broker_name or "PAPER").upper()

        if name in ["PAPER", "SIMULATOR"]:
            if cls._paper_instance is None:
                cls._paper_instance = PaperBroker()
            return cls._paper_instance
        elif name in ["ZERODHA", "KITE"]:
            return ZerodhaAdapter()
        elif name in ["DHAN"]:
            return DhanAdapter()
        else:
            # Fallback to PaperBroker
            return PaperBroker()
