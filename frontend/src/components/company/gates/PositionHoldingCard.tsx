import { Box, Typography } from '@mui/material';
import { useTheme } from '../../../theme/ThemeProvider';
import { SectionHeader, StatGrid, BulletList, AccentCard } from '../ui';
import PhilosophyScoresBar from '../charts/PhilosophyScoresBar';

interface Props {
  data: Record<string, any>;
}

// Muted action colors
const ACTION_COLORS: Record<string, string> = {
  BUY: '#6dba82',
  WATCH: '#c4a35a',
  AVOID: '#c47060',
};

// Muted philosopher colors
const PHILOSOPHER_COLORS: Record<string, string> = {
  Buffett: '#6dba82',
  Fisher: '#7da3d4',
  Munger: '#c4a35a',
};

export default function PositionHoldingCard({ data }: Props) {
  const { theme } = useTheme();
  const actionColor = ACTION_COLORS[data.action] || theme.text.muted;

  const statItems = [
    { label: 'Action', value: data.action || '—', color: actionColor },
    { label: 'Conviction', value: `${Math.round((data.conviction || 0) * 100)}%` },
    ...(data.position_size_pct > 0
      ? [{ label: 'Position', value: `${data.position_size_pct}%`, color: actionColor }]
      : []),
    { label: 'Horizon', value: data.hold_horizon || '—' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <StatGrid items={statItems} />

      {data.position_reasoning && (
        <Typography sx={{ fontSize: 12.5, color: theme.text.secondary, lineHeight: 1.65 }}>
          {data.position_reasoning}
        </Typography>
      )}

      {data.philosophy_scores && (
        <Box sx={{ maxWidth: 380 }}>
          <PhilosophyScoresBar scores={data.philosophy_scores} />
        </Box>
      )}

      {/* Philosopher comments */}
      {[
        { name: 'Buffett', comment: data.buffett_comment, color: PHILOSOPHER_COLORS.Buffett },
        { name: 'Fisher', comment: data.fisher_comment, color: PHILOSOPHER_COLORS.Fisher },
        { name: 'Munger', comment: data.munger_comment, color: PHILOSOPHER_COLORS.Munger },
      ].filter((p) => p.comment).length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {[
            { name: 'Buffett', comment: data.buffett_comment, color: PHILOSOPHER_COLORS.Buffett },
            { name: 'Fisher', comment: data.fisher_comment, color: PHILOSOPHER_COLORS.Fisher },
            { name: 'Munger', comment: data.munger_comment, color: PHILOSOPHER_COLORS.Munger },
          ]
            .filter((p) => p.comment)
            .map((p) => (
              <AccentCard key={p.name} color={p.color}>
                <Box sx={{ display: 'flex', gap: 1.25 }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: `${p.color}bb`, minWidth: 46 }}>
                    {p.name}
                  </Typography>
                  <Typography sx={{ fontSize: 12.5, color: theme.text.secondary, fontStyle: 'italic', lineHeight: 1.6 }}>
                    "{p.comment}"
                  </Typography>
                </Box>
              </AccentCard>
            ))}
        </Box>
      )}

      {data.sell_triggers?.length > 0 && (
        <Box>
          <SectionHeader>Sell Triggers</SectionHeader>
          <BulletList items={data.sell_triggers} variant="negative" />
        </Box>
      )}

      {data.add_triggers?.length > 0 && (
        <Box>
          <SectionHeader>Add Position Triggers</SectionHeader>
          <BulletList items={data.add_triggers} variant="positive" />
        </Box>
      )}

      {data.one_sentence && (
        <Box sx={{ p: 1.5, bgcolor: `${actionColor}08`, borderRadius: 1, border: `1px solid ${actionColor}12` }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: theme.text.secondary, textAlign: 'center' }}>
            {data.one_sentence}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
