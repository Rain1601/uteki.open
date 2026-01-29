import { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Send as SendIcon,
  Add as AddIcon,
  History as HistoryIcon,
  Search as SearchIcon,
  AutoAwesome as AutoAwesomeIcon,
  Psychology as PsychologyIcon,
  Code as CodeIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useTheme } from '../theme/ThemeProvider';
import ChatMessage from '../components/ChatMessage';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  mode: string;
  created_at: string;
}

// 快捷模式配置
const chatModes = [
  { id: 'research', label: 'Research', icon: <SearchIcon />, color: '#ff9800' },
  { id: 'analysis', label: 'Analysis', icon: <PsychologyIcon />, color: '#64b5f6' },
  { id: 'code', label: 'Code', icon: <CodeIcon />, color: '#9c27b0' },
  { id: 'trading', label: 'Trading', icon: <TrendingUpIcon />, color: '#4caf50' },
  { id: 'creative', label: 'Creative', icon: <AutoAwesomeIcon />, color: '#f48fb1' },
];

// 模型选项配置
const modelOptions = [
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude 4.5 Sonnet',
    provider: 'Claude',
    icon: 'https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/claude-color.png',
  },
  {
    id: 'deepseek-chat',
    name: 'DeepSeek V3.2',
    provider: 'DeepSeek',
    icon: 'https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/deepseek-color.png',
  },
  {
    id: 'gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    icon: 'https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/gemini-color.png',
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    icon: 'https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/light/openai.png',
  },
  {
    id: 'qwen-plus',
    name: 'Qwen Plus',
    provider: 'Qwen',
    icon: 'https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/qwen-color.png',
  },
];

