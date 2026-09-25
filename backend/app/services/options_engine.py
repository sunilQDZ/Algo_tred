import math
import numpy as np
from typing import Dict, Any, List

class OptionsEngine:
    """
    Quantitative derivatives engine calculating Options Greeks (Black-Scholes model)
    and Multi-Leg Options Payoff diagrams for NSE NIFTY, BANKNIFTY, and Equity options.
    """

    @staticmethod
    def _norm_cdf(x: float) -> float:
        return (1.0 + math.erf(x / math.sqrt(2.0))) / 2.0

    @staticmethod
    def _norm_pdf(x: float) -> float:
        return math.exp(-0.5 * x * x) / math.sqrt(2.0 * math.pi)

    @classmethod
    def calculate_greeks(
        cls,
        spot: float = 19500.0,
        strike: float = 19500.0,
        days_to_expiry: float = 7.0,
        risk_free_rate: float = 0.07, # 7% RBI Repo rate
        volatility: float = 0.16, # 16% India VIX
        option_type: str = "CE" # CE (Call) or PE (Put)
    ) -> Dict[str, Any]:
        """
        Calculates Black-Scholes Option Price and Greeks (Delta, Gamma, Theta, Vega).
        """
        T = max(1 / 365.0, days_to_expiry / 365.0)
        S = float(spot)
        K = float(strike)
        r = float(risk_free_rate)
        sigma = max(0.01, float(volatility))

        d1 = (math.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * math.sqrt(T))
        d2 = d1 - sigma * math.sqrt(T)

        if option_type.upper() in ["CE", "CALL"]:
            price = S * cls._norm_cdf(d1) - K * math.exp(-r * T) * cls._norm_cdf(d2)
            delta = cls._norm_cdf(d1)
        else: # PE / PUT
            price = K * math.exp(-r * T) * cls._norm_cdf(-d2) - S * cls._norm_cdf(-d1)
            delta = -cls._norm_cdf(-d1)

        gamma = cls._norm_pdf(d1) / (S * sigma * math.sqrt(T))
        vega = (S * cls._norm_pdf(d1) * math.sqrt(T)) / 100.0 # per 1% IV change
        theta = (-(S * cls._norm_pdf(d1) * sigma) / (2 * math.sqrt(T)) - r * K * math.exp(-r * T) * (cls._norm_cdf(d1) if option_type.upper() in ["CE", "CALL"] else cls._norm_cdf(-d1))) / 365.0

        return {
            "spot": spot,
            "strike": strike,
            "option_type": option_type.upper(),
            "price": round(price, 2),
            "delta": round(delta, 3),
            "gamma": round(gamma, 5),
            "theta": round(theta, 2),
            "vega": round(vega, 2),
            "iv_pct": round(sigma * 100, 1)
        }

    @classmethod
    def generate_payoff_matrix(
        cls,
        spot_price: float,
        legs: List[Dict[str, Any]] # [{"option_type": "CE", "strike": 19500, "action": "SELL", "premium": 150.0, "qty": 50}]
    ) -> Dict[str, Any]:
        """
        Generates Multi-Leg Options Strategy Expiry Payoff curve across a price range.
        """
        min_price = round(spot_price * 0.93, 2)
        max_price = round(spot_price * 1.07, 2)
        prices = np.linspace(min_price, max_price, 50)

        payoff_curve = []
        max_profit = -999999.0
        max_loss = 999999.0
        breakevens = []

        for p in prices:
            total_payoff = 0.0
            for leg in legs:
                opt_type = leg.get("option_type", "CE").upper()
                strike = float(leg.get("strike", spot_price))
                action = leg.get("action", "BUY").upper()
                premium = float(leg.get("premium", 50.0))
                qty = int(leg.get("qty", 50))

                # Expiry value
                if opt_type == "CE":
                    intrinsic = max(0.0, p - strike)
                else: # PE
                    intrinsic = max(0.0, strike - p)

                if action == "BUY":
                    leg_pnl = (intrinsic - premium) * qty
                else: # SELL / SHORT
                    leg_pnl = (premium - intrinsic) * qty

                total_payoff += leg_pnl

            max_profit = max(max_profit, total_payoff)
            max_loss = min(max_loss, total_payoff)

            payoff_curve.append({
                "underlying_price": round(p, 2),
                "payoff": round(total_payoff, 2)
            })

        # Calculate Breakeven points
        for i in range(1, len(payoff_curve)):
            prev = payoff_curve[i-1]["payoff"]
            curr = payoff_curve[i]["payoff"]
            if (prev <= 0 and curr >= 0) or (prev >= 0 and curr <= 0):
                breakevens.append(payoff_curve[i]["underlying_price"])

        return {
            "spot_price": spot_price,
            "max_profit": round(max_profit, 2) if max_profit < 900000 else "UNLIMITED",
            "max_loss": round(max_loss, 2) if max_loss > -900000 else "UNLIMITED",
            "breakevens": breakevens,
            "payoff_curve": payoff_curve
        }
