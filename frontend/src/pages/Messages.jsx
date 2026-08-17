import { useEffect, useMemo, useState } from 'react';
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

  const handleAutoReply = async () => {
    if (!selectedThread || !token || sendingReply) return;

    const safeMessage = selectedThread.blocked
      ? 'Okay sorry, I am on my way!'
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
                  <span className={`tag ${thread.blocked ? 'tag-blocked' : thread.emergency ? 'tag-emergency' : 'tag-neutral'}`}>
                    {thread.blocked ? 'Blocked Alert' : thread.emergency ? 'Emergency' : thread.role || 'Contact'}
                  </span>
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
              <div>
                {selectedThread.blocked && <span className="tag tag-blocked">Blocked Vehicle</span>}
                {selectedThread.emergency && !selectedThread.blocked && (
                  <span className="tag tag-emergency">Emergency Alert</span>
                )}
              </div>
            </div>

            <div className="messages-list">
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

            <div className="message-reply-panel">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAutoReply}
                disabled={sendingReply}
              >
                {sendingReply
                  ? 'Sending response...'
                  : selectedThread.blocked
                    ? 'Reply: I am on my way'
                    : selectedThread.emergency
                      ? 'Send Emergency Response'
                      : 'Send Automated Reply'}
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
