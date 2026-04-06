# Agent 技术难点突破记录

> 记录 Company Agent / Index Agent 开发中遇到的关键技术问题、排查思路和解决方案。
> 每条记录格式：**问题** → **结果** → **方法**

---

## 2026-04-06

### 1. Company Agent 缓存污染 — 分析 TSLA 返回 MSFT 结果

**问题（难点）**

用户分析 Tesla (TSLA)，返回的 7-gate 分析内容完全是 Microsoft (MSFT) 的业务模型、财务数据和护城河评估。Gate 1-6 的缓存结果被跨股票复用，导致严重的数据污染。

问题隐蔽性高：
- 分析流程正常执行，无报错
- Gate 7（final_verdict）不走缓存，所以最终格式正确，但内容基于错误的前置 gate 结论
- 只有用户仔细阅读分析文本才能发现异常

**结果（Before → After）**

| | Before | After |
|---|--------|-------|
| 缓存 key | `company:gate:{model}:{gate}:{prompt_hash}` | `company:gate:{symbol}:{model}:{gate}:{prompt_hash}` |
| 跨股票隔离 | 无 — 同一模型的不同股票共享缓存 | 有 — symbol 维度完全隔离 |
| 无 symbol 保护 | 无 — 返回错误结果 | 跳过缓存，强制重新分析 |
| PipelineContext | 只有 `company_data_text` | 新增 `symbol` 字段 |

**方法（思路 + 方法）**

1. **定位方向**：用户报告"分析TSLA返回MSFT"→ 两种可能：(a) 公司数据缓存（financials.py）返回了错误数据，(b) Gate 分析缓存（skill_runner.py）返回了错误结果

2. **排查 financials.py**：检查 `fetch_company_data()` 的缓存 key 为 `company:data:{symbol}`，key 构造正确，排除

3. **排查 skill_runner.py**：检查 `_get_gate_cache_key()` 方法：
   ```python
   # BUG: symbol 被提取了但从未使用！
   symbol = self.context.company_data_text[:50]  # 提取了
   return f"company:gate:{model}:{skill.gate_number}:{prompt_hash}"  # 没用上
   ```
   缓存 key 只有 3 个维度（model / gate_number / prompt_hash），**缺少 symbol**。同一模型分析不同股票时，gate 1-6 的 prompt 模板相同 → prompt_hash 相同 → 命中旧缓存

4. **修复**：
   - `PipelineContext` 新增 `symbol` 字段（从 `company_data["profile"]["symbol"]` 传入）
   - 缓存 key 加入 symbol 维度
   - 无 symbol 时返回 `None`，跳过缓存

5. **根因总结**：开发时 `symbol` 变量被提取但遗漏使用，属于典型的"写了一半忘了接上"的编码疏忽。Gate 缓存 TTL 为 24 小时，意味着首次分析后的 24 小时内，同模型的所有其他股票都会拿到第一个股票的结论。

**关键文件**：
- `backend/uteki/domains/company/skill_runner.py` — `_get_gate_cache_key()`
- `backend/uteki/domains/agent/core/context.py` — `PipelineContext`

---

### 2. Company Agent 7-Gate Pipeline 缓存策略设计

**问题（难点）**

Company Agent 的 7-gate 分析流程耗时 5-10 分钟（每个 gate 调用 LLM + 工具），相同股票短时间内重复分析造成资源浪费。需要在"性能"和"数据新鲜度"之间找平衡。

**结果（Before → After）**

| | Before | After |
|---|--------|-------|
| 重复分析 | 每次全量执行 7 gate | Gate 1-6 缓存 24h，Gate 7 始终重算 |
| 缓存粒度 | 无缓存 | 按 symbol × model × gate × prompt 版本 |
| 缓存隔离 | N/A | 不同股票、不同模型、不同 prompt 版本完全隔离 |

**方法（思路 + 方法）**

- Gate 1-6 是事实性分析（财务数据、行业地位、护城河等），短期内不会剧烈变化 → 适合缓存
- Gate 7 是综合判断（final_verdict），依赖前 6 gate 结论 + 当前市场情绪 → 不缓存
- 缓存 key 包含 `prompt_hash`（prompt 前 200 字符的 MD5），确保 prompt 版本更新后自动失效
- 使用 Redis cache-aside 模式，TTL 24 小时，非阻塞（缓存失败不影响分析流程）

---

### 3. TradingView iframe z-index 层叠上下文问题

**问题（难点）**

在 Company Agent 页面中，TradingView 的 K 线图使用 iframe 嵌入。iframe 创建了独立的层叠上下文（stacking context），导致页面上绝对定位的元素（搜索建议下拉框、浮动标签等）无法显示在 iframe 上方，即使设置了很高的 z-index 也无效。

**结果（Before → After）**

| | Before | After |
|---|--------|-------|
| 搜索建议 | 被 iframe 遮挡，不可见 | 改为向上展开（`bottom: '100%'`），避开 iframe 区域 |
| 推荐标签 | 在 iframe 上方不可见 | 移至左侧边栏 tab，避免与 iframe 重叠 |
| Line/K-Line 切换 | 无 | Line 模式使用原生 SVG 渲染，K-Line 使用 TradingView iframe |

**方法（思路 + 方法）**

- iframe 是浏览器级别的隔离容器，z-index 无法跨 iframe 边界生效
- 方案 1：将需要浮动的元素移到不与 iframe 重叠的位置（搜索建议向上弹出）
- 方案 2：将功能迁移到非重叠区域（推荐列表从 chart 区域移到左侧 sidebar tab）
- 方案 3：提供非 iframe 的替代渲染（Line 模式用原生 SVG，不存在层叠问题）

---

### 4. verdict 数据路径解析错误

**问题（难点）**

Company Agent 分析完成后，执行记录列表的 ACT（操作建议）列全部显示空白。Gate 7 的输出被正确生成但前端无法提取。

**结果（Before → After）**

| | Before | After |
|---|--------|-------|
| 数据路径 | `gateResults[7].parsed.action` | `gateResults[7].parsed.position_holding.action` |
| ACT 列 | 空白 | 正确显示 BUY/SELL/WATCH |
| conviction | 不显示 | 正确显示百分比 |

**方法（思路 + 方法）**

- Gate 7 的输出结构是嵌套的：`parsed` 下有 `position_holding` 子对象，其中才包含 `action`、`conviction`、`one_sentence` 等字段
- 前端直接访问 `parsed.action` 找不到值
- 通过检查实际 API 返回的 JSON 结构发现多了一层嵌套
- 修复：添加 `getTaskVerdict()` helper 函数，正确访问 `parsed.position_holding` 路径
