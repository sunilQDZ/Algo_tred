import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple
from app.schemas.strategy import StrategyRulesSchema, IndicatorCondition

try:
    import pandas_ta as ta
    HAS_PANDAS_TA = True
except ImportError:
    HAS_PANDAS_TA = False

class StrategyEngine:
    """
    Evaluates rule-based trading strategy conditions (JSON structured) against OHLC bar data.
    Supports technical indicators: RSI, EMA/SMA Crossovers, Supertrend, Bollinger Bands, VWAP, MACD.
    """

    @staticmethod
    def _calc_rsi(series: pd.Series, period: int = 14) -> pd.Series:
        delta = series.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss.replace(0, np.nan)
        rsi = 100 - (100 / (1 + rs))
        return rsi.fillna(50.0)

    @staticmethod
    def _calc_ema(series: pd.Series, length: int) -> pd.Series:
        return series.ewm(span=length, adjust=False).mean()

    @staticmethod
    def _calc_sma(series: pd.Series, length: int) -> pd.Series:
        return series.rolling(window=length).mean()

    @staticmethod
    def _calc_bollinger(series: pd.Series, period: int = 20, std_dev: float = 2.0) -> Tuple[pd.Series, pd.Series, pd.Series]:
        mid = series.rolling(window=period).mean()
        std = series.rolling(window=period).std()
        upper = mid + (std * std_dev)
        lower = mid - (std * std_dev)
        return lower, mid, upper

    @staticmethod
    def _calc_supertrend(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 10, multiplier: float = 3.0) -> Tuple[pd.Series, pd.Series]:
        # ATR calculation
        tr1 = high - low
        tr2 = (high - close.shift(1)).abs()
        tr3 = (low - close.shift(1)).abs()
        tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
        atr = tr.rolling(window=period).mean().fillna(0)

        hl2 = (high + low) / 2
        basic_upper = hl2 + (multiplier * atr)
        basic_lower = hl2 - (multiplier * atr)

        st_dir = pd.Series(1, index=close.index)
        st_val = basic_lower.copy()

        for i in range(1, len(close)):
            if close.iloc[i] > st_val.iloc[i-1]:
                st_dir.iloc[i] = 1
                st_val.iloc[i] = max(basic_lower.iloc[i], st_val.iloc[i-1])
            else:
                st_dir.iloc[i] = -1
                st_val.iloc[i] = min(basic_upper.iloc[i], st_val.iloc[i-1])

        return st_val, st_dir

    @classmethod
    def compute_indicators(cls, df: pd.DataFrame, rules: StrategyRulesSchema) -> pd.DataFrame:
        """
        Computes all required technical indicator columns on the OHLC dataframe.
        """
        df = df.copy()
        df.columns = [col.lower() for col in df.columns]

        all_conditions = rules.entry_conditions + rules.exit_conditions
        
        for cond in all_conditions:
            ind_name = cond.indicator.upper()
            params = cond.params or {}

            if ind_name == "RSI":
                period = int(params.get("period", 14))
                col_name = f"RSI_{period}"
                if col_name not in df.columns:
                    if HAS_PANDAS_TA:
                        res = ta.rsi(df["close"], length=period)
                        df[col_name] = res if res is not None else cls._calc_rsi(df["close"], period)
                    else:
                        df[col_name] = cls._calc_rsi(df["close"], period)

            elif ind_name in ["EMA", "SMA"]:
                length = int(params.get("length", 14))
                col_name = f"{ind_name}_{length}"
                if col_name not in df.columns:
                    if ind_name == "EMA":
                        df[col_name] = cls._calc_ema(df["close"], length)
                    else:
                        df[col_name] = cls._calc_sma(df["close"], length)

            elif ind_name == "EMA_CROSSOVER":
                fast = int(params.get("fast", 9))
                slow = int(params.get("slow", 21))
                if f"EMA_{fast}" not in df.columns:
                    df[f"EMA_{fast}"] = cls._calc_ema(df["close"], fast)
                if f"EMA_{slow}" not in df.columns:
                    df[f"EMA_{slow}"] = cls._calc_ema(df["close"], slow)

            elif ind_name == "SUPERTREND":
                period = int(params.get("period", 10))
                multiplier = float(params.get("multiplier", 3.0))
                st_val, st_dir = cls._calc_supertrend(df["high"], df["low"], df["close"], period, multiplier)
                df[f"SUPERTREND_DIR_{period}_{multiplier}"] = st_dir
                df[f"SUPERTREND_VAL_{period}_{multiplier}"] = st_val

            elif ind_name == "BOLLINGER":
                period = int(params.get("period", 20))
                std_dev = float(params.get("std_dev", 2.0))
                bbl, bbm, bbu = cls._calc_bollinger(df["close"], period, std_dev)
                df[f"BBL_{period}_{std_dev}"] = bbl
                df[f"BBM_{period}_{std_dev}"] = bbm
                df[f"BBU_{period}_{std_dev}"] = bbu

            elif ind_name == "VWAP":
                vol = df["volume"].replace(0, 1)
                df["VWAP"] = (df["close"] * vol).cumsum() / vol.cumsum()

            elif ind_name == "MACD":
                fast = int(params.get("fast", 12))
                slow = int(params.get("slow", 26))
                signal = int(params.get("signal", 9))
                macd_line = cls._calc_ema(df["close"], fast) - cls._calc_ema(df["close"], slow)
                signal_line = cls._calc_ema(macd_line, signal)
                df[f"MACD_{fast}_{slow}_{signal}"] = macd_line
                df[f"MACDs_{fast}_{slow}_{signal}"] = signal_line
                df[f"MACDh_{fast}_{slow}_{signal}"] = macd_line - signal_line

        return df

    @staticmethod
    def evaluate_condition(df: pd.DataFrame, cond: IndicatorCondition) -> pd.Series:
        ind_name = cond.indicator.upper()
        params = cond.params or {}
        op = cond.operator
        val = cond.value

        if ind_name == "RSI":
            period = int(params.get("period", 14))
            col = f"RSI_{period}"
            series = df[col]
            if op == "<": return series < float(val)
            elif op == ">": return series > float(val)
            elif op == "<=": return series <= float(val)
            elif op == ">=": return series >= float(val)

        elif ind_name == "EMA_CROSSOVER":
            fast = int(params.get("fast", 9))
            slow = int(params.get("slow", 21))
            fast_series = df[f"EMA_{fast}"]
            slow_series = df[f"EMA_{slow}"]
            
            if op == "CROSSES_ABOVE":
                return (fast_series > slow_series) & (fast_series.shift(1) <= slow_series.shift(1))
            elif op == "CROSSES_BELOW":
                return (fast_series < slow_series) & (fast_series.shift(1) >= slow_series.shift(1))

        elif ind_name == "SUPERTREND":
            period = int(params.get("period", 10))
            multiplier = float(params.get("multiplier", 3.0))
            st_dir = df.get(f"SUPERTREND_DIR_{period}_{multiplier}", pd.Series(1, index=df.index))
            if str(val).upper() in ["GREEN", "BULLISH", "1"]:
                return st_dir == 1
            else:
                return st_dir == -1

        elif ind_name == "BOLLINGER":
            period = int(params.get("period", 20))
            std_dev = float(params.get("std_dev", 2.0))
            if op == "CROSSES_BELOW_LOWER":
                bbl = df[f"BBL_{period}_{std_dev}"]
                return (df["close"] < bbl) & (df["close"].shift(1) >= bbl)
            elif op == "CROSSES_ABOVE_UPPER":
                bbu = df[f"BBU_{period}_{std_dev}"]
                return (df["close"] > bbu) & (df["close"].shift(1) <= bbu)

        elif ind_name == "VWAP":
            vwap = df["VWAP"]
            if op == ">": return df["close"] > vwap
            elif op == "<": return df["close"] < vwap

        elif ind_name == "MACD":
            fast = int(params.get("fast", 12))
            slow = int(params.get("slow", 26))
            signal = int(params.get("signal", 9))
            macd = df[f"MACD_{fast}_{slow}_{signal}"]
            macds = df[f"MACDs_{fast}_{slow}_{signal}"]
            if op == "CROSSES_ABOVE":
                return (macd > macds) & (macd.shift(1) <= macds.shift(1))
            elif op == "CROSSES_BELOW":
                return (macd < macds) & (macd.shift(1) >= macds.shift(1))

        return pd.Series(False, index=df.index)

    @classmethod
    def generate_signals(cls, df: pd.DataFrame, rules: StrategyRulesSchema) -> Tuple[pd.Series, pd.Series]:
        df_ind = cls.compute_indicators(df, rules)

        if rules.entry_conditions:
            entry_series_list = [cls.evaluate_condition(df_ind, cond) for cond in rules.entry_conditions]
            if rules.logic_operator.upper() == "OR":
                entries = pd.concat(entry_series_list, axis=1).any(axis=1)
            else:
                entries = pd.concat(entry_series_list, axis=1).all(axis=1)
        else:
            entries = pd.Series(False, index=df.index)

        if rules.exit_conditions:
            exit_series_list = [cls.evaluate_condition(df_ind, cond) for cond in rules.exit_conditions]
            if rules.logic_operator.upper() == "OR":
                exits = pd.concat(exit_series_list, axis=1).any(axis=1)
            else:
                exits = pd.concat(exit_series_list, axis=1).all(axis=1)
        else:
            exits = pd.Series(False, index=df.index)

        return entries.fillna(False), exits.fillna(False)
