# FOMC Calendar Spec

宏观经济日历页面规格说明

## ADDED Requirements

### Requirement: 经济日历面板

系统 SHALL 在左侧显示经济日历面板，包含月度日历视图和事件列表。

#### Scenario: 显示月度日历
- **WHEN** 用户访问 /macro/fomc-calendar 页面
- **THEN** 系统显示当前年月的日历视图，有事件的日期显示蓝色圆点

#### Scenario: 切换月份
- **WHEN** 用户点击左/右箭头按钮
- **THEN** 日历切换到上/下个月，并自动加载该月份的事件数据

#### Scenario: 点击日期定位事件
- **WHEN** 用户点击有事件的日期
- **THEN** 右侧时间线滚动到对应日期的事件组，并高亮显示

### Requirement: 事件列表显示

系统 SHALL 在日历下方显示当前月份的所有事件列表。

#### Scenario: 显示事件列表
- **WHEN** 事件数据加载完成
- **THEN** 在日历下方显示按日期排序的事件列表，每项显示日期和标题

#### Scenario: 点击事件定位
- **WHEN** 用户点击事件列表中的某个事件
- **THEN** 右侧时间线滚动到对应事件

### Requirement: 时间线面板

系统 SHALL 在右侧显示事件时间线面板，按日期分组展示事件详情。

#### Scenario: 按日期分组显示事件
- **WHEN** 事件数据加载完成
- **THEN** 右侧面板按日期分组显示事件，日期按降序排列（最新在前）

#### Scenario: 显示事件卡片
- **WHEN** 事件卡片渲染
- **THEN** 显示事件标题、类型标签（FOMC/Earnings/Economic Data）、描述和重要性标签

#### Scenario: 显示 FOMC 会议详情
- **WHEN** 事件类型为 fomc
- **THEN** 额外显示是否有新闻发布会、是否有经济预测、季度信息

#### Scenario: 显示经济数据详情
- **WHEN** 事件类型为 economic_data 且事件已过去
- **THEN** 显示实际值(actual)、预测值(forecast)、前值(previous) 数据卡片

### Requirement: 事件筛选功能

系统 SHALL 支持按类别筛选事件（全部、FOMC会议、就业数据、通胀数据、消费&GDP）。

#### Scenario: 筛选 FOMC 会议
- **WHEN** 用户选择"FOMC会议"筛选条件
- **THEN** 事件列表仅显示 event_type 为 fomc 的事件

#### Scenario: 筛选就业数据
- **WHEN** 用户选择"就业数据"筛选条件
- **THEN** 事件列表仅显示 event_type 为 employment 的事件

#### Scenario: 筛选通胀数据
- **WHEN** 用户选择"通胀数据"筛选条件
- **THEN** 事件列表仅显示 event_type 为 inflation 的事件

#### Scenario: 筛选消费和GDP数据
- **WHEN** 用户选择"消费&GDP"筛选条件
- **THEN** 事件列表显示 event_type 为 consumption 或 gdp 的事件

### Requirement: 统计信息显示

系统 SHALL 在页面头部显示事件统计信息。

#### Scenario: 显示统计卡片
- **WHEN** 统计数据加载完成
- **THEN** 显示三个统计卡片：Total Events、FOMC Meetings、Earnings Reports

### Requirement: AI 事件解读

系统 SHALL 支持对单个事件进行 AI 分析，以流式方式展示分析结果。

#### Scenario: 触发 AI 分析
- **WHEN** 用户点击事件卡片上的"AI解读"按钮
- **THEN** 系统展开分析卡片，显示加载状态，并开始流式请求

#### Scenario: 显示流式分析结果
- **WHEN** 后端返回流式分析数据
- **THEN** 分析卡片实时显示文本内容

#### Scenario: 显示分析完成结果
- **WHEN** 流式分析完成
- **THEN** 显示影响评估标签（正向/负向/无影响）和完整分析文本

#### Scenario: 处理分析超时
- **WHEN** 分析请求超过 150 秒无响应
- **THEN** 显示超时错误提示，允许用户重试

### Requirement: 主题适配

系统 SHALL 支持深色和浅色主题，所有颜色使用主题变量。

#### Scenario: 深色主题显示
- **WHEN** 系统处于深色主题
- **THEN** 页面使用深色背景、浅色文字、蓝色强调色

#### Scenario: 浅色主题显示
- **WHEN** 系统处于浅色主题
- **THEN** 页面使用浅色背景、深色文字，保持可读性和视觉一致性
