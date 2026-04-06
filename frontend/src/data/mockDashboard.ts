export const portfolioSummary = {
  totalValue: 1250000,
  dailyChange: 12500,
  dailyChangePct: 1.01,
  allocation: [
    { name: 'US Equity', value: 45, color: '#3B82F6' },
    { name: 'Intl Equity', value: 20, color: '#10B981' },
    { name: 'Fixed Income', value: 25, color: '#F59E0B' },
    { name: 'Cash', value: 10, color: '#6B7280' },
  ],
};

export const quickStats = {
  totalAnalyses: 47,
  winRate: 68,
  avgConviction: 0.73,
  modelsUsed: 5,
};

export const recentDecisions = [
  {
    date: '2026-04-04',
    agentType: 'index' as const,
    symbol: 'QQQ',
    action: 'BUY',
    model: 'Claude 3.5',
    returnPct: 2.3,
  },
  {
    date: '2026-04-03',
    agentType: 'company' as const,
    symbol: 'NVDA',
    action: 'BUY',
    model: 'GPT-4o',
    returnPct: 5.1,
  },
  {
    date: '2026-04-02',
    agentType: 'index' as const,
    symbol: 'SPY',
    action: 'WATCH',
    model: 'Gemini Pro',
    returnPct: 0.4,
  },
  {
    date: '2026-04-01',
    agentType: 'company' as const,
    symbol: 'TSLA',
    action: 'AVOID',
    model: 'DeepSeek V3',
    returnPct: -3.2,
  },
  {
    date: '2026-03-31',
    agentType: 'index' as const,
    symbol: 'VTI',
    action: 'BUY',
    model: 'Claude 3.5',
    returnPct: 1.8,
  },
];

// Generate 180 data points (6 months daily)
function generatePerformanceData() {
  const data: { date: string; portfolio: number; benchmark: number }[] = [];
  let portfolio = 100000;
  let benchmark = 100000;

  const startDate = new Date('2025-10-01');

  for (let i = 0; i < 180; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dateStr = date.toISOString().slice(0, 10);

    // Daily returns with some noise
    const portfolioReturn = 1 + (0.15 / 252 + (Math.random() - 0.48) * 0.015);
    const benchmarkReturn = 1 + (0.10 / 252 + (Math.random() - 0.48) * 0.012);

    portfolio *= portfolioReturn;
    benchmark *= benchmarkReturn;

    data.push({
      date: dateStr,
      portfolio: Math.round(portfolio),
      benchmark: Math.round(benchmark),
    });
  }

  return data;
}

export const performanceData = generatePerformanceData();

// ── Agent Activity ──

export const agentActivity = [
  {
    id: 'arena-1',
    type: 'arena' as const,
    title: 'Index Arena #47',
    result: 'BUY — SPY weighted toward tech recovery',
    winner: 'claude-sonnet-4',
    models: 5,
    latencyMs: 42300,
    timestamp: '2026-04-06T08:30:00Z',
    status: 'completed' as const,
  },
  {
    id: 'company-1',
    type: 'company' as const,
    title: 'AAPL Deep Analysis',
    result: 'BUY — 78% conviction, GOOD quality',
    model: 'deepseek-chat',
    gates: 7,
    latencyMs: 24800,
    timestamp: '2026-04-06T07:15:00Z',
    status: 'completed' as const,
  },
  {
    id: 'arena-2',
    type: 'arena' as const,
    title: 'Index Arena #46',
    result: 'HOLD — Insufficient consensus for action',
    winner: 'gpt-4.1',
    models: 5,
    latencyMs: 38900,
    timestamp: '2026-04-05T14:00:00Z',
    status: 'completed' as const,
  },
  {
    id: 'company-2',
    type: 'company' as const,
    title: 'NVDA Deep Analysis',
    result: 'BUY — 85% conviction, EXCELLENT quality',
    model: 'claude-sonnet-4',
    gates: 7,
    latencyMs: 31200,
    timestamp: '2026-04-05T10:20:00Z',
    status: 'completed' as const,
  },
  {
    id: 'company-3',
    type: 'company' as const,
    title: 'TSLA Deep Analysis',
    result: 'AVOID — 62% conviction, MEDIOCRE quality',
    model: 'gpt-4.1',
    gates: 7,
    latencyMs: 28400,
    timestamp: '2026-04-04T16:45:00Z',
    status: 'completed' as const,
  },
  {
    id: 'arena-3',
    type: 'arena' as const,
    title: 'Index Arena #45',
    result: 'BUY — Strong macro alignment with rate cycle',
    winner: 'gemini-2.5-flash',
    models: 5,
    latencyMs: 35600,
    timestamp: '2026-04-04T08:30:00Z',
    status: 'completed' as const,
  },
];

// ── Model Leaderboard ──

export const modelLeaderboard = [
  {
    model: 'claude-sonnet-4',
    provider: 'Anthropic',
    arenaWins: 12,
    arenaRuns: 20,
    companyRuns: 15,
    avgConviction: 0.79,
    avgLatencyMs: 4200,
    costPerRun: 0.12,
    winRate: 60,
  },
  {
    model: 'gpt-4.1',
    provider: 'OpenAI',
    arenaWins: 9,
    arenaRuns: 20,
    companyRuns: 10,
    avgConviction: 0.74,
    avgLatencyMs: 3800,
    costPerRun: 0.15,
    winRate: 45,
  },
  {
    model: 'deepseek-chat',
    provider: 'DeepSeek',
    arenaWins: 7,
    arenaRuns: 20,
    companyRuns: 12,
    avgConviction: 0.71,
    avgLatencyMs: 2100,
    costPerRun: 0.03,
    winRate: 35,
  },
  {
    model: 'gemini-2.5-flash',
    provider: 'Google',
    arenaWins: 8,
    arenaRuns: 20,
    companyRuns: 8,
    avgConviction: 0.72,
    avgLatencyMs: 2800,
    costPerRun: 0.06,
    winRate: 40,
  },
  {
    model: 'qwen-plus',
    provider: 'Alibaba',
    arenaWins: 4,
    arenaRuns: 20,
    companyRuns: 5,
    avgConviction: 0.65,
    avgLatencyMs: 1900,
    costPerRun: 0.04,
    winRate: 20,
  },
];
