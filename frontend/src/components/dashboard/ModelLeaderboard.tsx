import { Box, Typography, Paper } from '@mui/material';
import { Trophy } from 'lucide-react';
import { useTheme } from '../../theme/ThemeProvider';
import { modelLeaderboard } from '../../data/mockDashboard';

export default function ModelLeaderboard() {
  const { theme, isDark } = useTheme();

  const sorted = [...modelLeaderboard].sort((a, b) => b.winRate - a.winRate);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: '12px',
        border: `1px solid ${theme.border.default}`,
        bgcolor: theme.background.secondary,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Trophy size={16} color={theme.brand.primary} />
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: 600,
            color: theme.text.primary,
            letterSpacing: '-0.01em',
          }}
        >
          模型排行榜
        </Typography>
      </Box>

      {/* Header */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '30px 1fr 55px 55px 50px 55px',
          gap: 1,
          px: 1,
          pb: 1,
          borderBottom: `1px solid ${theme.border.default}`,
          mb: 0.5,
        }}
      >
        {['#', '模型', '胜率', 'Arena', '公司', '延迟'].map((h) => (
          <Typography
            key={h}
            sx={{
              fontSize: 10,
              fontWeight: 600,
              color: theme.text.disabled,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              textAlign: h === '#' || h === '模型' ? 'left' : 'right',
            }}
          >
            {h}
          </Typography>
        ))}
      </Box>

      {/* Rows */}
      {sorted.map((m, idx) => {
        const isFirst = idx === 0;
        return (
          <Box
            key={m.model}
            sx={{
              display: 'grid',
              gridTemplateColumns: '30px 1fr 55px 55px 50px 55px',
              gap: 1,
              px: 1,
              py: 1,
              borderRadius: '6px',
              bgcolor: isFirst
                ? isDark
                  ? `${theme.brand.primary}10`
                  : `${theme.brand.primary}08`
                : 'transparent',
              transition: 'background-color 0.15s ease',
              '&:hover': {
                bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              },
            }}
          >
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: isFirst ? 700 : 500,
                color: isFirst ? theme.brand.primary : theme.text.muted,
              }}
            >
              {idx + 1}
            </Typography>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                noWrap
                sx={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: theme.text.primary,
                  fontFamily: "'SF Mono', Monaco, monospace",
                  lineHeight: 1.3,
                }}
              >
                {m.model}
              </Typography>
              <Typography
                noWrap
                sx={{ fontSize: 10, color: theme.text.disabled, lineHeight: 1.3 }}
              >
                {m.provider}
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'right' }}>
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: m.winRate >= 50 ? '#10b981' : theme.text.secondary,
                }}
              >
                {m.winRate}%
              </Typography>
              <Box
                sx={{
                  mt: 0.3,
                  height: 3,
                  borderRadius: 2,
                  bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    width: `${m.winRate}%`,
                    height: '100%',
                    borderRadius: 2,
                    bgcolor:
                      m.winRate >= 50
                        ? '#10b981'
                        : m.winRate >= 30
                          ? '#f59e0b'
                          : '#ef4444',
                  }}
                />
              </Box>
            </Box>

            <Typography
              sx={{
                fontSize: 12,
                color: theme.text.secondary,
                textAlign: 'right',
              }}
            >
              {m.arenaWins}/{m.arenaRuns}
            </Typography>

            <Typography
              sx={{
                fontSize: 12,
                color: theme.text.secondary,
                textAlign: 'right',
              }}
            >
              {m.companyRuns}
            </Typography>

            <Typography
              sx={{
                fontSize: 11,
                color: theme.text.muted,
                textAlign: 'right',
                fontFamily: "'SF Mono', Monaco, monospace",
              }}
            >
              {(m.avgLatencyMs / 1000).toFixed(1)}s
            </Typography>
          </Box>
        );
      })}
    </Paper>
  );
}
