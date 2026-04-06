import { Box, Typography, Divider } from '@mui/material';
import { motion } from 'framer-motion';
import ReflectionCard, {
  GatePipelineView,
  type ReflectionData,
} from '@/components/company/ReflectionCard';

// ── Mock Data ──

const MOCK_REFLECTIONS: ReflectionData[] = [
  {
    afterGate: 3,
    contradictions: [
      'Gate 1 estimates revenue growth at 15% but Gate 3\'s DCF assumes only 8%.',
      'Gate 2 identifies strong competitive moat but Gate 3 pricing power analysis suggests margin pressure.',
    ],
    downstreamHints: [
      'Gate 4 should verify revenue growth assumptions against latest earnings call.',
      'Gate 6 risk assessment should factor in the margin pressure identified.',
      'Check if revenue growth divergence stems from organic vs. acquisition-driven splits.',
    ],
    needsRevisit: 1,
    raw: `## Reflection Checkpoint — After Gate 3 (Moat Assessment)

### Cross-Gate Consistency Check

Analyzing outputs from Gates 1-3 for logical consistency...

**Finding 1: Revenue Growth Conflict**
- Gate 1 conclusion: "Revenue growth estimated at 15% CAGR over next 3 years based on TAM expansion"
- Gate 3 DCF model: "Assumes 8% revenue growth as base case for intrinsic value calculation"
- Assessment: 7 percentage point gap in a core assumption. If Gate 1's 15% is correct, Gate 3's DCF is significantly undervaluing the company. If Gate 3's conservative 8% is right, Gate 1's business quality assessment may be overly optimistic.

**Finding 2: Moat vs. Margin Pressure**
- Gate 2 Fisher analysis: "Strong competitive moat — brand loyalty, switching costs, network effects all score 8+/10"
- Gate 3 pricing power: "Gross margins compressed 230bps YoY, pricing power weakening in core segments"
- Assessment: A company with genuinely strong moat should be able to maintain or expand margins. Margin compression contradicts the moat thesis.

### Downstream Hints
1. Gate 4 (Management): Verify whether management guidance aligns with 15% or 8% growth.
2. Gate 6 (Valuation): Apply sensitivity analysis across both growth scenarios.
3. Gate 5 (Reverse Test): Specifically test the bear case around margin erosion.

### Decision
- has_contradiction: true
- needs_revisit: Gate 1 (to reconcile revenue growth assumption)
- severity: moderate (2 contradictions found, resolvable with additional data)`,
  },
  {
    afterGate: 5,
    contradictions: [],
    downstreamHints: [
      'Strong consistency across all 5 gates — high confidence for final verdict.',
      'Valuation should weight management quality highly (Gate 4 score: 8.5/10).',
      'Reverse test found no fatal flaws — reduce bear-case probability to 15%.',
    ],
    needsRevisit: null,
    raw: `## Reflection Checkpoint — After Gate 5 (Reverse Test)

### Cross-Gate Consistency Check

Analyzing outputs from Gates 1-5 for logical consistency...

**Check 1: Business Quality vs. Reverse Test**
- Gate 1 rates business quality as "excellent" with sustainability score 8.7/10
- Gate 5 reverse test found no fundamental business model risks
- Status: CONSISTENT

**Check 2: Moat Assessment vs. Reverse Test**
- Gate 3 moat (after revisit): "Moderate-to-strong, primarily brand + distribution"
- Gate 5 tested competitive threat scenarios — moat held up under stress
- Status: CONSISTENT

**Check 3: Management vs. Fisher Quality**
- Gate 4 management score: 8.5/10 with strong capital allocation track record
- Gate 2 Fisher management questions align with Gate 4 findings
- Status: CONSISTENT

**Check 4: Overall Conviction Direction**
- All gates lean bullish with moderate-to-high conviction
- No conflicting directional signals detected
- Status: CONSISTENT

### Downstream Hints
1. High confidence across 5 gates — Gate 6 valuation can use standard multiples without extra risk discount.
2. Management quality is a standout factor — weight it accordingly.
3. Bear case probability can be reduced given reverse test found no fatal flaws.

### Decision
- has_contradiction: false
- needs_revisit: none
- severity: none (fully consistent)`,
  },
];

// ── Page ──

export default function ReflectionDemoPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: '#1a1a2e',
          color: '#e2e8f0',
          py: 4,
          px: { xs: 2, md: 4 },
        }}
      >
        <Box sx={{ maxWidth: 900, mx: 'auto' }}>
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, color: '#e2e8f0', mb: 0.5 }}
              >
                Reflection Results
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                Cross-gate consistency checks in the 7-gate investment analysis pipeline.
                Reflections run after Gate 3 (Moat Assessment) and Gate 5 (Reverse Test).
              </Typography>
            </Box>
          </motion.div>

          {/* Pipeline Visualization (horizontal stepper) */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Box
              sx={{
                bgcolor: '#16213e',
                border: '1px solid #334155',
                borderRadius: '12px',
                p: 2,
                mb: 4,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: '#94a3b8',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  mb: 1,
                  display: 'block',
                }}
              >
                7-Gate Pipeline with Reflection Checkpoints
              </Typography>
              <GatePipelineView reflections={MOCK_REFLECTIONS} />
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 1.5 }}>
                {[
                  { color: '#22c55e', label: 'Consistent' },
                  { color: '#f97316', label: 'Contradiction' },
                  { color: '#ef4444', label: 'Revisit Required' },
                ].map(({ color, label }) => (
                  <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color }} />
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                      {label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </motion.div>

          <Divider sx={{ borderColor: '#334155', mb: 3 }} />

          {/* Reflection Cards */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {MOCK_REFLECTIONS.map((reflection, i) => (
              <ReflectionCard key={reflection.afterGate} reflection={reflection} index={i} />
            ))}
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
}
