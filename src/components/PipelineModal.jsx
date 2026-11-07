import { useState } from 'react'
import Modal from './Modal.jsx'
import PipelineCreateForm from './PipelineCreateForm.jsx'

/** Create a pipeline (name + stages). Renaming lives in the "manage pipelines" modal. */
export default function PipelineModal({ onClose, onCreated }) {
    const [pending, setPending] = useState(false)
    return (
        <Modal
            title="Yangi voronka"
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="button button--ghost" onClick={onClose}>
                        Bekor qilish
                    </button>
                    <button type="submit" form="pipeline-create-form" className="button" disabled={pending}>
                        {pending ? 'Yaratilmoqda…' : 'Yaratish'}
                    </button>
                </>
            }
        >
            <PipelineCreateForm
                formId="pipeline-create-form"
                onPendingChange={setPending}
                onCreated={(pipeline) => {
                    onCreated?.(pipeline)
                    onClose()
                }}
            />
        </Modal>
    )
}
