import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowDown, ArrowUp, ImagePlus, Plus, Trash2, X } from 'lucide-react'
import Modal from './Modal.jsx'
import { getErrorMessage } from '../api/client.js'
import { useCreateForm, useDeleteFormLogo, useUpdateForm, useUploadFormLogo } from '../hooks/useForms.js'
import { usePipelines } from '../hooks/usePipelines.js'
import { useSources } from '../hooks/useSources.js'
import { FORM_FIELD_TYPE } from '../labels.js'
import { toastError, toastSuccess } from '../toast/toastStore.js'

const MAX_FIELDS = 30
const MAX_OPTIONS = 50
const NAME_TYPES = ['firstName', 'lastName', 'middleName']
const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
const LOGO_MAX_BYTES = 2 * 1024 * 1024

let nextUid = 1
const toRow = (field) => ({
    uid: nextUid++,
    key: field.key ?? '',
    type: field.type,
    label: field.label ?? '',
    placeholder: field.placeholder ?? '',
    required: field.type === 'firstName' || !!field.required,
    optionsText: (field.options ?? []).join('\n'),
})

// A new form starts with this; the user edits it.
const TEMPLATE = [
    { type: 'firstName', label: 'Ismingiz' },
    { type: 'phone', label: 'Telefon raqamingiz', placeholder: '+998 90 123 45 67', required: true },
    { type: 'textarea', label: 'Izoh' },
]

const parseOptions = (text) =>
    text
        .split('\n')
        .map((o) => o.trim())
        .filter(Boolean)

/**
 * Build the `fields` payload. Keys are always sent: the server's defaults (`field<N>` by position) could collide
 * with keys kept from before an edit. Returns `{ fields }` or `{ error }`.
 */
function buildFields(rows) {
    const counts = {}
    for (const row of rows) counts[row.type] = (counts[row.type] ?? 0) + 1
    if (counts.firstName !== 1) return { error: 'Formada aynan bitta “Ism” maydoni boʻlishi kerak' }
    if (counts.lastName > 1 || counts.middleName > 1) return { error: 'Familiya va otasining ismi maydonlari bittadan ortiq boʻlmaydi' }

    const taken = new Set(rows.map((r) => r.key.trim()).filter(Boolean))
    const fields = []
    for (const [index, row] of rows.entries()) {
        let key = row.key.trim()
        if (!key) {
            if (NAME_TYPES.includes(row.type) && !taken.has(row.type)) key = row.type
            else {
                let n = index + 1
                while (taken.has(`field${n}`)) n++
                key = `field${n}`
            }
            taken.add(key)
        }
        const field = { key, type: row.type, label: row.label.trim(), required: row.type === 'firstName' || row.required }
        if (row.placeholder.trim()) field.placeholder = row.placeholder.trim()
        if (row.type === 'select') {
            field.options = parseOptions(row.optionsText)
            if (!field.options.length) return { error: `“${field.label}”: kamida bitta variant kiriting` }
            if (field.options.length > MAX_OPTIONS) return { error: `“${field.label}”: ${MAX_OPTIONS} tadan koʻp variant boʻlmaydi` }
        }
        fields.push(field)
    }
    const keys = fields.map((f) => f.key)
    const duplicate = keys.find((k, i) => keys.indexOf(k) !== i)
    if (duplicate) return { error: `“${duplicate}” kaliti takrorlanmoqda` }
    return { fields }
}