export default function AgentChatPage() {
  const { theme } = useTheme();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedMode, setSelectedMode] = useState('research');
  const [selectedModelId, setSelectedModelId] = useState('deepseek-chat'); // 默认选择DeepSeek
  const [modelSelectorHovered, setModelSelectorHovered] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 加载会话列表
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const response = await fetch('http://localhost:8888/api/agent/conversations');
      const data = await response.json();
      setConversations(data.items || []);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  // 发送消息（SSE流式）
  const handleSendMessage = async () => {
    if (!message.trim() || isStreaming) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage('');
    setIsStreaming(true);

    // 创建助手消息占位符
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const response = await fetch('http://localhost:8888/api/agent/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_id: currentConversationId,
          message: userMessage.content,
          mode: selectedMode,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));

            // 更新会话ID
            if (data.conversation_id && !currentConversationId) {
              setCurrentConversationId(data.conversation_id);
            }

            // 累积内容
            if (!data.done && data.chunk) {
              accumulatedContent += data.chunk;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: accumulatedContent }
                    : msg
                )
              );
            }

            // 完成
            if (data.done) {
              setIsStreaming(false);
              loadConversations(); // 刷新会话列表
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: '抱歉，发送消息时出现错误。' }
            : msg
        )
      );
      setIsStreaming(false);
    }
  };

  // 加载会话历史
  const loadConversation = async (conversationId: string) => {
    try {
      const response = await fetch(
        `http://localhost:8888/api/agent/conversations/${conversationId}`
      );
      const data = await response.json();

      const loadedMessages: Message[] = data.messages.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.created_at),
      }));

      setMessages(loadedMessages);
      setCurrentConversationId(conversationId);
      setHistoryDrawerOpen(false);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  // 新建对话
  const handleNewConversation = () => {
    setMessages([]);
    setCurrentConversationId(null);
  };

  // 处理回车发送
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 判断是否为空白状态
  const isEmpty = messages.length === 0;

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: theme.background.deepest, // 极深黑背景
        color: theme.text.primary,
        position: 'relative',
      }}
    >
      {/* 顶部导航 */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'flex-end',
          p: 2,
          zIndex: 10,
        }}
      >
        {/* 右侧按钮组 */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            startIcon={<HistoryIcon />}
            onClick={() => setHistoryDrawerOpen(true)}
            sx={{
              color: theme.text.secondary,
              textTransform: 'none',
              '&:hover': {
                color: theme.text.primary,
                bgcolor: 'rgba(255, 255, 255, 0.05)',
              },
            }}
          >
            历史记录
          </Button>
          <Button
            startIcon={<AddIcon />}
            onClick={handleNewConversation}
            sx={{
              color: theme.text.secondary,
              textTransform: 'none',
              '&:hover': {
                color: theme.text.primary,
                bgcolor: 'rgba(255, 255, 255, 0.05)',
              },
            }}
          >
            新对话
          </Button>
        </Box>
      </Box>

      {/* 中心内容区域 */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: isEmpty ? 'center' : 'flex-start',
          px: 3,
          pt: isEmpty ? 0 : 10,
          pb: 3,
          overflow: 'hidden',
        }}
      >
        {isEmpty ? (
          /* 空白状态 - 居中显示欢迎语 */
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              maxWidth: '800px',
              width: '100%',
            }}
          >
            {/* 标题 */}
            <Typography
              sx={{
                fontSize: '2.5rem',
                fontWeight: 400,
                textAlign: 'center',
                color: theme.text.primary,
                letterSpacing: '0.02em',
              }}
            >
              What do you want to know today?
            </Typography>

            {/* 输入框 */}
            <Box sx={{ width: '100%' }}>
              <TextField
                fullWidth
                multiline
                maxRows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Message ${modelOptions.find(m => m.id === selectedModelId)?.name || 'AI'}...`}
                disabled={isStreaming}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    color: theme.text.primary,
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.08)',
                      borderWidth: '1px',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.12)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.brand.primary,
                      borderWidth: '1px',
                    },
                  },
                  '& .MuiInputBase-input': {
                    py: 2,
                    px: 3,
                    color: theme.text.primary,
                    '&::placeholder': {
                      color: theme.text.muted,
                      opacity: 0.6,
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <Box
                      onMouseEnter={() => setModelSelectorHovered(true)}
                      onMouseLeave={() => setModelSelectorHovered(false)}
                      sx={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        mr: 1,
                      }}
                    >
                      {/* 当前选中的模型 - 始终显示在固定位置 */}
                      <Tooltip
                        title={modelOptions.find((m) => m.id === selectedModelId)?.name}
                        placement="top"
                      >
                        <Box
                          sx={{
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            borderRadius: '8px',
                            bgcolor: modelSelectorHovered
                              ? 'rgba(144, 202, 249, 0.15)'
                              : 'transparent',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            padding: '4px',
                            zIndex: 2,
                          }}
                        >
                          <img
                            src={modelOptions.find((m) => m.id === selectedModelId)?.icon}
                            alt={
                              modelOptions.find((m) => m.id === selectedModelId)?.provider
                            }
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '6px',
                              objectFit: 'contain',
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </Box>
                      </Tooltip>

                      {/* 左侧展开的模型 */}
                      {modelSelectorHovered && (() => {
                        const otherModels = modelOptions.filter(
                          (m) => m.id !== selectedModelId
                        );
                        const middleIndex = Math.floor(otherModels.length / 2);
                        const leftModels = otherModels.slice(0, middleIndex);

                        return leftModels.map((model, index) => (
                          <Tooltip key={model.id} title={model.name} placement="top">
                            <Box
                              onClick={() => setSelectedModelId(model.id)}
                              sx={{
                                position: 'absolute',
                                right: `calc(100% + ${(leftModels.length - index) * 4}px)`,
                                width: '36px',
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                borderRadius: '8px',
                                bgcolor: 'transparent',
                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                padding: '4px',
                                opacity: 0,
                                transform: 'translateX(20px) scale(0.8)',
                                animation: 'slideInLeft 0.3s ease forwards',
                                animationDelay: `${index * 40}ms`,
                                '@keyframes slideInLeft': {
                                  to: {
                                    opacity: 1,
                                    transform: 'translateX(0) scale(1)',
                                  },
                                },
                                '&:hover': {
                                  bgcolor: 'rgba(255, 255, 255, 0.08)',
                                  transform: 'scale(1.1)',
                                },
                              }}
                            >
                              <img
                                src={model.icon}
                                alt={model.provider}
                                style={{
                                  width: '26px',
                                  height: '26px',
                                  borderRadius: '6px',
                                  objectFit: 'contain',
                                }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </Box>
                          </Tooltip>
                        ));
                      })()}

                      {/* 右侧展开的模型 */}
                      {modelSelectorHovered && (() => {
                        const otherModels = modelOptions.filter(
                          (m) => m.id !== selectedModelId
                        );
                        const middleIndex = Math.floor(otherModels.length / 2);
                        const rightModels = otherModels.slice(middleIndex);

                        return rightModels.map((model, index) => (
                          <Tooltip key={model.id} title={model.name} placement="top">
                            <Box
                              onClick={() => setSelectedModelId(model.id)}
                              sx={{
                                position: 'absolute',
                                left: `calc(100% + ${(index + 1) * 4}px)`,
                                width: '36px',
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                borderRadius: '8px',
                                bgcolor: 'transparent',
                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                padding: '4px',
                                opacity: 0,
                                transform: 'translateX(-20px) scale(0.8)',
                                animation: 'slideInRight 0.3s ease forwards',
                                animationDelay: `${index * 40}ms`,
                                '@keyframes slideInRight': {
                                  to: {
                                    opacity: 1,
                                    transform: 'translateX(0) scale(1)',
                                  },
                                },
                                '&:hover': {
                                  bgcolor: 'rgba(255, 255, 255, 0.08)',
                                  transform: 'scale(1.1)',
                                },
                              }}
                            >
                              <img
                                src={model.icon}
                                alt={model.provider}
                                style={{
                                  width: '26px',
                                  height: '26px',
                                  borderRadius: '6px',
                                  objectFit: 'contain',
                                }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </Box>
                          </Tooltip>
                        ));
                      })()}
                    </Box>
                  ),
                  endAdornment: (
                    <IconButton
                      onClick={handleSendMessage}
                      disabled={!message.trim() || isStreaming}
                      sx={{
                        color: message.trim() ? theme.brand.primary : theme.text.disabled,
                        '&:hover': {
                          bgcolor: 'rgba(100, 149, 237, 0.1)',
                        },
                      }}
                    >
                      {isStreaming ? <CircularProgress size={24} /> : <SendIcon />}
                    </IconButton>
                  ),
                }}
              />

              {/* 快捷模式按钮 */}
              <Box
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  mt: 2,
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                }}
              >
                {chatModes.map((mode) => (
                  <Chip
                    key={mode.id}
                    icon={mode.icon}
                    label={mode.label}
                    onClick={() => setSelectedMode(mode.id)}
                    sx={{
                      bgcolor:
                        selectedMode === mode.id
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(255, 255, 255, 0.03)',
                      color: theme.text.secondary,
                      border: `1px solid ${
                        selectedMode === mode.id
                          ? mode.color
                          : 'rgba(255, 255, 255, 0.08)'
                      }`,
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.08)',
                        borderColor: mode.color,
                      },
                      '& .MuiChip-icon': {
                        color: mode.color,
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        ) : (
          /* 对话状态 - 消息列表 */
          <Box
            sx={{
              flex: 1,
              width: '100%',
              maxWidth: '900px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}
          >
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </Box>
        )}
      </Box>

      {/* 底部输入框（对话状态时显示） */}
      {!isEmpty && (
        <Box
          sx={{
            borderTop: `1px solid ${theme.border.subtle}`,
            bgcolor: theme.background.primary,
            p: 2,
          }}
        >
          <Box sx={{ maxWidth: '900px', mx: 'auto' }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="继续对话..."
              disabled={isStreaming}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: theme.background.secondary,
                  borderRadius: '8px',
                  '& fieldset': {
                    borderColor: theme.border.subtle,
                  },
                  '&:hover fieldset': {
                    borderColor: theme.border.default,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.brand.primary,
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <Box
                    onMouseEnter={() => setModelSelectorHovered(true)}
                    onMouseLeave={() => setModelSelectorHovered(false)}
                    sx={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      mr: 1,
                    }}
                  >
                    {/* 当前选中的模型 - 始终显示在固定位置 */}
                    <Tooltip
                      title={modelOptions.find((m) => m.id === selectedModelId)?.name}
                      placement="top"
                    >
                      <Box
                        sx={{
                          width: '36px',
                          height: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          borderRadius: '8px',
                          bgcolor: modelSelectorHovered
                            ? 'rgba(144, 202, 249, 0.15)'
                            : 'transparent',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          padding: '4px',
                          zIndex: 2,
                        }}
                      >
                        <img
                          src={modelOptions.find((m) => m.id === selectedModelId)?.icon}
                          alt={
                            modelOptions.find((m) => m.id === selectedModelId)?.provider
                          }
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '6px',
                            objectFit: 'contain',
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </Box>
                    </Tooltip>

                    {/* 左侧展开的模型 */}
                    {modelSelectorHovered && (() => {
                      const otherModels = modelOptions.filter(
                        (m) => m.id !== selectedModelId
                      );
                      const middleIndex = Math.floor(otherModels.length / 2);
                      const leftModels = otherModels.slice(0, middleIndex);

                      return leftModels.map((model, index) => (
                        <Tooltip key={model.id} title={model.name} placement="top">
                          <Box
                            onClick={() => setSelectedModelId(model.id)}
                            sx={{
                              position: 'absolute',
                              right: `calc(100% + ${(leftModels.length - index) * 4}px)`,
                              width: '36px',
                              height: '36px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              borderRadius: '8px',
                              bgcolor: 'transparent',
                              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                              padding: '4px',
                              opacity: 0,
                              transform: 'translateX(20px) scale(0.8)',
                              animation: 'slideInLeft 0.3s ease forwards',
                              animationDelay: `${index * 40}ms`,
                              '@keyframes slideInLeft': {
                                to: {
                                  opacity: 1,
                                  transform: 'translateX(0) scale(1)',
                                },
                              },
                              '&:hover': {
                                bgcolor: 'rgba(255, 255, 255, 0.08)',
                                transform: 'scale(1.1)',
                              },
                            }}
                          >
                            <img
                              src={model.icon}
                              alt={model.provider}
                              style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '6px',
                                objectFit: 'contain',
                              }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </Box>
                        </Tooltip>
                      ));
                    })()}

                    {/* 右侧展开的模型 */}
                    {modelSelectorHovered && (() => {
                      const otherModels = modelOptions.filter(
                        (m) => m.id !== selectedModelId
                      );
                      const middleIndex = Math.floor(otherModels.length / 2);
                      const rightModels = otherModels.slice(middleIndex);

                      return rightModels.map((model, index) => (
                        <Tooltip key={model.id} title={model.name} placement="top">
                          <Box
                            onClick={() => setSelectedModelId(model.id)}
                            sx={{
                              position: 'absolute',
                              left: `calc(100% + ${(index + 1) * 4}px)`,
                              width: '36px',
                              height: '36px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              borderRadius: '8px',
                              bgcolor: 'transparent',
                              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                              padding: '4px',
                              opacity: 0,
                              transform: 'translateX(-20px) scale(0.8)',
                              animation: 'slideInRight 0.3s ease forwards',
                              animationDelay: `${index * 40}ms`,
                              '@keyframes slideInRight': {
                                to: {
                                  opacity: 1,
                                  transform: 'translateX(0) scale(1)',
                                },
                              },
                              '&:hover': {
                                bgcolor: 'rgba(255, 255, 255, 0.08)',
                                transform: 'scale(1.1)',
                              },
                            }}
                          >
                            <img
                              src={model.icon}
                              alt={model.provider}
                              style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '6px',
                                objectFit: 'contain',
                              }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </Box>
                        </Tooltip>
                      ));
                    })()}
                  </Box>
                ),
                endAdornment: (
                  <IconButton
                    onClick={handleSendMessage}
                    disabled={!message.trim() || isStreaming}
                    sx={{
                      color: message.trim() ? theme.brand.primary : theme.text.disabled,
                    }}
                  >
                    {isStreaming ? <CircularProgress size={24} /> : <SendIcon />}
                  </IconButton>
                ),
              }}
            />
          </Box>
        </Box>
      )}

      {/* 历史记录侧边栏 */}
      <Drawer
        anchor="right"
        open={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 320,
            bgcolor: theme.background.secondary,
            borderLeft: `1px solid ${theme.border.subtle}`,
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            历史对话
          </Typography>
          <List>
            {conversations.map((conv) => (
              <ListItem key={conv.id} disablePadding>
                <ListItemButton
                  onClick={() => loadConversation(conv.id)}
                  selected={conv.id === currentConversationId}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    '&.Mui-selected': {
                      bgcolor: `rgba(100, 149, 237, 0.12)`,
                      borderLeft: `3px solid ${theme.brand.primary}`,
                    },
                  }}
                >
                  <ListItemText
                    primary={conv.title}
                    secondary={new Date(conv.created_at).toLocaleDateString()}
                    primaryTypographyProps={{
                      sx: {
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </Box>
  );
}
