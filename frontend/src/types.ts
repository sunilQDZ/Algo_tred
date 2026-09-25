export interface IndicatorCondition {
  indicator: string;
  params: Record<string, any>;
  operator: string;
  value: any;
}

export interface StrategyRules {
  logic_operator: 'AND' | 'OR';
  entry_conditions: IndicatorCondition[];
  exit_conditions: IndicatorCondition[];
  stop_loss_pct: number;
  target_pct: number;
  trailing_stop_pct?: number;
  position_size_type: 'fixed_cash' | 'percentage_capital' | 'fixed_qty';
  position_size_value: number;
}

export interface StrategyTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  default_rules: StrategyRules;
  default_params: Record<string, any>;
  indicator_list: string[];
  created_at: string;
}

export interface Strategy {
  id: string;
  user_id: string;
  template_id?: string;
  name: string;
  description?: string;
  segment: string;
  symbol: string;
  timeframe: string;
  rules: StrategyRules;
  params: Record<string, any>;
  status: 'DRAFT' | 'BACKTESTED' | 'PAPER' | 'LIVE';
  created_at: string;
  updated_at: string;
}

export interface BacktestMetrics {
  initial_capital: number;
  final_equity: number;
  total_return_pct: number;
  cagr_pct: number;
  max_drawdown_pct: number;
  win_rate_pct: number;
  sharpe_ratio: number;
  profit_factor: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  total_gross_pnl?: number;
  total_statutory_charges?: number;
  total_net_pnl?: number;
}

export interface EquityPoint {
  date: string;
  equity: number;
  benchmark: number;
}

export interface TradeLog {
  trade_no: number;
  entry_time: string;
  exit_time: string;
  side: string;
  qty: number;
  entry_price: number;
  exit_price: number;
  gross_pnl: number;
  net_pnl: number;
  pnl_pct: number;
  exit_reason: string;
}

export interface BacktestRun {
  id: string;
  strategy_id: string;
  params_used: Record<string, any>;
  start_date: string;
  end_date: string;
  initial_capital: number;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  error_message?: string;
  metrics: BacktestMetrics;
  equity_curve: EquityPoint[];
  trade_log: TradeLog[];
  created_at: string;
}

export interface OptimizationResult {
  rank: number;
  params: Record<string, any>;
  train_metrics: BacktestMetrics;
  test_metrics: BacktestMetrics;
}

export interface OptimizationRun {
  id: string;
  strategy_id: string;
  param_search_space: Record<string, any>;
  method: string;
  n_trials: number;
  target_metric: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  top_n_results: OptimizationResult[];
  ai_summary?: string;
  ai_recommended_config_idx?: number;
  created_at: string;
}

export interface LiveDeployment {
  id: string;
  user_id: string;
  strategy_id: string;
  broker_connection_id?: string;
  mode: 'PAPER' | 'LIVE';
  status: 'RUNNING' | 'PAUSED' | 'STOPPED' | 'KILLED';
  capital_allocated: number;
  current_equity: number;
  realized_pnl: number;
  unrealized_pnl: number;
  risk_settings: Record<string, any>;
  started_at: string;
  stopped_at?: string;
}

export interface Order {
  id: string;
  client_order_id: string;
  broker_order_id?: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  qty: number;
  price: number;
  filled_price: number;
  order_type: string;
  status: string;
  placed_at: string;
}

export interface Position {
  id: string;
  symbol: string;
  qty: number;
  avg_price: number;
  current_price: number;
  unrealized_pnl: number;
  realized_pnl: number;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  kyc_status: string;
  risk_profile: {
    tolerance: 'conservative' | 'moderate' | 'aggressive';
    max_drawdown_limit: number;
    investment_horizon: string;
  };
  subscription_plan: 'FREE' | 'PRO' | 'INSTITUTIONAL';
  created_at: string;
}

export interface BrokerConnection {
  id: string;
  user_id: string;
  broker_name: string;
  account_id?: string;
  status: string;
  linked_at: string;
}
