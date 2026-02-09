## Context

uteki.open 是一个投资管理平台，后端 FastAPI + SQLAlchemy（SQLite/PostgreSQL），前端 React + TypeScript + MUI。已有：

- **Agent 基础设施**: `LLMAdapterFactory` 支持 7 个 LLM 提供商（OpenAI/Anthropic/DeepSeek/Qwen/MiniMax/Gemini），统一的 `LLMTool` 定义和 function calling 接口
- **SNB 交易**: `SnbClient` 封装了雪盈证券 SDK，支持查余额、持仓、下单、撤单、交易历史
- **Research**: `DeepResearchOrchestrator` 支持 Web 搜索 + 内容抓取 + LLM 综合分析
- **数据源 API Key**: FMP (`FMP_API_KEY`) 和 Alpha Vantage (`ALPHA_VANTAGE_API_KEY`) 已配置

本变更将新增 `index` 域，构建一个完整的指数投资智能体系统。

## Goals / Non-Goals

**Goals:**

- 构建端到端的指数 ETF 投资决策系统：数据采集 → 多模型分析 → 用户决策 → 实盘执行 → 事后追踪
- 多模型 Arena：同一输入并行调用所有 LLM，所有 I/O 完全透明可见
- Decision Harness 不可变快照，确保历史复现和公平模型对比
- System Prompt 版本化，排行榜按版本分组
- 反事实追踪：未采纳建议的假设收益也记录
- 调度器驱动的周/月级决策触发

**Non-Goals:**

- 不做实时行情推送/WebSocket 流式报价
- 不做高频交易或日内交易策略
- 不做模拟/Paper Trading（直接实盘）
- 不接入 IB Gateway（仅使用 SNB + 免费数据源）
- 记忆模块先实现基础版，不做语义检索优化（后续迭代）

## Decisions

### D1: 后端模块结构

```
backend/uteki/domains/index/
├── __init__.py
├── api.py                    # FastAPI 路由
├── schemas.py                # Pydantic 请求/响应模型
├── models/
│   ├── __init__.py
│   ├── watchlist.py          # 观察池标的
│   ├── index_price.py        # 指数历史价格
│   ├── decision_harness.py   # Decision Harness 快照
│   ├── model_io.py           # 模型 I/O 记录
│   ├── decision_log.py       # 决策日志
│   ├── agent_memory.py       # Agent 记忆
│   ├── model_score.py        # 模型评分
│   ├── schedule_task.py      # 调度任务
│   └── prompt_version.py     # System Prompt 版本
├── services/
│   ├── data_service.py       # 指数数据获取 (FMP/AV)
│   ├── backtest_service.py   # 回测引擎
│   ├── harness_builder.py    # Harness 构建器
│   ├── arena_service.py      # 多模型 Arena 调度
│   ├── agent_service.py      # Agent 对话 + 工具调用
│   ├── memory_service.py     # 记忆读写
│   ├── decision_service.py   # 决策日志 + 反事实追踪
│   ├── scheduler_service.py  # 调度任务管理
│   └── prompt_service.py     # System Prompt 版本管理
└── tools/
    ├── __init__.py
    └── index_tools.py        # Agent function calling 工具定义
```

**理由**: 按职责清晰拆分 service，每个 service 单一职责。`tools/` 独立出来因为工具定义同时被 Arena 和对话模式使用。

### D2: 数据源选择 — FMP 为主，Alpha Vantage 为备

| 需求 | FMP | Alpha Vantage |
|------|-----|---------------|
| ETF 实时报价 | `/quote/{symbol}` | `GLOBAL_QUOTE` |
| 历史日线 | `/historical-price-full/{symbol}` | `TIME_SERIES_DAILY` |
| PE/估值指标 | `/ratios/{symbol}` | 不支持 |
| 免费额度 | 250次/天 | 25次/天 |

**决策**: FMP 为主数据源（数据更全、额度更高），Alpha Vantage 作为 fallback。数据存入 `index_prices` 表，每日定时更新。

**替代方案**: Yahoo Finance（非官方 API，不稳定）、CCXT（仅加密货币）。

### D3: Decision Harness 设计

Harness 是一个不可变的 JSON 文档，构建后写入 DB 并获得唯一 ID。

