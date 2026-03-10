"""Add llm_backtest_runs and llm_backtest_steps tables.

Revision ID: 20260308_0100
Revises: 20260305_0100
Create Date: 2026-03-08 01:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "20260308_0100"
down_revision: Union[str, None] = "20260305_0100"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def is_sqlite() -> bool:
    bind = op.get_bind()
    return bind.dialect.name == "sqlite"


def upgrade() -> None:
    schema = None if is_sqlite() else "index"

    if not is_sqlite():
        op.execute("CREATE SCHEMA IF NOT EXISTS index")

    json_type = sa.JSON() if is_sqlite() else postgresql.JSONB()

    op.create_table(
        "llm_backtest_runs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), nullable=False, index=True),
        sa.Column("year", sa.Integer, nullable=False),
        sa.Column("initial_capital", sa.Numeric, nullable=False),
        sa.Column("monthly_contribution", sa.Numeric, server_default="0"),
        sa.Column("model_keys", json_type, nullable=False),
        sa.Column("benchmarks", json_type),
        sa.Column("status", sa.String(20), server_default="running"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        schema=schema,
    )

    op.create_table(
        "llm_backtest_steps",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("run_id", sa.String(36), nullable=False, index=True),
        sa.Column("model_key", sa.String(100), nullable=False),
        sa.Column("month", sa.Integer, nullable=False),
        sa.Column("decision_date", sa.Date, nullable=False),
        sa.Column("action", sa.String(20)),
        sa.Column("allocations", json_type),
        sa.Column("reasoning", sa.Text),
        sa.Column("portfolio_value", sa.Numeric),
        sa.Column("cash", sa.Numeric),
        sa.Column("positions", json_type),
        sa.Column("cost_usd", sa.Numeric, server_default="0"),
        sa.Column("latency_ms", sa.Integer, server_default="0"),
        sa.Column("raw_output", sa.Text),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        schema=schema,
    )

    # FK only for PostgreSQL (Supabase)
    if not is_sqlite():
        op.create_foreign_key(
            "fk_backtest_steps_run_id",
            "llm_backtest_steps", "llm_backtest_runs",
            ["run_id"], ["id"],
            source_schema=schema, referent_schema=schema,
        )


def downgrade() -> None:
    schema = None if is_sqlite() else "index"

    if not is_sqlite():
        op.drop_constraint("fk_backtest_steps_run_id", "llm_backtest_steps", schema=schema)

    op.drop_table("llm_backtest_steps", schema=schema)
    op.drop_table("llm_backtest_runs", schema=schema)
