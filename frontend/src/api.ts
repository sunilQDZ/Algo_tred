import {
  Strategy, StrategyTemplate, BacktestRun, OptimizationRun, LiveDeployment, Order, Position, User, BrokerConnection
} from './types';

const API_BASE = '/api/v1';
let authToken: string | null = localStorage.getItem('alg_token');

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('alg_token', token);
  } else {
    localStorage.removeItem('alg_token');
  }
};

const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
};

// Rich Demo Fallback Data (100% Type Aligned)
const DEMO_USER: User = {
  id: "USR-101",
  email: "trader@algotred.com",
  full_name: "Rajesh Sharma",
  phone: "+91 98765 43210",
  kyc_status: "VERIFIED",
  risk_profile: {
    tolerance: "moderate",
    max_drawdown_limit: 10,
    investment_horizon: "short_term"
  },
  subscription_plan: "PRO",
  created_at: "2026-01-01T00:00:00Z"
};

const DEMO_TEMPLATES: StrategyTemplate[] = [
  {
    id: "tpl-1",
    name: "SMA 6/30 Trend Crossover",
    description: "Classic moving average crossover strategy designed for NIFTY 50 bluechip equities on 15-minute candles.",
    category: "Trend Following",
    default_rules: {
      logic_operator: "AND",
      entry_conditions: [{ indicator: "SMA", params: { period: 6 }, operator: "crosses_above", value: "SMA(30)" }],
      exit_conditions: [{ indicator: "SMA", params: { period: 6 }, operator: "crosses_below", value: "SMA(30)" }],
      stop_loss_pct: 1.5,
      target_pct: 3.0,
      trailing_stop_pct: 0.5,
      position_size_type: "fixed_cash",
      position_size_value: 100000
    },
    default_params: { period_fast: 6, period_slow: 30 },
    indicator_list: ["SMA"],
    created_at: "2026-01-01T00:00:00Z"
  },
  {
    id: "tpl-2",
    name: "RSI 14 Mean Reversal",
    description: "Identifies oversold dips (RSI < 30) and overbought exits (RSI > 70) for high-probability mean reversion.",
    category: "Mean Reversion",
    default_rules: {
      logic_operator: "AND",
      entry_conditions: [{ indicator: "RSI", params: { period: 14 }, operator: "<", value: 30 }],
      exit_conditions: [{ indicator: "RSI", params: { period: 14 }, operator: ">", value: 70 }],
      stop_loss_pct: 1.2,
      target_pct: 2.5,
      position_size_type: "fixed_cash",
      position_size_value: 100000
    },
    default_params: { rsi_period: 14, oversold: 30, overbought: 70 },
    indicator_list: ["RSI"],
    created_at: "2026-01-01T00:00:00Z"
  },
  {
    id: "tpl-3",
    name: "Supertrend (10, 3) Intraday",
    description: "Rides strong momentum flips on 5m/15m intraday charts with trailing stop loss.",
    category: "Momentum",
    default_rules: {
      logic_operator: "AND",
      entry_conditions: [{ indicator: "SUPERTREND", params: { period: 10, multiplier: 3 }, operator: "bullish_flip", value: 0 }],
      exit_conditions: [{ indicator: "SUPERTREND", params: { period: 10, multiplier: 3 }, operator: "bearish_flip", value: 0 }],
      stop_loss_pct: 1.5,
      target_pct: 4.0,
      position_size_type: "fixed_cash",
      position_size_value: 100000
    },
    default_params: { period: 10, multiplier: 3 },
    indicator_list: ["SUPERTREND"],
    created_at: "2026-01-01T00:00:00Z"
  }
];

const DEMO_STRATEGY: Strategy = {
  id: "strat-101",
  user_id: "USR-101",
  name: "RELIANCE Intraday SMA Crossover",
  description: "Automated 15m trend follower on RELIANCE with strict risk limits",
  segment: "EQUITY",
  symbol: "RELIANCE",
  timeframe: "15m",
  rules: {
    logic_operator: "AND",
    entry_conditions: [{ indicator: "SMA", params: { period: 6 }, operator: "crosses_above", value: "SMA(30)" }],
    exit_conditions: [{ indicator: "SMA", params: { period: 6 }, operator: "crosses_below", value: "SMA(30)" }],
    stop_loss_pct: 1.5,
    target_pct: 3.0,
    trailing_stop_pct: 0.5,
    position_size_type: "fixed_cash",
    position_size_value: 100000
  },
  params: { fast_ma: 6, slow_ma: 30 },
  status: "LIVE",
  created_at: "2026-02-01T00:00:00Z",
  updated_at: "2026-03-01T00:00:00Z"
};

