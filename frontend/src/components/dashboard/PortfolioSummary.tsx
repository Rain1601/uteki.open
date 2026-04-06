import { Box, Typography, Paper } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTheme } from '../../theme/ThemeProvider';
import { portfolioSummary } from '../../data/mockDashboard';

export default function PortfolioSummary() {
  const { theme } = useTheme();
  const { totalValue, dailyChange, dailyChangePct, allocation } = portfolioSummary;
  const isPositive = dailyChange >= 0;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: '16px',
        border: `1px solid ${theme.border.default}`,
        bgcolor: theme.background.secondary,
      }}
    >
      <Typography sx={{ fontSize: 12, color: theme.text.muted, mb: 1, fontWeight: 500 }}>
        投资组合总值
      </Typography>
      <Typography
        sx={{
          fontSize: 28,
          fontWeight: 700,
          color: theme.text.primary,
          fontFamily: 'var(--font-ui)',
          letterSpacing: '-0.02em',
        }}
      >
        ${totalValue.toLocaleString()}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, mb: 3 }}>
        {isPositive ? (
          <TrendingUp size={14} color="#10b981" />
        ) : (
          <TrendingDown size={14} color="#ef4444" />
        )}
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 600,
            color: isPositive ? '#10b981' : '#ef4444',
          }}
        >
          {isPositive ? '+' : ''}${dailyChange.toLocaleString()} ({dailyChangePct.toFixed(2)}%)
        </Typography>
        <Typography sx={{ fontSize: 12, color: theme.text.muted, ml: 0.5 }}>今日</Typography>
      </Box>

      {/* Pie Chart */}
      <Box sx={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={allocation}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              dataKey="value"
              stroke="none"
            >
              {allocation.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: theme.background.tertiary,
                border: `1px solid ${theme.border.default}`,
                borderRadius: 8,
                fontSize: 12,
                color: theme.text.primary,
              }}
              formatter={(value: number) => [`${value}%`, '']}
            />
          </PieChart>
        </ResponsiveContainer>
      </Box>

      {/* Legend */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1 }}>
        {allocation.map((item) => (
          <Box key={item.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: item.color,
                flexShrink: 0,
              }}
            />
            <Typography sx={{ fontSize: 11, color: theme.text.muted }}>
              {item.name} {item.value}%
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
