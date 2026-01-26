# uteki.open

Open-source AI-powered quantitative trading platform for individual traders.

## Features

- **6 Domain Architecture**: Admin, Trading, Data, Agent, Evaluation, Dashboard
- **Multi-Database Strategy**: PostgreSQL + ClickHouse + Qdrant + Redis + MinIO
- **AI Agent Framework**: Unified SDK supporting OpenAI, Claude, DeepSeek, Qwen
- **Multi-Asset Support**: Crypto, Stocks (US), Commodities
- **Enterprise-Grade Evaluation**: OpenAI Evals + Anthropic alignment testing
- **One-Command Deployment**: Docker Compose for local setup

## Quick Start

### Prerequisites

- Python 3.10+
- Poetry
- Docker & Docker Compose
- Node.js 18+ (for frontend)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/uteki.open.git
   cd uteki.open
   ```

2. **Start all services**
   ```bash
   docker compose up -d
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   poetry install --all-extras
   ```

4. **Run database migrations**
   ```bash
   poetry run alembic upgrade head
   ```

5. **Seed initial data** (optional)
   ```bash
   poetry run python scripts/seed_data.py
   ```

6. **Start backend server**
   ```bash
   poetry run uvicorn uteki.main:app --reload
   ```

7. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

8. **Start frontend dev server**
   ```bash
   npm run dev
   ```

9. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## Configuration

1. Create `.env` file in `backend/`:
   ```env
   DATABASE_URL=postgresql://uteki:uteki_dev_pass@localhost:5432/uteki
   CLICKHOUSE_HOST=localhost
   CLICKHOUSE_PORT=8123
   QDRANT_HOST=localhost
   QDRANT_PORT=6333
   REDIS_URL=redis://localhost:6379
   MINIO_ENDPOINT=localhost:9000
   MINIO_ACCESS_KEY=uteki
   MINIO_SECRET_KEY=uteki_dev_pass
   ```

2. Configure API keys in `/admin` page:
   - LLM providers (OpenAI, Claude, DeepSeek, Qwen)
   - Exchanges (OKX, Binance, Interactive Brokers)
   - Data sources (FMP)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React 18)                     │
│                   /admin /evaluate                          │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/WebSocket
┌────────────────────────┴────────────────────────────────────┐
│                    Backend (FastAPI)                        │
│  ┌──────┐  ┌────────┐  ┌──────┐  ┌───────┐  ┌──────────┐  │
│  │Admin │  │Trading │  │ Data │  │ Agent │  │Evaluation│  │
│  └──┬───┘  └───┬────┘  └───┬──┘  └───┬───┘  └────┬─────┘  │
└─────┼─────────┼───────────┼─────────┼───────────┼─────────┘
      │         │           │         │           │
┌─────┴─────────┴───────────┴─────────┴───────────┴─────────┐
│  PostgreSQL  ClickHouse  Qdrant  Redis  MinIO              │
└─────────────────────────────────────────────────────────────┘
```

## Domain Responsibilities

| Domain | Responsibility |
|--------|----------------|
| **Admin** | System configuration, API keys, LLM/exchange setup |
| **Trading** | Order execution, position tracking, risk management |
| **Data** | Multi-asset data pipeline (daily K-lines, on-chain, financials) |
| **Agent** | AI agent framework, tool system, multi-agent orchestration |
| **Evaluation** | Performance metrics, benchmarks, A/B testing |
| **Dashboard** | Trading history visualization, P&L tracking |

## Development

### Run Tests
```bash
cd backend
poetry run pytest
```

### Lint Code
```bash
poetry run ruff check .
poetry run mypy .
```

### Format Code
```bash
poetry run ruff format .
```

## Documentation

- [Installation Guide](docs/INSTALL.md)
- [Configuration Guide](docs/CONFIGURATION.md)
- [User Guide](docs/USER_GUIDE.md)
- [Developer Guide](docs/DEVELOPMENT.md)
- [API Reference](http://localhost:8000/docs)

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Support

- GitHub Issues: https://github.com/yourusername/uteki.open/issues
- GitHub Discussions: https://github.com/yourusername/uteki.open/discussions
