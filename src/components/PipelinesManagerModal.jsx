import { useState } from 'react'
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import Modal from './Modal.jsx'
import { getErrorMessage } from '../api/client.js'
import { useCreatePipeline, useDeletePipeline, useRenamePipeline } from '../hooks/usePipelines.js'
import { toastSuccess } from '../toast/toastStore.js'

const leadCount = (pipeline) => pipeline.stages.reduce((sum, s) => sum + (s.contactsCount ?? 0), 0)

function PipelineRow({ pipeline, onDeleted }) {
    const [mode, setMode] = useState('view') // 'view' | 'edit' | 'confirmDelete'
    const [name, setName] = useState(pipeline.name)
    const rename = useRenamePipeline()
    const remove = useDeletePipeline()
    const count = leadCount(pipeline)

    const save = (e) => {
        e.preventDefault()
        const value = name.trim()
        if (!value || value === pipeline.name) return setMode('view')
        rename.mutate({ id: pipeline.id, name: value }, { onSuccess: () => setMode('view') })
    }

    const error = rename.error ?? remove.error

    return (
        <li className="manage-row">
            {mode === 'edit' ? (
                <form className="manage-row-main" onSubmit={save}>
                    <input
                        className="input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={100}
                        autoFocus
                        required
                    />
                    <button type="submit" className="icon-button" title="Saqlash" disabled={rename.isPending}>
                        <Check size={16} />
                    </button>
                    <button
                        type="button"
                        className="icon-button"
                        title="Bekor qilish"
                        onClick={() => {
                            setName(pipeline.name)
                            rename.reset()
                            setMode('view')
                        }}
                    >
                        <X size={16} />
                    </button>
                </form>
            ) : mode === 'confirmDelete' ? (
                <div className="manage-row-main">
                    <span className="manage-row-confirm">“{pipeline.name}” oʻchirilsinmi?</span>
                    <button
                        type="button"
                        className="button button--ghost"
                        onClick={() => {
                            remove.reset()
                            setMode('view')
                        }}
                    >
                        Yoʻq
                    </button>
                    <button
                        type="button"
                        className="button button--danger"
                        disabled={remove.isPending}
                        onClick={() =>
                            remove.mutate(pipeline.id, {
                                onSuccess: () => {
                                    toastSuccess('Voronka oʻchirildi')
                                    onDeleted(pipeline.id)
                                },
                            })
                        }
                    >
                        Oʻchirish
                    </button>
                </div>
            ) : (
                <div className="manage-row-main">
                    <div className="manage-row-info">
                        <span className="strong-plain">{pipeline.name}</span>
                        <span className="muted small">
                            {pipeline.stages.length} ta bosqich · {count} ta lid
                        </span>
                    </div>
                    <button type="button" className="icon-button" title="Nomini oʻzgartirish" onClick={() => setMode('edit')}>
                        <Pencil size={15} />
                    </button>
                    <button
                        type="button"
                        className="icon-button"
                        title={count ? 'Voronkada lidlar bor' : 'Oʻchirish'}
                        onClick={() => setMode('confirmDelete')}
                    >
                        <Trash2 size={15} />
                    </button>
                </div>
            )}
            {error && <p className="error small">{getErrorMessage(error)}</p>}
        </li>
    )
}

/** Create, rename and delete pipelines. New pipelines get the 5 default stages. */
export default function PipelinesManagerModal({ pipelines, onClose, onCreated, onDeleted }) {
    const [name, setName] = useState('')
    const create = useCreatePipeline()

    const submit = (e) => {
        e.preventDefault()
        const value = name.trim()
        if (!value) return
        create.mutate(
            { name: value },
            {
                onSuccess: (pipeline) => {
                    toastSuccess('Voronka yaratildi')
                    setName('')
                    onCreated?.(pipeline)
                },
            },
        )
    }

    return (
        <Modal title="Voronkalarni boshqarish" onClose={onClose}>
            <ul className="manage-list">
                {pipelines.map((p) => (
                    <PipelineRow key={p.id} pipeline={p} onDeleted={(id) => onDeleted?.(id)} />
                ))}
            </ul>
            <form className="manage-create" onSubmit={submit}>
                <input
                    className="input"
                    placeholder="Yangi voronka nomi"
                    value={name}
                    maxLength={100}
                    onChange={(e) => setName(e.target.value)}
                />
                <button type="submit" className="button" disabled={!name.trim() || create.isPending}>
                    <Plus size={16} /> Qoʻshish
                </button>
            </form>
            {create.error && <p className="error small">{getErrorMessage(create.error)}</p>}
            <p className="muted small">
                Yangi voronka standart bosqichlar bilan yaratiladi. Lidlari bor voronkani oʻchirib boʻlmaydi — avval
                lidlarni koʻchiring.
            </p>
        </Modal>
    )
}
