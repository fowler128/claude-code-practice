import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import SmartQueue from './pages/SmartQueue';
import MatterDetail from './pages/MatterDetail';
import Analytics from './pages/Analytics';
import WeeklyOpsBrief from './pages/WeeklyOpsBrief';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000
    }
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="queue" element={<SmartQueue />} />
            <Route path="queue/:lane" element={<SmartQueue />} />
            <Route path="matters/:id" element={<MatterDetail />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="ops-brief" element={<WeeklyOpsBrief />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
