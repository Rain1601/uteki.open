import { Box } from '@mui/material';

interface Props {
  theme: any;
}

const skeletonKeyframes = `
@keyframes tl-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
`;

function ShimmerLine({ width, theme, delay = 0 }: { width: string; theme: any; delay?: number }) {
  return (
    <Box
      sx={{
        height: 14,
        width,
        borderRadius: 1.5,
        background: `linear-gradient(90deg, ${theme.background.tertiary} 0%, ${theme.background.tertiary} 40%, rgba(255,255,255,0.18) 50%, ${theme.background.tertiary} 60%, ${theme.background.tertiary} 100%)`,
        backgroundSize: '300% 100%',
        animation: `tl-shimmer 1.8s ease-in-out ${delay}s infinite`,
      }}
    />
  );
}

export default function GateSkeletonCard({ theme }: Props) {
  return (
    <Box
      sx={{
        ml: '32px',
        pl: 2,
        mt: 0.5,
        mb: 1,
        animation: 'tl-card-in 0.3s ease-out',
      }}
    >
      <style>{skeletonKeyframes}</style>
      <Box
        sx={{
          p: 1.5,
          bgcolor: theme.background.secondary,
          borderRadius: 2,
          border: `1px solid ${theme.border.subtle}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        <ShimmerLine width="70%" theme={theme} delay={0} />
        <ShimmerLine width="90%" theme={theme} delay={0.2} />
        <ShimmerLine width="50%" theme={theme} delay={0.4} />
      </Box>
    </Box>
  );
}