```python
@dataclass
class DecisionHarness:
    id: str                    # UUID
    created_at: datetime
    harness_type: str          # "monthly_dca" | "rebalance" | "weekly_check"
    prompt_version_id: str     # 关联的 System Prompt 版本
    market_snapshot: dict      # {symbol: {price, pe, ma50, rsi, ...}}
    account_state: dict        # {cash, positions: [{symbol, qty, avg_price}], total}
    memory_summary: dict       # {recent_decisions, reflections, experiences}
    task: dict                 # {type, budget, constraints}
    tool_definitions: list     # 工具 JSON Schema 列表
```

**关键**: Harness 一旦创建就不可修改。市场数据和账户状态在 Harness 构建时从数据服务和 SNB 实时获取并冻结。

### D4: Arena 多模型并行调用

```
调度器触发 / 用户手动触发
         │
         ▼
  HarnessBuilder.build()
  ├── DataService.get_quotes()      # 市场数据
  ├── SnbClient.get_balance()       # 账户余额
  ├── SnbClient.get_positions()     # 持仓
  ├── MemoryService.get_summary()   # 记忆摘要
  └── PromptService.get_current()   # 当前 System Prompt
         │
         ▼
  ArenaService.run(harness)
  ├── 对每个已配置模型并行:
  │   ├── 构建完整 prompt (system + harness + tools)
  │   ├── 调用 LLMAdapter.chat(tools=...)
  │   ├── 解析结构化输出
  │   └── 保存完整 I/O 到 model_io 表
  └── 返回所有模型的结果
         │
         ▼
  前端 Arena 视图展示
         │
         ▼
  用户采纳 → DecisionCard → 确认执行 (TOTP) → SNB 下单
```

**并行策略**: 使用 `asyncio.gather()` 并行调用所有模型，每个模型通过 `asyncio.to_thread()` 执行（因为部分 SDK 是同步的）。单个模型超时 60s，整体超时 120s。

**替代方案**: 串行调用（慢）、消息队列异步（过重）。`asyncio.gather` 在周/月级频率下完全足够。

### D5: 模型 I/O 存储

每次 Arena 调用生成 N 条 `model_io` 记录：

```
model_io 表:
  id: UUID
  harness_id: FK → decision_harness
  model_provider: str           # "anthropic" | "openai" | ...
  model_name: str               # "claude-sonnet-4" | "gpt-4o" | ...
  input_prompt: TEXT             # 完整输入（system + user prompt 全文）
  input_token_count: int
  output_raw: TEXT               # 模型原始输出全文
  output_structured: JSON        # 解析后的结构化决策
  output_token_count: int
  tool_calls: JSON               # 工具调用链 [{tool, input, output}, ...]
  latency_ms: int
  cost_usd: float                # 估算成本
  created_at: datetime
```

**理由**: 输入输出分开存储，便于前端按需加载（列表页只展示摘要，详情页加载全文）。`input_prompt` 存完整 prompt 而非引用 Harness，因为 prompt 还包含 system prompt 拼接，每个模型的 tool 格式可能不同。

### D6: 反事实追踪

决策执行后，启动后台任务在 7d/30d/90d 时计算所有模型建议的假设收益：

```
counterfactual 表:
  id: UUID
  decision_log_id: FK → decision_log
  model_io_id: FK → model_io
  was_adopted: bool              # 是否被用户采纳
  tracking_days: int             # 7 | 30 | 90
  hypothetical_return_pct: float # 如果执行该方案的假设收益率
  actual_prices: JSON            # {symbol: {entry_price, current_price}}
  calculated_at: datetime
```

**计算方式**: 根据模型建议的 allocations，取 Harness 时刻的价格为买入价，取 N 天后的实际价格计算收益。不考虑交易成本（简化）。

### D7: System Prompt 版本管理

```
prompt_version 表:
  id: UUID
  version: str                   # "v1.0" | "v1.1" | ...
  content: TEXT                  # System Prompt 全文
  description: str               # 变更说明
  created_at: datetime
  is_current: bool
```

**工作流**: 用户通过 API/UI 更新 System Prompt → 自动创建新版本 → 后续 Harness 关联新版本 → 排行榜按版本分组展示。

### D8: 调度器实现

使用 `APScheduler` 管理定时任务，任务配置存 DB：

