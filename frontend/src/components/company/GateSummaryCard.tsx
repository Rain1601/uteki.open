import { Box, Typography } from '@mui/material';
import { ChevronRight } from 'lucide-react';
import { StatusBadge } from './ui';
import type { GateResult } from '../../api/company';

interface Props {
  gateNum: number;
  result: GateResult;
  theme: any;
  onClick?: () => void;
}

// ── Metric chip ──
function MetricChip({ label, value, theme }: { label: string; value: string | number; theme: any }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Typography sx={{ fontSize: 11, color: theme.text.disabled, whiteSpace: 'nowrap' }}>{label}</Typography>
      <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.text.secondary, whiteSpace: 'nowrap' }}>
        {value}
      </Typography>
    </Box>
  );
}

// ── Divider ──
function VDivider({ theme }: { theme: any }) {
  return <Box sx={{ width: 1, height: 14, bgcolor: theme.border.subtle, mx: 0.5 }} />;
}

// ── Badge variant mapping ──
type BadgeVariant = 'quality' | 'action' | 'width' | 'assessment' | 'risk' | 'score';

const GATE_BADGE_VARIANT: Record<string, BadgeVariant> = {
  quality: 'quality',
  score: 'score',
  width: 'width',
  resilience: 'score',
  assessment: 'assessment',
  action: 'action',
};

// ── Extract summary + metrics per gate type ──
function extractGateInfo(gateNum: number, result: GateResult) {
  const p = result.parsed || {};
  const raw = result.raw || '';
  const fallbackSummary = p.summary || raw.slice(0, 100).replace(/\n/g, ' ') + (raw.length > 100 ? '…' : '');

  switch (gateNum) {
    case 1: {
      const quality = p.business_quality || '';
      const sustainability = p.sustainability_score;
      return {
        badge: { type: 'quality' as const, value: quality },
        metrics: [
          sustainability != null && { label: '持续性', value: `${sustainability}/10` },
          p.is_good_business != null && { label: '好生意', value: p.is_good_business ? 'Yes' : 'No' },
        ].filter(Boolean),
        summary: fallbackSummary,
      };
    }
    case 2: {
      const total = p.total_score;
      const verdict = p.growth_verdict || '';
      return {
        badge: { type: 'score' as const, value: total != null ? `${total}/150` : verdict },
        metrics: [
          total != null && { label: '得分', value: `${total}/150` },
          verdict && { label: '成长判定', value: verdict },
        ].filter(Boolean),
        summary: fallbackSummary,
      };
    }
    case 3: {
      const width = p.moat_width || '';
      const trend = p.moat_trend || '';
      const durability = p.moat_durability_years;
      const trendIcon = trend === 'strengthening' ? ' ↑' : trend === 'eroding' ? ' ↓' : ' →';
      return {
        badge: { type: 'width' as const, value: width },
        metrics: [
          trend && { label: '趋势', value: trend + trendIcon },
          durability != null && { label: '耐久', value: `${durability}yr` },
        ].filter(Boolean),
        summary: fallbackSummary,
      };
    }
    case 4: {
      const mgmtScore = p.management_score;
      const integrity = p.integrity_score;
      const succession = p.succession_risk || '';
      return {
        badge: { type: 'score' as const, value: mgmtScore != null ? `${mgmtScore}/10` : '—' },
        metrics: [
          integrity != null && { label: '诚信', value: `${integrity}/10` },
          succession && { label: '继任风险', value: succession },
        ].filter(Boolean),
        summary: fallbackSummary,
      };
    }
    case 5: {
      const resilience = p.resilience_score;
      const flags = Array.isArray(p.red_flags) ? p.red_flags.filter((f: any) => f.triggered).length : 0;
      return {
        badge: { type: 'resilience' as const, value: resilience != null ? `${resilience}/10` : '—' },
        metrics: [
          resilience != null && { label: '韧性', value: `${resilience}/10` },
          { label: '红旗', value: `${flags}项` },
        ].filter(Boolean),
        summary: fallbackSummary,
      };
    }
    case 6: {
      const assessment = p.price_assessment || '';
      const margin = p.safety_margin || '';
      const confidence = p.buy_confidence;
      return {
        badge: { type: 'assessment' as const, value: assessment },
        metrics: [
          margin && { label: '安全边际', value: margin },
          confidence != null && { label: '买入信心', value: `${confidence}/10` },
        ].filter(Boolean),
        summary: fallbackSummary,
      };
    }
    case 7: {
      const action = p.action || '';
      const conviction = p.conviction;
      const quality = p.quality_verdict || '';
      const oneSentence = p.one_sentence || fallbackSummary;
      return {
        badge: { type: 'action' as const, value: action },
        metrics: [
          conviction != null && { label: '信念', value: `${(conviction * 100).toFixed(0)}%` },
          quality && { label: '品质', value: quality },
        ].filter(Boolean),
        summary: oneSentence,
      };
    }
    default:
      return { badge: null, metrics: [], summary: fallbackSummary };
  }
}

export default function GateSummaryCard({ gateNum, result, theme, onClick }: Props) {
  const info = extractGateInfo(gateNum, result);
  const hasBadgeOrMetrics = (info.badge && info.badge.value) || info.metrics.length > 0;

  return (
    <Box
      onClick={onClick}
      sx={{
        ml: '36px',
        mt: 0.25,
        mb: 0.25,
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        py: 0.5,
        px: 1.25,
        borderRadius: '5px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background 0.15s ease',
        animation: 'tl-card-in 0.3s ease-out',
        '&:hover': onClick ? {
          bgcolor: theme.background.secondary,
        } : {},
      }}
    >
      {/* Badge + metrics cluster */}
      {hasBadgeOrMetrics && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
          {info.badge && info.badge.value && (
            <StatusBadge
              variant={GATE_BADGE_VARIANT[info.badge.type] || 'score'}
              value={String(info.badge.value)}
            />
          )}
          {info.metrics.map((m: any, i: number) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              {i > 0 || info.badge?.value ? <VDivider theme={theme} /> : null}
              <MetricChip label={m.label} value={m.value} theme={theme} />
            </Box>
          ))}
        </Box>
      )}

      {/* Summary */}
      {info.summary && (
        <Typography
          sx={{
            fontSize: 12,
            color: theme.text.disabled,
            lineHeight: 1.4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
            minWidth: 0,
          }}
        >
          {info.summary}
        </Typography>
      )}

      {/* Chevron */}
      {onClick && (
        <Box sx={{ color: theme.text.disabled, display: 'flex', flexShrink: 0, ml: 0.25 }}>
          <ChevronRight size={14} />
        </Box>
      )}
    </Box>
  );
}
