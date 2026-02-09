import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Collapse,
  TextField,
  MenuItem,
  Skeleton,
} from '@mui/material';
import {
  PlayArrow as RunIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as AdoptIcon,
  ErrorOutline as ErrorIcon,
  AccessTime as PendingIcon,
} from '@mui/icons-material';
import { useTheme } from '../../theme/ThemeProvider';
import LoadingDots from '../LoadingDots';
import { useToast } from '../Toast';
import {
  ArenaTimelinePoint,
  ModelIOSummary,
  ModelIODetail,
  runArena,
  fetchArenaTimeline,
  fetchArenaResults,
  fetchModelIODetail,
  adoptModel,
} from '../../api/index';
import { ModelLogo } from './ModelLogos';
import ArenaTimelineChart from './ArenaTimelineChart';

// 当前已配置的模型列表（用于生成占位卡片）
const KNOWN_MODELS = [
  { provider: 'anthropic', name: 'claude-sonnet-4-20250514' },
  { provider: 'openai', name: 'gpt-4o' },
  { provider: 'deepseek', name: 'deepseek-chat' },
  { provider: 'google', name: 'gemini-2.0-flash' },
  { provider: 'qwen', name: 'qwen-plus' },
  { provider: 'minimax', name: 'MiniMax-Text-01' },
];

