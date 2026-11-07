import { useState } from 'react'
import Modal from './Modal.jsx'
import { getErrorMessage } from '../api/client.js'
import { useAddStage, useUpdateStage } from '../hooks/usePipelines.js'
import { STAGE_TYPE } from '../labels.js'
import { STAGE_COLORS } from '../utils/format.js'
import { toastSuccess } from '../toast/toastStore.js'

/** Add a stage to `pipelineId` (no `stage`) or edit `stage`. */
export default function StageModal({ pipelineId, stage, onClose }) {
    const isEdit = !!stage
    const [name, setName] = useState(stage?.name ?? '')
    const [type, setType] = useState(stage?.type ?? 'open')
    const [color, setColor] = useState(stage?.color ?? STAGE_COLORS[0])

    const addStage = useAddStage()
    const updateStage = useUpdateStage()
    const save = isEdit ? updateStage : addStage

    const handleSubmit = (e) => {
        e.preventDefault()
        const body = { pipelineId, name: name.trim(), type, color: color || null }
        save.mutate(isEdit ? { ...body, stageId: stage.id } : body, {
            onSuccess: () => {
                toastSuccess(isEdit ? 'Bosqich saqlandi' : 'Bosqich qoʻshildi')
                onClose()
            },
        })
    }

    return (
        <Modal
            title={isEdit ? 'Bosqichni tahrirlash' : 'Yangi bosqich'}
            onClose={onClose}
            size="sm"
            footer={
                <>
                    <button type="button" className="button button--ghost" onClick={onClose}>
                        Bekor qilish
                    </button>
                    <button type="submit" form="stage-form" className="button" disabled={save.isPending}>
                        {save.isPending ? 'Saqlanmoqda…' : 'Saqlash'}
                    </button>
                </>
            }
        >
            <form id="stage-form" className="form" onSubmit={handleSubmit}>
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
                <label className="field">
                    <span className="field-label">Turi</span>
                    <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
                        {Object.entries(STAGE_TYPE).map(([value, text]) => (
                            <option key={value} value={value}>
                                {text}
                            </option>
                        ))}
                    </select>
                </label>
                <div className="field">
                    <span className="field-label">Rangi</span>
                    <div className="swatches">
                        {STAGE_COLORS.map((c) => (
                            <button
                                key={c}
                                type="button"
                                className={`swatch${color?.toLowerCase() === c.toLowerCase() ? ' swatch--active' : ''}`}
                                style={{ background: c }}
                                onClick={() => setColor(c)}
                                aria-label={c}
                            />
                        ))}
                        <input
                            type="color"
                            className="color-input"
                            value={/^#[0-9a-f]{6}$/i.test(color ?? '') ? color : '#64748b'}
                            onChange={(e) => setColor(e.target.value)}
                            aria-label="Boshqa rang"
                        />
                        <button type="button" className="link-button" onClick={() => setColor('')}>
                            Rangsiz
                        </button>
                    </div>
                </div>
                {save.error && <p className="error">{getErrorMessage(save.error)}</p>}
            </form>
        </Modal>
    )
}
