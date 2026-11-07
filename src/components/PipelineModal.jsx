import { useState } from 'react'
import Modal from './Modal.jsx'
import { getErrorMessage } from '../api/client.js'
import { useCreatePipeline, useRenamePipeline } from '../hooks/usePipelines.js'
import { toastSuccess } from '../toast/toastStore.js'

/** Create a pipeline (with the 5 default stages) or rename `pipeline`. */
export default function PipelineModal({ pipeline, onClose, onCreated }) {
    const isEdit = !!pipeline
    const [name, setName] = useState(pipeline?.name ?? '')
    const createPipeline = useCreatePipeline()
    const renamePipeline = useRenamePipeline()
    const save = isEdit ? renamePipeline : createPipeline

    const handleSubmit = (e) => {
        e.preventDefault()
        const body = { name: name.trim() }
        save.mutate(isEdit ? { id: pipeline.id, ...body } : body, {
            onSuccess: (saved) => {
                toastSuccess(isEdit ? 'Voronka nomi oʻzgartirildi' : 'Voronka yaratildi')
                if (!isEdit) onCreated?.(saved)
                onClose()
            },
        })
    }

    return (
        <Modal
            title={isEdit ? 'Voronka nomini oʻzgartirish' : 'Yangi voronka'}
            onClose={onClose}
            size="sm"
            footer={
                <>
                    <button type="button" className="button button--ghost" onClick={onClose}>
                        Bekor qilish
                    </button>
                    <button type="submit" form="pipeline-form" className="button" disabled={save.isPending}>
                        {save.isPending ? 'Saqlanmoqda…' : 'Saqlash'}
                    </button>
                </>
            }
        >
            <form id="pipeline-form" className="form" onSubmit={handleSubmit}>
                <label className="field">
                    <span className="field-label">Nomi *</span>
                    <input
                        className="input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        maxLength={100}
                        autoFocus
                    />
                </label>
                {!isEdit && (
                    <p className="muted small">
                        Voronka standart bosqichlar bilan yaratiladi: Yangi lid, Bogʻlanildi, Muzokara, Yutildi,
                        Yoʻqotildi. Ularni keyin oʻzgartirish mumkin.
                    </p>
                )}
                {save.error && <p className="error">{getErrorMessage(save.error)}</p>}
            </form>
        </Modal>
    )
}