function FieldRow({ row, index, count, onChange, onMove, onRemove, usedTypes }) {
    const isFirstName = row.type === 'firstName'
    return (
        <li className="form-field-row">
            <div className="form-field-main">
                <span className="stage-editor-index">{index + 1}</span>
                <select
                    className="input form-field-type"
                    value={row.type}
                    onChange={(e) => onChange({ type: e.target.value, required: e.target.value === 'firstName' || row.required })}
                    aria-label="Maydon turi"
                >
                    {Object.entries(FORM_FIELD_TYPE).map(([value, text]) => (
                        // A name field can appear only once.
                        <option key={value} value={value} disabled={value !== row.type && NAME_TYPES.includes(value) && usedTypes.has(value)}>
                            {text}
                        </option>
                    ))}
                </select>
                <input
                    className="input"
                    value={row.label}
                    onChange={(e) => onChange({ label: e.target.value })}
                    placeholder="Sarlavha, masalan: Ismingiz"
                    aria-label="Sarlavha"
                    required
                    maxLength={200}
                />
                <label className="check form-field-required" title={isFirstName ? 'Ism har doim majburiy' : undefined}>
                    <input
                        type="checkbox"
                        checked={row.required}
                        disabled={isFirstName}
                        onChange={(e) => onChange({ required: e.target.checked })}
                    />
                    <span className="small">Majburiy</span>
                </label>
                <div className="form-field-actions">
                    <button type="button" className="icon-button" onClick={() => onMove(-1)} disabled={index === 0} title="Yuqoriga">
                        <ArrowUp size={15} />
                    </button>
                    <button type="button" className="icon-button" onClick={() => onMove(1)} disabled={index === count - 1} title="Pastga">
                        <ArrowDown size={15} />
                    </button>
                    <button type="button" className="icon-button" onClick={onRemove} disabled={count <= 1} title="Olib tashlash">
                        <X size={15} />
                    </button>
                </div>
            </div>
            <div className="form-field-extra">
                <input
                    className="input"
                    value={row.placeholder}
                    onChange={(e) => onChange({ placeholder: e.target.value })}
                    placeholder="Maslahat matni (ixtiyoriy)"
                    aria-label="Maslahat matni"
                    maxLength={200}
                />
                <input
                    className="input form-field-key"
                    value={row.key}
                    onChange={(e) => onChange({ key: e.target.value })}
                    placeholder="Kalit (avtomatik)"
                    aria-label="Kalit"
                    title="Yuborilgan javoblar shu kalit bilan keladi. Oʻzgartirsangiz, maxsus sahifalar ham yangilanishi kerak."
                    maxLength={100}
                />
            </div>
            {row.type === 'select' && (
                <textarea
                    className="input textarea form-field-options"
                    value={row.optionsText}
                    onChange={(e) => onChange({ optionsText: e.target.value })}
                    placeholder={'Variantlar, har biri alohida qatorda\nMasalan:\nSayt\nReklama'}
                    aria-label="Variantlar"
                    rows={3}
                />
            )}
        </li>
    )
}

