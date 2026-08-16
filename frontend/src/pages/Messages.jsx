import { useEffect, useMemo, useState } from 'react';
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

  useEffect(() => {
    if (!selectedThreadId) return;

    setThreads((currentThreads) =>
      currentThreads.map((thread) =>
        thread.id === selectedThreadId ? { ...thread, unread: 0 } : thread,
      ),
    );
  }, [selectedThreadId]);

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
                  <span className={`tag ${thread.blocked ? 'tag-blocked' : thread.emergency ? 'tag-emergency' : 'tag-neutral'}`}>
                    {thread.blocked ? 'Blocked' : thread.emergency ? 'Emergency' : thread.role}
                  </span>
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
              {selectedThread.blocked && <span className="tag tag-blocked">Blocked</span>}
              {selectedThread.emergency && !selectedThread.blocked && (
                <span className="tag tag-emergency">Emergency</span>
              )}
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
              <button type="button" onClick={handleAutoReply} disabled={sendingReply}>
                {sendingReply
                  ? 'Sending...'
                  : selectedThread.blocked
                    ? 'Okay sorry, I am on my way!'
                    : selectedThread.emergency
                      ? 'Send emergency response'
                      : 'Send automated reply'}
              </button>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

export default Messages;
