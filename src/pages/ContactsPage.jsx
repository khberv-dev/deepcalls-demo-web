import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react'
import ContactModal from '../components/ContactModal.jsx'
import SourceIcon from '../components/SourceIcon.jsx'
import Spinner from '../components/Spinner.jsx'
import { getErrorMessage } from '../api/client.js'
import { useContacts } from '../hooks/useContacts.js'
import { useDebouncedValue } from '../hooks/useDebouncedValue.js'
import { usePermissions } from '../hooks/usePermissions.js'
import { usePipelines } from '../hooks/usePipelines.js'
import { useSources } from '../hooks/useSources.js'
import { useUsers } from '../hooks/useUsers.js'
import { formatDate, formatPhone, fullName, initials } from '../utils/format.js'

const LIMIT = 20

export default function ContactsPage() {
    // Filters live in the URL so they survive reloads and can be linked to (e.g. from a kanban column).
    const [searchParams, setSearchParams] = useSearchParams()
    const navigate = useNavigate()
    const sourceId = searchParams.get('sourceId') ?? ''
    const pipelineId = searchParams.get('pipelineId') ?? ''
    const stageId = searchParams.get('stageId') ?? ''
    // Whose contacts: 'me' (default), 'all' or a user id. Anything but 'me' needs canReadContact.
    const { userId, canReadContact, canReadUser } = usePermissions()
    const owner = (canReadContact && searchParams.get('owner')) || 'me'
    const isMine = owner === 'me' || owner === userId
    const page = Math.max(1, Number(searchParams.get('page')) || 1)

    const [search, setSearch] = useState(searchParams.get('search') ?? '')
    const debouncedSearch = useDebouncedValue(search.trim(), 350)
    const [modal, setModal] = useState(null)

    const { data: sources = [] } = useSources()
    const { data: pipelines = [] } = usePipelines()
    const { data: users } = useUsers({ limit: 100 }, { enabled: canReadContact && canReadUser })
    const selectedPipeline = pipelines.find((p) => p.id === pipelineId)

    // Source/pipeline/stage ids are the owner's own, so those filters only make sense for my contacts.
    const { data, isLoading, isFetching, error } = useContacts({
        owner: owner === 'me' ? undefined : owner,
        search: debouncedSearch,
        sourceId: isMine ? sourceId : undefined,
        pipelineId: isMine ? pipelineId : undefined,
        stageId: isMine ? stageId : undefined,
        page,
        limit: LIMIT,
    })
    const totalPages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1

    const updateParams = (changes) => {
        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev)
                for (const [key, value] of Object.entries(changes)) {
                    if (value) next.set(key, value)
                    else next.delete(key)
                }
                if (!('page' in changes)) next.delete('page') // any filter change goes back to page 1
                return next
            },
            { replace: true },
        )
    }

    const pipelineNames = Object.fromEntries(pipelines.map((p) => [p.id, p.name]))
    const hasFilters = search || sourceId || pipelineId || stageId || owner !== 'me'

    return (
        <div className="page">
            <header className="page-header">
                <h1 className="page-title">
                    Kontaktlar {data && <span className="muted">({data.total})</span>}
                </h1>
                <button className="button" onClick={() => setModal({})}>
                    <Plus size={16} /> Yangi kontakt
                </button>
            </header>

            <div className="filters">
                <label className="search">
                    <Search size={16} aria-hidden="true" />
                    <input
                        className="input"
                        type="search"
                        placeholder="Ism, telefon yoki email boʻyicha qidirish"
                        value={search}
                        maxLength={100}
                        onChange={(e) => {
                            setSearch(e.target.value)
                            updateParams({ search: e.target.value.trim() })
                        }}
                    />
                </label>
                {canReadContact && (
                    <select
                        className="input"
                        value={owner}
                        onChange={(e) =>
                            updateParams({
                                owner: e.target.value === 'me' ? '' : e.target.value,
                                sourceId: '',
                                pipelineId: '',
                                stageId: '',
                            })
                        }
                    >
                        <option value="me">Mening kontaktlarim</option>
                        <option value="all">Barcha foydalanuvchilar</option>
                        {users?.items
                            .filter((u) => u.id !== userId)
                            .map((u) => (
                                <option key={u.id} value={u.id}>
                                    {fullName(u)}
                                </option>
                            ))}
                    </select>
                )}
                {isMine && (
                    <>
                        <select className="input" value={sourceId} onChange={(e) => updateParams({ sourceId: e.target.value })}>
                            <option value="">Barcha manbalar</option>
                            {sources.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                        <select
                            className="input"
                            value={pipelineId}
                            onChange={(e) => updateParams({ pipelineId: e.target.value, stageId: '' })}
                        >
                            <option value="">Barcha voronkalar</option>
                            {pipelines.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                        <select
                            className="input"
                            value={stageId}
                            onChange={(e) => updateParams({ stageId: e.target.value })}
                            disabled={!selectedPipeline}
                        >
                            <option value="">Barcha bosqichlar</option>
                            {selectedPipeline?.stages.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </>
                )}
                {hasFilters && (
                    <button
                        className="link-button"
                        onClick={() => {
                            setSearch('')
                            setSearchParams({}, { replace: true })
                        }}
                    >
                        Tozalash
                    </button>
                )}
            </div>

            {isLoading ? (
                <Spinner />
            ) : error ? (
                <p className="error">{getErrorMessage(error)}</p>
            ) : !data.items.length ? (
                <div className="empty-state">
                    <p className="muted">{hasFilters ? 'Hech narsa topilmadi' : 'Hali kontaktlar yoʻq'}</p>
                </div>
            ) : (
                <div className={`table-wrap${isFetching ? ' is-fetching' : ''}`}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Ism</th>
                                <th>Telefon</th>
                                <th>Email</th>
                                <th>Manba</th>
                                <th>Bosqich</th>
                                {!isMine && <th>Egasi</th>}
                                <th>Yaratilgan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.items.map((contact) => (
                                <tr key={contact.id} onClick={() => navigate(`/contacts/${contact.id}`)} className="clickable">
                                    <td>
                                        <div className="name-cell">
                                            <span className="avatar avatar--sm">{initials(contact)}</span>
                                            <div>
                                                <div className="strong">{fullName(contact)}</div>
                                                {contact.middleName && (
                                                    <div className="muted small">{contact.middleName}</div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        {contact.phones.length ? (
                                            <>
                                                {formatPhone(contact.phones[0])}
                                                {contact.phones.length > 1 && (
                                                    <span className="muted small"> +{contact.phones.length - 1}</span>
                                                )}
                                            </>
                                        ) : (
                                            <span className="muted">—</span>
                                        )}
                                    </td>
                                    <td>{contact.emails[0] ?? <span className="muted">—</span>}</td>
                                    <td>
                                        {contact.source ? (
                                            <span className="inline-icon">
                                                <SourceIcon icon={contact.source.icon} size={14} /> {contact.source.name}
                                            </span>
                                        ) : (
                                            <span className="muted">—</span>
                                        )}
                                    </td>
                                    <td>
                                        {contact.stage ? (
                                            <span className="inline-icon">
                                                <span
                                                    className="stage-dot"
                                                    style={{ background: contact.stage.color ?? 'var(--border)' }}
                                                />
                                                {contact.stage.name}
                                                {pipelineNames[contact.stage.pipelineId] && (
                                                    <span className="muted small">
                                                        {' '}
                                                        · {pipelineNames[contact.stage.pipelineId]}
                                                    </span>
                                                )}
                                            </span>
                                        ) : (
                                            <span className="muted">—</span>
                                        )}
                                    </td>
                                    {!isMine && (
                                        <td>
                                            {contact.userId === userId ? (
                                                <span className="muted">Siz</span>
                                            ) : (
                                                fullName(contact.user)
                                            )}
                                        </td>
                                    )}
                                    <td className="muted">{formatDate(contact.createdAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {data && data.total > LIMIT && (
                <div className="pagination">
                    <button
                        className="button button--ghost"
                        disabled={page <= 1}
                        onClick={() => updateParams({ page: String(page - 1) })}
                    >
                        <ChevronLeft size={16} /> Oldingi
                    </button>
                    <span className="muted">
                        {page} / {totalPages}
                    </span>
                    <button
                        className="button button--ghost"
                        disabled={page >= totalPages}
                        onClick={() => updateParams({ page: String(page + 1) })}
                    >
                        Keyingi <ChevronRight size={16} />
                    </button>
                </div>
            )}

            {modal && (
                <ContactModal
                    onClose={() => setModal(null)}
                    onCreated={(contact) => navigate(`/contacts/${contact.id}`)}
                />
            )}
        </div>
    )
}
