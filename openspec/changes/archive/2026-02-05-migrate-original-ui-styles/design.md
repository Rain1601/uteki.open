## Context

uteki.open 是从 uchu_trade 项目重构而来的开源版本。当前 uteki.open 使用了一套自定义的主题系统（ThemeProvider），但与原项目的视觉风格存在差异。原项目使用 Material-UI v4 的 makeStyles，而 uteki.open 使用 MUI v5 的 sx prop 和自定义 theme 对象。

当前状态：
- 主题系统已实现深色/浅色切换
- 侧边栏使用 hover 展开/收起交互
- Agent 聊天页面已完成基础功能

## Goals / Non-Goals

**Goals:**
- 将配色方案调整为与原项目一致的灰色系
- 复制原项目侧边栏的视觉效果和交互细节
- 在 Agent 聊天页面添加右上角控制按钮
- 添加模型选择器组件
- 保持代码的可维护性和主题系统的一致性

**Non-Goals:**
- 不迁移功能逻辑，仅复制样式
- 不改变当前的组件架构
- 不添加新的第三方样式库
- 不实现原项目的所有页面样式（仅聚焦 Agent Chat）

## Decisions

### D1: 配色方案更新策略
**决定**: 直接修改 `frontend/src/theme/colors.ts` 中的配色定义

**理由**:
- 当前主题系统已经完善，只需更新颜色值
- 保持单一数据源，避免硬编码颜色值
- 浅色主题暂不调整，保持与深色主题的对比

**配色映射**:
| 原项目 | uteki.open 对应字段 |
|--------|---------------------|
| #212121 | background.deepest |
| #2a2a2a | background.secondary |
| #303030 | background.tertiary |
| #181818 | background.primary (侧边栏) |
| rgba(255,255,255,0.05) | border.subtle |
| rgba(255,255,255,0.1) | border.default |
| #6495ed | brand.primary |

### D2: 侧边栏样式调整
**决定**: 在 HoverSidebar.tsx 中直接调整 sx 属性值

**理由**:
- 当前组件结构已满足需求
- 原项目使用 makeStyles，可直接将样式值迁移到 sx prop

**关键样式**:
- 收起状态背景: 使用 theme.background.primary (#181818)
- 展开时毛玻璃: `backdropFilter: 'blur(16px) saturate(1.2)'`
- 菜单项 hover: `transform: 'translateX(4px)'`
- 图标颜色: `rgba(255, 255, 255, 0.7)`

### D3: Agent Chat 页面控制按钮
**决定**: 创建 ChatControls 组件，放置在页面右上角

**理由**:
- 按钮组与聊天内容独立，便于复用
- 使用绝对定位 position: fixed，避免影响布局

**组件结构**:
```
ChatControls
├── HistoryButton ("历史记录")
└── NewChatButton ("+ 新对话")
```

### D4: 模型选择器实现
**决定**: 创建 ModelSelector 组件，使用图标按钮组

**理由**:
- 原项目使用图标展示支持的模型
- 需要准备 SVG 图标资源

**支持的模型图标**:
- Claude (Anthropic)
- GPT (OpenAI)
- Gemini (Google)
- Qwen (Alibaba)
- DeepSeek

### D5: Research 按钮实现
**决定**: 在 ChatInput 组件中添加 Research 模式切换

**理由**:
- Research 是原项目的深度搜索模式
- 需要与后端 API 配合，本次仅实现 UI

**样式要点**:
- 默认状态: 半透明背景，圆角胶囊
- 选中状态: 青色发光效果 `boxShadow: '0 0 15px rgba(125, 155, 184, 0.1)'`

## Risks / Trade-offs

### R1: 配色调整可能影响现有组件
**风险**: 修改全局配色可能导致部分组件显示异常
**缓解**:
- 逐个检查现有页面的视觉效果
- 保留浅色主题作为备份

### R2: 模型图标版权问题
**风险**: LLM 提供商的图标可能有使用限制
**缓解**:
- 使用官方提供的 brand assets
- 或使用简化的文字标识

### R3: 侧边栏移动端适配
**风险**: 桌面端样式调整可能影响移动端显示
**缓解**:
- 保持响应式断点检测
- 移动端使用独立的 SwipeableDrawer

## Open Questions

1. **模型图标资源**: 是否需要从原项目复制 SVG 文件，还是重新获取？
2. **Research 功能**: 后端是否已支持 Research 模式 API？
3. **历史记录功能**: 是否需要实现完整的历史记录抽屉，还是仅显示按钮？
