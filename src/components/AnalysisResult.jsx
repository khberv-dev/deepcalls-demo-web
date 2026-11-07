import { INTENT_CATEGORY, LANGUAGE, SPEAKER, label } from '../labels.js'

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

/**
 * Full call analysis (`details` of a `call_analysis` comment). The headline numbers and the summary are shown
 * by the comment itself, so this renders the rest.
 */
export default function AnalysisResult({ data }) {
    const {
        language,
        participants,
        clientIntent,
        purchaseLikelihood,
        productsOrServices,
        operatorPerformance,
        keyMoments,
        recommendedNextSteps,
    } = data

    return (
        <div className="analysis">
            <p className="muted small">
                Operator: {participants?.operatorName ?? 'Nomaʼlum'} · Mijoz: {participants?.clientName ?? 'Nomaʼlum'} ·
                Til: {label(LANGUAGE, language)}
            </p>

            <Section title="Mijoz maqsadi">
                <p>
                    <span className="badge">{label(INTENT_CATEGORY, clientIntent?.category)}</span>{' '}
                    <span className="muted small">
                        ishonchlilik {Math.round((clientIntent?.confidence ?? 0) * 100)}%
                    </span>
                </p>
                <p>{clientIntent?.primary}</p>
                {clientIntent?.secondary?.length > 0 && <List items={clientIntent.secondary} />}
            </Section>

            <div className="grid-2">
                <Section title="Xarid signallari">
                    <List items={purchaseLikelihood?.buyingSignals} />
                </Section>
                <Section title="Eʼtirozlar">
                    <List items={purchaseLikelihood?.objections} />
                </Section>
            </div>
            {purchaseLikelihood?.reasoning && <p className="muted small">{purchaseLikelihood.reasoning}</p>}

            {productsOrServices?.length > 0 && (
                <Section title="Mahsulotlar / xizmatlar">
                    <div className="tags">
                        {productsOrServices.map((p) => (
                            <span key={p} className="badge">
                                {p}
                            </span>
                        ))}
                    </div>
                </Section>
            )}

            <div className="grid-2">
                <Section title="Operatorning kuchli tomonlari">
                    <List items={operatorPerformance?.strengths} />
                </Section>
                <Section title="Yaxshilash mumkin">
                    <List items={operatorPerformance?.improvements} />
                </Section>
            </div>

            {keyMoments?.length > 0 && (
                <Section title="Muhim lahzalar">
                    <ol className="timeline">
                        {keyMoments.map((m, i) => (
                            <li key={i} className="timeline-item">
                                <span className="timestamp">{m.timestamp}</span>
                                <span className={`speaker speaker--${m.speaker}`}>{label(SPEAKER, m.speaker)}</span>
                                <span>{m.description}</span>
                            </li>
                        ))}
                    </ol>
                </Section>
            )}

            <Section title="Tavsiya etilgan keyingi qadamlar">
                <List items={recommendedNextSteps} />
            </Section>
        </div>
    )
}
