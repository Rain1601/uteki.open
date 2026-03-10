import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Chip,
  Checkbox,
  FormControlLabel,
  LinearProgress,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from '@mui/material';
import { Play, ChevronDown, History, RotateCcw } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { useTheme } from '../../theme/ThemeProvider';
import { toast } from 'sonner';
import {
  fetchModelConfig,
  ModelConfig,
  runLLMBacktestStream,
  fetchLLMBacktestRuns,
  fetchLLMBacktestDetail,
  LLMBacktestRunResult,
  LLMBacktestRunSummary,
  LLMBacktestProgressEvent,
} from '../../api/index';

const MODEL_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7c43', '#a05195',
  '#d45087', '#2f4b7c', '#665191', '#f95d6a', '#00b4d8',
];
const BENCHMARK_COLORS: Record<string, string> = { VOO: '#999', QQQ: '#666' };

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - 5 + i);

export default function LLMBacktestPanel() {
  const { theme, isDark } = useTheme();

  // Config
  const [year, setYear] = useState(currentYear - 1);
  const [initialCapital, setInitialCapital] = useState(10000);
  const [monthlyContribution, setMonthlyContribution] = useState(0);
  const [availableModels, setAvailableModels] = useState<ModelConfig[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);

  // Running state
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState('');
  const [modelProgress, setModelProgress] = useState<Record<string, { month: number; total: number }>>({});
  const cancelRef = useRef<(() => void) | null>(null);

  // Results
  const [result, setResult] = useState<LLMBacktestRunResult | null>(null);

  // History
  const [runs, setRuns] = useState<LLMBacktestRunSummary[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load models on mount
  const loadModels = useCallback(() => {
    setModelsLoading(true);
    fetchModelConfig().then((res) => {
      if (res.success && res.data) {
        setAvailableModels(res.data);
        const keys = res.data.slice(0, 2).map((m: ModelConfig) => `${m.provider}:${m.model}`);
        setSelectedKeys(keys);
      }
    }).catch((err) => {
      console.error('Failed to load models:', err);
      toast.error('Failed to load models. Please check your login status.');
    }).finally(() => setModelsLoading(false));
  }, []);

  useEffect(() => { loadModels(); }, [loadModels]);

  // Load history
  const loadHistory = useCallback(async () => {
    try {
      const res = await fetchLLMBacktestRuns(20);
      if (res.success && res.data) setRuns(res.data);
      return res.success ? res.data : [];
    } catch {
      return [];
    }
  }, []);

  // On mount: load history + auto-load latest completed run
  useEffect(() => {
    loadHistory().then(async (data) => {
      if (!data || data.length === 0) return;
      const latest = data.find((r: LLMBacktestRunSummary) => r.status === 'completed');
      if (latest) {
        try {
          const detail = await fetchLLMBacktestDetail(latest.id);
          if (detail.success && detail.data) setResult(detail.data);
        } catch { /* ignore */ }
      }
    });
  }, [loadHistory]);

  const toggleModel = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleRun = useCallback(() => {
    if (selectedKeys.length === 0) {
      toast.error('Select at least one model');
      return;
    }
    setRunning(true);
    setResult(null);
    setProgress('Starting backtest...');
    setModelProgress({});

    const { cancel } = runLLMBacktestStream(
      {
        year,
        initial_capital: initialCapital,
        monthly_contribution: monthlyContribution,
        model_keys: selectedKeys,
      },
      (event: LLMBacktestProgressEvent) => {
        switch (event.type) {
          case 'status':
            setProgress(event.message || '');
            break;
          case 'phase_start':
            setProgress(`Running ${event.total_models} models...`);
            break;
          case 'model_progress':
            if (event.model) {
              setModelProgress((prev) => ({
                ...prev,
                [event.model!]: { month: event.month || 0, total: event.total || 12 },
              }));
            }
            break;
          case 'model_complete':
            setProgress(`${event.model} done: ${event.return_pct?.toFixed(1)}%`);
            break;
          case 'result':
            setResult(event.data || null);
            setRunning(false);
            setProgress('');
            loadHistory();
            break;
          case 'error':
            toast.error(event.message || 'Backtest failed');
            setRunning(false);
            setProgress('');
            break;
        }
      },
    );
    cancelRef.current = cancel;
  }, [year, initialCapital, monthlyContribution, selectedKeys, loadHistory]);

  const handleCancel = () => {
    cancelRef.current?.();
    setRunning(false);
    setProgress('Cancelled');
  };

  const handleLoadRun = useCallback(async (runId: string) => {
    const res = await fetchLLMBacktestDetail(runId);
    if (res.success && res.data) {
      setResult(res.data);
      setShowHistory(false);
    }
  }, []);

  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)';
  const cardBorder = `1px solid ${theme.border.subtle}`;

  const fmt = (v: number) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  const pctColor = (v: number) => (v >= 0 ? '#4caf50' : '#f44336');

  // Build chart data
  const chartData = result ? buildChartData(result) : [];

  // Overall progress
  const totalProgress = running
    ? Object.values(modelProgress).reduce((sum, p) => sum + p.month, 0) /
      Math.max(Object.keys(modelProgress).length * 12, 1) * 100
    : 0;

  return (
    <Box sx={{ p: 3, overflow: 'auto', height: '100%' }}>
      {/* ── Config ── */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3, alignItems: 'flex-end' }}>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel sx={{ color: theme.text.muted }}>Year</InputLabel>
          <Select
            value={year}
            label="Year"
            onChange={(e) => setYear(Number(e.target.value))}
            sx={{ color: theme.text.primary, '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.border.subtle } }}
          >
            {yearOptions.map((y) => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Initial Capital"
          type="number"
          size="small"
          value={initialCapital}
          onChange={(e) => setInitialCapital(Number(e.target.value))}
          sx={{ width: 140, '& input': { color: theme.text.primary } }}
        />

        <TextField
          label="Monthly Add"
          type="number"
          size="small"
          value={monthlyContribution}
          onChange={(e) => setMonthlyContribution(Number(e.target.value))}
          sx={{ width: 130, '& input': { color: theme.text.primary } }}
        />

        <Button
          variant="contained"
          startIcon={<Play size={16} />}
          onClick={handleRun}
          disabled={running || selectedKeys.length === 0}
          sx={{ height: 40, textTransform: 'none' }}
        >
          Run Backtest
        </Button>

        {running && (
          <Button
            variant="outlined"
            color="error"
            onClick={handleCancel}
            sx={{ height: 40, textTransform: 'none' }}
          >
            Cancel
          </Button>
        )}

        <Button
          variant="text"
          startIcon={<History size={16} />}
          onClick={() => setShowHistory(!showHistory)}
          sx={{ height: 40, textTransform: 'none', ml: 'auto', color: theme.text.muted }}
        >
          History
        </Button>
      </Box>

      {/* Model selection */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2, alignItems: 'center' }}>
        {modelsLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={16} />
            <Typography sx={{ fontSize: 12, color: theme.text.muted }}>Loading models...</Typography>
          </Box>
        ) : availableModels.length === 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: 12, color: theme.text.muted }}>
              No models available. Configure models in Settings or Admin.
            </Typography>
            <Button size="small" onClick={loadModels} sx={{ textTransform: 'none', fontSize: 11 }}>
              <RotateCcw size={12} style={{ marginRight: 4 }} /> Retry
            </Button>
          </Box>
        ) : (
          availableModels.map((m) => {
            const key = `${m.provider}:${m.model}`;
            const selected = selectedKeys.includes(key);
            return (
              <FormControlLabel
                key={key}
                control={
                  <Checkbox
                    size="small"
                    checked={selected}
                    onChange={() => toggleModel(key)}
                    disabled={running}
                  />
                }
                label={
                  <Typography sx={{ fontSize: 12, color: theme.text.secondary }}>
                    {m.provider}/{m.model.split('-').slice(-2).join('-')}
                  </Typography>
                }
                sx={{ mr: 0 }}
              />
            );
          })
        )}
      </Box>

      {/* Progress */}
      {running && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress variant="determinate" value={totalProgress} sx={{ mb: 1, borderRadius: 1 }} />
          <Typography sx={{ fontSize: 12, color: theme.text.muted }}>{progress}</Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: 0.5, flexWrap: 'wrap' }}>
            {Object.entries(modelProgress).map(([model, p]) => (
              <Chip
                key={model}
                size="small"
                label={`${model.split(':')[1]?.split('-').slice(-2).join('-') || model}: ${p.month}/12`}
                sx={{ fontSize: 11 }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* History sidebar */}
      {showHistory && runs.length > 0 && (
        <Box
          sx={{
            mb: 3, p: 2, background: cardBg, border: cardBorder, borderRadius: 2,
            maxHeight: 200, overflow: 'auto',
          }}
        >
          <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1, color: theme.text.primary }}>
            Past Runs
          </Typography>
          {runs.map((r) => (
            <Box
              key={r.id}
              onClick={() => handleLoadRun(r.id)}
              sx={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                py: 0.5, px: 1, borderRadius: 1, cursor: 'pointer',
                '&:hover': { background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
              }}
            >
              <Typography sx={{ fontSize: 12, color: theme.text.secondary }}>
                {r.year} — {fmt(r.initial_capital)} — {r.model_keys?.length || 0} models
              </Typography>
              <Chip
                size="small"
                label={r.status}
                color={r.status === 'completed' ? 'success' : 'default'}
                sx={{ fontSize: 10, height: 20 }}
              />
            </Box>
          ))}
        </Box>
      )}

      {/* ── Results ── */}
      {result && (
        <>
          {/* Chart */}
          <Box sx={{ background: cardBg, border: cardBorder, borderRadius: 2, p: 2, mb: 3 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 2, color: theme.text.primary }}>
              Portfolio Value — {result.year}
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.border.subtle} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: theme.text.muted }} />
                <YAxis
                  tick={{ fontSize: 11, fill: theme.text.muted }}
                  tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: isDark ? '#1a1a2e' : '#fff',
                    border: cardBorder,
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [fmt(value), '']}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {result.model_results.map((mr, i) => (
                  <Line
                    key={mr.model_key}
                    type="monotone"
                    dataKey={mr.model_key}
                    stroke={MODEL_COLORS[i % MODEL_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    name={mr.model_key.split(':').pop()?.split('-').slice(-2).join('-') || mr.model_key}
                  />
                ))}
                {Object.keys(result.benchmarks).map((sym) => (
                  <Line
                    key={sym}
                    type="monotone"
                    dataKey={sym}
                    stroke={BENCHMARK_COLORS[sym] || '#aaa'}
                    strokeWidth={1.5}
                    strokeDasharray="6 3"
                    dot={false}
                    name={`${sym} (DCA)`}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Box>

          {/* Summary table */}
          <Box sx={{ background: cardBg, border: cardBorder, borderRadius: 2, p: 2, mb: 3, overflowX: 'auto' }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 2, color: theme.text.primary }}>
              Summary
            </Typography>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <Box component="thead">
                <Box component="tr" sx={{ '& th': { textAlign: 'left', py: 0.5, px: 1, color: theme.text.muted, borderBottom: cardBorder } }}>
                  <th>Model</th>
                  <th>Final Value</th>
                  <th>Return</th>
                  <th>Max DD</th>
                  <th>Sharpe</th>
                  <th>API Cost</th>
                </Box>
              </Box>
              <Box component="tbody">
                {result.model_results.map((mr) => (
                  <Box component="tr" key={mr.model_key} sx={{ '& td': { py: 0.5, px: 1, color: theme.text.primary, borderBottom: `1px solid ${theme.border.subtle}22` } }}>
                    <td>
                      <Typography sx={{ fontSize: 12, fontWeight: 500 }}>
                        {mr.model_key.split(':').pop()?.split('-').slice(-2).join('-') || mr.model_key}
                      </Typography>
                    </td>
                    <td>{fmt(mr.final_value)}</td>
                    <td style={{ color: pctColor(mr.total_return_pct), fontWeight: 600 }}>
                      {mr.total_return_pct > 0 ? '+' : ''}{mr.total_return_pct.toFixed(1)}%
                    </td>
                    <td style={{ color: '#f44336' }}>-{mr.max_drawdown_pct.toFixed(1)}%</td>
                    <td>{mr.sharpe_ratio.toFixed(2)}</td>
                    <td>${mr.total_cost_usd.toFixed(2)}</td>
                  </Box>
                ))}
                {/* Benchmarks */}
                {Object.entries(result.benchmarks).map(([sym, bm]) => (
                  <Box component="tr" key={sym} sx={{ '& td': { py: 0.5, px: 1, color: theme.text.muted, borderBottom: `1px solid ${theme.border.subtle}22` } }}>
                    <td>{sym} (DCA)</td>
                    <td>{fmt(bm.final_value)}</td>
                    <td style={{ color: pctColor(bm.return_pct), fontWeight: 600 }}>
                      {bm.return_pct > 0 ? '+' : ''}{bm.return_pct.toFixed(1)}%
                    </td>
                    <td>—</td>
                    <td>—</td>
                    <td>—</td>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>

          {/* Decision details (expandable per model) */}
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 1, color: theme.text.primary }}>
              Monthly Decisions
            </Typography>
            {result.model_results.map((mr) => (
              <Accordion
                key={mr.model_key}
                sx={{
                  background: cardBg, border: cardBorder, boxShadow: 'none',
                  '&:before': { display: 'none' }, mb: 1,
                }}
              >
                <AccordionSummary expandIcon={<ChevronDown size={16} color={theme.text.muted} />}>
                  <Typography sx={{ fontSize: 13, fontWeight: 500, color: theme.text.primary }}>
                    {mr.model_key.split(':').pop() || mr.model_key}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 1 }}>
                  <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <Box component="thead">
                      <Box component="tr" sx={{ '& th': { textAlign: 'left', py: 0.5, px: 1, color: theme.text.muted, fontSize: 10 } }}>
                        <th>Month</th>
                        <th>Date</th>
                        <th>Action</th>
                        <th>Allocations</th>
                        <th>Value</th>
                        <th>Reasoning</th>
                      </Box>
                    </Box>
                    <Box component="tbody">
                      {mr.steps.map((step) => (
                        <Box component="tr" key={step.month} sx={{ '& td': { py: 0.5, px: 1, color: theme.text.secondary, verticalAlign: 'top' } }}>
                          <td>{step.month}</td>
                          <td>{step.date}</td>
                          <td>
                            <Chip
                              size="small"
                              label={step.action}
                              sx={{
                                fontSize: 10, height: 18,
                                bgcolor: step.action === 'BUY' ? '#4caf5022' : step.action === 'REBALANCE' ? '#ff980022' : '#9e9e9e22',
                                color: step.action === 'BUY' ? '#4caf50' : step.action === 'REBALANCE' ? '#ff9800' : theme.text.muted,
                              }}
                            />
                          </td>
                          <td>
                            {step.allocations && Object.keys(step.allocations).length > 0
                              ? Object.entries(step.allocations).map(([s, p]) => `${s}: ${p}%`).join(', ')
                              : '—'}
                          </td>
                          <td>{fmt(step.portfolio_value)}</td>
                          <td>
                            <Typography sx={{ fontSize: 10, color: theme.text.muted, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {step.reasoning || '—'}
                            </Typography>
                          </td>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </>
      )}

      {/* Empty state */}
      {!result && !running && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <RotateCcw size={40} color={theme.text.muted} style={{ opacity: 0.3 }} />
          <Typography sx={{ mt: 2, color: theme.text.muted, fontSize: 14 }}>
            Configure parameters and select models to run an LLM-driven backtest.
          </Typography>
          <Typography sx={{ color: theme.text.muted, fontSize: 12, mt: 0.5 }}>
            Each model makes independent monthly investment decisions across the selected year.
          </Typography>
        </Box>
      )}
    </Box>
  );
}

// ── Helpers ──

function buildChartData(result: LLMBacktestRunResult) {
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const data: Record<string, any>[] = [];

  for (const month of months) {
    const point: Record<string, any> = { month: `M${month}` };

    for (const mr of result.model_results) {
      const step = mr.steps.find((s) => s.month === month);
      if (step) point[mr.model_key] = step.portfolio_value;
    }

    // Benchmarks: linearly interpolate (we only have final values)
    // For a better chart, compute monthly benchmark values from the steps
    // Simple approach: assume linear growth
    for (const [sym, bm] of Object.entries(result.benchmarks)) {
      const totalInvested = result.initial_capital + result.monthly_contribution * Math.max(month - 1, 0);
      const totalInvestedFull = bm.total_invested || result.initial_capital + result.monthly_contribution * 11;
      const ratio = totalInvestedFull > 0 ? bm.final_value / totalInvestedFull : 1;
      point[sym] = Math.round(totalInvested * (1 + (ratio - 1) * (month / 12)));
    }

    data.push(point);
  }

  return data;
}
