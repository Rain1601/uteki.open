"""新闻翻译服务 - 使用 DeepSeek/Qwen 将英文新闻翻译为中文，同时进行自动标签"""

import json
import logging
import re
from typing import Optional, Dict, Any, List
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from uteki.common.config import settings
from uteki.domains.news.models import NewsArticle
from uteki.domains.agent.llm_adapter import LLMAdapterFactory, LLMProvider, LLMConfig

logger = logging.getLogger(__name__)

# 有效的标签值
VALID_IMPORTANCE_LEVELS = {'critical', 'high', 'medium', 'low'}
VALID_IMPACT_VALUES = {'bullish', 'bearish', 'neutral'}
VALID_CONFIDENCE_LEVELS = {'high', 'medium', 'low'}

TRANSLATION_AND_LABELING_SYSTEM_PROMPT = """你是一个专业的金融新闻分析师和翻译专家。

你的任务是：
1. 将英文新闻翻译成中文
2. 分析新闻的重要性、市场影响方向和置信度

翻译要求：
- 保持原文的语气和风格
- 专业术语要准确（如：Federal Reserve 翻译为 美联储，FOMC 翻译为 联邦公开市场委员会）
- 数字、日期、人名等保持原样或按中文习惯格式化

标签说明：
- importance_level（重要性）:
  - critical: 美联储利率决议、重大政策变化、市场重大波动
  - high: 重要经济数据（就业、通胀）、央行官员讲话
  - medium: 市场评论、分析师观点、行业新闻
  - low: 日常市场更新、小型经济指标

- ai_impact（市场影响方向）:
  - bullish: 利好市场，增长信号，鸽派政策
  - bearish: 利空市场，衰退信号，鹰派政策
  - neutral: 影响不明确或混合信号

- impact_confidence（置信度）:
  - high: 新闻内容清晰，影响明确
  - medium: 有一定不确定性
  - low: 推测性内容，信号混杂

你必须以 JSON 格式返回结果，不要包含任何其他文字。"""

TRANSLATION_ONLY_SYSTEM_PROMPT = """你是一个专业的英文到中文翻译专家，专注于金融新闻和经济内容的翻译。
请保持翻译的准确性、流畅性和专业性。
翻译时需要注意：
1. 保持原文的语气和风格
2. 专业术语要准确（如：Federal Reserve 翻译为 美联储）
3. 数字、日期、人名等保持原样或按中文习惯格式化
4. 仅返回翻译结果，不要添加任何解释或说明"""


