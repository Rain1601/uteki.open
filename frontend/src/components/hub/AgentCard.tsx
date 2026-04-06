import { useNavigate } from 'react-router-dom';
import { Paper, Box, Typography, Button, Chip } from '@mui/material';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../../theme/ThemeProvider';

interface AgentCardProps {
  name: string;
  subtitle: string;
  description: string;
  status: 'online' | 'busy' | 'offline';
  lastActivity: string;
  icon: LucideIcon;
  route: string;
}

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  online: { bg: '#10b98120', text: '#10b981', label: '在线' },
  busy: { bg: '#f59e0b20', text: '#f59e0b', label: '忙碌' },
  offline: { bg: '#6b728020', text: '#6b7280', label: '离线' },
};

export default function AgentCard({
  name,
  subtitle,
  description,
  status,
  lastActivity,
  icon: Icon,
  route,
}: AgentCardProps) {
  const { theme, isDark } = useTheme();
  const navigate = useNavigate();
  const s = statusColors[status];

  return (
    <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: '16px',
          border: `1px solid ${theme.border.default}`,
          bgcolor: theme.background.secondary,
          cursor: 'pointer',
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
          '&:hover': {
            boxShadow: isDark
              ? '0 8px 32px rgba(0,0,0,0.3)'
              : '0 8px 32px rgba(0,0,0,0.08)',
            borderColor: theme.brand.primary + '60',
          },
        }}
        onClick={() => navigate(route)}
      >
        {/* Top: Icon + Name */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${theme.brand.primary}20, ${theme.brand.accent}20)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.brand.primary,
              flexShrink: 0,
            }}
          >
            <Icon size={22} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: 15,
                fontWeight: 600,
                color: theme.text.primary,
                lineHeight: 1.3,
              }}
            >
              {name}
            </Typography>
            <Typography sx={{ fontSize: 12, color: theme.text.muted }}>
              {subtitle}
            </Typography>
          </Box>
        </Box>

        {/* Description + Status */}
        <Typography
          sx={{
            fontSize: 13,
            color: theme.text.secondary,
            lineHeight: 1.6,
            mb: 2,
            minHeight: 42,
          }}
        >
          {description}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={s.label}
              size="small"
              sx={{
                height: 22,
                fontSize: 11,
                fontWeight: 600,
                bgcolor: s.bg,
                color: s.text,
                '& .MuiChip-label': { px: 1 },
              }}
            />
            <Typography sx={{ fontSize: 11, color: theme.text.muted }}>
              {lastActivity}
            </Typography>
          </Box>
          <Button
            size="small"
            endIcon={<ArrowRight size={14} />}
            sx={{
              fontSize: 12,
              fontWeight: 600,
              color: theme.brand.primary,
              textTransform: 'none',
              minWidth: 0,
              px: 1,
              '&:hover': { bgcolor: theme.brand.primary + '10' },
            }}
          >
            Launch
          </Button>
        </Box>
      </Paper>
    </motion.div>
  );
}
