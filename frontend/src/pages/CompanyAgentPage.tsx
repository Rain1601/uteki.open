import { useState, useRef, useCallback, useEffect } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { Loader2, Trash2 } from 'lucide-react';
import TradingViewChart from '../components/index/TradingViewChart';
import { useTheme } from '../theme/ThemeProvider';
import CompanyAnalysisForm from '../components/company/CompanyAnalysisForm';
import { type GateStatus } from '../components/company/GateProgressTracker';
import ThinkingTimeline from '../components/company/ThinkingTimeline';
import ReportPanel from '../components/company/ReportPanel';
import {
  analyzeCompanyStream,
  listCompanyAnalyses,
  getCompanyAnalysis,
  deleteCompanyAnalysis,
  type CompanyProgressEvent,
  type CompanyAnalysisResult,
  type CompanyAnalysisSummary,
  type CompanyAnalysisDetail,
  type PositionHoldingOutput,
  type GateResult,
} from '../api/company';

const spinKeyframes = `
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes analyzing-pulse {
  0%, 100% { background-color: rgba(59,130,246,0.08); }
  50% { background-color: rgba(59,130,246,0.18); }
}`;

interface RunningAnalysis {
  id: string;
  analysisId: string | null;
  symbol: string;
  provider: string;
  cancel: () => void;
  currentGate: number | null;
  gateStatuses: Record<number, GateStatus>;
  gateResults: Record<string, any>;
  streamingTexts: Record<string, string>;
  companyInfo: { name: string; symbol: string; sector: string; industry: string; price: number } | null;
  result: CompanyAnalysisResult | null;
  error: string | null;
  startTime: number;
  elapsedMs: number;
}

const SKILL_ORDER = [
  'business_analysis', 'fisher_qa', 'moat_assessment',
  'management_assessment', 'reverse_test', 'valuation', 'final_verdict',
] as const;

const ACTION_COLORS: Record<string, string> = {
  BUY: '#22c55e', WATCH: '#f59e0b', AVOID: '#ef4444',
};

