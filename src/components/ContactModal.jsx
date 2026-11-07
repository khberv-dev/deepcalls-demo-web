import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import Modal from './Modal.jsx'
import { getErrorMessage } from '../api/client.js'
import { useCreateContact, useDeleteContact, useUpdateContact } from '../hooks/useContacts.js'
import { usePipelines } from '../hooks/usePipelines.js'
import { useSources } from '../hooks/useSources.js'
import { toastSuccess } from '../toast/toastStore.js'
import { formatDateTime, formatPhone } from '../utils/format.js'

function ListInput({ label, values, onChange, type, placeholder }) {
    const update = (index, value) => onChange(values.map((v, i) => (i === index ? value : v)))
    const remove = (index) => onChange(values.length === 1 ? [''] : values.filter((_, i) => i !== index))

    return (
        <div className="field">
            <span className="field-label">{label}</span>
            {values.map((value, index) => (
                <div key={index} className="input-row">
                    <input
                        className="input"
                        type={type}
                        value={value}
                        placeholder={placeholder}
                        onChange={(e) => update(index, e.target.value)}
                    />
                    <button type="button" className="icon-button" onClick={() => remove(index)} aria-label="Olib tashlash">
                        <X size={16} />
                    </button>
                </div>
            ))}
            {values.length < 20 && (
                <button type="button" className="link-button" onClick={() => onChange([...values, ''])}>
                    <Plus size={14} /> Yana qoʻshish
                </button>
            )}
        </div>
    )
}

/**
 * Create (no `contact`) or edit (`contact`) a contact.
 * `initial` pre-fills a new contact: { firstName, sourceId, pipelineId, stageId }.
 * `restrictPlacement`: editing another user's contact. Its source and stage must be the owner's, which we can't
 * list, so those fields are hidden and not sent.
 * `onCreated(contact)` runs after a successful create; `onDeleted` runs after a successful delete (e.g. to leave the contact's page).
 */
