import { useState } from 'react'
import { Link } from 'react-router'
import { GripVertical, Pencil, Phone, Plus, Trash2 } from 'lucide-react'
import SourceIcon from './SourceIcon.jsx'
import { useContacts } from '../hooks/useContacts.js'
import { STAGE_TYPE } from '../labels.js'
import { formatDate, formatPhone, fullName } from '../utils/format.js'

// dataTransfer types are lowercased by browsers; distinct types tell card drags from column drags during dragover.
const DRAG_CONTACT = 'application/x-deepcalls-contact'
const DRAG_STAGE = 'application/x-deepcalls-stage'
const COLUMN_LIMIT = 100

function ContactCard({ contact, stageId, onOpen }) {
    return (
        <div
            className="kanban-card"
            draggable
            onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'move'
                e.dataTransfer.setData(DRAG_CONTACT, JSON.stringify({ id: contact.id, fromStageId: stageId }))
            }}
            onClick={() => onOpen(contact)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter') onOpen(contact)
            }}
        >
            <strong className="kanban-card-name">{fullName(contact)}</strong>
            {contact.phones[0] && (
                <span className="kanban-card-line">
                    <Phone size={13} aria-hidden="true" /> {formatPhone(contact.phones[0])}
                </span>
            )}
            <div className="kanban-card-footer">
                {contact.source ? (
                    <span className="kanban-card-line">
                        <SourceIcon icon={contact.source.icon} size={13} /> {contact.source.name}
                    </span>
                ) : (
                    <span />
                )}
                <span className="muted small">{formatDate(contact.createdAt)}</span>
            </div>
        </div>
    )
}

export default function KanbanColumn({
    stage,
    onOpenContact,
    onAddContact,
    onEditStage,
    onDeleteStage,
    onDropContact,
    onDropStage,
}) {
    const { data, isLoading, isError } = useContacts({ stageId: stage.id, limit: COLUMN_LIMIT })
    const [dropTarget, setDropTarget] = useState(false)
    const items = data?.items ?? []
    const hidden = stage.contactsCount - items.length

    const accepts = (e) => e.dataTransfer.types.includes(DRAG_CONTACT) || e.dataTransfer.types.includes(DRAG_STAGE)

    return (
        <section
            className={`kanban-column${dropTarget ? ' kanban-column--over' : ''}`}
            style={{ '--stage-color': stage.color ?? undefined }}
            onDragOver={(e) => {
                if (!accepts(e)) return
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
                if (!dropTarget) setDropTarget(true)
            }}
            onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) setDropTarget(false)
            }}
            onDrop={(e) => {
                e.preventDefault()
                setDropTarget(false)
                const contactData = e.dataTransfer.getData(DRAG_CONTACT)
                const stageData = e.dataTransfer.getData(DRAG_STAGE)
                if (contactData) {
                    const { id, fromStageId } = JSON.parse(contactData)
                    if (fromStageId !== stage.id) onDropContact(id, fromStageId, stage.id)
                } else if (stageData) {
                    onDropStage(stageData, stage.id)
                }
            }}
        >
            <header
                className="kanban-column-header"
                draggable
                onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move'
                    e.dataTransfer.setData(DRAG_STAGE, stage.id)
                }}
                title="Ustunni sudrab joyini oʻzgartiring"
            >
                <GripVertical size={14} className="grip" aria-hidden="true" />
                <span className="stage-dot" style={{ background: stage.color ?? 'var(--border-strong)' }} />
                <span className="kanban-column-title">{stage.name}</span>
                <span className="count">{stage.contactsCount}</span>
                {stage.type !== 'open' && <span className={`badge badge--${stage.type}`}>{STAGE_TYPE[stage.type]}</span>}
                <div className="kanban-column-actions">
                    <button className="icon-button" onClick={() => onAddContact(stage)} title="Kontakt qoʻshish">
                        <Plus size={16} />
                    </button>
                    <button className="icon-button" onClick={() => onEditStage(stage)} title="Tahrirlash">
                        <Pencil size={15} />
                    </button>
                    <button className="icon-button" onClick={() => onDeleteStage(stage)} title="Oʻchirish">
                        <Trash2 size={15} />
                    </button>
                </div>
            </header>
            <div className="kanban-column-body">
                {isLoading && <p className="muted small">Yuklanmoqda…</p>}
                {isError && <p className="error small">Yuklab boʻlmadi</p>}
                {!isLoading && !items.length && <p className="kanban-empty">Kontaktlar yoʻq</p>}
                {items.map((contact) => (
                    <ContactCard key={contact.id} contact={contact} stageId={stage.id} onOpen={onOpenContact} />
                ))}
                {hidden > 0 && (
                    <Link className="link-button" to={`/contacts?pipelineId=${stage.pipelineId}&stageId=${stage.id}`}>
                        Yana {hidden} ta kontakt
                    </Link>
                )}
            </div>
        </section>
    )
}
