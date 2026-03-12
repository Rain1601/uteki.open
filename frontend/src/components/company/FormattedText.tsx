import { useMemo } from 'react';
import { Box, Typography } from '@mui/material';

interface Props {
  text: string;
  theme: any;
  streaming?: boolean;
}

/** Lightweight markdown-like formatting for raw LLM text */
export default function FormattedText({ text, theme, streaming }: Props) {
  const lines = text.split('\n');

  const rendered = useMemo(() => {
    // In streaming mode, use plain text to avoid half-parsed markdown flicker
    if (streaming) {
      return lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <Box key={`br-${i}`} sx={{ height: 6 }} />;
        return (
          <Typography
            key={`s-${i}`}
            sx={{ fontSize: 13, color: theme.text.secondary, lineHeight: 1.7, wordBreak: 'break-word' }}
          >
            {trimmed}
          </Typography>
        );
      });
    }

    const result: React.ReactNode[] = [];
    let listBuffer: string[] = [];
    let keyIdx = 0;

    const flushList = () => {
      if (listBuffer.length === 0) return;
      result.push(
        <Box key={`list-${keyIdx++}`} component="ul" sx={{ m: 0, pl: 2.5, py: 0.3 }}>
          {listBuffer.map((item, i) => (
            <Box key={i} component="li" sx={{ fontSize: 13, lineHeight: 1.8, color: theme.text.secondary, py: 0.1 }}>
              {formatInline(item)}
            </Box>
          ))}
        </Box>
      );
      listBuffer = [];
    };

    const formatInline = (line: string): React.ReactNode => {
      // Bold: **text**
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        // Highlight numbers/percentages
        return part.split(/(\d+\.?\d*%|\$[\d,.]+)/g).map((seg, j) => {
          if (/^\d+\.?\d*%$/.test(seg) || /^\$[\d,.]+$/.test(seg)) {
            return (
              <Box
                key={`${i}-${j}`}
                component="span"
                sx={{ color: theme.brand.primary, fontWeight: 600 }}
              >
                {seg}
              </Box>
            );
          }
          return seg;
        });
      });
    };

    for (const line of lines) {
      const trimmed = line.trim();

      // Empty line = paragraph break
      if (!trimmed) {
        flushList();
        result.push(<Box key={`br-${keyIdx++}`} sx={{ height: 8 }} />);
        continue;
      }

      // Heading: ## or ###
      if (/^#{2,3}\s+/.test(trimmed)) {
        flushList();
        const headText = trimmed.replace(/^#{2,3}\s+/, '');
        result.push(
          <Typography
            key={`h-${keyIdx++}`}
            sx={{ fontSize: 14, fontWeight: 700, color: theme.text.primary, mt: 1, mb: 0.5, lineHeight: 1.6 }}
          >
            {formatInline(headText)}
          </Typography>
        );
        continue;
      }

      // List items: - or *
      if (/^[-*]\s+/.test(trimmed)) {
        listBuffer.push(trimmed.replace(/^[-*]\s+/, ''));
        continue;
      }

      // Numbered list: 1. or 1)
      if (/^\d+[.)]\s+/.test(trimmed)) {
        listBuffer.push(trimmed);
        continue;
      }

      // Regular paragraph line
      flushList();
      result.push(
        <Typography
          key={`p-${keyIdx++}`}
          sx={{ fontSize: 13, color: theme.text.secondary, lineHeight: 1.8 }}
        >
          {formatInline(trimmed)}
        </Typography>
      );
    }
    flushList();
    return result;
  }, [text, theme, streaming]);

  return <>{rendered}</>;
}
