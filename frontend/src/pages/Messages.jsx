import { useEffect, useMemo, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchMessages, sendAutoReply } from '../services/api';
import { useAuth } from '../context/AuthContext';

function Messages() {
  const location = useLocation();
  const { token } = useAuth();
  const queryThread = new URLSearchParams(location.search).get('thread');

  const [threads, setThreads] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState(queryThread || null);
  const [loading, setLoading] = useState(true);
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadMessages = async () => {
      if (!token) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const { ok, data } = await fetchMessages(token);

        if (!isMounted) return;

        if (ok && Array.isArray(data?.messages)) {
          const list = data.messages;
          const initialId = queryThread || list[0]?.id || null;
          // mark active thread as read
          const updatedList = list.map((t) => (t.id === initialId ? { ...t, unread: 0 } : t));
          setThreads(updatedList);
          setSelectedThreadId(initialId);
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

    loadMessages();

    return () => {
      isMounted = false;
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
        const { ok } = await (await import('../services/api')).markThreadRead(token, selectedThreadId);
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

  const handleAutoReply = async () => {
    if (!selectedThread || !token || sendingReply) return;

    const safeMessage = selectedThread.blocked
      ? 'Hey, sorry I am on my way!'
      : selectedThread.emergency
        ? 'I am on my way and I am contacting the emergency services now.'
        : 'Thank you for reaching out. Your message has been received.';

    try {
      setSendingReply(true);
      const mode = selectedThread.blocked ? 'blocked' : selectedThread.emergency ? 'emergency' : 'default';
      const { ok, data } = await sendAutoReply(token, selectedThread.id, mode);

      if (ok) {
        setThreads((currentThreads) =>
          currentThreads.map((thread) =>
            thread.id === selectedThread.id
              ? {
                  ...thread,
                  unread: 0,
                  messages: [
                    ...(thread.messages || []),
                    {
                      id: Date.now(),
                      sender: 'me',
                      text: data.message || safeMessage,
                      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    },
                  ],
                }
              : thread,
          ),
        );
      }
    } finally {
      setSendingReply(false);
    }
  };

  const handleEmergencyReply = async () => {
    if (!selectedThread || !token || sendingReply) return;

    const safeEmergency = 'I am on my way and I am contacting the emergency services now.';

    try {
      setSendingReply(true);
      const { ok, data } = await sendAutoReply(token, selectedThread.id, 'emergency');

      if (ok) {
        setThreads((currentThreads) =>
          currentThreads.map((thread) =>
            thread.id === selectedThread.id
              ? {
                  ...thread,
                  unread: 0,
                  messages: [
                    ...(thread.messages || []),
                    {
                      id: Date.now(),
                      sender: 'me',
                      text: data.message || safeEmergency,
                      time: 'Now',
                    },
                  ],
                }
              : thread,
          ),
        );
      }
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
              <button type="button" onClick={handleAutoReply} disabled={sendingReply}>
                {sendingReply ? 'Sending...' : 'Send reply'}
              </button>
              <button
                type="button"
                onClick={handleEmergencyReply}
                disabled={sendingReply}
                className="btn-danger"
              >
                {sendingReply ? 'Sending...' : 'Emergency reply'}
              </button>
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
