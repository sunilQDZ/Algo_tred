import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Optional

class MarketDataService:
    """
    Ingests and formats historical OHLC market data for backtesting and live execution.
    Contains built-in synthetic realistic stock generator for Indian market symbols.
    """

    @staticmethod
    def get_historical_ohlc(
        symbol: str = "RELIANCE",
        start_date: str = "2023-01-01",
        end_date: str = "2024-01-01",
        timeframe: str = "15m"
    ) -> pd.DataFrame:
        """
        Fetches or generates OHLC DataFrame indexed by Datetime.
        """
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        end_dt = datetime.strptime(end_date, "%Y-%m-%d")

        # Map timeframe to pandas frequency
        freq_map = {"1m": "1min", "5m": "5min", "15m": "15min", "1h": "1h", "1d": "1D"}
        freq = freq_map.get(timeframe, "15min")

        # Generate trading dates (excluding weekends)
        dates = pd.date_range(start=start_dt, end=end_dt, freq=freq)
        dates = dates[(dates.dayofweek < 5) & (dates.hour >= 9) & (dates.hour <= 15)]

        if len(dates) == 0:
            dates = pd.date_range(start=start_dt, periods=200, freq="15min")

        # Symbol base prices
        base_price_map = {
            "RELIANCE": 2400.0,
            "NIFTY50": 19500.0,
            "BANKNIFTY": 44000.0,
            "INFY": 1500.0,
            "TATASTEEL": 120.0,
            "HDFCBANK": 1600.0
        }
        start_price = base_price_map.get(symbol.upper(), 1000.0)

        # Seed random walk with geometric Brownian motion for realistic stock movement
        np.random.seed(abs(hash(symbol)) % 100000)
        n = len(dates)
        dt = 1 / (252 * 26) # 15-min interval step
        mu = 0.12 # 12% annual drift
        sigma = 0.22 # 22% annual volatility

        random_returns = np.random.normal((mu - 0.5 * sigma**2) * dt, sigma * np.sqrt(dt), n)
        price_paths = start_price * np.exp(np.cumsum(random_returns))

        # Generate Open, High, Low, Close, Volume
        noise_high = np.random.uniform(0.001, 0.005, n)
        noise_low = np.random.uniform(0.001, 0.005, n)

        open_p = price_paths * (1 + np.random.normal(0, 0.001, n))
        close_p = price_paths
        high_p = np.maximum(open_p, close_p) * (1 + noise_high)
        low_p = np.minimum(open_p, close_p) * (1 - noise_low)
        volume = np.random.randint(5000, 500000, n)

        df = pd.DataFrame({
            "timestamp": dates,
            "open": open_p.round(2),
            "high": high_p.round(2),
            "low": low_p.round(2),
            "close": close_p.round(2),
            "volume": volume
        })
        df.set_index("timestamp", inplace=True)
        return df

    @staticmethod
    def parse_csv_to_df(csv_file_bytes: bytes) -> pd.DataFrame:
        """
        Parses uploaded historical CSV data bytes into standardized OHLC DataFrame.
        Supports standard column names: date/timestamp/time, open, high, low, close, volume.
        """
        import io
        df = pd.read_csv(io.BytesIO(csv_file_bytes))
        
        # Standardize column headers to lowercase
        df.columns = [str(c).strip().lower() for c in df.columns]
        
        # Rename date/time column if needed
        time_col = None
        for col in ["timestamp", "date", "datetime", "time"]:
            if col in df.columns:
                time_col = col
                break
        
        if time_col:
            df["timestamp"] = pd.to_datetime(df[time_col])
            df.set_index("timestamp", inplace=True)
        else:
            df.index = pd.date_range(start="2023-01-01", periods=len(df), freq="15min")
            df.index.name = "timestamp"

        # Ensure required columns exist
        for req in ["open", "high", "low", "close"]:
            if req not in df.columns:
                raise ValueError(f"Missing required OHLC column: '{req}' in CSV")

        if "volume" not in df.columns:
            df["volume"] = 10000

        df = df[["open", "high", "low", "close", "volume"]].astype(float)
        return df
