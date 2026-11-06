function List({ items }) {
    if (!items?.length) return <p className="muted">—</p>
    return (
        <ul className="list">
            {items.map((item, i) => (
                <li key={i}>{item}</li>
            ))}
        </ul>
    )
}

function Section({ title, children }) {
    return (
        <section className="section">
            <h3 className="section-title">{title}</h3>
            {children}
        </section>
    )
}

export default function AnalysisResult({ data }) {
    const {
        language,
        summary,
        participants,
        clientIntent,
        purchaseLikelihood,
        productsOrServices,
        clientSentiment,
        operatorPerformance,
        keyMoments,
        recommendedNextSteps,
    } = data

    return (
        <div className="card result">
            <div className="stats">
                <div className="stat">
                    <span className="stat-label">Purchase likelihood</span>
                    <span className="stat-value">{purchaseLikelihood?.score ?? '—'}%</span>
                    <span className={`badge badge--${purchaseLikelihood?.level}`}>{purchaseLikelihood?.level}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Operator score</span>
                    <span className="stat-value">{operatorPerformance?.score ?? '—'}/10</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Sentiment</span>
                    <span className={`badge badge--${clientSentiment}`}>{clientSentiment}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Language</span>
                    <span className="stat-value">{language?.toUpperCase()}</span>
                </div>
            </div>

            <Section title="Summary">
                <p>{summary}</p>
                <p className="muted">
                    Operator: {participants?.operatorName ?? 'Unknown'} · Client: {participants?.clientName ?? 'Unknown'}
                </p>
            </Section>

            <Section title="Client intent">
                <p>
                    <span className="badge">{clientIntent?.category?.replaceAll('_', ' ')}</span>{' '}
                    <span className="muted">
                        confidence {Math.round((clientIntent?.confidence ?? 0) * 100)}%
                    </span>
                </p>
                <p>{clientIntent?.primary}</p>
                <List items={clientIntent?.secondary} />
            </Section>

            <div className="grid-2">
                <Section title="Buying signals">
                    <List items={purchaseLikelihood?.buyingSignals} />
                </Section>
                <Section title="Objections">
                    <List items={purchaseLikelihood?.objections} />
                </Section>
            </div>
            {purchaseLikelihood?.reasoning && <p className="muted">{purchaseLikelihood.reasoning}</p>}

            <Section title="Products / services">
                <div className="tags">
                    {productsOrServices?.map((p) => (
                        <span key={p} className="badge">{p}</span>
                    ))}
                </div>
            </Section>

            <div className="grid-2">
                <Section title="Operator strengths">
                    <List items={operatorPerformance?.strengths} />
                </Section>
                <Section title="Could improve">
                    <List items={operatorPerformance?.improvements} />
                </Section>
            </div>

            <Section title="Key moments">
                <ol className="timeline">
                    {keyMoments?.map((m, i) => (
                        <li key={i} className="timeline-item">
                            <span className="timestamp">{m.timestamp}</span>
                            <span className={`speaker speaker--${m.speaker}`}>{m.speaker}</span>
                            <span>{m.description}</span>
                        </li>
                    ))}
                </ol>
            </Section>

            <Section title="Recommended next steps">
                <List items={recommendedNextSteps} />
            </Section>
        </div>
    )
}
