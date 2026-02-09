## Why

uteki.open 当前使用的 UI 样式与原项目 (uchu_trade) 存在差异。为了保持视觉一致性和品牌统一性，需要将原项目的核心 UI 样式迁移到 uteki.open，包括配色方案、侧边栏交互、聊天界面布局等关键元素。

## What Changes

### 配色方案调整
- 背景色从当前的深黑色调整为原项目的深灰色 (#212121)
- Paper/Card 背景色使用 #2a2a2a
- 边框色使用 rgba(255, 255, 255, 0.05~0.12) 的半透明白色
- 侧边栏收起时显示纯色背景 #181818，hover 时 #303030
- 保留品牌主色 #6495ed（蓝色）用于选中状态

### 侧边栏样式优化
- 收起状态宽度保持 54px
- 移除左侧紫蓝渐变边条（原项目没有这个）
- 汉堡菜单图标使用半透明白色 rgba(255, 255, 255, 0.7)
- 展开时使用毛玻璃效果 (backdrop-filter: blur(16px))
- 菜单项 hover 时有 translateX(4px) 的微动效

### Agent Chat 页面布局
- 右上角添加 "历史记录" 和 "+ 新对话" 按钮（圆角胶囊样式）
- 空状态标题使用 Times New Roman 字体，2.2rem 大小
- 输入框使用实色背景 #2a2a2a，hover 时 #303030
- 添加 "Research" 按钮和模型选择器图标行
- Research 按钮选中时显示青色发光效果

### 按钮样式统一
- 所有按钮使用 rgba 半透明背景
- 统一的 hover 过渡动画 (cubic-bezier(0.4, 0, 0.2, 1))
- 圆角使用 12px 或 24px（胶囊按钮）

## Capabilities

### New Capabilities
- `agent-chat-controls`: 右上角控制按钮组（历史记录、新对话）
- `model-selector`: 模型选择器组件，支持多个 LLM 提供商图标展示

### Modified Capabilities
- `theme-system`: 更新主题配色以匹配原项目的灰色系
- `sidebar-interaction`: 优化侧边栏的收起/展开状态样式
- `chat-input`: 更新聊天输入框样式，添加 Research 按钮

## Impact

### 前端代码
- `frontend/src/theme/` - 更新配色定义
- `frontend/src/components/HoverSidebar.tsx` - 调整侧边栏样式
- `frontend/src/pages/AgentPage.tsx` - 添加右上角按钮和更新布局
- `frontend/src/components/ChatInput.tsx` - 更新输入框样式，添加 Research 按钮

### 设计资源
- 需要准备 LLM 提供商图标（Claude、GPT、Gemini、Qwen、DeepSeek）

### 无破坏性变更
- 所有变更为样式调整，不影响功能逻辑
- API 和数据结构保持不变
