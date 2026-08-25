/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { markThreadRead, sendMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useMessagesPoll } from '../context/MessagesPollContext';

function Messages() {
  const location = useLocation();
  const { token } = useAuth();
  const { threads, setThreads, loading } = useMessagesPoll();
  const queryThread = new URLSearchParams(location.search).get('thread');

  const [selectedThreadId, setSelectedThreadId] = useState(queryThread || null);
  const [sendingReply, setSendingReply] = useState(false);
  const [sendError, setSendError] = useState('');

  // sync selected thread with incoming threads — intentionally syncs state from props
  useEffect(() => {
    if (queryThread && threads.some((thread) => thread.id === queryThread)) {
      setSelectedThreadId(queryThread);
      return;
    }
    if (selectedThreadId && threads.some((thread) => thread.id === selectedThreadId)) return;
    if (threads[0]?.id) setSelectedThreadId(threads[0].id);
    if (threads.length === 0) setSelectedThreadId(queryThread || null);
  }, [threads, queryThread, selectedThreadId, setSelectedThreadId]);

  const handleSelectThread = (threadId) => {
    setSelectedThreadId(threadId);
    setThreads((currentThreads) =>
      currentThreads.map((thread) =>
        thread.id === threadId ? { ...thread, unread: 0 } : thread,
      ),
    );
  };

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedThreadId) || threads[0] || null,
    [selectedThreadId, threads],
  );

  const messagesListRef = useRef(null);
  const replyPanelRef = useRef(null);
  const scrollTimeoutRef = useRef(null);

  useEffect(() => {
    // scroll conversation to bottom when selected thread or its messages change
    const el = messagesListRef.current;
    const replyEl = replyPanelRef.current;
    if (el) {
      if (scrollTimeoutRef.current) window.clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = window.setTimeout(() => {
        const replyHeight = replyEl ? replyEl.offsetHeight : 0;
        el.scrollTop = Math.max(0, el.scrollHeight - el.clientHeight - replyHeight + 8);
      }, 50);
    }
    return () => {
      if (scrollTimeoutRef.current) window.clearTimeout(scrollTimeoutRef.current);
    };
  }, [selectedThreadId, selectedThread?.messages?.length]);

  useEffect(() => {
    if (!selectedThreadId || !token) return;

    let cancelled = false;

    const markRead = async () => {
      try {
        const { ok } = await markThreadRead(token, selectedThreadId);
        if (!ok || cancelled) return;

        setThreads((currentThreads) =>
          currentThreads.map((thread) =>
            thread.id === selectedThreadId ? { ...thread, unread: 0 } : thread,
          ),
        );
      } catch {
        // ignore
      }
    };

    markRead();

    return () => {
      cancelled = true;
    };
  }, [selectedThreadId, token, setThreads]);

  const isAnonymousThread = Boolean(
    selectedThread?.isAnonymous ||
    selectedThread?.senderName === 'Unknown' ||
    String(selectedThread?.id || '').startsWith('anon-vehicle-')
  );

  const handleSendAutoReply = async () => {
    if (!selectedThread || !token || sendingReply) return;
    if (isAnonymousThread) {
      setSendError('Cannot reply to anonymous sender. No reply channel available.');
      return;
    }

    try {
      setSendingReply(true);
      setSendError('');
      const text = "Ok! I'm coming!";
      const { ok, data } = await sendMessage(token, selectedThread.id, text, 'default');

      if (!ok) {
        setSendError(data?.message || 'Unable to send message.');
        return;
      }

      setThreads((currentThreads) =>
        currentThreads.map((thread) =>
          thread.id === selectedThread.id
            ? {
                ...thread,
                unread: 0,
                preview: text,
                time: data?.message?.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                messages: [
                  ...(thread.messages || []),
                  data?.message || {
                    id: String(Date.now()),
                    sender: 'me',
                    text,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    read: false,
                    kind: 'TEXT',
                  },
                ],
              }
            : thread,
        ),
      );
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <main className="page-shell dashboard-page messages-page">
      <section className="messages-layout">
        <aside className="messages-sidebar">
          <div className="messages-header-row">
            <h2>Inbox</h2>
          </div>

          {loading ? (
            <p className="state-message">Loading message threads...</p>
          ) : threads.length === 0 ? (
            <p className="state-message">No messages received yet.</p>
          ) : (
            <div role="tablist" aria-label="Message threads">
              {threads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  role="tab"
                  aria-selected={selectedThread?.id === thread.id}
                  className={`message-thread ${selectedThread?.id === thread.id ? 'is-selected' : ''}`}
                  onClick={() => handleSelectThread(thread.id)}
                >
                <div className="message-thread__top">
                  <strong>{thread.senderName}</strong>
                  <span>{thread.time}</span>
                </div>

                <div className="message-thread__meta">
                  {thread.username && <span className="tag tag-neutral">@{thread.username}</span>}
                  {thread.unread > 0 && <span className="message-count">{thread.unread}</span>}
                </div>

                <p>{thread.preview}</p>
              </button>
              ))}
            </div>
          )}
        </aside>

        {selectedThread ? (
          <section className="messages-chat-panel">
            <div className="messages-chat-header">
              <div>
                <h2>{selectedThread.senderName}</h2>
                {selectedThread.username && <p className="page-description">@{selectedThread.username}</p>}
              </div>
            </div>

            <div className="messages-list" ref={messagesListRef}>
              {(selectedThread.messages || []).map((message) => (
                <div
                  key={message.id}
                  className={`message-bubble ${message.sender === 'me' ? 'message-bubble--mine' : 'message-bubble--theirs'}`}
                >
                  <p>{message.text}</p>
                  <span>{message.time}</span>
                </div>
              ))}
            </div>

            <div className="message-reply-panel" ref={replyPanelRef}>
              {sendError && <p className="state-message state-message--error">{sendError}</p>}
              {isAnonymousThread ? (
                <p className="state-message">Anonymous messages cannot be replied to — no reply channel available.</p>
              ) : (
                <div className="message-reply-panel__actions">
                  <button type="button" className="btn btn-primary" onClick={handleSendAutoReply} disabled={sendingReply}>
                    {sendingReply ? 'Sending...' : "Ok! I'm coming!"}
                  </button>
                </div>
              )}
            </div>
          </section>
        ) : (
          !loading && (
            <section className="messages-chat-panel" style={{ alignItems: 'center', justifyContent: 'center' }}>
              <p className="state-message">Select a thread from the inbox to view messages.</p>
            </section>
          )
        )}
      </section>
    </main>
  );
}

export default Messages;
