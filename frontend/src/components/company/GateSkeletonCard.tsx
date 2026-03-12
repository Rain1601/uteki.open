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

function ShimmerLine({ width, theme }: { width: string; theme: any }) {
  return (
    <Box
      sx={{
        height: 12,
        width,
        borderRadius: 1,
        background: `linear-gradient(90deg, ${theme.background.tertiary} 25%, ${theme.border.subtle} 50%, ${theme.background.tertiary} 75%)`,
        backgroundSize: '200% 100%',
        animation: 'tl-shimmer 1.5s ease-in-out infinite',
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
        <ShimmerLine width="70%" theme={theme} />
        <ShimmerLine width="90%" theme={theme} />
        <ShimmerLine width="50%" theme={theme} />
      </Box>
    </Box>
  );
}
