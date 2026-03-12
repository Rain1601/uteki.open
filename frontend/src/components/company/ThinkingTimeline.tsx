import { useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { Check, Search, FileText } from 'lucide-react';
import { useTheme } from '../../theme/ThemeProvider';
import { GATE_NAMES, TOTAL_GATES, type GateResult } from '../../api/company';
import type { GateStatus } from './GateProgressTracker';
import FormattedText from './FormattedText';
import GateSummaryCard from './GateSummaryCard';
import GateSkeletonCard from './GateSkeletonCard';

const timelineKeyframes = `
@keyframes tl-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
  70% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0); }
}
@keyframes tl-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
@keyframes tl-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes tl-fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes tl-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes tl-glow {
  0%, 100% { box-shadow: 0 0 4px rgba(100,149,237,0.3); }
  50% { box-shadow: 0 0 12px rgba(100,149,237,0.6); }
}
@keyframes tl-card-in {
  from { opacity: 0; transform: translateY(4px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes tl-check-pop {
  0% { transform: scale(0); }
  70% { transform: scale(1.2); }
  100% { transform: scale(1); }
}
@keyframes tl-report-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.3); }
  50% { box-shadow: 0 0 0 6px rgba(59, 130, 246, 0); }
}
`;

interface Props {
  gateStatuses: Record<number, GateStatus>;
  gateResults: Record<string, GateResult>;
  streamingTexts: Record<string, string>;
  currentGate: number | null;
  companyInfo: { name: string; symbol: string; sector: string; industry: string; price: number } | null;
  error: string | null;
  isComplete: boolean;
  isDbRunning?: boolean;
  elapsedMs: number;
  onOpenReport: () => void;
}

const SKILL_ORDER = [
  'business_analysis',
  'fisher_qa',
  'moat_assessment',
  'management_assessment',
  'reverse_test',
  'valuation',
  'final_verdict',
] as const;

export default function ThinkingTimeline({
  gateStatuses,
  gateResults,
  streamingTexts,
  currentGate,
  companyInfo,
  error,
  isComplete,
  isDbRunning,
  elapsedMs,
  onOpenReport,
}: Props) {
  const { theme } = useTheme();
  const bottomRef = useRef<HTMLDivElement>(null);
  const streamingBoxRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Auto-scroll to bottom when new nodes appear
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [currentGate, Object.keys(gateStatuses).length]);

  // Auto-scroll streaming text boxes to bottom
  useEffect(() => {
    for (const [skill, text] of Object.entries(streamingTexts)) {
      if (text && streamingBoxRefs.current[skill]) {
        const el = streamingBoxRefs.current[skill]!;
        el.scrollTop = el.scrollHeight;
      }
    }
  }, [streamingTexts]);

  const hasAnyGate = Object.keys(gateStatuses).length > 0;
  const hasDataLoaded = companyInfo != null;

  if (!hasAnyGate && !hasDataLoaded && !error) return null;

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <Box sx={{ position: 'relative', pb: 3 }}>
      <style>{timelineKeyframes}</style>

      {/* ── Horizontal Stepper ── */}
      {hasAnyGate && (
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            bgcolor: theme.background.primary,
            pt: 1,
            pb: 1.5,
            mb: 1.5,
            borderBottom: `1px solid ${theme.border.subtle}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0, width: '100%' }}>
            {Array.from({ length: TOTAL_GATES }, (_, i) => {
              const gate = i + 1;
              const status = gateStatuses[gate] || 'pending';
              const isLast = gate === TOTAL_GATES;
              const isActive = status === 'running';
              const isDone = status === 'complete';
              const hasErr = status === 'error' || status === 'timeout';

              const dotColor = isDone ? '#22c55e' : isActive ? theme.brand.primary : hasErr ? '#ef4444' : theme.text.disabled;

              return (
                <Box key={gate} sx={{ display: 'flex', alignItems: 'center', flex: isLast ? 0 : 1 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3, minWidth: 48 }}>
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease',
                        ...(isDone && {
                          bgcolor: dotColor,
                          animation: isComplete ? `tl-check-pop 0.4s ease-out ${i * 0.08}s both` : 'none',
                        }),
                        ...(isActive && {
                          bgcolor: dotColor,
                          animation: 'tl-glow 1.5s ease-in-out infinite',
                        }),
                        ...(hasErr && {
                          bgcolor: dotColor,
                        }),
                        ...(!isDone && !isActive && !hasErr && {
                          border: `1.5px solid ${theme.text.disabled}`,
                          bgcolor: 'transparent',
                        }),
                      }}
                    >
                      {isDone && <Check size={10} color="#fff" strokeWidth={3} />}
                      {isActive && (
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            border: '1.5px solid #fff',
                            borderTop: '1.5px solid transparent',
                            borderRadius: '50%',
                            animation: 'tl-spin 0.8s linear infinite',
                          }}
                        />
                      )}
                      {hasErr && (
                        <Typography sx={{ fontSize: 9, fontWeight: 800, color: '#fff', lineHeight: 1 }}>!</Typography>
                      )}
                    </Box>
                    <Typography
                      sx={{
                        fontSize: 9,
                        color: isActive ? theme.brand.primary : isDone ? '#22c55e' : theme.text.disabled,
                        fontWeight: isActive ? 600 : 400,
                        textAlign: 'center',
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {GATE_NAMES[gate]}
                    </Typography>
                  </Box>

                  {/* Connector line */}
                  {!isLast && (
                    <Box
                      sx={{
                        flex: 1,
                        height: 1.5,
                        bgcolor:
                          (gateStatuses[gate + 1] && gateStatuses[gate + 1] !== 'pending')
                            ? '#22c55e'
                            : isDone ? '#22c55e' : theme.border.subtle,
                        transition: 'background-color 0.3s ease',
                        mx: 0.3,
                        mt: -1.5,
                      }}
                    />
                  )}
                </Box>
              );
            })}

            {/* Total time on right */}
            {isComplete && (
              <Typography
                sx={{
                  fontSize: 11,
                  color: theme.text.muted,
                  ml: 1.5,
                  whiteSpace: 'nowrap',
                  fontVariantNumeric: 'tabular-nums',
                  mt: -1.5,
                }}
              >
                {formatTime(elapsedMs)}
              </Typography>
            )}
          </Box>
        </Box>
      )}

      {/* ── Vertical line ── */}
      <Box
        sx={{
          position: 'absolute',
          left: 15,
          top: hasAnyGate ? 80 : 8,
          bottom: 0,
          width: 2,
          bgcolor: theme.border.subtle,
          zIndex: 0,
        }}
      />

      {/* ── Data loaded node ── */}
      {hasDataLoaded && (
        <TimelineNode
          theme={theme}
          status="complete"
          label="数据加载完成"
          sublabel={`${companyInfo.name} · ${companyInfo.symbol}`}
        />
      )}

      {/* ── Gate nodes with 3-phase rendering ── */}
      {SKILL_ORDER.map((skillName, idx) => {
        const gateNum = idx + 1;
        const status = gateStatuses[gateNum];
        if (!status) return null;

        const result = gateResults[skillName];
        const streamText = streamingTexts[skillName];
        const isRunning = status === 'running';
        const isDone = status === 'complete';
        const hasError = status === 'error' || status === 'timeout';
        const hasStreamText = !!(streamText && streamText.length > 0);

        // Determine phase: skeleton | streaming | summary
        const phase: 'skeleton' | 'streaming' | 'summary' =
          isDone || hasError ? 'summary' :
          isRunning && hasStreamText ? 'streaming' :
          isRunning ? 'skeleton' :
          'summary'; // pending with result (loaded from DB)

        return (
          <Box key={skillName} sx={{ animation: 'tl-fade-in 0.3s ease-out' }}>
            <TimelineNode
              theme={theme}
              status={hasError ? 'error' : isDone ? 'complete' : isRunning ? 'running' : 'pending'}
              label={`Gate ${gateNum}: ${GATE_NAMES[gateNum]}`}
              sublabel={
                isRunning ? '正在分析...' :
                isDone ? undefined :
                hasError ? (result?.error || (status === 'timeout' ? '超时' : '失败')) :
                undefined
              }
              latencyMs={result?.latency_ms}
            />

            {/* Tool calls sub-nodes */}
            {isRunning && result?.tool_calls && result.tool_calls.length > 0 && (
              <Box sx={{ pl: 5, ml: '15px', borderLeft: `2px solid ${theme.border.subtle}` }}>
                {result.tool_calls.map((tc: any, i: number) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                    <Search size={12} color={theme.text.muted} />
                    <Typography sx={{ fontSize: 12, color: theme.text.muted }}>
                      {tc.tool_name || tc.name || 'Web search'}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}

            {/* Phase 1: Skeleton */}
            {phase === 'skeleton' && <GateSkeletonCard theme={theme} />}

            {/* Phase 2: Streaming text */}
            {phase === 'streaming' && streamText && (
              <Box sx={{ ml: '32px', pl: 2, mt: 0.5, mb: 1, animation: 'tl-card-in 0.2s ease-out' }}>
                <Box
                  ref={(el: HTMLDivElement | null) => { streamingBoxRefs.current[skillName] = el; }}
                  sx={{
                    p: 2,
                    bgcolor: theme.background.secondary,
                    borderRadius: 2,
                    border: `1px solid ${theme.border.subtle}`,
                    maxHeight: 200,
                    overflow: 'auto',
                    position: 'relative',
                    '&::-webkit-scrollbar': { width: 4 },
                    '&::-webkit-scrollbar-thumb': { bgcolor: theme.border.default, borderRadius: 2 },
                  }}
                >
                  <FormattedText text={streamText} theme={theme} streaming />
                  {/* Blinking cursor */}
                  <Box
                    component="span"
                    sx={{
                      display: 'inline-block',
                      width: 7,
                      height: 15,
                      bgcolor: theme.brand.primary,
                      ml: 0.3,
                      verticalAlign: 'text-bottom',
                      animation: 'tl-blink 1s step-end infinite',
                    }}
                  />
                </Box>
                {/* Bottom gradient fade */}
                <Box
                  sx={{
                    position: 'relative',
                    mt: '-24px',
                    height: 24,
                    background: `linear-gradient(transparent, ${theme.background.primary})`,
                    pointerEvents: 'none',
                    borderRadius: '0 0 8px 8px',
                  }}
                />
              </Box>
            )}

            {/* Phase 3: Summary Card (for completed gates) */}
            {phase === 'summary' && isDone && result && (
              <GateSummaryCard
                gateNum={gateNum}
                result={result}
                theme={theme}
              />
            )}

            {/* Error display */}
            {hasError && result?.error && (
              <Box sx={{ ml: '32px', pl: 2, mt: 0.5, mb: 1 }}>
                <Typography sx={{ fontSize: 12, color: '#ef4444' }}>
                  {result.error}
                </Typography>
              </Box>
            )}
          </Box>
        );
      })}

      {/* ── DB running indicator ── */}
      {isDbRunning && !isComplete && !error && (
        <Box sx={{ ml: '32px', pl: 2, mt: 2, mb: 1, animation: 'tl-fade-in 0.3s ease-out' }}>
          <Typography sx={{ fontSize: 12, color: theme.text.muted }}>
            后台分析进行中，等待结果...
          </Typography>
        </Box>
      )}

      {/* ── Error node ── */}
      {error && (
        <TimelineNode
          theme={theme}
          status="error"
          label="分析出错"
          sublabel={error}
        />
      )}

      {/* ── Completion node ── */}
      {isComplete && !error && (
        <Box sx={{ animation: 'tl-fade-in 0.3s ease-out' }}>
          <TimelineNode
            theme={theme}
            status="done"
            label="分析完成"
            sublabel={`总耗时 ${formatTime(elapsedMs)}`}
          />

          {/* View report button */}
          <Box sx={{ ml: '32px', pl: 2, mt: 1.5 }}>
            <Box
              onClick={onOpenReport}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                px: 2.5,
                py: 1.2,
                bgcolor: theme.brand.primary,
                color: '#fff',
                borderRadius: 2,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                transition: 'all 0.2s',
                animation: 'tl-report-pulse 2s ease-in-out 0.5s 3',
                '&:hover': {
                  filter: 'brightness(1.15)',
                  transform: 'translateY(-1px)',
                  boxShadow: `0 4px 12px ${theme.brand.primary}40`,
                },
              }}
            >
              <FileText size={16} />
              查看投研报告
            </Box>
          </Box>
        </Box>
      )}

      <div ref={bottomRef} />
    </Box>
  );
}

// ── Timeline Node sub-component ──

interface NodeProps {
  theme: any;
  status: 'pending' | 'running' | 'complete' | 'error' | 'done';
  label: string;
  sublabel?: string;
  latencyMs?: number;
}

function TimelineNode({ theme, status, label, sublabel, latencyMs }: NodeProps) {
  const dotSize = 12;
  const outerSize = 32;

  const dotColor =
    status === 'complete' || status === 'done' ? '#22c55e' :
    status === 'running' ? theme.brand.primary :
    status === 'error' ? '#ef4444' :
    theme.text.disabled;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
        py: 1,
        pl: 0,
        position: 'relative',
        zIndex: 1,
      }}
    >
      {/* Dot */}
      <Box
        sx={{
          width: outerSize,
          height: outerSize,
          minWidth: outerSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {status === 'running' ? (
          <Box
            sx={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              bgcolor: dotColor,
              animation: 'tl-pulse 1.5s infinite',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 8px ${dotColor}60`,
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                border: '2px solid #fff',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'tl-spin 0.8s linear infinite',
              }}
            />
          </Box>
        ) : status === 'complete' || status === 'done' ? (
          <Box
            sx={{
              width: dotSize + 4,
              height: dotSize + 4,
              borderRadius: '50%',
              bgcolor: dotColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Check size={10} color="#fff" strokeWidth={3} />
          </Box>
        ) : status === 'error' ? (
          <Box
            sx={{
              width: dotSize + 4,
              height: dotSize + 4,
              borderRadius: '50%',
              bgcolor: dotColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography sx={{ fontSize: 10, fontWeight: 800, color: '#fff', lineHeight: 1 }}>!</Typography>
          </Box>
        ) : (
          <Box
            sx={{
              width: dotSize,
              height: dotSize,
              borderRadius: '50%',
              border: `2px solid ${theme.text.disabled}`,
              bgcolor: theme.background.primary,
            }}
          />
        )}
      </Box>

      {/* Text */}
      <Box sx={{ flex: 1, minWidth: 0, pt: 0.4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: status === 'running' ? 600 : 500,
              color: status === 'running' ? theme.brand.primary : theme.text.secondary,
              lineHeight: 1.4,
            }}
          >
            {label}
          </Typography>

          {latencyMs != null && (
            <Typography
              sx={{
                fontSize: 11,
                color: theme.text.disabled,
                bgcolor: theme.background.tertiary,
                px: 0.8,
                py: 0.15,
                borderRadius: 0.8,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {(latencyMs / 1000).toFixed(1)}s
            </Typography>
          )}
        </Box>

        {sublabel && (
          <Typography
            sx={{
              fontSize: 12,
              color: status === 'error' ? '#ef4444' : theme.text.muted,
              mt: 0.2,
              lineHeight: 1.4,
            }}
          >
            {sublabel}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
