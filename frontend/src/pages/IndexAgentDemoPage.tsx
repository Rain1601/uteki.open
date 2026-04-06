import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

type Phase = 'config' | 'running' | 'result';
type RunSubPhase = 'decide' | 'vote' | 'tally';
type SkillStatus = 'pending' | 'running' | 'complete';
type Action = 'BUY' | 'HOLD' | 'AVOID';

interface SkillState {
  name: string;
  status: SkillStatus;
}

interface ModelConfig {
  id: string;
  provider: string;
  model: string;
  costEstimate: string;
  selected: boolean;
}

interface ModelDecision {
  id: string;
  provider: string;
  model: string;
  action: Action;
  confidence: number;
  reasoning: string;
  latencyMs: number;
  tokensUsed: number;
  skills: SkillState[];
  elapsed: number;
}

interface Vote {
  voter: string;
  target: string;
  approve: boolean;
  reasoning: string;
}

interface ModelResult {
  id: string;
  provider: string;
  model: string;
  action: Action;
  confidence: number;
  reasoning: string;
  latencyMs: number;
  tokensUsed: number;
  approveCount: number;
  rejectCount: number;
  netScore: number;
  rank: number;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const INITIAL_MODELS: ModelConfig[] = [
  { id: 'claude', provider: 'Anthropic', model: 'claude-sonnet-4', costEstimate: '$0.12', selected: true },
  { id: 'deepseek', provider: 'DeepSeek', model: 'deepseek-chat', costEstimate: '$0.03', selected: true },
  { id: 'gpt', provider: 'OpenAI', model: 'gpt-4.1', costEstimate: '$0.15', selected: true },
  { id: 'gemini', provider: 'Google', model: 'gemini-2.5-flash', costEstimate: '$0.06', selected: true },
  { id: 'qwen', provider: 'Alibaba', model: 'qwen-plus', costEstimate: '$0.04', selected: true },
];

const SKILLS = ['analyze_market', 'analyze_macro', 'recall_memory', 'make_decision'];

const MOCK_DECISIONS: Record<string, Omit<ModelDecision, 'skills' | 'elapsed'>> = {
  claude: {
    id: 'claude', provider: 'Anthropic', model: 'claude-sonnet-4',
    action: 'BUY', confidence: 82,
    reasoning: 'Strong macro alignment with Fed easing cycle. SPY allocation weighted toward tech sector recovery.',
    latencyMs: 7420, tokensUsed: 3842,
  },
  gpt: {
    id: 'gpt', provider: 'OpenAI', model: 'gpt-4.1',
    action: 'BUY', confidence: 75,
    reasoning: 'Earnings momentum supports continued equity exposure. Recommend overweight in growth sectors.',
    latencyMs: 6890, tokensUsed: 4210,
  },
  deepseek: {
    id: 'deepseek', provider: 'DeepSeek', model: 'deepseek-chat',
    action: 'HOLD', confidence: 68,
    reasoning: 'Mixed signals from macro data. Maintain current allocation pending clearer direction.',
    latencyMs: 5340, tokensUsed: 2960,
  },
  gemini: {
    id: 'gemini', provider: 'Google', model: 'gemini-2.5-flash',
    action: 'BUY', confidence: 78,
    reasoning: 'Cross-asset analysis favors equities. Bond yields declining support risk-on positioning.',
    latencyMs: 4120, tokensUsed: 3150,
  },
  qwen: {
    id: 'qwen', provider: 'Alibaba', model: 'qwen-plus',
    action: 'AVOID', confidence: 60,
    reasoning: 'Volatility regime shift signals caution. Recommend reducing equity exposure.',
    latencyMs: 5780, tokensUsed: 2680,
  },
};

const MOCK_VOTES: Vote[] = [
  // claude votes on others
  { voter: 'claude', target: 'gpt', approve: true, reasoning: 'Aligned macro thesis' },
  { voter: 'claude', target: 'deepseek', approve: false, reasoning: 'HOLD lacks conviction' },
  { voter: 'claude', target: 'gemini', approve: true, reasoning: 'Solid cross-asset logic' },
  { voter: 'claude', target: 'qwen', approve: false, reasoning: 'AVOID premature given data' },
  // gpt votes on others
  { voter: 'gpt', target: 'claude', approve: true, reasoning: 'Tech sector call is strong' },
  { voter: 'gpt', target: 'deepseek', approve: false, reasoning: 'Too cautious' },
  { voter: 'gpt', target: 'gemini', approve: true, reasoning: 'Bond yield analysis valid' },
  { voter: 'gpt', target: 'qwen', approve: false, reasoning: 'Risk-off not supported' },
  // deepseek votes on others
  { voter: 'deepseek', target: 'claude', approve: true, reasoning: 'Reasonable BUY case' },
  { voter: 'deepseek', target: 'gpt', approve: false, reasoning: 'Overweight too aggressive' },
  { voter: 'deepseek', target: 'gemini', approve: true, reasoning: 'Balanced approach' },
  { voter: 'deepseek', target: 'qwen', approve: true, reasoning: 'Caution warranted' },
  // gemini votes on others
  { voter: 'gemini', target: 'claude', approve: true, reasoning: 'Strong Fed cycle analysis' },
  { voter: 'gemini', target: 'gpt', approve: true, reasoning: 'Growth thesis valid' },
  { voter: 'gemini', target: 'deepseek', approve: false, reasoning: 'HOLD is indecisive' },
  { voter: 'gemini', target: 'qwen', approve: false, reasoning: 'AVOID too bearish' },
  // qwen votes on others
  { voter: 'qwen', target: 'claude', approve: false, reasoning: 'Ignores volatility risk' },
  { voter: 'qwen', target: 'gpt', approve: false, reasoning: 'Growth overweight risky' },
  { voter: 'qwen', target: 'deepseek', approve: true, reasoning: 'Prudent stance' },
  { voter: 'qwen', target: 'gemini', approve: false, reasoning: 'Risk-on too aggressive' },
];

// ─── Styles ──────────────────────────────────────────────────────────────────

const colors = {
  bg: '#FAF8F4',
  card: '#FFFFFF',
  accent: '#D97149',
  accentHover: '#C45A33',
  accentBg: '#FFF4F0',
  heading: '#000000',
  body: '#333333',
  muted: '#777777',
  borderLight: '#F0EDE9',
  borderMed: '#E8E5E1',
  btnPrimaryBg: '#000000',
  btnPrimaryText: '#FAF8F4',
  green: '#2E7D32',
  greenBg: '#E8F5E9',
  red: '#C62828',
  redBg: '#FFEBEE',
};

const fonts = {
  ui: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
  reading: "'Times New Roman', 'SimSun', serif",
  code: "'SF Mono', Monaco, monospace",
};

const s = {
  page: {
    minHeight: '100vh',
    backgroundColor: colors.bg,
    fontFamily: fonts.ui,
    color: colors.body,
    padding: '48px 24px',
  } as React.CSSProperties,
  container: {
    maxWidth: 960,
    margin: '0 auto',
  } as React.CSSProperties,
  h1: {
    fontSize: '2rem',
    fontWeight: 700,
    color: colors.heading,
    margin: 0,
    letterSpacing: '-0.02em',
  } as React.CSSProperties,
  subtitle: {
    fontSize: '1rem',
    color: colors.muted,
    margin: '8px 0 0',
    lineHeight: 1.5,
  } as React.CSSProperties,
  sectionLabel: {
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: colors.muted,
    margin: '32px 0 12px',
  } as React.CSSProperties,
  card: {
    background: colors.card,
    border: `1px solid ${colors.borderLight}`,
    borderRadius: 4,
    padding: '20px 24px',
  } as React.CSSProperties,
  cardCompact: {
    background: colors.card,
    border: `1px solid ${colors.borderLight}`,
    borderRadius: 4,
    padding: '16px 20px',
  } as React.CSSProperties,
  btnPrimary: {
    background: colors.btnPrimaryBg,
    color: colors.btnPrimaryText,
    border: 'none',
    borderRadius: 4,
    padding: '12px 32px',
    fontSize: '0.9rem',
    fontWeight: 600,
    fontFamily: fonts.ui,
    cursor: 'pointer',
    transition: 'opacity 0.2s ease',
  } as React.CSSProperties,
  btnSecondary: {
    background: 'transparent',
    color: colors.heading,
    border: `1px solid ${colors.borderMed}`,
    borderRadius: 4,
    padding: '12px 32px',
    fontSize: '0.9rem',
    fontWeight: 600,
    fontFamily: fonts.ui,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  } as React.CSSProperties,
  chip: {
    display: 'inline-block',
    background: colors.accentBg,
    color: colors.accentHover,
    borderRadius: 16,
    padding: '3px 12px',
    fontSize: '0.75rem',
    fontWeight: 600,
  } as React.CSSProperties,
  actionTag: (action: Action): React.CSSProperties => ({
    display: 'inline-block',
    borderRadius: 16,
    padding: '3px 14px',
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.03em',
    background: action === 'BUY' ? colors.greenBg : action === 'AVOID' ? colors.redBg : '#FFF8E1',
    color: action === 'BUY' ? colors.green : action === 'AVOID' ? colors.red : '#F57F17',
  }),
  input: {
    border: `1px solid ${colors.borderMed}`,
    borderRadius: 4,
    padding: '10px 14px',
    fontSize: '0.9rem',
    fontFamily: fonts.ui,
    outline: 'none',
    width: 140,
    transition: 'border-color 0.2s ease',
  } as React.CSSProperties,
  checkbox: {
    width: 18,
    height: 18,
    accentColor: colors.accent,
    cursor: 'pointer',
  } as React.CSSProperties,
};

// ─── Utility ─────────────────────────────────────────────────────────────────

function computeResults(selectedIds: string[]): ModelResult[] {
  const scores: Record<string, { approve: number; reject: number }> = {};
  selectedIds.forEach(id => { scores[id] = { approve: 0, reject: 0 }; });

  const relevantVotes = MOCK_VOTES.filter(
    v => selectedIds.includes(v.voter) && selectedIds.includes(v.target)
  );
  relevantVotes.forEach(v => {
    if (v.approve) scores[v.target].approve++;
    else scores[v.target].reject++;
  });

  const results: ModelResult[] = selectedIds.map(id => {
    const d = MOCK_DECISIONS[id];
    const sc = scores[id];
    return {
      ...d,
      approveCount: sc.approve,
      rejectCount: sc.reject,
      netScore: sc.approve - sc.reject,
      rank: 0,
    };
  });

  results.sort((a, b) => b.netScore - a.netScore || b.confidence - a.confidence);
  results.forEach((r, i) => { r.rank = i + 1; });
  return results;
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function ProgressBar({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, margin: '32px 0' }}>
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={step}>
            {i > 0 && (
              <div style={{
                flex: 1,
                height: 2,
                background: done ? colors.accent : colors.borderMed,
                transition: 'background 0.3s ease',
              }} />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 80 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 700,
                background: done ? colors.accent : active ? colors.accentBg : colors.card,
                color: done ? '#fff' : active ? colors.accent : colors.muted,
                border: active ? `2px solid ${colors.accent}` : done ? 'none' : `1px solid ${colors.borderMed}`,
                transition: 'all 0.3s ease',
              }}>
                {done ? '\u2713' : i + 1}
              </div>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: active ? 700 : 500,
                color: active ? colors.accent : done ? colors.heading : colors.muted,
                textTransform: 'capitalize',
              }}>
                {step}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

