import { Box, Typography, Paper } from '@mui/material';
import { BarChart3, Target, Gauge, Cpu } from 'lucide-react';
import { useTheme } from '../../theme/ThemeProvider';
import { quickStats } from '../../data/mockDashboard';

const stats = [
  {
    icon: BarChart3,
    label: '总分析次数',
    value: quickStats.totalAnalyses.toString(),
  },
  {
    icon: Target,
    label: '胜率',
    value: `${quickStats.winRate}%`,
  },
  {
    icon: Gauge,
    label: '平均置信度',
    value: quickStats.avgConviction.toFixed(2),
  },
  {
    icon: Cpu,
    label: '使用模型数',
    value: quickStats.modelsUsed.toString(),
  },
];

export default function QuickStats() {
  const { theme } = useTheme();

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 2,
      }}
    >
      {stats.map(({ icon: Icon, label, value }) => (
        <Paper
          key={label}
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: '12px',
            border: `1px solid ${theme.border.default}`,
            bgcolor: theme.background.secondary,
          }}
        >
          <Box sx={{ color: theme.brand.primary, mb: 1.5 }}>
            <Icon size={20} />
          </Box>
          <Typography
            sx={{
              fontSize: 22,
              fontWeight: 700,
              color: theme.text.primary,
              fontFamily: 'var(--font-ui)',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            {value}
          </Typography>
          <Typography sx={{ fontSize: 11, color: theme.text.muted, mt: 0.5, fontWeight: 500 }}>
            {label}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
}
