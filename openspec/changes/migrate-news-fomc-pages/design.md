## Context

从 uchu_trade 项目完整迁移 News Timeline 和 FOMC Calendar 功能模块到 uteki.open，包括：

1. **后端数据层**：NewsArticle 和 EconomicEvent 数据模型
2. **后端服务层**：新闻抓取、经济日历数据聚合、AI 分析
3. **后端 API 层**：RESTful API 和 SSE 流式接口
4. **调度任务**：定时新闻抓取
5. **前端页面**：NewsTimelinePage (~1700行) 和 FOMCCalendar (~1100行)

当前状态：
- uchu_trade 后端使用 Flask + SQLAlchemy
- uteki.open 后端使用 FastAPI + SQLAlchemy (async)
- uchu_trade 前端使用 Material-UI v4 (makeStyles)
- uteki.open 前端使用 MUI v5 (sx prop + theme variables)

## Goals / Non-Goals

**Goals:**
- 完整迁移后端数据模型、服务、API 和调度任务
- 将 Flask 同步代码升级为 FastAPI 异步代码
- 完整迁移前端页面的 UI 和交互功能
- 升级到 MUI v5 并适配 uteki.open 主题系统
- 保持与原项目一致的用户体验
- 支持深色/浅色主题切换

**Non-Goals:**
- 不重构 AI 分析功能的 prompt 逻辑（保持原有分析质量）
- 不优化抓取频率或策略（保持原有逻辑）
- 不添加新功能，仅迁移现有功能

## Decisions

### D1: 后端架构 - Domain 组织

**决策**: 将功能组织到 uteki.open 的 domain 结构中

```
backend/uteki/domains/
├── news/
│   ├── models/
│   │   └── news_article.py
│   ├── services/
│   │   ├── jeff_cox_service.py
│   │   └── news_analysis_agent.py
│   ├── api.py
│   └── analysis_api.py
└── macro/
    ├── models/
    │   └── economic_event.py
    ├── services/
    │   └── fmp_calendar_service.py
    └── api.py
```

**理由**:
- 与 uteki.open 现有架构一致
- 清晰的功能边界划分
- 便于后续扩展

### D2: Flask → FastAPI 迁移策略

**决策**: 将 Flask Blueprint 转换为 FastAPI Router，同步代码转为异步

**原代码** (Flask):
```python
@jeff_cox_bp.route('/monthly/<int:year>/<int:month>', methods=['GET'])
def get_monthly_news(year, month):
    articles = JeffCoxService.get_monthly_articles(year, month)
    return jsonify({'success': True, 'data': articles})
```

**新代码** (FastAPI):
```python
@router.get("/monthly/{year}/{month}")
async def get_monthly_news(
    year: int, month: int,
    session: AsyncSession = Depends(get_db_session)
):
    articles = await JeffCoxService.get_monthly_articles(session, year, month)
    return {"success": True, "data": articles}
```

**理由**:
- 利用 FastAPI 的异步特性提高并发性能
- 使用 Depends 进行依赖注入
- 类型安全的路径参数

### D3: 数据模型迁移

**决策**: 保持与原项目相同的表结构，使用 SQLAlchemy 2.0 异步模式

```python
class NewsArticle(Base):
    __tablename__ = "news_articles"

    id = Column(String, primary_key=True)
    source = Column(String, nullable=False)
    headline = Column(String, nullable=False)
    content = Column(Text)
    publish_time = Column(DateTime)
    tags = Column(JSON, default=[])
    important = Column(Boolean, default=False)
    # AI 分析字段
    ai_analysis_status = Column(String, default='pending')
    ai_analysis = Column(Text)
    ai_impact = Column(String)
```

**理由**:
- 保持数据兼容性，便于数据迁移
- 支持预加载 AI 分析结果

### D4: SSE 流式输出

**决策**: 使用 FastAPI StreamingResponse 实现 Server-Sent Events

```python
@router.post("/analyze-news-stream")
async def analyze_news_stream(request: AnalysisRequest):
    async def event_generator():
        async for chunk in news_analysis_agent.analyze_stream(request.news_id):
            yield f"data: {json.dumps(chunk)}\n\n"
    return StreamingResponse(event_generator(), media_type="text/event-stream")
```