export default function ArenaView() {
  const { theme, isDark } = useTheme();
  const { showToast } = useToast();

  // Timeline data
  const [timeline, setTimeline] = useState<ArenaTimelinePoint[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  // Selected point
  const [selectedHarnessId, setSelectedHarnessId] = useState<string | null>(null);
  const [selectedModels, setSelectedModels] = useState<ModelIOSummary[]>([]);
  const [selectedHarnessType, setSelectedHarnessType] = useState('');
  const [selectedPromptVersion, setSelectedPromptVersion] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);

  // Run controls
  const [running, setRunning] = useState(false);
  const [harnessType, setHarnessType] = useState('monthly_dca');
  const [budget, setBudget] = useState(1000);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)';

  // Load timeline data
  const loadTimeline = useCallback(async () => {
    setTimelineLoading(true);
    try {
      const res = await fetchArenaTimeline();
      if (res.success && res.data) {
        setTimeline(res.data);
        // Default select latest point
        if (res.data.length > 0 && !selectedHarnessId) {
          const latest = res.data[res.data.length - 1];
          handleSelectPoint(latest.harness_id, res.data);
        }
      }
    } catch { /* ignore */ }
    finally { setTimelineLoading(false); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadTimeline(); }, [loadTimeline]);

  // Timer
  useEffect(() => {
    if (running) {
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running]);

  // Select a point on the chart
  const handleSelectPoint = useCallback(async (harnessId: string, timelineData?: ArenaTimelinePoint[]) => {
    const tl = timelineData || timeline;
    const point = tl.find((p) => p.harness_id === harnessId);

    setSelectedHarnessId(harnessId);
    setSelectedHarnessType(point?.harness_type || '');
    setSelectedPromptVersion(point?.prompt_version || '');
    setSelectedModels([]);
    setDetailLoading(true);

    try {
      const res = await fetchArenaResults(harnessId);
      if (res.success && res.data) setSelectedModels(res.data);
      else showToast('Failed to load arena results', 'error');
    } catch { showToast('Failed to load arena results', 'error'); }
    finally { setDetailLoading(false); }
  }, [timeline, showToast]);

  // Run Arena
  const handleRun = useCallback(async () => {
    setRunning(true);
    try {
      const res = await runArena({ harness_type: harnessType, budget });
      if (res.success && res.data) {
        // After run, reload timeline and select the new run
        setSelectedHarnessId(res.data.harness_id);
        setSelectedHarnessType(res.data.harness_type);
        setSelectedPromptVersion(res.data.prompt_version || '');
        setSelectedModels(res.data.models);
        // Reload timeline to include new data point
        const tlRes = await fetchArenaTimeline();
        if (tlRes.success && tlRes.data) setTimeline(tlRes.data);
      } else {
        showToast(res.error || 'Arena run failed', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Arena run failed', 'error');
    } finally {
      setRunning(false);
    }
  }, [harnessType, budget, showToast]);

  const hasData = timeline.length > 0;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* ── Top Controls ── */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', px: 3, py: 1.5, flexWrap: 'wrap', flexShrink: 0, borderBottom: `1px solid ${theme.border.subtle}` }}>
        <TextField
          select
          size="small"
          label="Harness Type"
          value={harnessType}
          onChange={(e) => setHarnessType(e.target.value)}
          sx={{ minWidth: 160 }}
          InputProps={{ sx: { color: theme.text.primary, fontSize: 13 } }}
          InputLabelProps={{ sx: { color: theme.text.muted } }}
        >
          <MenuItem value="monthly_dca">Monthly DCA</MenuItem>
          <MenuItem value="weekly_check">Weekly Check</MenuItem>
          <MenuItem value="adhoc">Ad Hoc</MenuItem>
        </TextField>

        <TextField
          size="small"
          label="Budget ($)"
          type="number"
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          sx={{ width: 120 }}
          InputProps={{ sx: { color: theme.text.primary, fontSize: 13 } }}
          InputLabelProps={{ sx: { color: theme.text.muted } }}
        />

        <Button
          startIcon={running ? undefined : <RunIcon />}
          onClick={handleRun}
          disabled={running}
          sx={{
            bgcolor: theme.brand.primary,
            color: '#fff',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: 13,
            borderRadius: 2,
            px: 3,
            '&:hover': { bgcolor: theme.brand.hover },
          }}
        >
          {running ? <LoadingDots text="Running Arena" fontSize={13} color="#fff" /> : 'Run Arena'}
        </Button>

        {running && (
          <Typography sx={{ fontSize: 12, color: theme.text.muted, ml: 1 }}>
            {elapsedSeconds}s
          </Typography>
        )}
      </Box>

      {/* ── Main Content: Left Chart + Right Detail ── */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        {/* ── Left Panel: Timeline Chart (70%) ── */}
        <Box
          sx={{
            width: { xs: '100%', md: '70%' },
            height: { xs: 280, md: '100%' },
            flexShrink: 0,
            borderRight: { xs: 'none', md: `1px solid ${theme.border.subtle}` },
            borderBottom: { xs: `1px solid ${theme.border.subtle}`, md: 'none' },
          }}
        >
          {timelineLoading ? (
            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LoadingDots text="Loading timeline" fontSize={13} />
            </Box>
          ) : (
            <ArenaTimelineChart
              data={timeline}
              selectedHarnessId={selectedHarnessId}
              onSelectPoint={(id) => handleSelectPoint(id)}
            />
          )}
        </Box>

        {/* ── Right Panel: Model Cards (30%) ── */}
        <Box
          sx={{
            width: { xs: '100%', md: '30%' },
            overflow: 'auto',
            px: 1.5,
            py: 1.5,
            minWidth: 0,
          }}
        >
          {/* Running skeleton */}
          {running && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.text.secondary }}>
                  Arena Results
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {KNOWN_MODELS.map((m) => (
                  <Box key={m.provider}>
                    <SkeletonModelCard
                      provider={m.provider}
                      modelName={m.name}
                      theme={theme}
                      isDark={isDark}
                      elapsedSeconds={elapsedSeconds}
                    />
                  </Box>
                ))}
              </Box>
            </>
          )}

          {/* No data empty state */}
          {!running && !hasData && !selectedHarnessId && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 1 }}>
              <Typography sx={{ fontSize: 16, fontWeight: 600, color: theme.text.muted }}>
                Multi-Model Arena
              </Typography>
              <Typography sx={{ fontSize: 13, color: theme.text.muted, textAlign: 'center', maxWidth: 480 }}>
                Arena 将同一份市场数据快照（Decision Harness）同时发送给多个 LLM，
                让它们独立给出投资建议，方便你对比不同模型的分析能力和决策质量。
              </Typography>
            </Box>
          )}

          {/* Selected model results */}
          {!running && selectedHarnessId && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.text.secondary }}>
                  Results
                </Typography>
                {selectedHarnessType && (
                  <Chip
                    label={selectedHarnessType.replace('_', ' ')}
                    size="small"
                    sx={{ fontSize: 9, height: 18, bgcolor: cardBg, color: theme.text.muted }}
                  />
                )}
                {selectedPromptVersion && (
                  <Chip
                    label={selectedPromptVersion}
                    size="small"
                    sx={{ fontSize: 9, height: 18, bgcolor: 'rgba(76,175,80,0.1)', color: '#4caf50' }}
                  />
                )}
              </Box>

              {detailLoading && selectedModels.length === 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {KNOWN_MODELS.map((m) => (
                    <SkeletonModelCard
                      key={m.provider}
                      provider={m.provider}
                      modelName={m.name}
                      theme={theme}
                      isDark={isDark}
                      elapsedSeconds={0}
                    />
                  ))}
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {selectedModels.map((model) => (
                    <ModelCard
                      key={model.id}
                      model={model}
                      harnessId={selectedHarnessId}
                      theme={theme}
                      isDark={isDark}
                    />
                  ))}
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}