export default function CompanyAgentPage() {
  const { theme } = useTheme();

  const [analyses, setAnalyses] = useState<CompanyAnalysisSummary[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<CompanyAnalysisDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [runningAnalyses, setRunningAnalyses] = useState<Map<string, RunningAnalysis>>(new Map());
  const [viewingRunId, setViewingRunId] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [scrollToGate, setScrollToGate] = useState<number | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const runIdCounter = useRef(0);
  const runningRef = useRef(runningAnalyses);
  runningRef.current = runningAnalyses;

  const hasSelection = !!viewingRunId || !!selectedId;

  // ── Data loading ──
  useEffect(() => {
    (async () => {
      try {
        const { analyses: list } = await listCompanyAnalyses({ limit: 100 });
        setAnalyses(list);
      } catch (e) { console.error('Failed to load analyses:', e); }
      finally { setLoadingHistory(false); }
    })();
  }, []);

  useEffect(() => {
    if (runningAnalyses.size > 0) {
      timerRef.current = setInterval(() => {
        setRunningAnalyses((prev) => {
          const next = new Map(prev);
          let changed = false;
          for (const [id, ra] of next) {
            const elapsed = Date.now() - ra.startTime;
            if (elapsed !== ra.elapsedMs) { next.set(id, { ...ra, elapsedMs: elapsed }); changed = true; }
          }
          return changed ? next : prev;
        });
      }, 200);
    } else { if (timerRef.current) clearInterval(timerRef.current); }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [runningAnalyses.size > 0]);

  useEffect(() => { return () => { runningRef.current.forEach((ra) => ra.cancel()); }; }, []);

  useEffect(() => {
    if (!selectedId) { setSelectedDetail(null); return; }
    let cancelled = false;
    setLoadingDetail(true);
    (async () => {
      try {
        const detail = await getCompanyAnalysis(selectedId);
        if (!cancelled) { setSelectedDetail(detail); if (detail.status !== 'running') setReportOpen(true); }
      } catch (e) { console.error('Failed to load analysis detail:', e); }
      finally { if (!cancelled) setLoadingDetail(false); }
    })();
    return () => { cancelled = true; };
  }, [selectedId]);

  // Poll running DB records
  const pollingIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const localAnalysisIds = new Set(Array.from(runningAnalyses.values()).map((ra) => ra.analysisId).filter(Boolean));
    const dbRunning = analyses.filter((a) => a.status === 'running' && !localAnalysisIds.has(a.id));
    if (dbRunning.length === 0) { pollingIdsRef.current.clear(); return; }
    const ids = new Set(dbRunning.map((a) => a.id));
    pollingIdsRef.current = ids;
    const interval = setInterval(async () => {
      for (const id of Array.from(pollingIdsRef.current)) {
        try {
          const detail = await getCompanyAnalysis(id);
          if (detail.status === 'completed' || detail.status === 'error') {
            setAnalyses((prev) => prev.map((a) => a.id === id ? { ...a, ...detail } : a));
            pollingIdsRef.current.delete(id);
            if (selectedId === id) setSelectedDetail(detail);
          } else if (selectedId === id) { setSelectedDetail(detail); }
        } catch { /* ignore */ }
      }
      if (pollingIdsRef.current.size === 0) clearInterval(interval);
    }, 3000);
    return () => clearInterval(interval);
  }, [analyses.filter((a) => a.status === 'running').length, runningAnalyses.size]);

  // ── Analyze handler (SSE) ──
  const handleAnalyze = useCallback((symbol: string, provider?: string) => {
    const runId = `run_${++runIdCounter.current}`;
    setReportOpen(false);
    const initial: RunningAnalysis = {
      id: runId, analysisId: null, symbol, provider: provider || 'auto',
      cancel: () => {}, currentGate: null, gateStatuses: {}, gateResults: {},
      streamingTexts: {}, companyInfo: null, result: null, error: null,
      startTime: Date.now(), elapsedMs: 0,
    };
    const updateRun = (updater: (prev: RunningAnalysis) => RunningAnalysis) => {
      setRunningAnalyses((prev) => {
        const ra = prev.get(runId);
        if (!ra) return prev;
        const next = new Map(prev);
        next.set(runId, updater(ra));
        return next;
      });
    };
    const stream = analyzeCompanyStream({ symbol, provider }, (event: CompanyProgressEvent) => {
      switch (event.type) {
        case 'data_loaded':
          updateRun((ra) => ({
            ...ra, analysisId: event.analysis_id || null,
            companyInfo: { name: event.company_name || symbol, symbol: event.symbol || symbol, sector: event.sector || '', industry: event.industry || '', price: event.current_price || 0 },
          }));
          if (event.analysis_id) {
            const runningSummary: CompanyAnalysisSummary = {
              id: event.analysis_id, symbol: event.symbol || symbol, company_name: event.company_name || symbol,
              provider: provider || 'auto', model: '', status: 'running',
              verdict_action: 'WATCH', verdict_conviction: 0.5, verdict_quality: 'GOOD',
              total_latency_ms: 0, created_at: new Date().toISOString(),
            };
            setAnalyses((prev) => [runningSummary, ...prev]);
          }
          break;
        case 'gate_start':
          if (event.gate) updateRun((ra) => ({ ...ra, currentGate: event.gate!, gateStatuses: { ...ra.gateStatuses, [event.gate!]: 'running' as GateStatus } }));
          break;
        case 'gate_text':
          if (event.skill && event.text) updateRun((ra) => ({ ...ra, streamingTexts: { ...ra.streamingTexts, [event.skill!]: (ra.streamingTexts[event.skill!] || '') + event.text! } }));
          break;
        case 'gate_complete':
          if (event.gate) {
            const status: GateStatus = event.parse_status === 'timeout' ? 'timeout' : event.parse_status === 'error' ? 'error' : 'complete';
            updateRun((ra) => {
              const newStatuses = { ...ra.gateStatuses, [event.gate!]: status };
              const newResults = { ...ra.gateResults };
              const newStreamingTexts = { ...ra.streamingTexts };
              if (event.skill) {
                delete newStreamingTexts[event.skill];
                newResults[event.skill] = { gate: event.gate, display_name: event.display_name, parsed: event.parsed || {}, parse_status: event.parse_status, latency_ms: event.latency_ms, error: event.error, raw: event.raw || '' };
                if (event.skill === 'final_verdict' && event.parsed) {
                  for (const sn of ['business_analysis', 'fisher_qa', 'moat_assessment', 'management_assessment', 'reverse_test', 'valuation']) {
                    const gateData = event.parsed[sn];
                    if (gateData && typeof gateData === 'object' && newResults[sn]) newResults[sn] = { ...newResults[sn], parsed: gateData, parse_status: 'structured' };
                  }
                }
              }
              return { ...ra, gateStatuses: newStatuses, gateResults: newResults, streamingTexts: newStreamingTexts };
            });
          }
          break;
        case 'result':
          if (event.data) {
            const resultData = event.data;
            updateRun((ra) => ({ ...ra, result: resultData }));
            setReportOpen(true);
            if (resultData.analysis_id) {
              const completedSummary: CompanyAnalysisSummary = {
                id: resultData.analysis_id, symbol: resultData.symbol, company_name: resultData.company_name,
                provider: resultData.model_used.split('/')[0], model: resultData.model_used.split('/')[1] || '',
                status: 'completed', verdict_action: resultData.verdict?.action || 'WATCH',
                verdict_conviction: resultData.verdict?.conviction || 0.5, verdict_quality: resultData.verdict?.quality_verdict || 'GOOD',
                total_latency_ms: resultData.total_latency_ms, created_at: new Date().toISOString(),
              };
              setAnalyses((prev) => { const exists = prev.some((a) => a.id === resultData.analysis_id); return exists ? prev.map((a) => a.id === resultData.analysis_id ? completedSummary : a) : [completedSummary, ...prev]; });
              setSelectedId(resultData.analysis_id);
              setViewingRunId(null);
            }
            setTimeout(() => { setRunningAnalyses((prev) => { const next = new Map(prev); next.delete(runId); return next; }); }, 500);
          }
          break;
        case 'error':
          updateRun((ra) => {
            if (ra.analysisId) setAnalyses((prev) => prev.map((a) => a.id === ra.analysisId ? { ...a, status: 'error' } : a));
            return { ...ra, error: event.message || 'Analysis failed' };
          });
          setTimeout(() => { setRunningAnalyses((prev) => { const next = new Map(prev); next.delete(runId); return next; }); }, 3000);
          break;
      }
    });
    initial.cancel = stream.cancel;
    setRunningAnalyses((prev) => { const next = new Map(prev); next.set(runId, initial); return next; });
    setSelectedId(null);
    setViewingRunId(runId);
  }, []);

  const handleDeleteAnalysis = useCallback(async (id: string) => {
    try {
      await deleteCompanyAnalysis(id);
      setAnalyses((prev) => prev.filter((a) => a.id !== id));
      if (selectedId === id) { setSelectedId(null); setSelectedDetail(null); setReportOpen(false); }
    } catch (e) { console.error('Failed to delete analysis:', e); }
  }, [selectedId]);

  // ── Display derivation ──
  const viewingRun = viewingRunId ? runningAnalyses.get(viewingRunId) : null;
  const isViewingRunning = !!viewingRun;

  const displaySkills: Record<string, GateResult> = isViewingRunning ? (viewingRun!.result?.skills || viewingRun!.gateResults) : (selectedDetail?.full_report?.skills || {});
  const displayVerdict = isViewingRunning ? viewingRun!.result?.verdict as PositionHoldingOutput | undefined : selectedDetail?.full_report?.verdict as PositionHoldingOutput | undefined;
  const displayResult = isViewingRunning ? viewingRun!.result : selectedDetail?.full_report || null;
  const displayError = isViewingRunning ? viewingRun!.error : null;
  const displayCompanyInfo = isViewingRunning ? viewingRun!.companyInfo : (selectedDetail ? {
    name: selectedDetail.full_report?.company_name || selectedDetail.company_name,
    symbol: selectedDetail.full_report?.symbol || selectedDetail.symbol,
    sector: selectedDetail.full_report?.sector || '',
    industry: selectedDetail.full_report?.industry || '',
    price: selectedDetail.full_report?.current_price || 0,
  } : null);

  const isDbRunning = !isViewingRunning && selectedDetail?.status === 'running';
  const displayGateStatuses: Record<number, GateStatus> = isViewingRunning
    ? viewingRun!.gateStatuses
    : (() => {
        const skills = selectedDetail?.full_report?.skills;
        const hasSkills = skills && Object.keys(skills).length > 0;
        if (hasSkills) {
          const statuses: Record<number, GateStatus> = {};
          for (const skillName of SKILL_ORDER) {
            const result = skills[skillName];
            if (result) statuses[result.gate] = result.parse_status === 'timeout' ? 'timeout' : result.parse_status === 'error' ? 'error' : 'complete';
          }
          if (isDbRunning) { const cg = Object.keys(statuses).length; if (cg < 7) statuses[cg + 1] = 'running'; }
          return statuses;
        }
        if (isDbRunning) { const s: Record<number, GateStatus> = {}; for (let i = 1; i <= 7; i++) s[i] = 'pending'; s[1] = 'running'; return s; }
        return {};
      })();

  const displayGateResults = isViewingRunning ? viewingRun!.gateResults : (selectedDetail?.full_report?.skills || {});
  const displayStreamingTexts = isViewingRunning ? viewingRun!.streamingTexts : {};
  const displayCurrentGate = isViewingRunning ? viewingRun!.currentGate : isDbRunning ? (Object.entries(displayGateStatuses).find(([, s]) => s === 'running')?.[0] ? Number(Object.entries(displayGateStatuses).find(([, s]) => s === 'running')![0]) : null) : null;
  const isComplete = isViewingRunning ? !!viewingRun!.result : (!!displayResult && !isDbRunning);
  const runningCount = runningAnalyses.size;
  const hasTimeline = Object.keys(displayGateStatuses).length > 0 || displayCompanyInfo != null || !!displayError || isDbRunning;

  const formatTime = (ms: number) => { const s = Math.round(ms / 1000); return s >= 60 ? `${Math.floor(s / 60)}m${s % 60}s` : `${s}s`; };
  const formatDate = (iso: string) => { const d = new Date(iso); return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }); };

  // ── Filtered list ──
  const filteredAnalyses = analyses.filter((a) => {
    if (a.status !== 'running') return true;
    return !Array.from(runningAnalyses.values()).some((ra) => ra.analysisId === a.id);
  });

  // ── Screener Row ──
  const renderRow = (a: CompanyAnalysisSummary, compact = false) => {
    const actionColor = ACTION_COLORS[a.verdict_action] || theme.text.muted;
    const isRunningRecord = a.status === 'running';
    const isActive = selectedId === a.id;
    const conviction = a.verdict_conviction || 0;

    return (
      <Box
        key={a.id}
        onClick={() => { setViewingRunId(null); setSelectedId(a.id); }}
        sx={{
          display: 'flex', alignItems: 'center', gap: compact ? 1 : 0,
          px: compact ? 1 : 0, py: compact ? 0.5 : 0,
          minHeight: compact ? 36 : 40,
          cursor: 'pointer',
          transition: 'background-color 0.1s',
          bgcolor: isActive ? `${theme.brand.primary}08` : 'transparent',
          borderLeft: compact && isActive ? `2px solid ${theme.brand.primary}` : compact ? '2px solid transparent' : 'none',
          borderBottom: compact ? 'none' : `1px solid ${theme.border.subtle}`,
          '&:hover': { bgcolor: `${theme.text.primary}05` },
          '&:hover .row-delete': { opacity: 0.6 },
        }}
      >
        {/* Symbol */}
        <Box sx={{ width: compact ? 'auto' : 80, flexShrink: 0, px: compact ? 0 : 1.5 }}>
          <Typography sx={{ fontSize: compact ? 11.5 : 13, fontWeight: 700, color: theme.text.primary }}>
            {a.symbol}
          </Typography>
        </Box>

        {/* Company name — hidden in compact */}
        {!compact && (
          <Box sx={{ flex: 1, minWidth: 0, px: 1 }}>
            <Typography sx={{ fontSize: 12, color: theme.text.secondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {a.company_name || '—'}
            </Typography>
          </Box>
        )}

        {compact && <Box sx={{ flex: 1 }} />}

        {/* Action badge */}
        <Box sx={{ width: compact ? 'auto' : 70, flexShrink: 0, px: compact ? 0 : 1, display: 'flex', justifyContent: compact ? 'flex-end' : 'center' }}>
          {isRunningRecord ? (
            <Loader2 size={12} color={theme.brand.primary} style={{ animation: 'spin 1.5s linear infinite' }} />
          ) : (
            <Typography sx={{ fontSize: 11, fontWeight: 800, color: actionColor }}>{a.verdict_action}</Typography>
          )}
        </Box>

        {/* Conviction bar — hidden in compact */}
        {!compact && (
          <Box sx={{ width: 80, flexShrink: 0, px: 1, display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ flex: 1, height: 3, borderRadius: 2, bgcolor: `${actionColor}15` }}>
              <Box sx={{ height: '100%', width: `${conviction * 100}%`, borderRadius: 2, bgcolor: actionColor, transition: 'width 0.3s' }} />
            </Box>
            <Typography sx={{ fontSize: 10, color: theme.text.muted, fontFeatureSettings: '"tnum"', minWidth: 22 }}>
              {isRunningRecord ? '' : `${Math.round(conviction * 100)}%`}
            </Typography>
          </Box>
        )}

        {/* Quality */}
        {!compact && (
          <Box sx={{ width: 64, flexShrink: 0, px: 1, textAlign: 'center' }}>
            <Typography sx={{ fontSize: 10, fontWeight: 600, color: actionColor, opacity: 0.7 }}>
              {isRunningRecord ? '—' : (a.verdict_quality || '')}
            </Typography>
          </Box>
        )}

        {/* Model */}
        {!compact && (
          <Box sx={{ width: 72, flexShrink: 0, px: 1 }}>
            <Typography sx={{ fontSize: 10, color: theme.text.disabled }}>{a.provider}</Typography>
          </Box>
        )}

        {/* Time */}
        <Box sx={{ width: compact ? 'auto' : 56, flexShrink: 0, px: compact ? 0 : 1, textAlign: 'right' }}>
          <Typography sx={{ fontSize: 10, color: theme.text.muted, fontFeatureSettings: '"tnum"' }}>
            {isRunningRecord ? '' : formatTime(a.total_latency_ms)}
          </Typography>
        </Box>

        {/* Date */}
        <Box sx={{ width: compact ? 'auto' : 56, flexShrink: 0, px: compact ? 0 : 1, textAlign: 'right' }}>
          <Typography sx={{ fontSize: 10, color: theme.text.disabled }}>
            {formatDate(a.created_at)}
          </Typography>
        </Box>

        {/* Delete */}
        {!compact && (
          <Box sx={{ width: 32, flexShrink: 0, textAlign: 'center' }}>
            <IconButton
              className="row-delete"
              size="small"
              onClick={(e) => { e.stopPropagation(); handleDeleteAnalysis(a.id); }}
              sx={{ opacity: 0, color: theme.text.disabled, p: 0.5, '&:hover': { color: '#ef4444', opacity: '1 !important' } }}
            >
              <Trash2 size={12} />
            </IconButton>
          </Box>
        )}
      </Box>
    );
  };

  // ── Chart symbol ──
  const chartSymbol = displayCompanyInfo?.symbol
    || (selectedId && analyses.find((a) => a.id === selectedId)?.symbol)
    || (filteredAnalyses.length > 0 ? filteredAnalyses[0].symbol : null);

  // ── Render ──
  return (
    <Box sx={{ m: -3, height: 'calc(100vh - 48px)', width: 'calc(100% + 48px)', display: 'flex', flexDirection: 'column', bgcolor: theme.background.primary, color: theme.text.primary, overflow: 'hidden' }}>
      <style>{spinKeyframes}</style>

      {/* ── Top bar: Form + Company Info ── */}
      <Box sx={{
        px: 2, py: 0.75, flexShrink: 0,
        borderBottom: `1px solid ${theme.border.subtle}`,
        display: 'flex', alignItems: 'center', gap: 2,
      }}>
        <Box sx={{ flex: 1, maxWidth: 420 }}>
          <CompanyAnalysisForm onAnalyze={handleAnalyze} isRunning={false} runningCount={runningCount} elapsedMs={0} />
        </Box>
        {displayCompanyInfo && (
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography sx={{ fontSize: 15, fontWeight: 700 }}>{displayCompanyInfo.symbol}</Typography>
            <Typography sx={{ fontSize: 12, color: theme.text.muted }}>{displayCompanyInfo.name}</Typography>
            {displayCompanyInfo.price > 0 && (
              <Typography sx={{ fontSize: 13, color: theme.text.secondary, fontFeatureSettings: '"tnum"', fontWeight: 600 }}>
                ${displayCompanyInfo.price.toFixed(2)}
              </Typography>
            )}
            {displayVerdict && (
              <Typography sx={{
                fontSize: 11, fontWeight: 800, ml: 1, px: 1, py: 0.15, borderRadius: '4px',
                color: ACTION_COLORS[displayVerdict.action] || theme.text.muted,
                bgcolor: `${ACTION_COLORS[displayVerdict.action] || theme.text.muted}15`,
              }}>
                {displayVerdict.action}
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {/* ── Main: Left Chart + Right Screener/Detail ── */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ════ LEFT: TradingView Chart ════ */}
        <Box sx={{
          width: '50%',
          flexShrink: 0,
          borderRight: `1px solid ${theme.border.subtle}`,
          position: 'relative',
        }}>
          {chartSymbol ? (
            <TradingViewChart symbol={chartSymbol} />
          ) : (
            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography sx={{ fontSize: 13, color: theme.text.disabled }}>
                输入股票代码查看K线
              </Typography>
            </Box>
          )}
        </Box>

        {/* ════ RIGHT: Screener + Detail ════ */}
        <Box sx={{ width: '50%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Detail view — ThinkingTimeline + Report */}
          {hasSelection && hasTimeline && (
            <Box sx={{
              flex: 1,
              display: 'flex',
              overflow: 'hidden',
              borderBottom: `1px solid ${theme.border.subtle}`,
            }}>
              <Box sx={{
                flex: reportOpen ? '0 0 50%' : '1 1 auto',
                overflow: 'auto', transition: 'flex 0.3s ease',
                '&::-webkit-scrollbar': { width: 4 },
                '&::-webkit-scrollbar-thumb': { bgcolor: theme.border.default, borderRadius: 2 },
              }}>
                <Box sx={{ px: 2, py: 1.5 }}>
                  {loadingDetail && (
                    <Typography sx={{ fontSize: 12, color: theme.text.muted, textAlign: 'center', py: 3 }}>Loading...</Typography>
                  )}
                  <ThinkingTimeline
                    gateStatuses={displayGateStatuses}
                    gateResults={displayGateResults}
                    streamingTexts={displayStreamingTexts}
                    currentGate={displayCurrentGate}
                    companyInfo={displayCompanyInfo}
                    error={displayError}
                    isComplete={isComplete}
                    isDbRunning={isDbRunning}
                    elapsedMs={isViewingRunning ? viewingRun!.elapsedMs : (displayResult?.total_latency_ms || 0)}
                    onOpenReport={() => setReportOpen(true)}
                    onGateClick={(gateNum) => { setReportOpen(true); setScrollToGate(gateNum); }}
                  />
                </Box>
              </Box>

              <ReportPanel
                open={reportOpen}
                onClose={() => setReportOpen(false)}
                skills={displaySkills}
                verdict={displayVerdict}
                companyInfo={displayCompanyInfo}
                totalLatencyMs={displayResult?.total_latency_ms}
                modelUsed={displayResult?.model_used}
                dataFreshness={displayResult?.data_freshness}
                toolCallsCount={displayResult?.tool_calls?.length}
                scrollToGate={scrollToGate}
                onScrollToGateConsumed={() => setScrollToGate(null)}
              />
            </Box>
          )}

          {/* Screener list — always visible below detail or fills full height */}
          <Box sx={{
            flex: hasSelection && hasTimeline ? '0 0 auto' : 1,
            maxHeight: hasSelection && hasTimeline ? 280 : undefined,
            minHeight: hasSelection && hasTimeline ? 160 : undefined,
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Column headers */}
            {filteredAnalyses.length > 0 && (
              <Box sx={{
                display: 'flex', alignItems: 'center',
                py: 0.4, px: 1,
                borderBottom: `1px solid ${theme.border.subtle}`,
                bgcolor: theme.background.primary,
                flexShrink: 0,
              }}>
                {[
                  { label: 'Symbol', w: 64 },
                  { label: 'Company', w: 0, flex: true },
                  { label: 'Action', w: 54 },
                  { label: 'Conv.', w: 44, right: true },
                  { label: 'Quality', w: 52 },
                  { label: 'Model', w: 60 },
                  { label: 'Time', w: 48, right: true },
                  { label: 'Date', w: 44, right: true },
                  { label: '', w: 24 },
                ].map((col) => (
                  <Box key={col.label || 'del'} sx={{
                    width: col.flex ? undefined : col.w, flex: col.flex ? 1 : undefined,
                    flexShrink: 0, px: 0.75,
                    textAlign: col.right ? 'right' : 'left',
                  }}>
                    <Typography sx={{ fontSize: 9, fontWeight: 600, color: theme.text.disabled, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {col.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}

            {/* Rows */}
            <Box sx={{
              flex: 1, overflow: 'auto',
              '&::-webkit-scrollbar': { width: 3 },
              '&::-webkit-scrollbar-thumb': { bgcolor: theme.border.default, borderRadius: 2 },
            }}>
              {loadingHistory ? (
                <Typography sx={{ fontSize: 11, color: theme.text.muted, textAlign: 'center', py: 3 }}>Loading...</Typography>
              ) : filteredAnalyses.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography sx={{ fontSize: 12, color: theme.text.muted }}>暂无分析记录</Typography>
                </Box>
              ) : (
                filteredAnalyses.map((a) => renderRow(a, false))
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
