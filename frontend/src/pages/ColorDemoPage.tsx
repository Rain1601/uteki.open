import { Box, Typography, Button, Card, CardContent, Grid, Chip } from '@mui/material';
import { useTheme } from '../theme/ThemeProvider';

/**
 * 配色演示页面 - 展示所有配色编号
 */
export default function ColorDemoPage() {
  const { theme } = useTheme();

  return (
    <Box>
      {/* 标题 */}
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          mb: 1,
          background: `linear-gradient(135deg, ${theme.brand.primary} 0%, ${theme.brand.accent} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        配色系统演示
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        uchu_trade 配色方案 - 带编号标注方便修改
      </Typography>

      {/* 核心主题色 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            核心主题色
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    width: '100%',
                    height: 80,
                    bgcolor: '#2EE5AC',
                    borderRadius: 2,
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#000',
                    fontWeight: 700,
                  }}
                >
                  C1
                </Box>
                <Typography variant="body2" color="text.secondary">
                  翠绿 #2EE5AC
                </Typography>
                <Typography variant="caption" color="text.muted">
                  主要交互、成功状态
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    width: '100%',
                    height: 80,
                    bgcolor: '#f57ad0',
                    borderRadius: 2,
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 700,
                  }}
                >
                  C2
                </Box>
                <Typography variant="body2" color="text.secondary">
                  粉红 #f57ad0
                </Typography>
                <Typography variant="caption" color="text.muted">
                  卖出标识、次要操作
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    width: '100%',
                    height: 80,
                    bgcolor: '#6495ed',
                    borderRadius: 2,
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 700,
                  }}
                >
                  C3
                </Box>
                <Typography variant="body2" color="text.secondary">
                  道奇蓝 #6495ed
                </Typography>
                <Typography variant="caption" color="text.muted">
                  SideBar菜单、焦点状态
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    width: '100%',
                    height: 80,
                    bgcolor: '#7b61ff',
                    borderRadius: 2,
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 700,
                  }}
                >
                  C4
                </Box>
                <Typography variant="body2" color="text.secondary">
                  紫色 #7b61ff
                </Typography>
                <Typography variant="caption" color="text.muted">
                  次要品牌色
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 按钮演示 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            按钮配色（带编号标注）
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {/* C1 - 主要按钮 */}
            <Button variant="contained" sx={{ bgcolor: theme.button.primary.bg }}>
              主要按钮 (C1)
            </Button>

            {/* S1 - 成功按钮 */}
            <Button variant="contained" color="success" sx={{ bgcolor: theme.button.success.bg }}>
              成功按钮 (S1)
            </Button>

            {/* S3 - 危险按钮 */}
            <Button variant="contained" color="error" sx={{ bgcolor: theme.button.danger.bg }}>
              危险按钮 (S3)
            </Button>

            {/* S2 - 警告按钮 */}
            <Button variant="contained" color="warning" sx={{ bgcolor: theme.button.warning.bg }}>
              警告按钮 (S2)
            </Button>

            {/* S4 - 信息按钮 */}
            <Button variant="contained" color="info" sx={{ bgcolor: theme.button.info.bg }}>
              信息按钮 (S4)
            </Button>

            {/* C3 - 交互按钮 */}
            <Button variant="contained" sx={{ bgcolor: theme.button.interactive.bg }}>
              交互按钮 (C3)
            </Button>

            {/* C4 - 强调按钮 */}
            <Button variant="contained" sx={{ bgcolor: theme.button.emphasis.bg }}>
              强调按钮 (C4)
            </Button>
          </Box>

          <Typography variant="subtitle1" sx={{ mt: 3, mb: 2, fontWeight: 600 }}>
            次要按钮（边框）
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Button variant="outlined" color="primary">
              次要按钮 (C1)
            </Button>
            <Button variant="outlined" color="success">
              成功边框 (S1)
            </Button>
            <Button variant="outlined" color="error">
              错误边框 (S3)
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* 状态色演示 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            状态颜色
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Chip
                label="成功 (S1)"
                sx={{
                  bgcolor: theme.status.success,
                  color: '#fff',
                  width: '100%',
                }}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <Chip
                label="警告 (S2)"
                sx={{
                  bgcolor: theme.status.warning,
                  color: '#000',
                  width: '100%',
                }}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <Chip
                label="错误 (S3)"
                sx={{
                  bgcolor: theme.status.error,
                  color: '#fff',
                  width: '100%',
                }}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <Chip
                label="信息 (S4)"
                sx={{
                  bgcolor: theme.status.info,
                  color: '#fff',
                  width: '100%',
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 交易配色 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            交易配色
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={4}>
              <Chip
                label="买入 (T1)"
                sx={{
                  bgcolor: theme.trading.buy,
                  color: '#fff',
                  width: '100%',
                }}
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <Chip
                label="卖出 (T2)"
                sx={{
                  bgcolor: theme.trading.sell,
                  color: '#fff',
                  width: '100%',
                }}
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <Chip
                label="中性 (T3)"
                sx={{
                  bgcolor: theme.trading.neutral,
                  color: '#fff',
                  width: '100%',
                }}
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <Chip
                label="盈利 (T1亮)"
                sx={{
                  bgcolor: theme.trading.profit,
                  color: '#000',
                  width: '100%',
                }}
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <Chip
                label="亏损 (C2)"
                sx={{
                  bgcolor: theme.trading.loss,
                  color: '#fff',
                  width: '100%',
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 背景色演示 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            背景色系（当前模式）
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2.4}>
              <Box
                sx={{
                  bgcolor: theme.background.deepest,
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  BG1 - 极深黑
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 0.5 }}>
                  #0a0a0a
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Box
                sx={{
                  bgcolor: theme.background.primary,
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  BG2 - 主背景
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 0.5 }}>
                  #181c1f
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Box
                sx={{
                  bgcolor: theme.background.secondary,
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  BG3 - 次背景
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 0.5 }}>
                  #1E1E1E
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Box
                sx={{
                  bgcolor: theme.background.tertiary,
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  BG4 - 卡片背景
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 0.5 }}>
                  #262830
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Box
                sx={{
                  bgcolor: theme.background.hover,
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  BG5 - 悬浮状态
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 0.5 }}>
                  #2e3039
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 文字颜色 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            文字颜色
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography sx={{ color: theme.text.primary }}>TXT1 - 主文字 #ffffff</Typography>
            <Typography sx={{ color: theme.text.secondary }}>TXT2 - 次要文字 #e5e7eb</Typography>
            <Typography sx={{ color: theme.text.muted }}>TXT3 - 静音文字 #8b8d94</Typography>
            <Typography sx={{ color: theme.text.disabled }}>TXT4 - 禁用文字 #6b6d74</Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
