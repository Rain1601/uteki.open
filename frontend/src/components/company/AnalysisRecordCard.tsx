import { Box, Typography, IconButton } from '@mui/material';
import { X, Loader2 } from 'lucide-react';
import { useTheme } from '../../theme/ThemeProvider';
import type { CompanyAnalysisSummary } from '../../api/company';
import type { GateStatus } from './GateProgressTracker';

const ACTION_COLORS: Record<string, string> = {
  BUY: '#22c55e',
  WATCH: '#f59e0b',
  AVOID: '#ef4444',
};

const QUALITY_LABELS: Record<string, string> = {
  EXCELLENT: 'EX',
  GOOD: 'GD',
  MEDIOCRE: 'MD',
  POOR: 'PR',
};

interface RunningInfo {
  symbol: string;
  provider: string;
  currentGate: number | null;
  gateStatuses: Record<number, GateStatus>;
}

interface Props {
  record?: CompanyAnalysisSummary;
  running?: RunningInfo;
  selected?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
}

export default function AnalysisRecordCard({ record, running, selected, onClick, onDelete }: Props) {
  const { theme } = useTheme();
  const isRunning = !!running;

  const symbol = record?.symbol || running?.symbol || '';
  const provider = record?.provider || running?.provider || '';
  const actionColor = record ? (ACTION_COLORS[record.verdict_action] || theme.text.muted) : theme.brand.primary;

  const completedGates = running
    ? Object.values(running.gateStatuses).filter((s) => s === 'complete' || s === 'error' || s === 'timeout').length
    : 0;

  const formatTime = (ms: number) => {
    const s = Math.round(ms / 1000);
    return s >= 60 ? `${Math.floor(s / 60)}m${s % 60}s` : `${s}s`;
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        height: 36,
        px: 2,
        cursor: 'pointer',
        transition: 'background-color 0.1s',
        bgcolor: selected ? `${theme.brand.primary}12` : 'transparent',
        '&:hover': {
          bgcolor: selected ? `${theme.brand.primary}18` : theme.background.hover || `${theme.text.primary}08`,
          '& .record-delete': { opacity: 1 },
        },
      }}
    >
      {/* Selected indicator dot */}
      <Box sx={{
        width: 4,
        height: 4,
        borderRadius: '50%',
        bgcolor: selected ? theme.brand.primary : 'transparent',
        mr: 1.5,
        flexShrink: 0,
      }} />

      {/* Symbol */}
      <Typography sx={{
        fontSize: 13,
        fontWeight: 600,
        color: selected ? theme.brand.primary : theme.text.primary,
        width: 56,
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}>
        {symbol}
      </Typography>

      {/* Provider chip */}
      <Typography sx={{
        fontSize: 10,
        color: theme.text.disabled,
        bgcolor: `${theme.text.primary}08`,
        px: 0.75,
        py: 0.15,
        borderRadius: 0.5,
        width: 60,
        textAlign: 'center',
        flexShrink: 0,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {provider}
      </Typography>

      {/* Status area */}
      <Box sx={{ ml: 2, display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
        {isRunning ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Loader2 size={11} color={theme.brand.primary} style={{ animation: 'spin 1s linear infinite' }} />
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: theme.brand.primary }}>
              Gate {running.currentGate || completedGates + 1}/7
            </Typography>
          </Box>
        ) : record ? (
          record.status === 'running' ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Loader2 size={11} color={theme.brand.primary} style={{ animation: 'spin 1s linear infinite' }} />
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: theme.brand.primary }}>分析中</Typography>
            </Box>
          ) : (
            <>
              {/* Verdict pill */}
              <Box sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.4,
                px: 0.8,
                py: 0.1,
                borderRadius: '4px',
                bgcolor: `${actionColor}18`,
                border: `1px solid ${actionColor}30`,
              }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: actionColor, lineHeight: 1.5 }}>
                  {record.verdict_action}
                </Typography>
                {record.verdict_quality && (
                  <Typography sx={{ fontSize: 9, color: actionColor, opacity: 0.6, lineHeight: 1 }}>
                    {QUALITY_LABELS[record.verdict_quality] || ''}
                  </Typography>
                )}
              </Box>
            </>
          )
        ) : null}
      </Box>

      {/* Right side: time + date */}
      {record && record.status !== 'running' && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, ml: 1 }}>
          <Typography sx={{ fontSize: 10, color: theme.text.disabled, fontVariantNumeric: 'tabular-nums' }}>
            {formatTime(record.total_latency_ms)}
          </Typography>
          <Typography sx={{ fontSize: 10, color: theme.text.disabled, fontVariantNumeric: 'tabular-nums' }}>
            {formatDate(record.created_at)}
          </Typography>
        </Box>
      )}

      {/* Delete */}
      {record && onDelete && (
        <IconButton
          className="record-delete"
          size="small"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          sx={{
            opacity: 0,
            p: 0.3,
            ml: 0.5,
            color: theme.text.disabled,
            transition: 'opacity 0.1s, color 0.1s',
            '&:hover': { color: theme.status.error || '#ef4444' },
          }}
        >
          <X size={11} />
        </IconButton>
      )}
    </Box>
  );
}
