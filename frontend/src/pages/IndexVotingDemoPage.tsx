import { useState, useCallback, useRef } from 'react';
import { Box, Typography, Button, Container, Chip } from '@mui/material';
import { Play, Square, RotateCcw, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import VotingVisualization from '@/components/index/VotingVisualization';
import type { VoteData } from '@/components/index/VotingVisualization';

// ─── Mock Data ───────────────────────────────────────────────────

const MODELS = [
  'claude-sonnet-4-20250514',
  'deepseek-chat',
  'gpt-4.1',
  'gemini-2.5-flash',
  'qwen-plus',
  'grok-3-mini',
  'claude-haiku',
];

const REASONINGS = [
  'Strong conviction aligned with macro signals and risk parameters.',
  'Allocation weights are reasonable but entry timing seems premature.',
  'Disagree on sector rotation thesis — momentum indicators suggest otherwise.',
  'Partially aligned — correct direction but position sizing too aggressive.',
  'The macro overlay supports this view, though the model underweights tail risk.',
  'Good use of relative value signals, but correlation assumptions are fragile.',
  'Sound reasoning on rates exposure, though FX hedging is insufficient.',
  'Conviction score is well-calibrated given current volatility regime.',
  'Overweight in tech contradicts the mean-reversion signal from credit spreads.',
  'Agree with the defensive tilt — breadth deterioration confirms risk-off.',
  'Portfolio construction is solid but ignores the liquidity premium in EM.',
  'Disagree — the carry trade is crowded and unwinding risk is elevated.',
];

function pickVoteType(): VoteData['voteType'] {
  const r = Math.random();
  if (r < 0.45) return 'agree';
  if (r < 0.72) return 'partial';
  return 'disagree';
}

function generateAllVotes(): VoteData[] {
  const votes: VoteData[] = [];
  for (const voter of MODELS) {
    for (const target of MODELS) {
      if (voter === target) continue;
      votes.push({
        voter,
        target,
        voteType: pickVoteType(),
        reasoning: REASONINGS[Math.floor(Math.random() * REASONINGS.length)],
      });
    }
  }
  // Shuffle for a more natural streaming order
  for (let i = votes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [votes[i], votes[j]] = [votes[j], votes[i]];
  }
  return votes;
}

// ─── Page Component ──────────────────────────────────────────────

export default function IndexVotingDemoPage() {
  const [votes, setVotes] = useState<VoteData[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const allVotesRef = useRef<VoteData[]>([]);
  const indexRef = useRef(0);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const start = useCallback(() => {
    stop();
    const allVotes = generateAllVotes();
    allVotesRef.current = allVotes;
    indexRef.current = 0;
    setVotes([]);
    setIsStreaming(true);

    timerRef.current = setInterval(() => {
      const idx = indexRef.current;
      if (idx >= allVotesRef.current.length) {
        stop();
        return;
      }
      setVotes((prev) => [...prev, allVotesRef.current[idx]]);
      indexRef.current++;
    }, 200);
  }, [stop]);

  const reset = useCallback(() => {
    stop();
    setVotes([]);
  }, [stop]);

  const totalVotes = MODELS.length * (MODELS.length - 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: '#0a0a0f',
          py: 6,
        }}
      >
        <Container maxWidth="lg">
          {/* Header */}
          <Box className="mb-8">
            <Box className="flex items-center gap-3 mb-2">
              <Sparkles size={24} className="text-amber-400" />
              <Typography
                variant="h4"
                sx={{ color: '#fff', fontWeight: 700, letterSpacing: -0.5 }}
              >
                Arena Voting Visualization
              </Typography>
            </Box>
            <Typography
              variant="body2"
              sx={{ color: 'rgba(255,255,255,0.45)', maxWidth: 600, mb: 3 }}
            >
              Simulates the cross-voting phase of the Uteki Index Agent arena.
              Each of {MODELS.length} models votes on all others, producing{' '}
              {totalVotes} votes total.
            </Typography>

            {/* Controls */}
            <Box className="flex items-center gap-3">
              {!isStreaming ? (
                <Button
                  variant="contained"
                  startIcon={<Play size={16} />}
                  onClick={start}
                  sx={{
                    bgcolor: '#f59e0b',
                    color: '#000',
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: 2,
                    '&:hover': { bgcolor: '#d97706' },
                  }}
                >
                  {votes.length > 0 ? 'Restart Simulation' : 'Start Simulation'}
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  startIcon={<Square size={14} />}
                  onClick={stop}
                  sx={{
                    borderColor: 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: 2,
                  }}
                >
                  Stop
                </Button>
              )}

              {votes.length > 0 && !isStreaming && (
                <Button
                  variant="text"
                  startIcon={<RotateCcw size={14} />}
                  onClick={reset}
                  sx={{
                    color: 'rgba(255,255,255,0.5)',
                    textTransform: 'none',
                    fontSize: 13,
                  }}
                >
                  Reset
                </Button>
              )}

              <Chip
                label={`${votes.length} / ${totalVotes} votes`}
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 12,
                  fontWeight: 500,
                }}
              />
            </Box>
          </Box>

          {/* Visualization */}
          <VotingVisualization
            votes={votes}
            models={MODELS}
            isStreaming={isStreaming}
          />
        </Container>
      </Box>
    </motion.div>
  );
}
