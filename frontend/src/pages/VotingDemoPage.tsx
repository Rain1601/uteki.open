import { Box, Typography } from '@mui/material';
import VotingVisualization from '@/components/index/VotingVisualization';
import type { VoteData } from '@/components/index/VotingVisualization';

// ─── Mock Data ───

const MODELS = [
  'claude-sonnet-4-20250514',
  'deepseek-chat',
  'gpt-4.1',
  'gemini-2.5-flash',
  'qwen-plus',
];

const MOCK_VOTES: VoteData[] = [
  // claude-sonnet → others
  { voter: 'claude-sonnet-4-20250514', target: 'deepseek-chat', voteType: 'disagree', reasoning: 'HOLD position lacks conviction. The analysis is too cautious given available alpha signals.' },
  { voter: 'claude-sonnet-4-20250514', target: 'gpt-4.1', voteType: 'agree', reasoning: 'Solid fundamental analysis with appropriate weighting of earnings momentum factors.' },
  { voter: 'claude-sonnet-4-20250514', target: 'gemini-2.5-flash', voteType: 'agree', reasoning: 'Excellent use of multi-timeframe analysis. Entry timing is well-calibrated.' },
  { voter: 'claude-sonnet-4-20250514', target: 'qwen-plus', voteType: 'disagree', reasoning: 'AVOID recommendation is too bearish without sufficient downside catalysts identified.' },

  // deepseek → others
  { voter: 'deepseek-chat', target: 'claude-sonnet-4-20250514', voteType: 'agree', reasoning: 'Thorough technical analysis with clear entry/exit levels. Risk management is well-defined.' },
  { voter: 'deepseek-chat', target: 'gpt-4.1', voteType: 'disagree', reasoning: 'Insufficient consideration of liquidity conditions in the current market regime.' },
  { voter: 'deepseek-chat', target: 'gemini-2.5-flash', voteType: 'disagree', reasoning: 'Latency concerns — slow execution risk in a volatile environment.' },
  { voter: 'deepseek-chat', target: 'qwen-plus', voteType: 'agree', reasoning: 'Provides necessary counterpoint to consensus. Tail risk assessment is valuable.' },

  // gpt-4.1 → others
  { voter: 'gpt-4.1', target: 'claude-sonnet-4-20250514', voteType: 'agree', reasoning: 'Strong macro alignment with Fed policy trajectory. BUY thesis is well-supported.' },
  { voter: 'gpt-4.1', target: 'deepseek-chat', voteType: 'disagree', reasoning: 'Underdeveloped macro thesis. Does not sufficiently address sector-specific catalysts.' },
  { voter: 'gpt-4.1', target: 'gemini-2.5-flash', voteType: 'agree', reasoning: 'Strong correlation analysis across asset classes supports the thesis.' },
  { voter: 'gpt-4.1', target: 'qwen-plus', voteType: 'disagree', reasoning: 'Low confidence undermines the thesis. Contrarian view not well-supported.' },

  // gemini → others
  { voter: 'gemini-2.5-flash', target: 'claude-sonnet-4-20250514', voteType: 'agree', reasoning: 'Comprehensive cross-asset analysis. Conviction level is justified by breadth of evidence.' },
  { voter: 'gemini-2.5-flash', target: 'deepseek-chat', voteType: 'agree', reasoning: 'Prudent risk management approach, though conviction could be higher.' },
  { voter: 'gemini-2.5-flash', target: 'gpt-4.1', voteType: 'agree', reasoning: 'Good synthesis of quantitative signals with qualitative market context.' },
  { voter: 'gemini-2.5-flash', target: 'qwen-plus', voteType: 'disagree', reasoning: 'Weak evidence base. Sentiment analysis does not align with positioning data.' },

  // qwen → others
  { voter: 'qwen-plus', target: 'claude-sonnet-4-20250514', voteType: 'disagree', reasoning: 'Overly bullish given current volatility regime. Fails to adequately price in geopolitical tail risks.' },
  { voter: 'qwen-plus', target: 'deepseek-chat', voteType: 'agree', reasoning: 'Balanced view that acknowledges market uncertainty appropriately.' },
  { voter: 'qwen-plus', target: 'gpt-4.1', voteType: 'disagree', reasoning: 'Same directional bias as majority without independent contrarian analysis.' },
  { voter: 'qwen-plus', target: 'gemini-2.5-flash', voteType: 'disagree', reasoning: 'Overlapping thesis with claude-sonnet without adding differentiated insights.' },
];

// ─── Page ───

export default function VotingDemoPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#1a1a2e',
        p: { xs: 2, md: 4 },
      }}
    >
      <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
        <Typography
          sx={{
            fontSize: 24,
            fontWeight: 800,
            color: '#e2e8f0',
            mb: 1,
            letterSpacing: -0.5,
          }}
        >
          Arena Voting Results
        </Typography>
        <Typography
          sx={{
            fontSize: 13,
            color: '#94a3b8',
            mb: 4,
          }}
        >
          Visualization demo with 5 models, 20 cross-votes. Winner determined by net agree score.
        </Typography>

        <VotingVisualization models={MODELS} votes={MOCK_VOTES} isStreaming={false} />
      </Box>
    </Box>
  );
}
