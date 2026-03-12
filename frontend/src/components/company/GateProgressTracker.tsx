import { Box, Typography } from '@mui/material';
import { Check, Loader2, AlertCircle, Clock } from 'lucide-react';
import { useTheme } from '../../theme/ThemeProvider';
import { GATE_NAMES, TOTAL_GATES } from '../../api/company';

export type GateStatus = 'pending' | 'running' | 'complete' | 'error' | 'timeout';

interface Props {
  gateStatuses: Record<number, GateStatus>;
  currentGate: number | null;
}

const progressKeyframes = `
@keyframes gpt-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.gpt-spin { animation: gpt-spin 1s linear infinite; }
@keyframes gpt-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
@keyframes gpt-glow {
  0%, 100% { box-shadow: 0 0 4px rgba(100,149,237,0.3); }
  50% { box-shadow: 0 0 12px rgba(100,149,237,0.6); }
}
`;

export default function GateProgressTracker({ gateStatuses }: Props) {
  const { theme } = useTheme();

  const getColor = (status: GateStatus) => {
    switch (status) {
      case 'complete': return theme.status.success;
      case 'running': return theme.brand.primary;
      case 'error': return theme.status.error;
      case 'timeout': return theme.status.warning;
      default: return theme.text.disabled;
    }
  };

  const getIcon = (status: GateStatus) => {
    switch (status) {
      case 'complete': return <Check size={12} />;
      case 'running': return <Loader2 size={12} className="gpt-spin" />;
      case 'error': return <AlertCircle size={12} />;
      case 'timeout': return <Clock size={12} />;
      default: return null;
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0, width: '100%' }}>
      <style>{progressKeyframes}</style>
      {Array.from({ length: TOTAL_GATES }, (_, i) => {
        const gate = i + 1;
        const status = gateStatuses[gate] || 'pending';
        const color = getColor(status);
        const isLast = gate === TOTAL_GATES;

        return (
          <Box key={gate} sx={{ display: 'flex', alignItems: 'center', flex: isLast ? 0 : 1 }}>
            {/* Gate circle */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.3,
                minWidth: 48,
              }}
            >
              <Box
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  border: `1.5px solid ${color}`,
                  bgcolor: status === 'complete' ? color : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: status === 'complete' ? '#fff' : color,
                  transition: 'all 0.3s ease',
                  ...(status === 'running' && {
                    animation: 'gpt-glow 1.5s ease-in-out infinite',
                  }),
                }}
              >
                {getIcon(status) || (
                  <Typography sx={{ fontSize: 10, fontWeight: 700 }}>{gate}</Typography>
                )}
              </Box>
              <Typography
                sx={{
                  fontSize: 9,
                  color: status === 'pending' ? theme.text.disabled : color,
                  fontWeight: status === 'running' ? 600 : 400,
                  textAlign: 'center',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                }}
              >
                {GATE_NAMES[gate]}
              </Typography>
            </Box>

            {/* Connector line */}
            {!isLast && (
              <Box
                sx={{
                  flex: 1,
                  height: 1.5,
                  bgcolor: (gateStatuses[gate + 1] && gateStatuses[gate + 1] !== 'pending')
                    ? theme.status.success
                    : status === 'complete' ? theme.status.success : theme.border.subtle,
                  transition: 'background-color 0.3s ease',
                  mx: 0.3,
                  mt: -1.5,
                }}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
}
