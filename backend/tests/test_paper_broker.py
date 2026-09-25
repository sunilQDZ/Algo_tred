import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from app.services.broker.paper_broker import PaperBroker

@pytest.mark.asyncio
async def test_paper_broker_order_and_idempotency():
    broker = PaperBroker()
    connected = await broker.connect({})
    assert connected is True

    # Place BUY order
    client_ord_1 = "ORD_TEST_1001"
    ord_1 = await broker.place_order(client_ord_1, "RELIANCE", "BUY", 10)
    assert ord_1["status"] == "FILLED"
    assert ord_1["qty"] == 10

    # Idempotency check: placing same client_order_id returns existing order without duplicating
    ord_1_repeat = await broker.place_order(client_ord_1, "RELIANCE", "BUY", 10)
    assert ord_1_repeat["broker_order_id"] == ord_1["broker_order_id"]

    # Check positions
    positions = await broker.get_positions()
    assert len(positions) == 1
    assert positions[0]["symbol"] == "RELIANCE"
    assert positions[0]["qty"] == 10
