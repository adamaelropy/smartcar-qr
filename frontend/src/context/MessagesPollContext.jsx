/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from 'react';
import { useMessagesPolling } from '../hooks/useMessagesPolling';
import { useAuth } from './AuthContext';

const MessagesPollContext = createContext(null);

export function MessagesPollProvider({ children, intervalMs = 5000 }) {
  const { token, isAuthenticated } = useAuth();
  const { threads, setThreads, loading, refresh } = useMessagesPolling(token, isAuthenticated, intervalMs);

  const value = { threads, setThreads, loading, refresh };
  return (
    <MessagesPollContext.Provider value={value}>
      {children}
    </MessagesPollContext.Provider>
  );
}

export function useMessagesPoll() {
  const ctx = useContext(MessagesPollContext);
  if (!ctx) throw new Error('useMessagesPoll must be used within MessagesPollProvider');
  return ctx;
}