export default function ContactModal({ contact, initial = {}, onClose, onDeleted, onCreated, restrictPlacement = false }) {
    const isEdit = !!contact
    const { data: sources = [] } = useSources()
    const { data: pipelines = [] } = usePipelines()

    const [form, setForm] = useState(() => ({
        firstName: contact?.firstName ?? initial.firstName ?? '',
        lastName: contact?.lastName ?? '',
        middleName: contact?.middleName ?? '',
        // The server keeps digits only; show them formatted for editing (any formatting is accepted back).
        phones: contact?.phones?.length ? contact.phones.map(formatPhone) : [''],
        emails: contact?.emails?.length ? contact.emails : [''],
        sourceId: contact?.sourceId ?? initial.sourceId ?? '',
        pipelineId: contact?.stage?.pipelineId ?? initial.pipelineId ?? '',
        stageId: contact?.stageId ?? initial.stageId ?? '',
    }))
    const [confirmDelete, setConfirmDelete] = useState(false)

    const createContact = useCreateContact()
    const updateContact = useUpdateContact()
    const deleteContact = useDeleteContact()
    const save = isEdit ? updateContact : createContact

    const set = (field) => (value) => setForm((f) => ({ ...f, [field]: value }))
    const selectedPipeline = pipelines.find((p) => p.id === form.pipelineId)

    const handleSubmit = (e) => {
        e.preventDefault()
        const body = {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim() || null,
            middleName: form.middleName.trim() || null,
            phones: form.phones.map((p) => p.trim()).filter(Boolean),
            emails: form.emails.map((m) => m.trim()).filter(Boolean),
        }
        if (!restrictPlacement) {
            body.sourceId = form.sourceId || null
            // Pipeline placement: a stage wins; a pipeline alone means its first stage; neither removes it (on edit).
            if (form.stageId) body.stageId = form.stageId
            else if (form.pipelineId) body.pipelineId = form.pipelineId
            else if (isEdit) body.stageId = null
        }

        save.mutate(isEdit ? { id: contact.id, ...body } : body, {
            onSuccess: (saved) => {
                toastSuccess(isEdit ? 'Kontakt saqlandi' : 'Kontakt yaratildi')
                onClose()
                if (!isEdit) onCreated?.(saved)
            },
        })
    }

    const handleDelete = () => {
        deleteContact.mutate(contact.id, {
            onSuccess: () => {
                toastSuccess('Kontakt oʻchirildi')
                onClose()
                onDeleted?.()
            },
        })
    }

    const error = save.error ?? deleteContact.error

    return (
        <Modal
            title={isEdit ? 'Kontaktni tahrirlash' : 'Yangi kontakt'}
            onClose={onClose}
            footer={
                confirmDelete ? (
                    <>
                        <span className="footer-note">Kontakt butunlay oʻchiriladi. Davom etasizmi?</span>
                        <button type="button" className="button button--ghost" onClick={() => setConfirmDelete(false)}>
                            Yoʻq
                        </button>
                        <button
                            type="button"
                            className="button button--danger"
                            onClick={handleDelete}
                            disabled={deleteContact.isPending}
                        >
                            {deleteContact.isPending ? 'Kuting…' : 'Ha, oʻchirish'}
                        </button>
                    </>
                ) : (
                    <>
                        {isEdit && (
                            <button
                                type="button"
                                className="button button--ghost button--danger-text footer-left"
                                onClick={() => setConfirmDelete(true)}
                            >
                                <Trash2 size={16} /> Oʻchirish
                            </button>
                        )}
                        <button type="button" className="button button--ghost" onClick={onClose}>
                            Bekor qilish
                        </button>
                        <button type="submit" form="contact-form" className="button" disabled={save.isPending}>
                            {save.isPending ? 'Saqlanmoqda…' : 'Saqlash'}
                        </button>
                    </>
                )
            }
        >
            <form id="contact-form" className="form" onSubmit={handleSubmit}>
                <div className="grid-3">
                    <label className="field">
                        <span className="field-label">Ism *</span>
                        <input
                            className="input"
                            value={form.firstName}
                            onChange={(e) => set('firstName')(e.target.value)}
                            required
                            maxLength={100}
                            autoFocus
                        />
                    </label>
                    <label className="field">
                        <span className="field-label">Familiya</span>
                        <input
                            className="input"
                            value={form.lastName}
                            onChange={(e) => set('lastName')(e.target.value)}
                            maxLength={100}
                        />
                    </label>
                    <label className="field">
                        <span className="field-label">Otasining ismi</span>
                        <input
                            className="input"
                            value={form.middleName}
                            onChange={(e) => set('middleName')(e.target.value)}
                            maxLength={100}
                        />
                    </label>
                </div>

                <div className="grid-2">
                    <ListInput
                        label="Telefonlar"
                        type="tel"
                        placeholder="+998 90 123 45 67"
                        values={form.phones}
                        onChange={set('phones')}
                    />
                    <ListInput
                        label="Email"
                        type="email"
                        placeholder="name@mail.uz"
                        values={form.emails}
                        onChange={set('emails')}
                    />
                </div>

                {!restrictPlacement && (
                    <>
                        <label className="field">
                            <span className="field-label">Manba</span>
                            <select className="input" value={form.sourceId} onChange={(e) => set('sourceId')(e.target.value)}>
                                <option value="">— Tanlanmagan —</option>
                                {sources.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <div className="grid-2">
                            <label className="field">
                                <span className="field-label">Voronka</span>
                                <select
                                    className="input"
                                    value={form.pipelineId}
                                    onChange={(e) => setForm((f) => ({ ...f, pipelineId: e.target.value, stageId: '' }))}
                                >
                                    <option value="">— Voronkada emas —</option>
                                    {pipelines.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="field">
                                <span className="field-label">Bosqich</span>
                                <select
                                    className="input"
                                    value={form.stageId}
                                    onChange={(e) => set('stageId')(e.target.value)}
                                    disabled={!selectedPipeline}
                                >
                                    <option value="">{selectedPipeline ? 'Birinchi bosqich' : '—'}</option>
                                    {selectedPipeline?.stages.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>

                    </>
                )}
                {isEdit && (
                    <p className="muted small">
                        Yaratilgan: {formatDateTime(contact.createdAt)} · Yangilangan: {formatDateTime(contact.updatedAt)}
                    </p>
                )}
                {error && <p className="error">{getErrorMessage(error)}</p>}
            </form>
        </Modal>
    )
}
