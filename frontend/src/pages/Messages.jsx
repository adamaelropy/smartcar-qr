import { useEffect, useMemo, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchMessages, sendAutoReply } from '../services/api';
import { useAuth } from '../context/AuthContext';

const fallbackThreads = [
  {
    id: 'qr-accident',
    senderName: 'Random passerby',
    role: 'Scanned QR',
    label: 'Emergency alert',
    preview: 'A stranger scanned the QR on your relative\'s car and sent an emergency message.',
    time: 'Just now',
    unread: 1,
    blocked: false,
    emergency: true,
    messages: [
      {
        id: 1,
        sender: 'them',
        text: 'Please come to this location immediately: 47 Cedar Lane, Greenfield. Your relative may be in danger and needs help now.',
        time: '08:12 PM',
      },
      {
        id: 2,
        sender: 'me',
        text: 'I am on my way and I am contacting the emergency services now.',
        time: '08:14 PM',
      },
    ],
  },
  {
    id: 'qr-blocked',
    senderName: 'Random passerby',
    role: 'Scanned QR',
    label: 'Blocked message',
    preview: 'A stranger scanned the QR on the back of the vehicle and sent a blocked message.',
    time: '3 min ago',
    unread: 1,
    blocked: true,
    emergency: false,
    messages: [
      {
        id: 1,
        sender: 'them',
        text: 'Hey, you are blocking my car, please come and remove it.',
        time: '08:09 PM',
      },
      {
        id: 2,
        sender: 'me',
        text: 'Okay sorry, I am on my way!',
        time: '08:10 PM',
      },
    ],
  },
];

function Messages() {
  const location = useLocation();
  const { token } = useAuth();
  const queryThread = new URLSearchParams(location.search).get('thread');

  const [threads, setThreads] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState(queryThread || null);
  const [loading, setLoading] = useState(true);
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    const loadMessages = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { ok, data } = await fetchMessages(token);

        if (ok && Array.isArray(data?.messages)) {
          setThreads(data.messages);
          const firstThreadId = queryThread || data.messages[0]?.id || null;
          setSelectedThreadId(firstThreadId);
        } else {
          setThreads([]);
          setSelectedThreadId(queryThread || null);
        }
      } catch {
        setThreads([]);
        setSelectedThreadId(queryThread || null);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [token, queryThread]);

  useEffect(() => {
    if (queryThread && threads.some((thread) => thread.id === queryThread)) {
      setSelectedThreadId(queryThread);
    }
  }, [queryThread, threads]);

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
    if (!selectedThreadId) return;

    setThreads((currentThreads) =>
      currentThreads.map((thread) => (thread.id === selectedThreadId ? { ...thread, unread: 0 } : thread)),
    );

    // mark thread read on the server so subsequent polls reflect the change
    (async () => {
      try {
        if (token && selectedThreadId) {
          const { ok } = await (await import('../services/api')).markThreadRead(token, selectedThreadId);
          // no-op if not ok; local UI already updated
        }
      } catch (e) {
        // ignore
      }
    })();
  }, [selectedThreadId]);

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
            <h2>Messages</h2>
          </div>

          {loading ? (
            <p className="state-message">Loading messages...</p>
          ) : threads.length === 0 ? (
            <p className="state-message">No messages yet.</p>
          ) : (
            threads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                className={`message-thread ${selectedThreadId === thread.id ? 'is-selected' : ''}`}
                onClick={() => setSelectedThreadId(thread.id)}
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

        {selectedThread && (
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
        )}
      </section>
    </main>
  );
}

export default Messages;