```
schedule_task 表:
  id: UUID
  name: str                      # "monthly_dca" | "weekly_check" | "monthly_reflection"
  cron_expression: str           # "0 9 1 * *" (每月1日9点)
  task_type: str                 # "arena_analysis" | "reflection"
  config: JSON                   # {budget: 1000, harness_type: "monthly_dca"}
  is_enabled: bool
  last_run_at: datetime
  last_run_status: str           # "success" | "error" | "pending_user_action"
  next_run_at: datetime          # 由 APScheduler 计算
  created_at: datetime
```

**替代方案**: Celery Beat（过重）、系统 cron（不灵活、不可视）。APScheduler 轻量且支持动态增删任务。

### D9: 记忆模块（V1 基础版）

先实现简单的分类存储，后续可迭代为语义检索：

```
agent_memory 表:
  id: UUID
  user_id: str
  category: str                  # "decision" | "reflection" | "experience" | "observation"
  content: TEXT
  metadata: JSON                 # {related_symbols, related_decision_id, ...}
  created_at: datetime
```

**检索策略 V1**: 按 category 过滤 + 按时间倒序 + 取最近 N 条。构建 Harness 时，自动提取最近 3 条 decision + 最近 1 条 reflection + 所有 experience（通常不多）。

### D10: 前端组件架构

```
frontend/src/pages/IndexAgentPage.tsx        # 主页面（Tab 切换）
frontend/src/components/index/
├── ChatPanel.tsx                            # 左侧对话流
├── DataPanel.tsx                            # 右侧数据面板
├── ArenaView.tsx                            # Arena 多模型对比
├── ModelCard.tsx                            # 单个模型结果卡片
├── ModelIODetail.tsx                        # I/O 展开详情（展开/收起）
├── DecisionCard.tsx                         # 决策卡片（批准/修改/跳过）
├── DecisionTimeline.tsx                     # 决策历史时间线
├── CounterfactualBadge.tsx                  # 反事实收益标签
├── HarnessViewer.tsx                        # Harness 内容查看器
├── LeaderboardTable.tsx                     # 模型排行榜
├── SchedulerPanel.tsx                       # 调度器管理
├── WatchlistPanel.tsx                       # 观察池管理
└── BacktestChart.tsx                        # 回测收益曲线
```

**页面 Tab 结构**: Chat（对话+决策卡片） | Arena（当前/历史 Arena） | History（决策时间线） | Leaderboard | Settings（调度器+观察池+Prompt 版本）

## Risks / Trade-offs

**[FMP 免费额度 250次/天]** → 每日更新观察池内所有标的的日线数据 + 实时报价。若标的超过 10 只，需控制更新频率或升级付费计划。首期观察池控制在 10 只以内。

**[多模型并行成本]** → 每次 Arena 调用 4-6 个模型，单次估算 $0.10-$0.30。周/月频率下月成本约 $1-$5，可接受。Arena 结果缓存在 DB，不重复调用。

**[LLM 结构化输出可靠性]** → 不同模型对 JSON 输出格式的遵守程度不同。使用两层解析：先尝试 JSON 解析，失败则用 regex 提取关键字段，最终 fallback 为纯文本记录。

**[Harness 数据量膨胀]** → 每次 Harness 包含完整市场数据 + 完整 I/O，长期积累数据量较大。按 Harness 存储，可按时间归档到冷存储。首年预估 < 100MB，不是问题。

**[APScheduler 进程级调度]** → 单进程模式下重启丢失调度状态。使用 `SQLAlchemyJobStore` 持久化任务到 DB，重启后自动恢复。

**[SNB 登录会话超时]** → SNB token 有有效期，Harness 构建时如果 token 过期需要重新登录。现有 `_ensure_login()` 逻辑已处理，但需增加错误重试。

## Open Questions

- **回测引擎精度**: 是否需要考虑分红再投资、管理费率？V1 建议先用简单的价格收益计算，后续迭代加入分红数据。
- **反事实追踪的触发**: 用后台定时任务还是惰性计算（用户查看时才算）？建议后台定时，因为需要在固定时间点取价格。
- **多用户隔离**: 当前 SNB 账号是全局单例。多用户场景下每个用户是否需要独立的 SNB 账号？首期单用户，后续迭代。
