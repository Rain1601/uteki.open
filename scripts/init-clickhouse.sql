-- ClickHouse initialization script for uteki.open
-- This script creates optimized tables for time-series data

-- Create database
CREATE DATABASE IF NOT EXISTS uteki;

-- K-lines table (OHLCV data for all assets)
CREATE TABLE IF NOT EXISTS uteki.klines
(
    symbol String,              -- Trading pair (e.g., BTC-USDT, AAPL)
    exchange String,            -- Exchange name (okx, binance, fmp)
    interval String,            -- Time interval (1d only for MVP)
    timestamp DateTime,         -- Candle open time
    open Decimal(18, 8),
    high Decimal(18, 8),
    low Decimal(18, 8),
    close Decimal(18, 8),
    volume Decimal(18, 8),
    created_at DateTime DEFAULT now()
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (symbol, exchange, interval, timestamp)
SETTINGS index_granularity = 8192;

-- On-chain metrics table (BTC, ETH daily metrics)
CREATE TABLE IF NOT EXISTS uteki.onchain_metrics
(
    asset String,               -- BTC, ETH, etc.
    date Date,
    active_addresses UInt64,
    transaction_count UInt64,
    avg_fee Decimal(18, 8),
    whale_transactions UInt32,
    exchange_inflow Decimal(18, 8),
    exchange_outflow Decimal(18, 8),
    tvl Decimal(18, 2),         -- Total value locked (for ETH DeFi)
    created_at DateTime DEFAULT now()
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (asset, date)
SETTINGS index_granularity = 8192;

-- Financial metrics table (time-series company financials)
CREATE TABLE IF NOT EXISTS uteki.financial_metrics
(
    symbol String,
    report_date Date,
    revenue Decimal(18, 2),
    net_income Decimal(18, 2),
    operating_cash_flow Decimal(18, 2),
    total_assets Decimal(18, 2),
    total_liabilities Decimal(18, 2),
    pe_ratio Nullable(Decimal(10, 2)),
    pb_ratio Nullable(Decimal(10, 2)),
    roe Nullable(Decimal(10, 4)),
    created_at DateTime DEFAULT now()
)
ENGINE = MergeTree()
PARTITION BY toYear(report_date)
ORDER BY (symbol, report_date)
SETTINGS index_granularity = 8192;

-- Agent execution logs (for evaluation)
CREATE TABLE IF NOT EXISTS uteki.agent_execution_logs
(
    task_id String,
    agent_id String,
    agent_type String,
    status String,              -- pending, running, completed, failed
    start_time DateTime,
    end_time Nullable(DateTime),
    latency_ms Nullable(UInt32),
    tokens_used UInt32,
    cost_usd Decimal(10, 6),
    accuracy Nullable(Decimal(5, 4)),
    created_at DateTime DEFAULT now()
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(start_time)
ORDER BY (agent_type, start_time, task_id)
SETTINGS index_granularity = 8192;

-- Trade history (archived trades older than 30 days)
CREATE TABLE IF NOT EXISTS uteki.trade_history
(
    trade_id String,
    order_id String,
    symbol String,
    side String,                -- buy, sell
    price Decimal(18, 8),
    quantity Decimal(18, 8),
    fee Decimal(18, 8),
    realized_pnl Nullable(Decimal(18, 8)),
    timestamp DateTime,
    created_at DateTime DEFAULT now()
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (symbol, timestamp, trade_id)
SETTINGS index_granularity = 8192;

SELECT 'ClickHouse initialized successfully for uteki.open' AS status;