/** Create a form (no `form`) or edit `form`: name, fields, logo, where its leads go, and whether it's active. */
export default function FormModal({ form, onClose }) {
    const isEdit = !!form
    const { data: sources = [] } = useSources()
    const { data: pipelines = [] } = usePipelines()

    const [name, setName] = useState(form?.name ?? '')
    const [isActive, setIsActive] = useState(form?.isActive ?? true)
    const [rows, setRows] = useState(() => (form?.fields?.length ? form.fields : TEMPLATE).map(toRow))
    const [sourceId, setSourceId] = useState(form?.sourceId ?? '')
    const [pipelineId, setPipelineId] = useState(form?.stage?.pipelineId ?? '')
    const [stageId, setStageId] = useState(form?.stageId ?? '')
    // { file, preview } for a newly picked logo; `removeLogo` drops the current one on save.
    const [logo, setLogo] = useState(null)
    const [removeLogo, setRemoveLogo] = useState(false)
    const [error, setError] = useState(null)
    const [pending, setPending] = useState(false)

    const createForm = useCreateForm()
    const updateForm = useUpdateForm()
    const uploadLogo = useUploadFormLogo()
    const deleteLogo = useDeleteFormLogo()

    const selectedPipeline = pipelines.find((p) => p.id === pipelineId)
    const usedTypes = new Set(rows.map((r) => r.type))
    const currentLogo = logo?.preview ?? (removeLogo ? null : form?.logoUrl)

    const updateRow = (uid, patch) => setRows((list) => list.map((r) => (r.uid === uid ? { ...r, ...patch } : r)))
    const removeRow = (uid) => setRows((list) => list.filter((r) => r.uid !== uid))
    const moveRow = (index, delta) =>
        setRows((list) => {
            const next = [...list]
            const [row] = next.splice(index, 1)
            next.splice(index + delta, 0, row)
            return next
        })
    const addRow = () => setRows((list) => [...list, toRow({ type: 'text', label: '' })])

    const pickLogo = (e) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file) return
        if (!LOGO_TYPES.includes(file.type)) return setError('Logotip PNG, JPEG, WEBP yoki GIF boʻlishi kerak')
        if (file.size > LOGO_MAX_BYTES) return setError('Logotip 2 MB dan katta boʻlmasligi kerak')
        setError(null)
        const reader = new FileReader()
        reader.onload = () => setLogo({ file, preview: reader.result })
        reader.readAsDataURL(file)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const built = buildFields(rows)
        if (built.error) return setError(built.error)

        const body = { name: name.trim(), fields: built.fields, isActive }
        // Placement, as for contacts: a stage wins; a pipeline alone means its first stage; neither clears it (on edit).
        if (stageId) body.stageId = stageId
        else if (pipelineId) body.pipelineId = pipelineId
        else if (isEdit) body.stageId = null
        if (sourceId) body.sourceId = sourceId
        else if (isEdit) body.sourceId = null

        setError(null)
        setPending(true)
        let saved
        try {
            saved = isEdit ? await updateForm.mutateAsync({ id: form.id, ...body }) : await createForm.mutateAsync(body)
        } catch (err) {
            setPending(false)
            return setError(err)
        }
        try {
            if (logo) await uploadLogo.mutateAsync({ id: saved.id, file: logo.file })
            else if (removeLogo && saved.logoUrl) await deleteLogo.mutateAsync(saved.id)
        } catch (err) {
            setPending(false)
            // The form itself was saved; submitting again would create a second one.
            if (!isEdit) {
                toastError(`Forma yaratildi, lekin logotip saqlanmadi: ${getErrorMessage(err)}`)
                return onClose()
            }
            return setError(err)
        }
        setPending(false)
        toastSuccess(isEdit ? 'Forma saqlandi' : 'Forma yaratildi')
        onClose()
    }

    return (
        <Modal
            title={isEdit ? 'Formani tahrirlash' : 'Yangi forma'}
            onClose={onClose}
            size="lg"
            footer={
                <>
                    <label className="check footer-left">
                        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                        <span>Faol (havola orqali toʻldirish mumkin)</span>
                    </label>
                    <button type="button" className="button button--ghost" onClick={onClose}>
                        Bekor qilish
                    </button>
                    <button type="submit" form="lead-form-form" className="button" disabled={pending}>
                        {pending ? 'Saqlanmoqda…' : 'Saqlash'}
                    </button>
                </>
            }
        >
            <form id="lead-form-form" className="form" onSubmit={handleSubmit}>
                <div className="form-head">
                    <div className="form-logo">
                        {currentLogo ? (
                            <img src={currentLogo} alt="" className="form-logo-img" />
                        ) : (
                            <ImagePlus size={20} className="muted" aria-hidden="true" />
                        )}
                    </div>
                    <div className="form-head-fields">
                        <label className="field">
                            <span className="field-label">Forma nomi *</span>
                            <input
                                className="input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Masalan: Bepul konsultatsiya"
                                required
                                maxLength={100}
                                autoFocus
                            />
                        </label>
                        <div className="form-logo-actions">
                            <label className="link-button">
                                <ImagePlus size={14} /> {currentLogo ? 'Logotipni almashtirish' : 'Logotip yuklash'}
                                <input type="file" accept={LOGO_TYPES.join(',')} onChange={pickLogo} hidden />
                            </label>
                            {currentLogo && (
                                <button
                                    type="button"
                                    className="link-button button--danger-text"
                                    onClick={() => {
                                        setLogo(null)
                                        setRemoveLogo(true)
                                    }}
                                >
                                    <Trash2 size={14} /> Olib tashlash
                                </button>
                            )}
                            <span className="muted small">PNG, JPEG, WEBP yoki GIF, 2 MB gacha</span>
                        </div>
                    </div>
                </div>

                <div className="field">
                    <span className="field-label">Maydonlar *</span>
                    <ol className="form-field-list">
                        {rows.map((row, index) => (
                            <FieldRow
                                key={row.uid}
                                row={row}
                                index={index}
                                count={rows.length}
                                usedTypes={usedTypes}
                                onChange={(patch) => updateRow(row.uid, patch)}
                                onMove={(delta) => moveRow(index, delta)}
                                onRemove={() => removeRow(row.uid)}
                            />
                        ))}
                    </ol>
                    {rows.length < MAX_FIELDS && (
                        <button type="button" className="link-button" onClick={addRow}>
                            <Plus size={14} /> Maydon qoʻshish
                        </button>
                    )}
                    <span className="muted small">
                        Ism, telefon va email lidning oʻziga yoziladi; qolgan javoblar lidga izoh boʻlib tushadi.
                    </span>
                </div>

                <div className="field">
                    <span className="field-label">Yangi lidlar qayerga tushadi</span>
                    <div className="grid-3">
                        <select className="input" value={sourceId} onChange={(e) => setSourceId(e.target.value)} aria-label="Manba">
                            <option value="">— Manbasiz —</option>
                            {sources.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                        <select
                            className="input"
                            value={pipelineId}
                            onChange={(e) => {
                                setPipelineId(e.target.value)
                                setStageId('')
                            }}
                            aria-label="Voronka"
                        >
                            <option value="">— Voronkasiz —</option>
                            {pipelines.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                        <select
                            className="input"
                            value={stageId}
                            onChange={(e) => setStageId(e.target.value)}
                            disabled={!selectedPipeline}
                            aria-label="Bosqich"
                        >
                            <option value="">{selectedPipeline ? 'Birinchi bosqich' : '—'}</option>
                            {selectedPipeline?.stages.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    {(!sources.length || !pipelines.length) && (
                        <span className="muted small">
                            {!sources.length && (
                                <>
                                    Manbalar yoʻq — <Link to="/sources" onClick={onClose}>manba qoʻshing</Link>.{' '}
                                </>
                            )}
                            {!pipelines.length && 'Voronkalar yoʻq — ularni “Lidlar” sahifasida yarating.'}
                        </span>
                    )}
                </div>

                {error && <p className="error">{typeof error === 'string' ? error : getErrorMessage(error)}</p>}
            </form>
        </Modal>
    )
}
