import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import DemoPage from './pages/DemoPage';
import AdminPage from './pages/AdminPage';
import AgentChatPage from './pages/AgentChatPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<DemoPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="agent" element={<AgentChatPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
