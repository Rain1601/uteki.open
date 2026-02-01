# 日志文件说明

## 日志位置

所有应用日志都保存在此目录下：

- `uteki_dev.log` - 当前日志文件（包含所有 DEBUG 及以上级别日志）
- `uteki_dev.log.2026-02-01` - 按日期归档的历史日志（每天午夜自动轮转）
- `uteki_dev.log.2026-01-31` - 前一天的日志
- 等等...

**日志保留策略**：
- ✅ 按天轮转（每天午夜自动创建新文件）
- ✅ 保留最近 30 天的日志
- ✅ 单个文件最大 5MB（超过后会额外分割）
- ✅ 日志文件不会提交到 Git（已在 .gitignore 配置）

## 日志格式

统一的日志格式（便于解析）：

```
时间|级别|模块名|文件:行号|消息
```

**示例**：
```
2026-02-01 10:43:19|INFO    |__main__|main_dev.py:104|✅ All domain routers registered
2026-02-01 10:43:20|DEBUG   |uteki.domains.agent.research.web_scraper|web_scraper.py:109|🔍 Scraping URL: https://example.com
2026-02-01 10:43:21|WARNING |uteki.domains.agent.research.web_scraper|web_scraper.py:164|⏱️ Timeout (10s) fetching https://slow-site.com
2026-02-01 10:43:22|ERROR   |uteki.domains.agent.service|service.py:85|❌ LLM API error: Connection timeout
```

**解析脚本示例**：
```python
import re

log_pattern = r'^(?P<time>[\d\s:-]+)\|(?P<level>\w+)\s*\|(?P<module>[\w.]+)\|(?P<location>[\w.:]+)\|(?P<message>.+)$'

with open('logs/uteki_dev.log') as f:
    for line in f:
        match = re.match(log_pattern, line)
        if match:
            print(f"Time: {match.group('time')}, Level: {match.group('level')}, Message: {match.group('message')}")
```

## 日志级别

日志按照以下级别记录（从低到高）：

- **DEBUG** - 调试信息（仅输出到文件）
  - 详细的请求/响应数据
  - 函数调用跟踪
  - Web scraping 详细过程

- **INFO** - 一般信息（控制台 + 文件）
  - 应用启动/关闭
  - API 请求成功
  - 模块初始化

- **WARNING** - 警告信息
  - HTTP 错误（非 200）
  - 网页抓取失败
  - 资源不可用

- **ERROR** - 错误信息
  - 异常堆栈
  - API 调用失败
  - 数据库错误

- **CRITICAL** - 严重错误
  - 系统崩溃级别问题

## 查看日志

### 实时监控日志

```bash
cd /Users/rain/PycharmProjects/uteki.open/backend

# 实时查看所有日志
tail -f logs/uteki_dev.log

# 只查看错误和警告（推荐）
tail -f logs/uteki_dev.log | grep -E "ERROR|WARNING|❌|⚠️"

# 只查看 Research 相关日志
tail -f logs/uteki_dev.log | grep -i "research\|scrape\|search"

# 彩色高亮显示（需要安装 ccze）
tail -f logs/uteki_dev.log | ccze -A
```

### 搜索特定内容

```bash
# 搜索当前日志文件
grep -i "scrape" logs/uteki_dev.log

# 搜索所有日志文件（包括历史）
grep -i "scrape" logs/uteki_dev.log*

# 搜索特定 URL 的日志
grep "example.com" logs/uteki_dev.log*

# 搜索所有错误
grep "|ERROR" logs/uteki_dev.log*

# 查看最近50条错误
grep "|ERROR" logs/uteki_dev.log* | tail -50

# 统计错误数量
grep "|ERROR" logs/uteki_dev.log* | wc -l
```

### 按时间/日期查看

