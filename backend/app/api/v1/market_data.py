from fastapi import APIRouter, Query
from typing import Dict, Any, List
from app.services.market_data_service import MarketDataService

router = APIRouter(prefix="/market-data", tags=["Market Data"])

@router.get("/ohlc")
async def get_ohlc(
    symbol: str = Query("RELIANCE"),
    start_date: str = Query("2023-01-01"),
    end_date: str = Query("2024-01-01"),
    timeframe: str = Query("15m")
):
    df = MarketDataService.get_historical_ohlc(symbol=symbol, start_date=start_date, end_date=end_date, timeframe=timeframe)
    data = []
    for ts, row in df.iterrows():
        data.append({
            "time": ts.strftime("%Y-%m-%d %H:%M"),
            "open": float(row["open"]),
            "high": float(row["high"]),
            "low": float(row["low"]),
            "close": float(row["close"]),
            "volume": int(row["volume"])
        })
    return {"symbol": symbol, "timeframe": timeframe, "count": len(data), "candles": data}

@router.get("/quote")
async def get_symbol_quote(symbol: str = Query("RELIANCE")):
    df = MarketDataService.get_historical_ohlc(symbol=symbol, timeframe="1m")
    last_row = df.iloc[-1]
    return {
        "symbol": symbol,
        "ltp": float(last_row["close"]),
        "high": float(last_row["high"]),
        "low": float(last_row["low"]),
        "open": float(last_row["open"]),
        "volume": int(last_row["volume"])
    }
