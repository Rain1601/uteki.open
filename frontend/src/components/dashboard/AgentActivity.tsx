import { Box, Typography, Paper, Chip } from '@mui/material';
import { LineChart, Building2, Clock, Zap } from 'lucide-react';
import { useTheme } from '../../theme/ThemeProvider';
import { agentActivity } from '../../data/mockDashboard';

function formatTime(ts: string): string {
  const d = new Date(ts);
  const now = new Date();
  const diffH = Math.floor((now.getTime() - d.getTime()) / 3600000);
  if (diffH < 1) return '刚刚';
  if (diffH < 24) return `${diffH}小时前`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}天前`;
}

function formatLatency(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function AgentActivity() {
  const { theme, isDark } = useTheme();

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
      <Typography
        sx={{
          fontSize: 14,
          fontWeight: 600,
          color: theme.text.primary,
          mb: 2,
          letterSpacing: '-0.01em',
        }}
      >
        近期 Agent 活动
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {agentActivity.map((item) => {
          const isArena = item.type === 'arena';
          const Icon = isArena ? LineChart : Building2;

          // Extract action from result
          const action = item.result.split('—')[0]?.trim() || '';
          const actionColor =
            action === 'BUY'
              ? '#10b981'
              : action === 'AVOID'
                ? '#ef4444'
                : '#f59e0b';

          return (
            <Box
              key={item.id}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.5,
                p: 1.5,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                '&:hover': {
                  bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                },
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  bgcolor: isArena
                    ? `${theme.brand.primary}15`
                    : isDark
                      ? 'rgba(16,185,129,0.12)'
                      : 'rgba(16,185,129,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  mt: 0.25,
                }}
              >
                <Icon
                  size={16}
                  color={isArena ? theme.brand.primary : '#10b981'}
                />
              </Box>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                  <Typography
                    noWrap
                    sx={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: theme.text.primary,
                      flex: 1,
                    }}
                  >
                    {item.title}
                  </Typography>
                  <Chip
                    label={action}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: 10,
                      fontWeight: 600,
                      bgcolor: `${actionColor}18`,
                      color: actionColor,
                      borderRadius: '4px',
                      '& .MuiChip-label': { px: 0.75 },
                    }}
                  />
                </Box>

                <Typography
                  noWrap
                  sx={{ fontSize: 11.5, color: theme.text.muted, mb: 0.5, lineHeight: 1.4 }}
                >
                  {item.result.split('—')[1]?.trim() || item.result}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                    <Clock size={10} color={theme.text.disabled} />
                    <Typography sx={{ fontSize: 10, color: theme.text.disabled }}>
                      {formatTime(item.timestamp)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                    <Zap size={10} color={theme.text.disabled} />
                    <Typography sx={{ fontSize: 10, color: theme.text.disabled }}>
                      {formatLatency(item.latencyMs)}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: 10, color: theme.text.disabled }}>
                    {isArena
                      ? `${item.models} models · winner: ${item.winner}`
                      : `${item.model} · ${item.gates} gates`}
                  </Typography>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}