```bash
# 查看今天的日志（当前文件）
tail -100 logs/uteki_dev.log

# 查看昨天的日志
cat logs/uteki_dev.log.$(date -v-1d +%Y-%m-%d)

# 查看特定日期的日志
cat logs/uteki_dev.log.2026-02-01

# 查看特定时间段（例如10:30-10:40）
grep "10:3[0-9]" logs/uteki_dev.log

# 查看最近3天的所有错误
find logs -name "uteki_dev.log*" -mtime -3 -exec grep "|ERROR" {} \;
```

## Deep Research 问题排查

当 Research 模式出现 "Failed to scrape any content" 错误时，检查日志：

```bash
# 查看完整的 research 执行过程
grep "research\|scrape\|search" logs/uteki_dev.log | tail -100

# 查看具体哪些 URL 失败了
grep "Failed to scrape\|❌" logs/uteki_dev.log | tail -50

# 查看 HTTP 错误
grep "HTTP.*for http" logs/uteki_dev.log | tail -20
```

### 常见失败原因

日志中会显示详细的失败原因：

1. **Timeout** - `⏱️ Timeout (10s) fetching` → 网站响应太慢
2. **HTTP Error** - `⚠️ HTTP 403/429/503` → 反爬虫限制
3. **No Content** - `Failed to extract meaningful content` → 内容提取失败（少于50字符）
4. **Network Error** - `HTTP error fetching` → 网络连接问题

## 日志配置

日志配置位于：`uteki/common/logging_config.py`

可调整的参数：

- `log_level` - 日志级别（DEBUG/INFO/WARNING/ERROR）
- `log_dir` - 日志目录路径
- `max_bytes` - 单个日志文件最大大小（默认 10MB）
- `backup_count` - 保留的历史文件数量（默认 5 个）

## 日志轮转策略

### 按天轮转（主要机制）

每天午夜（00:00）自动创建新的日志文件：

```
uteki_dev.log              <- 当前日志（今天）
uteki_dev.log.2026-02-01   <- 2026年2月1日的日志
uteki_dev.log.2026-01-31   <- 2026年1月31日的日志
uteki_dev.log.2026-01-30   <- 2026年1月30日的日志
...
uteki_dev.log.2026-01-02   <- 30天前的日志（之后自动删除）
```

### 大小限制（辅助机制）

- 单个日志文件最大 5MB
- 如果一天内日志超过 5MB，会继续写入同一文件
- 不会因为大小而分割成多个文件（保持日期完整性）

### 自动清理

- 自动保留最近 30 天的日志
- 30 天前的日志会被自动删除
- 无需手动清理

## 手动清理日志

虽然日志会自动清理（保留30天），但如果需要手动清理：

```bash
# 查看日志文件占用空间
du -sh logs/
ls -lh logs/

# 删除所有历史日志（保留当前）
rm logs/uteki_dev.log.20*

# 删除7天前的日志
find logs -name "uteki_dev.log.20*" -mtime +7 -delete

# 压缩并归档历史日志
tar -czf logs-archive-$(date +%Y%m%d).tar.gz logs/*.log.20* && rm logs/*.log.20*

# 完全清空日志目录（谨慎！）
rm -f logs/uteki_dev.log*
```

## 日志分析脚本

### 统计每天的错误数量

```bash
#!/bin/bash
echo "Date | ERROR | WARNING"
for log in logs/uteki_dev.log*; do
    date=$(basename $log | grep -o '[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}' || echo "today")
    errors=$(grep -c "|ERROR" $log 2>/dev/null || echo 0)
    warnings=$(grep -c "|WARNING" $log 2>/dev/null || echo 0)
    echo "$date | $errors | $warnings"
done
```

### 提取所有 Research 失败的 URL

```bash
#!/bin/bash
grep "Failed to scrape\|❌.*http" logs/uteki_dev.log* | \
    grep -oE 'https?://[^ ]+' | \
    sort | uniq -c | sort -rn
```

### 分析最常见的错误类型

```bash
#!/bin/bash
grep "|ERROR" logs/uteki_dev.log* | \
    sed 's/.*|ERROR.*|//' | \
    cut -d: -f1 | \
    sort | uniq -c | sort -rn | head -10
```