**理由**:
- 与原项目 SSE 接口兼容
- 前端无需修改流式处理逻辑

### D5: 样式迁移策略

**决策**: 使用 MUI v5 sx prop + 内联样式对象，不使用 styled-components 或 emotion

**理由**:
- 与项目现有代码风格一致（AgentChatPage, HoverSidebar 等）
- sx prop 可直接访问 theme 变量
- 减少额外依赖
- 更容易进行主题适配

**替代方案**:
- styled-components: 需要额外学习成本，与现有代码风格不一致
- CSS Modules: 无法直接使用 theme 变量

### D6: 前端文件组织结构

**决策**:
```
frontend/src/
├── pages/
│   ├── NewsTimelinePage.tsx
│   └── macro/
│       └── FOMCCalendar.tsx
├── components/
│   └── ArticleDetailDialog.tsx
└── api/
    ├── news.ts
    └── economicCalendar.ts
```

**理由**:
- 保持与原项目相似的目录结构，便于对照
- macro 子目录用于宏观经济相关页面，便于扩展

### D7: API 基础 URL 配置

**决策**: 使用环境变量配置 API 基础 URL，支持代理到原后端

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
```

**理由**:
- 开发时可指向 localhost:8000（原后端）
- 生产时可使用相对路径或配置代理
- 灵活适配不同部署场景

### D8: 主题变量映射

**决策**: 将原项目硬编码颜色映射到 uteki.open 主题变量

| 原项目颜色 | uteki.open 变量 |
|-----------|-----------------|
| #212121 | theme.background.primary |
| rgba(255, 255, 255, 0.06) | theme.border.subtle |
| rgba(255, 255, 255, 0.9) | theme.text.primary |
| #6495ed | theme.brand.primary |
| rgba(100, 149, 237, 0.15) | 动态计算或使用 alpha |

**理由**:
- 确保深色/浅色主题正确切换
- 与项目整体视觉风格一致

### D9: TypeScript 类型定义

**决策**: 为 API 响应和组件 props 定义 TypeScript 接口

```typescript
// types/news.ts
interface NewsItem {
  id: string;
  source: string;
  time: string;
  headline: string;
  summary: string;
  tags: string[];
  important: boolean;
  // ...
}

// types/economicCalendar.ts
interface EconomicEvent {
  id: string;
  title: string;
  start_date: string;
  event_type: 'fomc' | 'earnings' | 'economic_data';
  // ...
}
```

**理由**:
- 类型安全，减少运行时错误
- 更好的 IDE 支持
- 代码可维护性

## Risks / Trade-offs

### R1: Flask → FastAPI 异步迁移
**风险**: 原项目使用同步 SQLAlchemy，迁移到异步可能引入并发问题
**缓解**:
- 仔细检查数据库会话管理
- 使用 async with 确保正确关闭连接
- 充分测试并发场景

### R2: 外部 API 依赖
**风险**: 依赖 CNBC GraphQL 和 FMP API，服务不稳定或接口变更可能导致功能失效
**缓解**:
- 添加 API 错误处理和重试逻辑
- 记录详细的错误日志
- 设置合理的超时时间

### R3: AI 分析成本
**风险**: AI 分析调用 LLM API，可能产生较高费用
**缓解**:
- 实现分析结果缓存（预加载到数据库）
- 避免重复分析相同内容
- 监控 API 调用量

### R4: 流式 AI 分析兼容性
**风险**: SSE 流式输出在某些代理或负载均衡配置下可能出现问题
**缓解**:
- 添加超时处理 (150s)
- 提供非流式 fallback
- 测试 Cloud Run 部署场景

### R5: 代码量较大
**风险**: 完整迁移涉及后端服务、API、调度器和前端（~5000行），可能遗漏细节
**缓解**:
- 分阶段迁移：数据模型 → 服务 → API → 调度器 → 前端
- 逐个功能点测试
- 保留原代码作为参考

### R6: 数据迁移
**风险**: 如需迁移历史数据，可能涉及大量数据导入
**缓解**:
- 提供数据导出/导入脚本
- 支持增量同步
- 可选择从空数据库开始
