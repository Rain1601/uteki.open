import { useState, useMemo } from 'react';
import { Box, Container, Typography, Divider, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import { Brain, Zap, Timer, Clock, DollarSign, Star } from 'lucide-react';
import ModelSelector, { MODELS } from '@/components/company/ModelSelector';
import type { ModelInfo } from '@/components/company/ModelSelector';

/* ------------------------------------------------------------------ */
/*  Detail panel for single-model selection                            */
/* ------------------------------------------------------------------ */

function ModelDetailPanel({ model }: { model: ModelInfo }) {
  const speedLabel = { fast: 'Fast', medium: 'Medium', slow: 'Slow' }[model.speed];
  const speedColor = { fast: '#4ade80', medium: '#facc15', slow: '#f87171' }[model.speed];
  const speedIcon = {
    fast: <Zap size={16} />,
    medium: <Timer size={16} />,
    slow: <Clock size={16} />,
  }[model.speed];
  const costLabel = '$'.repeat(model.cost);
  const costColor = model.cost === 1 ? '#4ade80' : model.cost === 2 ? '#facc15' : '#f87171';

  return (
    <motion.div
      key={model.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Box
        sx={{
          mt: 4,
          p: 3,
          borderRadius: 3,
          bgcolor: '#0f172a',
          border: '1px solid #1e293b',
        }}
      >
        <Box className="flex items-center gap-3 mb-3">
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: model.providerColor + '20',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: model.providerColor,
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {model.provider.slice(0, 2).toUpperCase()}
          </Box>
          <Box>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>
              {model.name}
            </Typography>
            <Typography sx={{ fontSize: 13, color: '#64748b' }}>
              {model.provider} &middot; {model.id}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ borderColor: '#1e293b', my: 2 }} />

        <Box className="grid grid-cols-3 gap-4">
          {/* Speed */}
          <Box>
            <Typography sx={{ fontSize: 11, color: '#64748b', mb: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Speed
            </Typography>
            <Box className="flex items-center gap-1.5" sx={{ color: speedColor }}>
              {speedIcon}
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: speedColor }}>
                {speedLabel}
              </Typography>
            </Box>
          </Box>

          {/* Cost */}
          <Box>
            <Typography sx={{ fontSize: 11, color: '#64748b', mb: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Cost
            </Typography>
            <Box className="flex items-center gap-1.5">
              <DollarSign size={16} style={{ color: costColor }} />
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: costColor }}>
                {costLabel}
              </Typography>
            </Box>
          </Box>

          {/* Quality */}
          <Box>
            <Typography sx={{ fontSize: 11, color: '#64748b', mb: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Quality
            </Typography>
            <Box className="flex items-center gap-1.5">
              <Star size={16} style={{ color: '#facc15' }} />
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#facc15' }}>
                {model.quality.toFixed(1)}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Compare panel for multi-model selection                            */
/* ------------------------------------------------------------------ */

function CompareDetailPanel({ models }: { models: ModelInfo[] }) {
  if (models.length === 0) {
    return (
      <Box sx={{ mt: 4, p: 3, borderRadius: 3, bgcolor: '#0f172a', border: '1px solid #1e293b' }}>
        <Typography sx={{ fontSize: 14, color: '#64748b', textAlign: 'center' }}>
          Select models to compare
        </Typography>
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Box sx={{ mt: 4, p: 3, borderRadius: 3, bgcolor: '#0f172a', border: '1px solid #1e293b' }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#818cf8', mb: 2 }}>
          Comparing {models.length} model{models.length !== 1 ? 's' : ''}
        </Typography>

        <Box className="grid gap-3" sx={{ gridTemplateColumns: `repeat(${Math.min(models.length, 3)}, 1fr)` }}>
          {models.map((m) => {
            const costColor = m.cost === 1 ? '#4ade80' : m.cost === 2 ? '#facc15' : '#f87171';
            return (
              <Box
                key={m.id}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: m.providerColor + '40',
                  bgcolor: m.providerColor + '08',
                }}
              >
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', mb: 0.5 }}>
                  {m.name}
                </Typography>
                <Typography sx={{ fontSize: 11, color: '#64748b', mb: 1.5 }}>
                  {m.provider}
                </Typography>
                <Box className="flex flex-col gap-1">
                  <Box className="flex justify-between">
                    <Typography sx={{ fontSize: 11, color: '#64748b' }}>Speed</Typography>
                    <Chip
                      label={m.speed}
                      size="small"
                      sx={{ height: 18, fontSize: 10, bgcolor: '#1e293b', color: '#94a3b8' }}
                    />
                  </Box>
                  <Box className="flex justify-between">
                    <Typography sx={{ fontSize: 11, color: '#64748b' }}>Cost</Typography>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: costColor }}>
                      {'$'.repeat(m.cost)}
                    </Typography>
                  </Box>
                  <Box className="flex justify-between">
                    <Typography sx={{ fontSize: 11, color: '#64748b' }}>Quality</Typography>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#facc15' }}>
                      {m.quality.toFixed(1)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Demo page                                                          */
/* ------------------------------------------------------------------ */

export default function ModelSelectorDemoPage() {
  const [selectedModel, setSelectedModel] = useState('claude-sonnet-4-20250514');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);

  const handleToggleCompare = () => {
    const next = !compareMode;
    setCompareMode(next);
    if (next) {
      setSelectedModels([selectedModel]);
    } else {
      setSelectedModels([]);
    }
  };

  const activeModel = useMemo(
    () => MODELS.find((m) => m.id === selectedModel) ?? MODELS[0],
    [selectedModel],
  );

  const compareModels = useMemo(
    () => selectedModels.map((id) => MODELS.find((m) => m.id === id)).filter(Boolean) as ModelInfo[],
    [selectedModels],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Container
        maxWidth="md"
        sx={{
          minHeight: '100vh',
          bgcolor: '#020617',
          py: 6,
          px: 3,
        }}
      >
        {/* Page header */}
        <Box className="flex items-center gap-3 mb-2">
          <Brain size={28} color="#818cf8" />
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.02em' }}
          >
            Model Selector
          </Typography>
        </Box>
        <Typography sx={{ fontSize: 14, color: '#64748b', mb: 5, maxWidth: 520 }}>
          Choose an LLM for Company Agent analysis, or enable Compare Mode to evaluate
          multiple models side by side.
        </Typography>

        {/* Selector */}
        <ModelSelector
          selectedModel={selectedModel}
          onSelect={setSelectedModel}
          compareMode={compareMode}
          selectedModels={selectedModels}
          onToggleCompare={handleToggleCompare}
          onCompareSelect={setSelectedModels}
        />

        {/* Detail panel */}
        {compareMode ? (
          <CompareDetailPanel models={compareModels} />
        ) : (
          <ModelDetailPanel model={activeModel} />
        )}

        {/* Debug state */}
        <Box
          sx={{
            mt: 4,
            p: 2,
            borderRadius: 2,
            bgcolor: '#0f172a',
            border: '1px solid #1e293b',
          }}
        >
          <Typography sx={{ fontSize: 11, color: '#475569', mb: 0.5, fontFamily: 'monospace' }}>
            state
          </Typography>
          <Typography
            component="pre"
            sx={{
              fontSize: 12,
              color: '#94a3b8',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              m: 0,
            }}
          >
            {JSON.stringify({ selectedModel, compareMode, selectedModels }, null, 2)}
          </Typography>
        </Box>
      </Container>
    </motion.div>
  );
}
