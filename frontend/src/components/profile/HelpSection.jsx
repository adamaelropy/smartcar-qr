const HELP_TOPICS = [
  { id: 'register', label: 'How do I register a vehicle?', category: 'GETTING STARTED' },
  { id: 'qr', label: 'How do I download my QR?', category: 'VEHICLE & QR' },
  { id: 'bug', label: 'How do I report a bug?', category: 'SUPPORT' },
];

export default function HelpSection({ helpMessages, helpInput, setHelpInput, onAsk, onSubmit }) {
  return (
    <section className="profile-section">
      <div className="profile-section-header">
        <div>
          <h2>Help Center</h2>
        </div>
      </div>
      <div className="help-center">
        <aside className="help-topics-card">
          <div className="help-topics-header">
            <h3>Popular topics</h3>
            <span className="help-topics-badge">3 articles</span>
          </div>
          <div className="help-topics-list">
            {HELP_TOPICS.map((topic) => (
              <button
                key={topic.id}
                type="button"
                className="help-topic-item"
                onClick={() => onAsk(topic.label)}
              >
                <div className="help-topic-text">
                  <span className="help-topic-category">{topic.category}</span>
                  <span className="help-topic-title">{topic.label}</span>
                </div>
                <svg className="help-topic-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            ))}
          </div>
        </aside>

        <div className="help-chat-card">
          <div className="help-chat__header">
            <div className="help-chat__identity">
              <div className="help-chat__avatar" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div>
                <strong className="help-chat__name">SmartCar Assistant</strong>
                <span className="help-chat__sub">Typically replies instantly</span>
              </div>
            </div>
            <span className="help-chat__status">ONLINE</span>
          </div>

          <div className="help-chat__body">
            {helpMessages.length === 0 ? (
              <div className="help-chat__empty-state">
                <div className="help-chat__empty-icon" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <strong>How can we help?</strong>
                <p>Select a topic on the left or type your question below.</p>
              </div>
            ) : (
              helpMessages.map((message, index) => (
                <div key={`${message.from}-${index}`} className={`help-message help-message--${message.from}`}>
                  <div className="help-message__bubble">{message.text}</div>
                </div>
              ))
            )}
          </div>

          <div className="help-chat__composer">
            <input
              className="help-chat__input"
              value={helpInput}
              onChange={(e) => setHelpInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onSubmit();
                }
              }}
              placeholder="Ask a question..."
              aria-label="Ask a question"
            />
            <button
              type="button"
              className="btn btn-primary help-chat__send-btn"
              onClick={onSubmit}
              disabled={!helpInput.trim()}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