function SkillProgress({ skills }: { skills: SkillState[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
      {skills.map(sk => (
        <div key={sk.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 10, display: 'flex', justifyContent: 'center' }}>
            {sk.status === 'complete' && (
              <span style={{ color: colors.green, fontSize: '0.8rem', fontWeight: 700 }}>{'\u2713'}</span>
            )}
            {sk.status === 'running' && (
              <span style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: colors.accent,
                animation: 'indexDemoPulse 1s infinite',
              }} />
            )}
            {sk.status === 'pending' && (
              <span style={{
                display: 'inline-block',
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: colors.borderMed,
              }} />
            )}
          </div>
          <span style={{
            fontSize: '0.8rem',
            fontFamily: fonts.code,
            color: sk.status === 'running' ? colors.accent : sk.status === 'complete' ? colors.heading : colors.muted,
            fontWeight: sk.status === 'running' ? 600 : 400,
          }}>
            {sk.name}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function IndexAgentDemoPage() {
  const [phase, setPhase] = useState<Phase>('config');
  const [models, setModels] = useState<ModelConfig[]>(INITIAL_MODELS);
  const [budget, setBudget] = useState('10000');
  const [subPhase, setSubPhase] = useState<RunSubPhase>('decide');
  const [modelStates, setModelStates] = useState<ModelDecision[]>([]);
  const [visibleVotes, setVisibleVotes] = useState<Vote[]>([]);
  const [results, setResults] = useState<ModelResult[]>([]);
  const [expandedModel, setExpandedModel] = useState<string | null>(null);
  const [totalTime, setTotalTime] = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const startTimeRef = useRef(0);

  const selectedModels = models.filter(m => m.selected);
  const selectedIds = selectedModels.map(m => m.id);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const toggleModel = (id: string) => {
    setModels(prev => prev.map(m => m.id === id ? { ...m, selected: !m.selected } : m));
  };

  // ─── Start Arena ─────────────────────────────────────────────────────────

  const startArena = () => {
    clearTimers();
    startTimeRef.current = Date.now();

    const ids = models.filter(m => m.selected).map(m => m.id);

    const initStates: ModelDecision[] = ids.map(id => ({
      ...MOCK_DECISIONS[id],
      skills: SKILLS.map(name => ({ name, status: 'pending' as SkillStatus })),
      elapsed: 0,
    }));
    setModelStates(initStates);
    setVisibleVotes([]);
    setResults([]);
    setExpandedModel(null);
    setPhase('running');
    setSubPhase('decide');

    const allTimers: ReturnType<typeof setTimeout>[] = [];

    // ── Decide phase: stagger models, 2s per skill ──
    ids.forEach((id, modelIdx) => {
      const stagger = modelIdx * 500;
      SKILLS.forEach((_, skillIdx) => {
        const runTime = stagger + skillIdx * 2000;
        allTimers.push(setTimeout(() => {
          setModelStates(prev => prev.map(m => {
            if (m.id !== id) return m;
            const skills = m.skills.map((sk, si) =>
              si === skillIdx ? { ...sk, status: 'running' as SkillStatus } : sk
            );
            return { ...m, skills, elapsed: (Date.now() - startTimeRef.current) / 1000 };
          }));
        }, runTime));

        const completeTime = stagger + (skillIdx + 1) * 2000;
        allTimers.push(setTimeout(() => {
          setModelStates(prev => prev.map(m => {
            if (m.id !== id) return m;
            const skills = m.skills.map((sk, si) =>
              si === skillIdx ? { ...sk, status: 'complete' as SkillStatus } : sk
            );
            return { ...m, skills, elapsed: (Date.now() - startTimeRef.current) / 1000 };
          }));
        }, completeTime));
      });
    });

    const decideEnd = (ids.length - 1) * 500 + SKILLS.length * 2000;

    // ── Vote phase ──
    const voteStart = decideEnd + 400;
    allTimers.push(setTimeout(() => setSubPhase('vote'), voteStart));

    const relevantVotes = MOCK_VOTES.filter(
      v => ids.includes(v.voter) && ids.includes(v.target)
    );
    relevantVotes.forEach((vote, i) => {
      allTimers.push(setTimeout(() => {
        setVisibleVotes(prev => [...prev, vote]);
      }, voteStart + 300 + i * 300));
    });

    // ── Tally phase ──
    const tallyStart = voteStart + 300 + relevantVotes.length * 300 + 400;
    allTimers.push(setTimeout(() => setSubPhase('tally'), tallyStart));

    allTimers.push(setTimeout(() => {
      setTotalTime((Date.now() - startTimeRef.current) / 1000);
      const r = computeResults(ids);
      setResults(r);
      setPhase('result');
    }, tallyStart + 2000));

    timersRef.current = allTimers;
  };

  const resetToConfig = () => {
    clearTimers();
    setPhase('config');
    setSubPhase('decide');
    setModelStates([]);
    setVisibleVotes([]);
    setResults([]);
    setExpandedModel(null);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  const subPhaseIdx = subPhase === 'decide' ? 0 : subPhase === 'vote' ? 1 : 2;
  const winner = results[0];
  const totalCost = selectedModels.reduce((sum, m) => {
    const v = parseFloat(m.costEstimate.replace('$', ''));
    return sum + v;
  }, 0);

  return (
    <div style={s.page}>
      <style>{`
        @keyframes indexDemoPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes indexDemoSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div style={s.container}>

        {/* ── PHASE: CONFIG ─────────────────────────────────────────── */}
        {phase === 'config' && (
          <div style={{ opacity: 1, transition: 'opacity 0.3s ease' }}>
            <h1 style={s.h1}>Index Agent Arena</h1>
            <p style={s.subtitle}>
              Multiple AI models independently analyze the market, then cross-vote on each other's decisions to reach a consensus.
            </p>

            <div style={s.sectionLabel}>Budget</div>
            <div style={s.card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '0.9rem', color: colors.muted }}>$</span>
                <input
                  type="text"
                  value={budget}
                  onChange={e => setBudget(e.target.value.replace(/[^0-9]/g, ''))}
                  style={s.input}
                />
                <span style={{ fontSize: '0.85rem', color: colors.muted }}>USD allocation for this run</span>
              </div>
            </div>

            <div style={s.sectionLabel}>Model Selection</div>
            <div style={{ ...s.card, padding: 0 }}>
              {models.map((m, i) => (
                <label
                  key={m.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '14px 24px',
                    borderBottom: i < models.length - 1 ? `1px solid ${colors.borderLight}` : 'none',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                    background: m.selected ? colors.accentBg : 'transparent',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={m.selected}
                    onChange={() => toggleModel(m.id)}
                    style={s.checkbox}
                  />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.8rem', color: colors.muted, marginRight: 8 }}>{m.provider}</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: colors.heading, fontFamily: fonts.code }}>
                      {m.model}
                    </span>
                  </div>
                  <span style={s.chip}>{m.costEstimate}</span>
                </label>
              ))}
            </div>

            <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 16 }}>
              <button
                style={{
                  ...s.btnPrimary,
                  opacity: selectedModels.length < 2 ? 0.4 : 1,
                  cursor: selectedModels.length < 2 ? 'not-allowed' : 'pointer',
                }}
                disabled={selectedModels.length < 2}
                onClick={startArena}
              >
                Start Arena
              </button>
              {selectedModels.length < 2 && (
                <span style={{ fontSize: '0.8rem', color: colors.muted }}>Select at least 2 models</span>
              )}
              {selectedModels.length >= 2 && (
                <span style={{ fontSize: '0.8rem', color: colors.muted }}>
                  {selectedModels.length} models selected  --  est. ${totalCost.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── PHASE: RUNNING ────────────────────────────────────────── */}
        {phase === 'running' && (
          <div style={{ opacity: 1, transition: 'opacity 0.3s ease' }}>
            <h1 style={s.h1}>Arena Running</h1>
            <p style={s.subtitle}>
              {subPhase === 'decide' && 'Each model is independently running the 4-skill pipeline...'}
              {subPhase === 'vote' && 'Models are cross-voting on each other\'s decisions...'}
              {subPhase === 'tally' && 'Compiling votes into final ranking...'}
            </p>

            <ProgressBar steps={['Decide', 'Vote', 'Tally']} current={subPhaseIdx} />

            {/* Decide phase — model cards */}
            {subPhase === 'decide' && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 16,
              }}>
                {modelStates.map(m => (
                  <div key={m.id} style={s.cardCompact}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: colors.muted }}>{m.provider}</span>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, fontFamily: fonts.code, color: colors.heading }}>
                          {m.model}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: colors.muted, fontFamily: fonts.code }}>
                        {m.elapsed.toFixed(1)}s
                      </span>
                    </div>
                    <SkillProgress skills={m.skills} />
                  </div>
                ))}
              </div>
            )}

            {/* Vote phase — vote list */}
            {subPhase === 'vote' && (
              <div style={s.card}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {visibleVotes.map((v, i) => {
                    const voterModel = MOCK_DECISIONS[v.voter]?.model ?? v.voter;
                    const targetModel = MOCK_DECISIONS[v.target]?.model ?? v.target;
                    return (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '8px 12px',
                          borderRadius: 4,
                          background: v.approve ? colors.greenBg : colors.redBg,
                          fontSize: '0.85rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span style={{ fontFamily: fonts.code, fontWeight: 600, minWidth: 140, color: colors.heading }}>
                          {voterModel}
                        </span>
                        <span style={{ color: colors.muted }}>{'\u2192'}</span>
                        <span style={{ fontFamily: fonts.code, minWidth: 140, color: colors.heading }}>
                          {targetModel}
                        </span>
                        <span style={{
                          fontWeight: 700,
                          color: v.approve ? colors.green : colors.red,
                          minWidth: 60,
                        }}>
                          {v.approve ? 'APPROVE' : 'REJECT'}
                        </span>
                        <span style={{ color: colors.muted, fontSize: '0.8rem', flex: 1, minWidth: 120 }}>
                          {v.reasoning}
                        </span>
                      </div>
                    );
                  })}
                  {visibleVotes.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 24, color: colors.muted }}>
                      Waiting for votes...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tally phase */}
            {subPhase === 'tally' && (
              <div style={{ ...s.card, textAlign: 'center', padding: '48px 24px' }}>
                <div style={{
                  display: 'inline-block',
                  width: 24,
                  height: 24,
                  border: `3px solid ${colors.borderMed}`,
                  borderTopColor: colors.accent,
                  borderRadius: '50%',
                  animation: 'indexDemoSpin 0.8s linear infinite',
                }} />
                <p style={{ marginTop: 16, color: colors.muted, fontSize: '0.9rem' }}>
                  Compiling results...
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── PHASE: RESULT ─────────────────────────────────────────── */}
        {phase === 'result' && winner && (
          <div style={{ opacity: 1, transition: 'opacity 0.3s ease' }}>
            <h1 style={s.h1}>Arena Results</h1>
            <p style={s.subtitle}>
              Consensus reached after {totalTime.toFixed(1)}s across {results.length} models.
            </p>

            {/* Winner banner */}
            <div style={{
              ...s.card,
              marginTop: 24,
              borderColor: colors.accent,
              borderWidth: 2,
              background: colors.accentBg,
              textAlign: 'center',
              padding: '32px 24px',
            }}>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: colors.muted,
                marginBottom: 8,
              }}>
                Winner
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: fonts.code, color: colors.heading }}>
                {winner.model}
              </div>
              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={s.actionTag(winner.action)}>{winner.action}</span>
                <span style={{ fontSize: '0.9rem', color: colors.heading, fontWeight: 600 }}>
                  Net Score: +{winner.netScore}
                </span>
                <span style={{ fontSize: '0.85rem', color: colors.muted }}>
                  {winner.confidence}% confidence
                </span>
              </div>
              <p style={{
                marginTop: 16,
                marginBottom: 0,
                fontSize: '1rem',
                fontFamily: fonts.reading,
                color: colors.body,
                lineHeight: 1.6,
              }}>
                {winner.reasoning}
              </p>
            </div>

            {/* Vote results table */}
            <div style={s.sectionLabel}>Vote Results</div>
            <div style={{ ...s.card, padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: colors.accent }}>
                      {['Rank', 'Model', 'Action', 'Approve', 'Reject', 'Net Score'].map(h => (
                        <th key={h} style={{
                          padding: '10px 16px',
                          textAlign: 'left',
                          color: '#FFFFFF',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          letterSpacing: '0.02em',
                          whiteSpace: 'nowrap',
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map(r => (
                      <tr
                        key={r.id}
                        style={{
                          background: r.rank === 1 ? colors.accentBg : 'transparent',
                          borderBottom: `1px solid ${colors.borderLight}`,
                        }}
                      >
                        <td style={{ padding: '10px 16px', fontWeight: 700, color: r.rank === 1 ? colors.accent : colors.muted }}>
                          #{r.rank}
                        </td>
                        <td style={{ padding: '10px 16px', fontFamily: fonts.code, fontWeight: 600, color: colors.heading, whiteSpace: 'nowrap' }}>
                          {r.model}
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <span style={s.actionTag(r.action)}>{r.action}</span>
                        </td>
                        <td style={{ padding: '10px 16px', color: colors.green, fontWeight: 600 }}>
                          {r.approveCount}
                        </td>
                        <td style={{ padding: '10px 16px', color: colors.red, fontWeight: 600 }}>
                          {r.rejectCount}
                        </td>
                        <td style={{
                          padding: '10px 16px',
                          fontWeight: 700,
                          color: r.netScore > 0 ? colors.green : r.netScore < 0 ? colors.red : colors.muted,
                        }}>
                          {r.netScore > 0 ? '+' : ''}{r.netScore}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Model details — expandable */}
            <div style={s.sectionLabel}>Model Details</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {results.map(r => {
                const isExpanded = expandedModel === r.id;
                return (
                  <div key={r.id} style={s.cardCompact}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                      onClick={() => setExpandedModel(isExpanded ? null : r.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontFamily: fonts.code, fontWeight: 600, color: colors.heading }}>
                          {r.model}
                        </span>
                        <span style={s.actionTag(r.action)}>{r.action}</span>
                      </div>
                      <span style={{
                        fontSize: '0.8rem',
                        color: colors.muted,
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        display: 'inline-block',
                      }}>
                        {'\u25BC'}
                      </span>
                    </div>
                    {isExpanded && (
                      <div style={{
                        marginTop: 16,
                        paddingTop: 16,
                        borderTop: `1px solid ${colors.borderLight}`,
                      }}>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                          gap: 16,
                          marginBottom: 16,
                        }}>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                              Confidence
                            </div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: colors.heading }}>
                              {r.confidence}%
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                              Latency
                            </div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: colors.heading }}>
                              {(r.latencyMs / 1000).toFixed(1)}s
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                              Tokens
                            </div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: colors.heading }}>
                              {r.tokensUsed.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                            Reasoning
                          </div>
                          <p style={{ margin: 0, fontSize: '0.9rem', fontFamily: fonts.reading, lineHeight: 1.6, color: colors.body }}>
                            {r.reasoning}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Summary + action bar */}
            <div style={{
              ...s.card,
              marginTop: 24,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
            }}>
              <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Total Time
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: colors.heading, marginTop: 2 }}>
                    {totalTime.toFixed(1)}s
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Est. Cost
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: colors.heading, marginTop: 2 }}>
                    ${totalCost.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Models
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: colors.heading, marginTop: 2 }}>
                    {results.length}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button style={s.btnPrimary}>
                  Approve Decision
                </button>
                <button style={s.btnSecondary} onClick={resetToConfig}>
                  Run Again
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