/* ── 骨架加载卡片 ── */
function SkeletonModelCard({
  provider,
  modelName,
  theme,
  isDark,
  elapsedSeconds,
}: {
  provider: string;
  modelName: string;
  theme: any;
  isDark: boolean;
  elapsedSeconds: number;
}) {
  return (
    <Box sx={{ borderBottom: `1px solid ${theme.border.subtle}`, pb: 1 }}>
      <Box sx={{ py: 0.8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ModelLogo provider={provider} size={18} isDark={isDark} />
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.text.primary }}>
            {modelName}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <PendingIcon sx={{ fontSize: 12, color: theme.text.muted, animation: 'spin 2s linear infinite', '@keyframes spin': { '100%': { transform: 'rotate(360deg)' } } }} />
          <Typography sx={{ fontSize: 10, color: theme.text.muted }}>
            {elapsedSeconds}s
          </Typography>
        </Box>
      </Box>
      <Skeleton variant="rounded" width={50} height={16} sx={{ mb: 0.5, bgcolor: 'rgba(128,128,128,0.1)' }} />
      <Skeleton variant="text" width="70%" sx={{ bgcolor: 'rgba(128,128,128,0.08)', height: 14 }} />
    </Box>
  );
}

/* ── 结果卡片 ── */
function ModelCard({
  model,
  harnessId,
  theme,
  isDark,
}: {
  model: ModelIOSummary;
  harnessId: string;
  theme: any;
  isDark: boolean;
}) {
  const { showToast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState<ModelIODetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [adopting, setAdopting] = useState(false);

  const isError = model.status === 'error' || model.status === 'timeout';
  const structured = model.output_structured || {};

  const handleExpand = async () => {
    if (!expanded && !detail) {
      setDetailLoading(true);
      try {
        const res = await fetchModelIODetail(harnessId, model.id);
        if (res.success && res.data) setDetail(res.data);
      } catch { /* ignore */ }
      finally { setDetailLoading(false); }
    }
    setExpanded(!expanded);
  };

  const handleAdopt = async () => {
    setAdopting(true);
    try {
      const res = await adoptModel(harnessId, model.id);
      if (res.success) {
        showToast(`Adopted ${model.model_name}`, 'success');
      } else {
        showToast(res.error || 'Adopt failed', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Adopt failed', 'error');
    } finally {
      setAdopting(false);
    }
  };

  const statusColor = isError ? '#f44336' : model.parse_status === 'structured' ? '#4caf50' : '#ff9800';
  const statusBg = isError ? 'rgba(244,67,54,0.12)' : model.parse_status === 'structured' ? 'rgba(76,175,80,0.12)' : 'rgba(255,152,0,0.12)';
  const statusLabel = isError ? (model.status === 'timeout' ? 'timeout' : 'error') : model.parse_status || 'ok';

  return (
    <Box
      sx={{
        borderBottom: `1px solid ${isError ? 'rgba(244,67,54,0.3)' : theme.border.subtle}`,
        opacity: isError ? 0.75 : 1,
        pb: 0.5,
      }}
    >
      {/* Header */}
      <Box sx={{ py: 0.8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ModelLogo provider={model.model_provider} size={18} isDark={isDark} />
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.text.primary }}>
            {model.model_name}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
          {structured.action && (
            <Chip
              label={structured.action}
              size="small"
              sx={{
                fontWeight: 600,
                fontSize: 10,
                height: 18,
                bgcolor: structured.action === 'BUY' ? 'rgba(76,175,80,0.15)' : structured.action === 'SELL' ? 'rgba(244,67,54,0.15)' : 'rgba(255,152,0,0.15)',
                color: structured.action === 'BUY' ? '#4caf50' : structured.action === 'SELL' ? '#f44336' : '#ff9800',
              }}
            />
          )}
          <Chip
            icon={isError ? <ErrorIcon sx={{ fontSize: '12px !important' }} /> : undefined}
            label={statusLabel}
            size="small"
            sx={{ fontSize: 9, height: 18, bgcolor: statusBg, color: statusColor }}
          />
        </Box>
      </Box>

      {/* Error message */}
      {isError && model.error_message && (
        <Box sx={{ pb: 0.5 }}>
          <Typography sx={{ fontSize: 11, color: '#f44336', lineHeight: 1.4 }}>
            {model.error_message.length > 80 ? model.error_message.slice(0, 80) + '...' : model.error_message}
          </Typography>
        </Box>
      )}

      {/* Summary — allocations + metrics in compact row */}
      {!isError && (
        <Box sx={{ pb: 0.5 }}>
          {structured.allocations?.map((alloc: any, i: number) => (
            <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.15 }}>
              <Typography sx={{ fontSize: 11, color: theme.text.primary }}>{alloc.etf}</Typography>
              <Typography sx={{ fontSize: 11, color: theme.text.secondary }}>
                ${alloc.amount?.toLocaleString()} ({alloc.percentage}%)
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* Metrics */}
      <Box sx={{ pb: 0.5, display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        {model.latency_ms != null && model.latency_ms > 0 && (
          <Typography sx={{ fontSize: 10, color: theme.text.muted }}>
            {(model.latency_ms / 1000).toFixed(1)}s
          </Typography>
        )}
        {model.cost_usd != null && model.cost_usd > 0 && (
          <Typography sx={{ fontSize: 10, color: theme.text.muted }}>
            ${model.cost_usd.toFixed(4)}
          </Typography>
        )}
        {model.output_token_count != null && model.output_token_count > 0 && (
          <Typography sx={{ fontSize: 10, color: theme.text.muted }}>
            {model.output_token_count} tok
          </Typography>
        )}
        {structured.confidence != null && (
          <Typography sx={{ fontSize: 10, color: theme.text.muted }}>
            {(structured.confidence * 100).toFixed(0)}%
          </Typography>
        )}
      </Box>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 0.5, py: 0.3 }}>
        <Button
          size="small"
          onClick={handleExpand}
          endIcon={expanded ? <ExpandLessIcon sx={{ fontSize: 14 }} /> : <ExpandMoreIcon sx={{ fontSize: 14 }} />}
          sx={{ color: theme.text.muted, textTransform: 'none', fontSize: 11, borderRadius: 1, py: 0.2, minHeight: 24 }}
        >
          {expanded ? 'Collapse' : 'Details'}
        </Button>
        {!isError && (
          <Button
            size="small"
            startIcon={<AdoptIcon sx={{ fontSize: 14 }} />}
            onClick={handleAdopt}
            disabled={adopting}
            sx={{
              color: theme.brand.primary,
              textTransform: 'none',
              fontSize: 11,
              fontWeight: 600,
              borderRadius: 1,
              py: 0.2,
              minHeight: 24,
            }}
          >
            {adopting ? '...' : 'Adopt'}
          </Button>
        )}
      </Box>

      {/* Detail */}
      <Collapse in={expanded}>
        <Box sx={{ py: 1, maxHeight: 200, overflow: 'auto' }}>
          {detailLoading ? (
            <LoadingDots text="Loading" fontSize={12} />
          ) : detail ? (
            <Box sx={{ fontSize: 12, fontFamily: 'monospace', color: theme.text.secondary }}>
              {detail.error_message && (
                <>
                  <Typography sx={{ fontSize: 11, color: '#f44336', mb: 0.5, fontWeight: 600 }}>
                    Error:
                  </Typography>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#f44336', marginBottom: 12 }}>
                    {detail.error_message}
                  </pre>
                </>
              )}
              {detail.output_raw && (
                <>
                  <Typography sx={{ fontSize: 11, color: theme.text.muted, mb: 0.5, fontWeight: 600 }}>
                    Raw Output:
                  </Typography>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: 12 }}>
                    {detail.output_raw}
                  </pre>
                </>
              )}
              {structured.reasoning && (
                <>
                  <Typography sx={{ fontSize: 11, color: theme.text.muted, mb: 0.5, fontWeight: 600 }}>
                    Reasoning:
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: theme.text.secondary, lineHeight: 1.6 }}>
                    {structured.reasoning}
                  </Typography>
                </>
              )}
              {!detail.output_raw && !detail.error_message && !structured.reasoning && (
                <Typography sx={{ fontSize: 12, color: theme.text.muted }}>No details available</Typography>
              )}
            </Box>
          ) : (
            <Typography sx={{ fontSize: 12, color: theme.text.muted }}>No details available</Typography>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}