class TranslationService:
    """新闻翻译与自动标签服务"""

    def __init__(self, provider: str = "deepseek"):
        self.provider = provider.lower()
        self._llm_adapter = None

        # 根据 provider 选择默认模型
        if self.provider == "deepseek":
            self.model = "deepseek-chat"
            self.llm_provider = LLMProvider.DEEPSEEK
            self.api_key = settings.deepseek_api_key
        elif self.provider == "qwen":
            self.model = "qwen-plus"
            self.llm_provider = LLMProvider.QWEN
            self.api_key = settings.qwen_api_key
        else:
            raise ValueError(f"不支持的 provider: {provider}")

        logger.info(f"翻译服务初始化: provider={self.provider}, model={self.model}")

    def _get_llm_adapter(self):
        """获取 LLM adapter"""
        if self._llm_adapter is None:
            if not self.api_key:
                raise ValueError(f"{self.provider.upper()}_API_KEY not configured")

            config = LLMConfig(temperature=0.3, max_tokens=4096)
            self._llm_adapter = LLMAdapterFactory.create_adapter(
                provider=self.llm_provider,
                api_key=self.api_key,
                model=self.model,
                config=config,
            )
        return self._llm_adapter

    def _validate_label(self, value: Optional[str], valid_values: set) -> Optional[str]:
        """验证标签值，无效则返回 None"""
        if value is None:
            return None
        value_lower = value.lower().strip()
        if value_lower in valid_values:
            return value_lower
        logger.warning(f"无效的标签值: {value}, 有效值: {valid_values}")
        return None

    def _extract_json_from_response(self, response: str) -> Optional[Dict]:
        """从 LLM 响应中提取 JSON"""
        # 尝试直接解析
        try:
            return json.loads(response.strip())
        except json.JSONDecodeError:
            pass

        # 尝试从 markdown code block 中提取
        json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', response)
        if json_match:
            try:
                return json.loads(json_match.group(1))
            except json.JSONDecodeError:
                pass

        # 尝试找到 JSON 对象
        json_match = re.search(r'\{[\s\S]*\}', response)
        if json_match:
            try:
                return json.loads(json_match.group(0))
            except json.JSONDecodeError:
                pass

        return None

    async def translate_text(self, text: str, context: str = "news article") -> str:
        """翻译单个文本（仅翻译，无标签）"""
        if not text or not text.strip():
            return ""

        try:
            adapter = self._get_llm_adapter()

            messages = [
                {"role": "system", "content": TRANSLATION_ONLY_SYSTEM_PROMPT},
                {"role": "user", "content": f"请将以下{context}翻译为中文：\n\n{text}"},
            ]

            result = ""
            async for chunk in adapter.chat_stream(messages):
                result += chunk

            logger.info(f"翻译成功: {len(text)} -> {len(result)} 字符")
            return result.strip()

        except Exception as e:
            logger.error(f"翻译失败: {e}")
            raise

    async def translate_and_label_article(
        self, article_id: str, session: AsyncSession
    ) -> Dict[str, Any]:
        """翻译文章并生成标签（合并为一次 LLM 调用）"""
        try:
            stmt = select(NewsArticle).where(NewsArticle.id == article_id)
            result = await session.execute(stmt)
            article = result.scalar_one_or_none()

            if not article:
                raise ValueError(f"文章不存在: {article_id}")

            # 检查是否已翻译
            if article.translation_status == 'completed':
                logger.info(f"文章已翻译: {article_id}")
                return {
                    "status": "already_translated",
                    "article_id": article_id,
                }

            logger.info(f"开始翻译并标签文章: {article_id}")

            # 构建要翻译的内容
            title = article.title or ""
            keypoints = article.summary_keypoints or ""
            content = (article.content_full or "")[:5000]  # 限制长度

            # 构建 JSON 请求
            user_prompt = f"""请分析并翻译以下新闻：

标题: {title}
关键要点: {keypoints}
正文: {content}

请返回 JSON 格式（只返回 JSON，不要其他文字）：
{{
  "title_zh": "翻译后的标题",
  "keypoints_zh": "翻译后的关键要点",
  "content_zh": "翻译后的正文",
  "importance_level": "critical/high/medium/low",
  "ai_impact": "bullish/bearish/neutral",
  "impact_confidence": "high/medium/low"
}}"""

            adapter = self._get_llm_adapter()
            messages = [
                {"role": "system", "content": TRANSLATION_AND_LABELING_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ]

            response = ""
            async for chunk in adapter.chat_stream(messages):
                response += chunk

            # 解析 JSON 响应
            parsed = self._extract_json_from_response(response)
            results = {"translated": False, "labeled": False}

            if parsed:
                # 提取翻译
                if parsed.get("title_zh") and not article.title_zh:
                    article.title_zh = parsed["title_zh"]
                    results["translated"] = True

                if parsed.get("keypoints_zh") and not article.summary_keypoints_zh:
                    article.summary_keypoints_zh = parsed["keypoints_zh"]

                if parsed.get("content_zh") and not article.content_full_zh:
                    article.content_full_zh = parsed["content_zh"]

                # 提取并验证标签
                importance = self._validate_label(
                    parsed.get("importance_level"), VALID_IMPORTANCE_LEVELS
                )
                impact = self._validate_label(
                    parsed.get("ai_impact"), VALID_IMPACT_VALUES
                )
                confidence = self._validate_label(
                    parsed.get("impact_confidence"), VALID_CONFIDENCE_LEVELS
                )

                if importance:
                    article.importance_level = importance
                    results["labeled"] = True
                if impact:
                    article.ai_impact = impact
                if confidence:
                    article.impact_confidence = confidence

                logger.info(f"标签结果: importance={importance}, impact={impact}, confidence={confidence}")

            else:
                # JSON 解析失败，回退到纯翻译模式
                logger.warning(f"JSON 解析失败，回退到纯翻译模式: {article_id}")
                if title and not article.title_zh:
                    article.title_zh = await self.translate_text(title, "标题")
                    results["translated"] = True
                if keypoints and not article.summary_keypoints_zh:
                    article.summary_keypoints_zh = await self.translate_text(keypoints, "关键要点")
                if content and not article.content_full_zh:
                    article.content_full_zh = await self.translate_text(content, "正文")

            # 更新状态
            article.translation_status = 'completed'
            article.translated_at = datetime.utcnow()
            article.translation_model = f"{self.provider}:{self.model}"

            await session.commit()
            logger.info(f"文章翻译标签完成: {article_id}")

            return {
                "status": "success",
                "article_id": article_id,
                "translated": results["translated"],
                "labeled": results["labeled"],
                "importance_level": article.importance_level,
                "ai_impact": article.ai_impact,
                "impact_confidence": article.impact_confidence,
            }

        except Exception as e:
            logger.error(f"翻译标签文章失败: {article_id}, 错误: {e}")
            raise

    async def translate_article(
        self, article_id: str, session: AsyncSession
    ) -> Dict[str, Any]:
        """翻译文章（向后兼容，调用 translate_and_label_article）"""
        return await self.translate_and_label_article(article_id, session)

    async def label_article(
        self, article_id: str, session: AsyncSession
    ) -> Dict[str, Any]:
        """仅对文章生成标签（不翻译）"""
        try:
            stmt = select(NewsArticle).where(NewsArticle.id == article_id)
            result = await session.execute(stmt)
            article = result.scalar_one_or_none()

            if not article:
                raise ValueError(f"文章不存在: {article_id}")

            # 已有标签则跳过
            if article.importance_level and article.impact_confidence:
                return {
                    "status": "already_labeled",
                    "article_id": article_id,
                }

            logger.info(f"开始标签文章: {article_id}")

            # 使用中文内容（如有）或英文内容
            title = article.title_zh or article.title or ""
            content = (article.content_full_zh or article.content_full or "")[:3000]

            user_prompt = f"""请分析以下新闻的重要性和市场影响：

标题: {title}
正文: {content}

请返回 JSON 格式（只返回 JSON，不要其他文字）：
{{
  "importance_level": "critical/high/medium/low",
  "ai_impact": "bullish/bearish/neutral",
  "impact_confidence": "high/medium/low"
}}"""

            adapter = self._get_llm_adapter()
            messages = [
                {"role": "system", "content": TRANSLATION_AND_LABELING_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ]

            response = ""
            async for chunk in adapter.chat_stream(messages):
                response += chunk

            parsed = self._extract_json_from_response(response)

            if parsed:
                importance = self._validate_label(
                    parsed.get("importance_level"), VALID_IMPORTANCE_LEVELS
                )
                impact = self._validate_label(
                    parsed.get("ai_impact"), VALID_IMPACT_VALUES
                )
                confidence = self._validate_label(
                    parsed.get("impact_confidence"), VALID_CONFIDENCE_LEVELS
                )

                if importance:
                    article.importance_level = importance
                if impact:
                    article.ai_impact = impact
                if confidence:
                    article.impact_confidence = confidence

                await session.commit()

                return {
                    "status": "success",
                    "article_id": article_id,
                    "importance_level": importance,
                    "ai_impact": impact,
                    "impact_confidence": confidence,
                }
            else:
                logger.warning(f"标签 JSON 解析失败: {article_id}")
                return {
                    "status": "failed",
                    "article_id": article_id,
                    "error": "JSON parsing failed",
                }

        except Exception as e:
            logger.error(f"标签文章失败: {article_id}, 错误: {e}")
            raise

    async def translate_pending_articles(
        self, session: AsyncSession, limit: int = 10,
        source_filter: Optional[str] = None,
    ) -> Dict[str, Any]:
        """翻译并标签所有待处理的文章"""
        source = source_filter or 'cnbc_jeff_cox'
        stmt = (
            select(NewsArticle)
            .where(NewsArticle.source == source)
            .where(NewsArticle.translation_status != 'completed')
            .order_by(NewsArticle.published_at.desc())
            .limit(limit)
        )
        result = await session.execute(stmt)
        articles = result.scalars().all()

        stats = {"total": len(articles), "success": 0, "failed": 0}

        for article in articles:
            try:
                await self.translate_and_label_article(article.id, session)
                stats["success"] += 1
            except Exception as e:
                logger.error(f"翻译失败 {article.id}: {e}")
                stats["failed"] += 1

        logger.info(f"批量翻译标签完成: {stats}")
        return stats

    async def label_unlabeled_articles(
        self, session: AsyncSession, limit: int = 10
    ) -> Dict[str, Any]:
        """为已翻译但未标签的文章生成标签"""
        stmt = (
            select(NewsArticle)
            .where(NewsArticle.source == 'cnbc_jeff_cox')
            .where(NewsArticle.translation_status == 'completed')
            .where(NewsArticle.importance_level == None)
            .order_by(NewsArticle.published_at.desc())
            .limit(limit)
        )
        result = await session.execute(stmt)
        articles = result.scalars().all()

        stats = {"total": len(articles), "success": 0, "failed": 0}

        for article in articles:
            try:
                result = await self.label_article(article.id, session)
                if result.get("status") == "success":
                    stats["success"] += 1
                else:
                    stats["failed"] += 1
            except Exception as e:
                logger.error(f"标签失败 {article.id}: {e}")
                stats["failed"] += 1

        logger.info(f"批量标签完成: {stats}")
        return stats


# 全局单例
_translation_service: Optional[TranslationService] = None


def get_translation_service(provider: str = "deepseek") -> TranslationService:
    """获取翻译服务实例"""
    global _translation_service
    if _translation_service is None:
        _translation_service = TranslationService(provider=provider)
    return _translation_service
