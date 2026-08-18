import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchMessages, markThreadRead, sendMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';

function Messages() {
  const location = useLocation();
  const { token } = useAuth();
  const queryThread = new URLSearchParams(location.search).get('thread');

  const [threads, setThreads] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState(queryThread || null);
  const [loading, setLoading] = useState(true);
  const [sendingReply, setSendingReply] = useState(false);
  const [composerText, setComposerText] = useState('');
  const [sendError, setSendError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadMessages = async (keepLoadingState = false) => {
      if (!token) {
        if (isMounted) setLoading(false);
        return;
      }

      if (keepLoadingState) {
        setLoading(true);
      }

      try {
        const { ok, data } = await fetchMessages(token);
        if (!isMounted) return;

        if (ok && Array.isArray(data?.messages)) {
          const list = data.messages;
          setThreads(list);
          setSelectedThreadId((currentId) => {
            if (queryThread && list.some((thread) => thread.id === queryThread)) return queryThread;
            if (currentId && list.some((thread) => thread.id === currentId)) return currentId;
            return list[0]?.id || null;
          });
        } else {
          setThreads([]);
          setSelectedThreadId(queryThread || null);
        }
      } catch {
        if (isMounted) {
          setThreads([]);
          setSelectedThreadId(queryThread || null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadMessages(true);
    const intervalId = window.setInterval(() => loadMessages(false), 5000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [token, queryThread]);

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

  useEffect(() => {
    // scroll conversation to bottom when selected thread or its messages change
    const el = messagesListRef.current;
    const replyEl = replyPanelRef.current;
    if (el) {
      // allow render to complete
      setTimeout(() => {
        const replyHeight = replyEl ? replyEl.offsetHeight : 0;
        // leave extra space equal to reply panel so last message isn't hidden
        el.scrollTop = Math.max(0, el.scrollHeight - el.clientHeight - replyHeight + 8);
      }, 50);
    }
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
  }, [selectedThreadId, token]);

  const handleSend = async (mode = 'default') => {
    if (!selectedThread || !token || sendingReply) return;

    const text = composerText.trim();
    if (!text) {
      setSendError('Type a message first.');
      return;
    }

    try {
      setSendingReply(true);
      setSendError('');
      const { ok, data } = await sendMessage(token, selectedThread.id, text, mode);

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
                    kind: mode === 'emergency' ? 'EMERGENCY' : 'TEXT',
                  },
                ],
              }
            : thread,
        ),
      );
      setComposerText('');
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
            threads.map((thread) => (
              <button
                key={thread.id}
                type="button"
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
            ))
          )}
        </aside>

        {selectedThread ? (
          <section className="messages-chat-panel">
            <div className="messages-chat-header">
              <div>
                <p className="eyebrow">Conversation</p>
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
              <textarea
                className="message-composer"
                value={composerText}
                onChange={(event) => setComposerText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    handleSend('default');
                  }
                }}
                rows={3}
                placeholder={`Message ${selectedThread.senderName}...`}
              />
              {sendError && <p className="state-message state-message--error">{sendError}</p>}
              <div className="message-reply-panel__actions">
                <button type="button" className="btn btn-secondary" onClick={() => handleSend('default')} disabled={sendingReply}>
                  {sendingReply ? 'Sending...' : 'Send message'}
                </button>
                <button type="button" className="btn btn-danger" onClick={() => handleSend('emergency')} disabled={sendingReply}>
                  {sendingReply ? 'Sending...' : 'Send as emergency'}
                </button>
              </div>
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
