import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowLeft, Mail, Pencil, Phone } from 'lucide-react'
import CallsPanel from '../components/CallsPanel.jsx'
import CommentFeed from '../components/CommentFeed.jsx'
import ContactModal from '../components/ContactModal.jsx'
import SourceIcon from '../components/SourceIcon.jsx'
import Spinner from '../components/Spinner.jsx'
import { getErrorMessage } from '../api/client.js'
import { useContact, useUpdateContact } from '../hooks/useContacts.js'
import { usePipelines } from '../hooks/usePipelines.js'
import { toastError } from '../toast/toastStore.js'
import { formatDateTime, formatPhone, fullName, initials } from '../utils/format.js'

function InfoRow({ label, children }) {
    return (
        <div className="info-row">
            <span className="info-label">{label}</span>
            <div className="info-value">{children}</div>
        </div>
    )
}

/** amoCRM-style contact card: details and calls on the left, the timeline (notes + AI analyses) on the right. */
export default function ContactPage() {
    const { contactId } = useParams()
    const navigate = useNavigate()
    const { data: contact, isLoading, error } = useContact(contactId)
    const { data: pipelines = [] } = usePipelines()
    const updateContact = useUpdateContact()
    const [editing, setEditing] = useState(false)

    if (isLoading) return <Spinner />
    if (error) {
        return (
            <div className="page">
                <Link to="/contacts" className="link-button">
                    <ArrowLeft size={14} /> Kontaktlar
                </Link>
                <p className="error">
                    {error.response?.status === 404 ? 'Kontakt topilmadi' : getErrorMessage(error)}
                </p>
            </div>
        )
    }

    const pipeline = pipelines.find((p) => p.id === contact.stage?.pipelineId)
    const backTo = pipeline ? `/pipelines/${pipeline.id}` : '/contacts'

    return (
        <div className="page contact-page">
            <header className="page-header">
                <div className="contact-title">
                    <Link to={backTo} className="icon-button" title="Orqaga">
                        <ArrowLeft size={18} />
                    </Link>
                    <span className="avatar">{initials(contact)}</span>
                    <div>
                        <h1 className="page-title">{fullName(contact)}</h1>
                        {contact.middleName && <span className="muted small">{contact.middleName}</span>}
                    </div>
                </div>
                <button className="button button--ghost" onClick={() => setEditing(true)}>
                    <Pencil size={14} /> Tahrirlash
                </button>
            </header>

            <div className="contact-layout">
                <aside className="contact-side">
                    <section className="card panel">
                        <InfoRow label="Bosqich">
                            <select
                                className="input"
                                value={contact.stageId ?? ''}
                                disabled={updateContact.isPending}
                                onChange={(e) =>
                                    updateContact.mutate(
                                        { id: contact.id, stageId: e.target.value || null },
                                        { onError: toastError },
                                    )
                                }
                            >
                                <option value="">— Voronkada emas —</option>
                                {pipelines.map((p) => (
                                    <optgroup key={p.id} label={p.name}>
                                        {p.stages.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                            {contact.stage && (
                                <span
                                    className="stage-bar"
                                    style={{ background: contact.stage.color ?? 'var(--border)' }}
                                />
                            )}
                        </InfoRow>
                        <InfoRow label="Telefon">
                            {contact.phones.length ? (
                                contact.phones.map((phone) => (
                                    <a key={phone} href={`tel:+${phone}`} className="inline-icon">
                                        <Phone size={13} /> {formatPhone(phone)}
                                    </a>
                                ))
                            ) : (
                                <span className="muted">—</span>
                            )}
                        </InfoRow>
                        <InfoRow label="Email">
                            {contact.emails.length ? (
                                contact.emails.map((email) => (
                                    <a key={email} href={`mailto:${email}`} className="inline-icon">
                                        <Mail size={13} /> {email}
                                    </a>
                                ))
                            ) : (
                                <span className="muted">—</span>
                            )}
                        </InfoRow>
                        <InfoRow label="Manba">
                            {contact.source ? (
                                <span className="inline-icon">
                                    <SourceIcon icon={contact.source.icon} size={13} /> {contact.source.name}
                                </span>
                            ) : (
                                <span className="muted">—</span>
                            )}
                        </InfoRow>
                        <InfoRow label="Yaratilgan">
                            <span className="muted">{formatDateTime(contact.createdAt)}</span>
                        </InfoRow>
                    </section>

                    <CallsPanel contactId={contact.id} />
                </aside>

                <CommentFeed contactId={contact.id} />
            </div>

            {editing && (
                <ContactModal
                    contact={contact}
                    onClose={() => setEditing(false)}
                    onDeleted={() => navigate(backTo, { replace: true })}
                />
            )}
        </div>
    )
}
