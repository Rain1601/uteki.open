# UI Style Refinements Spec

## Overview

对 uteki.open 的 UI 样式进行精调，使其与原项目 uchu_trade 的视觉风格保持一致。主要调整配色方案和交互细节。

## Requirements

### R1: 背景配色调整

**当前状态：**
- `background.deepest`: #0a0a0a (极深黑)
- `background.primary`: #181c1f
- `background.secondary`: #1E1E1E

**目标状态（匹配原项目）：**
- `background.deepest`: #212121 (深灰)
- `background.primary`: #212121 (与 deepest 统一)
- `background.secondary`: #2a2a2a
- `background.tertiary`: #303030 (hover 状态)

**验收标准：**
- [ ] 页面主背景使用 #212121
- [ ] Card/Paper 组件使用 #2a2a2a
- [ ] Hover 状态使用 #303030

### R2: 侧边栏配色调整

**当前状态：**
- 收起状态背景使用 theme.background.deepest (#0a0a0a)

**目标状态：**
- 收起状态背景: #181818
- Hover 状态背景: #303030
- 边框: rgba(255, 255, 255, 0.05)

**验收标准：**
- [ ] HoverSidebar 收起状态使用 #181818 背景
- [ ] 菜单项 hover 时有 translateX(4px) 动画
- [ ] 图标颜色使用 rgba(255, 255, 255, 0.7)

### R3: 输入框样式调整

**当前状态：**
- 使用 rgba(255, 255, 255, 0.03) 透明背景
- 边框使用 rgba(255, 255, 255, 0.08)

**目标状态：**
- 背景使用实色 #2a2a2a
- Hover 背景: #303030
- Focus 背景: #333333
- 边框使用 rgba(255, 255, 255, 0.12)

**验收标准：**
- [ ] AgentChatPage 输入框使用实色背景
- [ ] Focus 状态有轻微上移效果 (translateY(-2px))
- [ ] 添加 boxShadow 增强层次感

### R4: 标题字体调整

**当前状态：**
- "What do you want to know today?" 使用默认字体

**目标状态：**
- 使用 Times New Roman 衬线字体
- 字号 2.2rem (桌面) / 1.5rem (移动端)
- fontWeight: 400

**验收标准：**
- [ ] 空状态标题使用 Times New Roman 字体
- [ ] 响应式字号适配

### R5: 按钮样式统一

**目标状态：**
- 所有控制按钮使用 rgba 半透明背景
- 统一使用 cubic-bezier(0.4, 0, 0.2, 1) 过渡动画
- 圆角: 12px (普通按钮) / 24px (胶囊按钮)
- 边框: 1px solid rgba(255, 255, 255, 0.08~0.12)

**验收标准：**
- [ ] "历史记录" 和 "新对话" 按钮样式一致
- [ ] Research 按钮选中时有发光效果
- [ ] Hover 状态有 transform: translateY(-1px) 效果

## Non-Requirements

- 不修改功能逻辑
- 不添加新组件
- 不改变响应式断点
- 浅色主题暂不调整

## Technical Notes

修改文件清单：
1. `frontend/src/theme/colors.ts` - 调整深色主题配色
2. `frontend/src/components/HoverSidebar.tsx` - 侧边栏样式
3. `frontend/src/pages/AgentChatPage.tsx` - 输入框和标题样式