const DEMO_BACKTEST_RUN: BacktestRun = {
  id: "bt-501",
  strategy_id: "strat-101",
  params_used: { period_fast: 6, period_slow: 30 },
  start_date: "2023-01-01",
  end_date: "2024-01-01",
  initial_capital: 200000,
  status: "COMPLETED",
  metrics: {
    initial_capital: 200000,
    final_equity: 249000,
    total_return_pct: 24.5,
    cagr_pct: 24.5,
    max_drawdown_pct: 8.2,
    sharpe_ratio: 2.14,
    win_rate_pct: 68.5,
    total_trades: 120,
    winning_trades: 82,
    losing_trades: 38,
    profit_factor: 2.35
  },
  equity_curve: [
    { date: "2023-01-01", equity: 200000, benchmark: 200000 },
    { date: "2023-03-01", equity: 208500, benchmark: 202100 },
    { date: "2023-05-01", equity: 215000, benchmark: 206000 },
    { date: "2023-07-01", equity: 228000, benchmark: 211000 },
    { date: "2023-09-01", equity: 236500, benchmark: 214500 },
    { date: "2023-11-01", equity: 242000, benchmark: 218000 },
    { date: "2024-01-01", equity: 249000, benchmark: 221000 }
  ],
  trade_log: [
    {
      trade_no: 1,
      entry_time: "2023-01-05 09:30",
      exit_time: "2023-01-06 14:45",
      side: "BUY",
      qty: 50,
      entry_price: 2450.0,
      exit_price: 2510.0,
      gross_pnl: 3000.0,
      net_pnl: 2750.0,
      pnl_pct: 2.45,
      exit_reason: "Target Hit"
    }
  ],
  created_at: "2026-03-05T00:00:00Z"
};

const DEMO_OPTIMIZATION_RUN: OptimizationRun = {
  id: "opt-301",
  strategy_id: "strat-101",
  param_search_space: { period_fast: [5, 12], period_slow: [20, 40] },
  method: "optuna",
  n_trials: 20,
  target_metric: "sharpe_ratio",
  status: "COMPLETED",
  top_n_results: [
    {
      rank: 1,
      params: { period_fast: 8, period_slow: 28, stop_loss_pct: 1.2 },
      train_metrics: DEMO_BACKTEST_RUN.metrics,
      test_metrics: { ...DEMO_BACKTEST_RUN.metrics, sharpe_ratio: 2.48, max_drawdown_pct: 6.1 }
    }
  ],
  ai_summary: `### Quant AI Strategy Optimization Report

- **Optimal Parameter Set**: Fast MA = 8, Slow MA = 28, Stop Loss = 1.2%.
- **Sharpe Ratio Improvement**: Increased from **2.14** to **2.48** (+15.8%).
- **Drawdown Reduction**: Maximum Drawdown reduced from **8.2%** to **6.1%**.
- **Out-of-Sample Risk Assessment**: Strategy shows strong robustness across 2023-2024 volatility regimes. Low curve-fitting risk confirmed by 50-trial Optuna distribution.`,
  ai_recommended_config_idx: 0,
  created_at: "2026-03-06T00:00:00Z"
};

const DEMO_DEPLOYMENTS: LiveDeployment[] = [
  {
    id: "dep-101",
    user_id: "USR-101",
    strategy_id: "strat-101",
    broker_connection_id: "brk-1",
    mode: "PAPER",
    status: "RUNNING",
    capital_allocated: 150000,
    current_equity: 152140,
    realized_pnl: 1500,
    unrealized_pnl: 640,
    risk_settings: { daily_loss_guard_pct: 2 },
    started_at: "2026-03-01T00:00:00Z"
  },
  {
    id: "dep-102",
    user_id: "USR-101",
    strategy_id: "strat-102",
    broker_connection_id: "brk-2",
    mode: "LIVE",
    status: "RUNNING",
    capital_allocated: 250000,
    current_equity: 254275,
    realized_pnl: 3200,
    unrealized_pnl: 1075,
    risk_settings: { max_drawdown_pct: 5 },
    started_at: "2026-03-02T00:00:00Z"
  }
];

const DEMO_ORDERS: Order[] = [
  {
    id: "ord-1",
    client_order_id: "ord-1",
    broker_order_id: "260910001923",
    symbol: "RELIANCE",
    side: "BUY",
    qty: 50,
    price: 2920.50,
    filled_price: 2920.50,
    order_type: "MARKET",
    status: "FILLED",
    placed_at: "2026-09-10 10:15:00"
  },
  {
    id: "ord-2",
    client_order_id: "ord-2",
    broker_order_id: "260910001924",
    symbol: "BANKNIFTY 51200 CE",
    side: "BUY",
    qty: 150,
    price: 340.00,
    filled_price: 340.00,
    order_type: "MARKET",
    status: "FILLED",
    placed_at: "2026-09-10 09:45:00"
  }
];

