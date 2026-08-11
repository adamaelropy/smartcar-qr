function Communications() {
  const communications = [
    {
      title: 'Customer Support',
      detail: 'Connect directly with service teams for inspection and maintenance updates.',
    },
    {
      title: 'Service Alerts',
      detail: 'Get real-time updates about service availability and scheduling changes.',
    },
    {
      title: 'Driver Messages',
      detail: 'Share important communication notes with nearby smart car stations.',
    },
  ];

  return (
    <main className="page communications-page">
      <header>
        <h1>Communications</h1>
      </header>

      <section className="communication-list">
        {communications.map((item) => (
          <article key={item.title} className="communication-item">
            <h2>{item.title}</h2>
            <p>{item.detail}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

export default Communications;
