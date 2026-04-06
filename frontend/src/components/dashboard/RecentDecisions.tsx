import { Box, Typography, Paper, Chip } from '@mui/material';
import { useTheme } from '../../theme/ThemeProvider';
import { recentDecisions } from '../../data/mockDashboard';

const actionColors: Record<string, { bg: string; text: string }> = {
  BUY: { bg: '#10b98120', text: '#10b981' },
  WATCH: { bg: '#f59e0b20', text: '#f59e0b' },
  AVOID: { bg: '#ef444420', text: '#ef4444' },
};

export default function RecentDecisions() {
  const { theme, isDark } = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: '16px',
        border: `1px solid ${theme.border.default}`,
        bgcolor: theme.background.secondary,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${theme.border.divider}` }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.text.primary }}>
          近期决策
        </Typography>
      </Box>

      {/* Header row */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '90px 60px 70px 60px 90px 60px',
          gap: 1,
          px: 3,
          py: 1,
          borderBottom: `1px solid ${theme.border.divider}`,
        }}
      >
        {['日期', 'Agent', '标的', '操作', '模型', '收益'].map((h) => (
          <Typography key={h} sx={{ fontSize: 11, fontWeight: 600, color: theme.text.muted }}>
            {h}
          </Typography>
        ))}
      </Box>

      {/* Rows */}
      {recentDecisions.map((d, i) => {
        const ac = actionColors[d.action] || actionColors.WATCH;
        return (
          <Box
            key={i}
            sx={{
              display: 'grid',
              gridTemplateColumns: '90px 60px 70px 60px 90px 60px',
              gap: 1,
              px: 3,
              py: 1.25,
              alignItems: 'center',
              '&:hover': {
                bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              },
            }}
          >
            <Typography sx={{ fontSize: 12, color: theme.text.secondary }}>
              {d.date.slice(5)}
            </Typography>
            <Typography sx={{ fontSize: 12, color: theme.text.muted, textTransform: 'capitalize' }}>
              {d.agentType}
            </Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.text.primary }}>
              {d.symbol}
            </Typography>
            <Chip
              label={d.action}
              size="small"
              sx={{
                height: 20,
                fontSize: 10,
                fontWeight: 700,
                bgcolor: ac.bg,
                color: ac.text,
                '& .MuiChip-label': { px: 0.75 },
              }}
            />
            <Typography noWrap sx={{ fontSize: 11, color: theme.text.muted }}>
              {d.model}
            </Typography>
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 600,
                color: d.returnPct >= 0 ? '#10b981' : '#ef4444',
              }}
            >
              {d.returnPct >= 0 ? '+' : ''}
              {d.returnPct.toFixed(1)}%
            </Typography>
          </Box>
        );
      })}
    </Paper>
  );
}
