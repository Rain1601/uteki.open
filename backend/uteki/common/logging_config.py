"""
日志配置模块 - 统一配置日志输出到控制台和文件
"""

import logging
import sys
from pathlib import Path
from logging.handlers import TimedRotatingFileHandler


def setup_logging(
    log_level: str = "INFO",
    log_dir: str = "./logs",
    log_file_prefix: str = "uteki",
    max_bytes: int = 5 * 1024 * 1024,  # 5MB per file
    backup_count: int = 30,  # Keep 30 days of logs
):
    """
    配置应用日志系统

    Args:
        log_level: 日志级别 (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_dir: 日志文件目录
        log_file_prefix: 日志文件前缀（会自动添加日期）
        max_bytes: 单个日志文件最大大小（仅用于size-based rotation）
        backup_count: 保留的历史日志文件数量（天数）
    """
    # 创建日志目录
    log_path = Path(log_dir)
    log_path.mkdir(parents=True, exist_ok=True)

    # 统一的日志格式 - 便于解析
    # 格式: 时间|级别|模块名|文件:行号|消息
    log_format = "%(asctime)s|%(levelname)-8s|%(name)s|%(filename)s:%(lineno)d|%(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"

    # 创建根日志器
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper()))

    # 清除已有的处理器
    root_logger.handlers.clear()

    # 控制台处理器 - 彩色输出
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_formatter = ColoredFormatter(log_format, date_format)
    console_handler.setFormatter(console_formatter)
    root_logger.addHandler(console_handler)

    # 文件处理器 - 按天轮转 + 大小限制
    # 日志文件名格式: uteki_2026-02-01.log
    file_handler = TimedRotatingFileHandler(
        filename=log_path / f"{log_file_prefix}.log",
        when="midnight",  # 每天午夜轮转
        interval=1,  # 每1天
        backupCount=backup_count,  # 保留30天
        encoding="utf-8",
        utc=False,  # 使用本地时间
    )
    # 设置日志文件名后缀格式
    file_handler.suffix = "%Y-%m-%d"
    file_handler.setLevel(logging.DEBUG)  # 文件记录所有级别
    file_formatter = logging.Formatter(log_format, date_format)
    file_handler.setFormatter(file_formatter)
    root_logger.addHandler(file_handler)

    # 为特定模块设置日志级别
    # SQLAlchemy 日志太多，降低级别
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.pool").setLevel(logging.WARNING)

    # HTTP 客户端日志
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)

    # 我们自己的模块保持详细日志
    logging.getLogger("uteki").setLevel(logging.DEBUG)

    # Research 模块特别详细
    logging.getLogger("uteki.domains.agent.research").setLevel(logging.DEBUG)

    logging.info(f"✅ Logging configured: level={log_level}, dir={log_path}, daily_rotation=True")


class ColoredFormatter(logging.Formatter):
    """彩色日志格式化器（仅用于控制台）"""

    # ANSI 颜色代码
    COLORS = {
        "DEBUG": "\033[36m",     # 青色
        "INFO": "\033[32m",      # 绿色
        "WARNING": "\033[33m",   # 黄色
        "ERROR": "\033[31m",     # 红色
        "CRITICAL": "\033[35m",  # 品红
    }
    RESET = "\033[0m"

    def format(self, record):
        # 添加颜色
        levelname = record.levelname
        if levelname in self.COLORS:
            record.levelname = f"{self.COLORS[levelname]}{levelname}{self.RESET}"

        # 格式化
        result = super().format(record)

        # 恢复原始 levelname（避免影响其他处理器）
        record.levelname = levelname

        return result
