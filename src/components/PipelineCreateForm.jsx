import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { getErrorMessage } from '../api/client.js'
import { useCreatePipeline } from '../hooks/usePipelines.js'
import { STAGE_TYPE } from '../labels.js'
import { toastSuccess } from '../toast/toastStore.js'
import { STAGE_COLORS } from '../utils/format.js'

const MAX_STAGES = 30

// POST /pipelines requires the stages; this is only a starting point the user edits.
const TEMPLATE = [
    { name: 'Yangi', type: 'open', color: '#3B82F6' },
    { name: 'Bogʻlanildi', type: 'open', color: '#8B5CF6' },
    { name: 'Muzokara', type: 'open', color: '#F59E0B' },
    { name: 'Sotildi', type: 'won', color: '#22C55E' },
    { name: 'Rad etildi', type: 'lost', color: '#EF4444' },
]

let nextKey = 1
const withKey = (stage) => ({ ...stage, key: nextKey++ })

/**
 * New pipeline: name plus an editable list of stages (name, type, color), pre-filled with a template.
 * Renders a <form id={formId}>; the caller puts the submit button (form={formId}) wherever it wants.
 */
export default function PipelineCreateForm({ formId, onCreated, onPendingChange }) {
    const [name, setName] = useState('')
    const [stages, setStages] = useState(() => TEMPLATE.map(withKey))
    const create = useCreatePipeline()

    const update = (key, patch) => setStages((list) => list.map((s) => (s.key === key ? { ...s, ...patch } : s)))
    const remove = (key) => setStages((list) => list.filter((s) => s.key !== key))
    const add = () =>
        setStages((list) => [...list, withKey({ name: '', type: 'open', color: STAGE_COLORS[list.length % STAGE_COLORS.length] })])

    const submit = (e) => {
        e.preventDefault()
        const body = {
            name: name.trim(),
            stages: stages.map(({ name: stageName, type, color }) => ({ name: stageName.trim(), type, color: color || null })),
        }
        onPendingChange?.(true)
        create.mutate(body, {
            onSuccess: (pipeline) => {
                toastSuccess('Voronka yaratildi')
                onCreated?.(pipeline)
            },
            onSettled: () => onPendingChange?.(false),
        })
    }

    return (
        <form id={formId} className="form" onSubmit={submit}>
            <label className="field">
                <span className="field-label">Voronka nomi *</span>
                <input
                    className="input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Masalan: Sotuv"
                    required
                    maxLength={100}
                    autoFocus
                />
            </label>

            <div className="field">
                <span className="field-label">Bosqichlar *</span>
                <ol className="stage-editor">
                    {stages.map((stage, index) => (
                        <li key={stage.key} className="stage-editor-row">
                            <span className="stage-editor-index">{index + 1}</span>
                            <label className="stage-color" style={{ background: stage.color || 'var(--border-strong)' }}>
                                <input
                                    type="color"
                                    value={/^#[0-9a-f]{6}$/i.test(stage.color ?? '') ? stage.color : '#64748b'}
                                    onChange={(e) => update(stage.key, { color: e.target.value })}
                                    aria-label="Rang"
                                />
                            </label>
                            <input
                                className="input"
                                value={stage.name}
                                onChange={(e) => update(stage.key, { name: e.target.value })}
                                placeholder="Bosqich nomi"
                                required
                                maxLength={100}
                            />
                            <select
                                className="input stage-editor-type"
                                value={stage.type}
                                onChange={(e) => update(stage.key, { type: e.target.value })}
                            >
                                {Object.entries(STAGE_TYPE).map(([value, text]) => (
                                    <option key={value} value={value}>
                                        {text}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                className="icon-button"
                                onClick={() => remove(stage.key)}
                                disabled={stages.length <= 1}
                                title={stages.length <= 1 ? 'Kamida bitta bosqich kerak' : 'Olib tashlash'}
                            >
                                <X size={16} />
                            </button>
                        </li>
                    ))}
                </ol>
                {stages.length < MAX_STAGES && (
                    <button type="button" className="link-button" onClick={add}>
                        <Plus size={14} /> Bosqich qoʻshish
                    </button>
                )}
            </div>

            <p className="muted small">Bosqichlarni keyin ham oʻzgartirish, qoʻshish va tartibini almashtirish mumkin.</p>
            {create.error && <p className="error">{getErrorMessage(create.error)}</p>}
        </form>
    )
}