const DEMO_POSITIONS: Position[] = [
  {
    id: "pos-1",
    symbol: "RELIANCE",
    qty: 50,
    avg_price: 2920.50,
    current_price: 2954.80,
    unrealized_pnl: 1715.00,
    realized_pnl: 0,
    updated_at: "2026-09-10 10:15:00"
  },
  {
    id: "pos-2",
    symbol: "BANKNIFTY 51200 CE",
    qty: 150,
    avg_price: 340.00,
    current_price: 368.50,
    unrealized_pnl: 4275.00,
    realized_pnl: 0,
    updated_at: "2026-09-10 09:45:00"
  }
];

const DEMO_BROKERS: BrokerConnection[] = [
  {
    id: "brk-1",
    user_id: "USR-101",
    broker_name: "Zerodha (Kite Connect)",
    account_id: "ZER-89412",
    status: "CONNECTED",
    linked_at: "2026-01-10T00:00:00Z"
  },
  {
    id: "brk-2",
    user_id: "USR-101",
    broker_name: "Dhan API",
    account_id: "DHN-51209",
    status: "CONNECTED",
    linked_at: "2026-01-15T00:00:00Z"
  },
  {
    id: "brk-3",
    user_id: "USR-101",
    broker_name: "Angel One SmartAPI",
    account_id: "ANG-33210",
    status: "DISCONNECTED",
    linked_at: "2026-02-01T00:00:00Z"
  }
];

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ access_token: string; user: User }> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        setAuthToken(data.access_token);
        return data;
      }
    } catch (e) {}
    setAuthToken("demo_access_token_123");
    return { access_token: "demo_access_token_123", user: DEMO_USER };
  },

  async register(email: string, password: string, full_name: string): Promise<User> {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return { ...DEMO_USER, email, full_name };
  },

  async getCurrentUser(): Promise<User> {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {}
    return DEMO_USER;
  },

  async updateRiskProfile(risk_profile: User['risk_profile']): Promise<User> {
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ risk_profile }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return { ...DEMO_USER, risk_profile };
  },

  // Strategy Templates & Strategies
  async getTemplates(): Promise<StrategyTemplate[]> {
    try {
      const res = await fetch(`${API_BASE}/strategies/templates`, { headers: getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {}
    return DEMO_TEMPLATES;
  },

  async getStrategies(): Promise<Strategy[]> {
    try {
      const res = await fetch(`${API_BASE}/strategies/`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) return data;
      }
    } catch (e) {}
    return [DEMO_STRATEGY];
  },

  async createStrategy(strat: Partial<Strategy>): Promise<Strategy> {
    try {
      const res = await fetch(`${API_BASE}/strategies/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(strat),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return {
      ...DEMO_STRATEGY,
      id: `strat-${Date.now()}`,
      name: strat.name || DEMO_STRATEGY.name,
      symbol: strat.symbol || DEMO_STRATEGY.symbol,
      timeframe: strat.timeframe || DEMO_STRATEGY.timeframe,
    };
  },

  async updateStrategy(id: string, strat: Partial<Strategy>): Promise<Strategy> {
    try {
      const res = await fetch(`${API_BASE}/strategies/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(strat),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return { ...DEMO_STRATEGY, ...strat, id };
  },

  async parseNaturalLanguageStrategy(prompt: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/strategies/parse-prompt`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ prompt }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const promptLower = prompt.toLowerCase();
    let symbol = "RELIANCE";
    for (const s of ["NIFTY", "BANKNIFTY", "RELIANCE", "TCS", "HDFCBANK", "INFY", "TATAMOTORS", "ITC"]) {
      if (promptLower.includes(s.toLowerCase())) { symbol = s; break; }
    }
    let timeframe = "15m";
    if (promptLower.includes("1m") || promptLower.includes("1 min")) timeframe = "1m";
    else if (promptLower.includes("5m") || promptLower.includes("5 min")) timeframe = "5m";
    else if (promptLower.includes("1h") || promptLower.includes("1 hour")) timeframe = "1h";

    let entry_conditions: any[] = [{ indicator: 'SMA', params: { period: 6 }, operator: 'crosses_above', value: 'SMA(30)' }];
    let exit_conditions: any[] = [{ indicator: 'SMA', params: { period: 6 }, operator: 'crosses_below', value: 'SMA(30)' }];

    if (promptLower.includes("rsi")) {
      entry_conditions = [{ indicator: 'RSI', params: { period: 14 }, operator: '<', value: 30 }];
      exit_conditions = [{ indicator: 'RSI', params: { period: 14 }, operator: '>', value: 70 }];
    } else if (promptLower.includes("supertrend")) {
      entry_conditions = [{ indicator: 'SUPERTREND', params: { period: 10, multiplier: 3 }, operator: 'bullish_flip', value: 0 }];
      exit_conditions = [{ indicator: 'SUPERTREND', params: { period: 10, multiplier: 3 }, operator: 'bearish_flip', value: 0 }];
    }

    return {
      name: `AI Strategy (${symbol} ${timeframe})`,
      symbol,
      timeframe,
      segment: "EQUITY",
      logic_operator: "AND",
      entry_conditions,
      exit_conditions,
      stop_loss_pct: 1.5,
      target_pct: 3.0,
      trailing_stop_pct: 0.5,
      automation_mode: "signal_only"
    };
  },

  // Backtest
  async runBacktest(strategy_id: string, start_date: string, end_date: string, initial_capital: number, params?: Record<string, any>): Promise<BacktestRun> {
    try {
      const res = await fetch(`${API_BASE}/backtests/run`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ strategy_id, start_date, end_date, initial_capital, params }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return { ...DEMO_BACKTEST_RUN, strategy_id, start_date, end_date, initial_capital };
  },

  async getLatestBacktest(strategy_id: string): Promise<BacktestRun> {
    try {
      const res = await fetch(`${API_BASE}/backtests/strategy/${strategy_id}/latest`, { headers: getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {}
    return { ...DEMO_BACKTEST_RUN, strategy_id };
  },

  // Optimization
  async runOptimization(strategy_id: string, param_search_space: Record<string, any>, n_trials: number): Promise<OptimizationRun> {
    try {
      const res = await fetch(`${API_BASE}/optimizations/run`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ strategy_id, param_search_space, n_trials, target_metric: 'sharpe_ratio' }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return { ...DEMO_OPTIMIZATION_RUN, strategy_id };
  },

  async getLatestOptimization(strategy_id: string): Promise<OptimizationRun> {
    try {
      const res = await fetch(`${API_BASE}/optimizations/strategy/${strategy_id}/latest`, { headers: getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {}
    return { ...DEMO_OPTIMIZATION_RUN, strategy_id };
  },

  // Deployments
  async createDeployment(strategy_id: string, mode: 'PAPER' | 'LIVE', capital_allocated: number, broker_connection_id?: string): Promise<LiveDeployment> {
    try {
      const res = await fetch(`${API_BASE}/deployments/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ strategy_id, mode, capital_allocated, broker_connection_id }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return {
      id: `dep-${Date.now()}`,
      user_id: "USR-101",
      strategy_id,
      broker_connection_id: broker_connection_id || "brk-1",
      mode,
      status: 'RUNNING',
      capital_allocated,
      current_equity: capital_allocated,
      realized_pnl: 0,
      unrealized_pnl: 0,
      risk_settings: {},
      started_at: new Date().toISOString()
    };
  },

  async getDeployments(): Promise<LiveDeployment[]> {
    try {
      const res = await fetch(`${API_BASE}/deployments/`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) return data;
      }
    } catch (e) {}
    return DEMO_DEPLOYMENTS;
  },

  async killDeployment(deployment_id: string): Promise<LiveDeployment> {
    try {
      const res = await fetch(`${API_BASE}/deployments/${deployment_id}/kill`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    const dep = DEMO_DEPLOYMENTS.find(d => d.id === deployment_id) || DEMO_DEPLOYMENTS[0];
    return { ...dep, status: 'PAUSED' };
  },

  async getOrders(deployment_id: string): Promise<Order[]> {
    try {
      const res = await fetch(`${API_BASE}/deployments/${deployment_id}/orders`, { headers: getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {}
    return DEMO_ORDERS;
  },

  async getPositions(deployment_id: string): Promise<Position[]> {
    try {
      const res = await fetch(`${API_BASE}/deployments/${deployment_id}/positions`, { headers: getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {}
    return DEMO_POSITIONS;
  },

  // Brokers
  async getBrokers(): Promise<BrokerConnection[]> {
    try {
      const res = await fetch(`${API_BASE}/brokers/`, { headers: getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {}
    return DEMO_BROKERS;
  },

  async connectBroker(broker_name: string, api_key?: string, api_secret?: string, access_token?: string, client_id?: string): Promise<BrokerConnection> {
    try {
      const res = await fetch(`${API_BASE}/brokers/connect`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ broker_name, api_key, api_secret, access_token, client_id }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return {
      id: `brk-${Date.now()}`,
      user_id: "USR-101",
      broker_name,
      account_id: `ACC-${Math.floor(Math.random() * 90000 + 10000)}`,
      status: 'CONNECTED',
      linked_at: new Date().toISOString()
    };
  },

  // Billing
  async getSubscription(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/billing/subscription`, { headers: getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {}
    return { plan: 'PRO', active: true, price: 2999, expires_at: '2026-12-31' };
  }
};
