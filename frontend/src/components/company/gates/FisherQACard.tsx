import { useState } from 'react';
import { Box, Typography, Collapse, LinearProgress } from '@mui/material';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTheme } from '../../../theme/ThemeProvider';
import { SectionHeader, StatGrid, BulletList, AccentCard } from '../ui';
import FisherRadarChart from '../charts/FisherRadarChart';

interface Props {
  data: Record<string, any>;
}

const CONFIDENCE_COLORS: Record<string, string> = {
  high: '#6dba82',
  medium: '#c4a35a',
  low: '#c47060',
};

const VERDICT_COLORS: Record<string, string> = {
  compounder: '#6dba82',
  cyclical: '#c4a35a',
  declining: '#c47060',
  turnaround: '#7da3d4',
};

export default function FisherQACard({ data }: Props) {
  const { theme } = useTheme();
  const [expandedQ, setExpandedQ] = useState<Record<string, boolean>>({});

  const toggleQ = (id: string) => {
    setExpandedQ((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const questions = data.questions || [];
  const verdictColor = VERDICT_COLORS[data.growth_verdict] || theme.text.muted;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Top stats */}
      <StatGrid
        items={[
          { label: 'Total Score', value: `${data.total_score || 0}/150` },
          { label: 'Growth Verdict', value: data.growth_verdict?.toUpperCase() || '—', color: verdictColor },
        ]}
      />

      {/* Radar chart + Flags split */}
      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Radar chart */}
        {data.radar_data && (
          <Box sx={{ width: { xs: '100%', md: 280 }, flexShrink: 0 }}>
            <FisherRadarChart data={data.radar_data} />
          </Box>
        )}

        {/* Flags */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {data.green_flags?.length > 0 && (
            <Box>
              <SectionHeader>Green Flags</SectionHeader>
              <BulletList items={data.green_flags} variant="positive" />
            </Box>
          )}
          {data.red_flags?.length > 0 && (
            <Box>
              <SectionHeader>Red Flags</SectionHeader>
              <BulletList items={data.red_flags} variant="negative" />
            </Box>
          )}
        </Box>
      </Box>

      {/* 15 Questions Accordion */}
      <Box>
        <SectionHeader>Fisher 15 Questions</SectionHeader>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {questions.map((q: any) => {
            const isOpen = expandedQ[q.id] ?? true;
            const scoreColor = (q.score || 0) >= 7 ? '#6dba82' : (q.score || 0) >= 4 ? '#c4a35a' : '#c47060';
            const confColor = CONFIDENCE_COLORS[q.data_confidence] || theme.text.muted;

            return (
              <AccentCard key={q.id} color={scoreColor} sx={{ overflow: 'hidden', px: 0, py: 0 }}>
                <Box
                  onClick={() => toggleQ(q.id)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 1.25,
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                    '&:hover': { bgcolor: `${scoreColor}10` },
                  }}
                >
                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <Typography sx={{ fontSize: 11, fontWeight: 600, color: theme.brand.primary, minWidth: 28 }}>
                    {q.id}
                  </Typography>
                  <Typography sx={{ fontSize: 12.5, flex: 1, color: theme.text.primary, lineHeight: 1.65 }}>
                    {q.question}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                    <Box
                      sx={{
                        width: 6, height: 6, borderRadius: '50%',
                        bgcolor: confColor,
                      }}
                      title={`Data confidence: ${q.data_confidence}`}
                    />
                    <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: scoreColor, minWidth: 20, textAlign: 'right' }}>
                      {q.score}
                    </Typography>
                  </Box>
                </Box>
                <Collapse in={isOpen}>
                  <Box sx={{ px: 2, pb: 1.5, pt: 0.5 }}>
                    <Typography sx={{ fontSize: 12.5, color: theme.text.secondary, lineHeight: 1.65 }}>
                      {q.answer}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(q.score || 0) * 10}
                      sx={{
                        mt: 1,
                        height: 4,
                        borderRadius: 2,
                        bgcolor: theme.background.secondary,
                        '& .MuiLinearProgress-bar': {
                          bgcolor: scoreColor,
                          borderRadius: 2,
                        },
                      }}
                    />
                  </Box>
                </Collapse>
              </AccentCard>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
