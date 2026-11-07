import { useState } from 'react'
import Modal from './Modal.jsx'
import SourceIcon from './SourceIcon.jsx'
import { getErrorMessage } from '../api/client.js'
import { useCreateSource, useUpdateSource } from '../hooks/useSources.js'
import { toastSuccess } from '../toast/toastStore.js'
import { ICON_PRESETS } from '../utils/format.js'

/** Create a source (no `source`) or edit `source`. */
export default function SourceModal({ source, onClose }) {
    const isEdit = !!source
    const [name, setName] = useState(source?.name ?? '')
    const [icon, setIcon] = useState(source?.icon ?? '')
    const createSource = useCreateSource()
    const updateSource = useUpdateSource()
    const save = isEdit ? updateSource : createSource

    const handleSubmit = (e) => {
        e.preventDefault()
        const body = { name: name.trim(), icon: icon.trim() || null }
        save.mutate(isEdit ? { id: source.id, ...body } : body, {
            onSuccess: () => {
                toastSuccess(isEdit ? 'Manba saqlandi' : 'Manba qoʻshildi')
                onClose()
            },
        })
    }

    return (
        <Modal
            title={isEdit ? 'Manbani tahrirlash' : 'Yangi manba'}
            onClose={onClose}
            size="sm"
            footer={
                <>
                    <button type="button" className="button button--ghost" onClick={onClose}>
                        Bekor qilish
                    </button>
                    <button type="submit" form="source-form" className="button" disabled={save.isPending}>
                        {save.isPending ? 'Saqlanmoqda…' : 'Saqlash'}
                    </button>
                </>
            }
        >
            <form id="source-form" className="form" onSubmit={handleSubmit}>
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
                <div className="field">
                    <span className="field-label">Belgi</span>
                    <div className="icon-picker">
                        {ICON_PRESETS.map((preset) => (
                            <button
                                key={preset}
                                type="button"
                                className={`icon-option${icon === preset ? ' icon-option--active' : ''}`}
                                onClick={() => setIcon(preset)}
                                title={preset}
                                aria-label={preset}
                            >
                                <SourceIcon icon={preset} size={18} />
                            </button>
                        ))}
                    </div>
                    <input
                        className="input"
                        value={icon}
                        onChange={(e) => setIcon(e.target.value)}
                        placeholder="Belgi nomi yoki rasm URL manzili"
                        maxLength={500}
                    />
                </div>
                {save.error && <p className="error">{getErrorMessage(save.error)}</p>}
            </form>
        </Modal>
    )
}
