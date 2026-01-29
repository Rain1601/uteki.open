import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import { useTheme } from '../theme/ThemeProvider';
import Toast from './Toast';
import HoverSidebar from './HoverSidebar';

const SIDEBAR_COLLAPSED_WIDTH = 54;

export default function Layout() {
  const { theme } = useTheme();

  return (
    <>
      <Toast />
      <Box sx={{ display: 'flex' }}>
        <HoverSidebar />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            marginLeft: `${SIDEBAR_COLLAPSED_WIDTH}px`,
            minHeight: '100vh',
            bgcolor: theme.background.deepest,
            p: 3,
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </>
  );
}
