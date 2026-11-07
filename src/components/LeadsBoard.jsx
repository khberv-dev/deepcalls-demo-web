import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Plus } from 'lucide-react'
import ConfirmDialog from './ConfirmDialog.jsx'
import ContactModal from './ContactModal.jsx'
import KanbanColumn from './KanbanColumn.jsx'
import PipelineModal from './PipelineModal.jsx'
import PipelineSelect from './PipelineSelect.jsx'
import PipelinesManagerModal from './PipelinesManagerModal.jsx'
import Spinner from './Spinner.jsx'
import StageModal from './StageModal.jsx'
import { getErrorMessage } from '../api/client.js'
import { useMoveContact } from '../hooks/useContacts.js'
import { useDeleteStage, usePipelines, useReorderStages } from '../hooks/usePipelines.js'
import { toastError, toastSuccess } from '../toast/toastStore.js'

const MAX_STAGES = 30

/**
 * Kanban view of the leads page. The selected pipeline is the `pipelineId` search param (shared with the list
 * view's pipeline filter, so switching views keeps it); without one, the first pipeline is shown.
 */
export default function LeadsBoard({ heading }) {
    const [searchParams, setSearchParams] = useSearchParams()
    const navigate = useNavigate()
    const { data: pipelines, isLoading, error } = usePipelines()

    // Which modal is open: { type: 'contact' | 'stage' | 'pipeline' | 'pipelines' | 'deleteStage', ... }
    const [modal, setModal] = useState(null)
    const close = () => setModal(null)

    const moveContact = useMoveContact()
    const reorderStages = useReorderStages()
    const deleteStage = useDeleteStage()

    const selectPipeline = (id, { replace = false } = {}) =>
        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev)
                if (id) next.set('pipelineId', id)
                else next.delete('pipelineId')
                next.delete('stageId')
                return next
            },
            { replace },
        )

    const header = (actions) => (
        <header className="page-header">
            {heading}
            {actions && <div className="page-actions">{actions}</div>}
        </header>
    )

    if (isLoading) {
        return (
            <div className="page">
                {header()}
                <Spinner />
            </div>
        )
    }
    if (error) {
        return (
            <div className="page">
                {header()}
                <p className="error">{getErrorMessage(error)}</p>
            </div>
        )
    }

    const openNewPipeline = () => setModal({ type: 'pipeline' })
    const pipeline = pipelines.find((p) => p.id === searchParams.get('pipelineId')) ?? pipelines[0]

    if (!pipeline) {
        return (
            <div className="page">
                {header()}
                <div className="empty-state">
                    <h2 className="card-title">Voronkalar yoʻq</h2>
                    <p className="muted">Lidlarni bosqichlar boʻyicha boshqarish uchun voronka yarating.</p>
                    <button className="button" onClick={openNewPipeline}>
                        <Plus size={16} /> Voronka yaratish
                    </button>
                </div>
                {modal?.type === 'pipeline' && <PipelineModal onClose={close} onCreated={(p) => selectPipeline(p.id)} />}
            </div>
        )
    }

    const stages = pipeline.stages.map((s) => ({ ...s, pipelineId: pipeline.id }))

    const handleDropContact = (id, fromStageId, toStageId) => {
        moveContact.mutate({ id, stageId: toStageId, fromStageId }, { onError: toastError })
    }

    const handleDropStage = (draggedId, targetId) => {
        if (draggedId === targetId) return
        const ids = stages.map((s) => s.id)
        if (!ids.includes(draggedId)) return
        const without = ids.filter((id) => id !== draggedId)
        const targetIndex = ids.indexOf(targetId)
        without.splice(targetIndex, 0, draggedId)
        reorderStages.mutate({ pipelineId: pipeline.id, stageIds: without }, { onError: toastError })
    }

    return (
        <div className="page page--board">
            {header(
                <>
                    <PipelineSelect
                        pipelines={pipelines}
                        value={pipeline.id}
                        onChange={(id) => selectPipeline(id)}
                        onManage={() => setModal({ type: 'pipelines' })}
                    />
                    <button className="button" onClick={() => setModal({ type: 'contact', initial: { pipelineId: pipeline.id } })}>
                        <Plus size={16} /> Yangi lid
                    </button>
                </>,
            )}

            <div className="kanban">
                {stages.map((stage) => (
                    <KanbanColumn
                        key={stage.id}
                        stage={stage}
                        onOpenContact={(contact) => navigate(`/leads/${contact.id}`)}
                        onAddContact={(s) => setModal({ type: 'contact', initial: { pipelineId: pipeline.id, stageId: s.id } })}
                        onEditStage={(s) => setModal({ type: 'stage', stage: s })}
                        onDeleteStage={(s) => {
                            deleteStage.reset()
                            setModal({ type: 'deleteStage', stage: s })
                        }}
                        onDropContact={handleDropContact}
                        onDropStage={handleDropStage}
                    />
                ))}
                <button
                    type="button"
                    className="kanban-add-column"
                    onClick={() => setModal({ type: 'stage' })}
                    disabled={stages.length >= MAX_STAGES}
                    title={stages.length >= MAX_STAGES ? `Eng koʻpi ${MAX_STAGES} ta bosqich` : undefined}
                >
                    <Plus size={18} aria-hidden="true" />
                    <span>Yangi bosqich</span>
                </button>
            </div>

            {modal?.type === 'contact' && (
                <ContactModal key={modal.contact?.id ?? 'new'} contact={modal.contact} initial={modal.initial} onClose={close} />
            )}
            {modal?.type === 'stage' && <StageModal pipelineId={pipeline.id} stage={modal.stage} onClose={close} />}
            {modal?.type === 'pipelines' && (
                <PipelinesManagerModal
                    pipelines={pipelines}
                    onClose={close}
                    onCreated={(p) => selectPipeline(p.id)}
                    onDeleted={(id) => {
                        if (id === pipeline.id) selectPipeline(null, { replace: true })
                    }}
                />
            )}
            {modal?.type === 'deleteStage' && (
                <ConfirmDialog
                    title="Bosqichni oʻchirish"
                    message={`“${modal.stage.name}” bosqichi oʻchiriladi. Bosqichda lidlar boʻlsa, avval ularni boshqa bosqichga koʻchiring.`}
                    isPending={deleteStage.isPending}
                    error={deleteStage.error}
                    onClose={close}
                    onConfirm={() =>
                        deleteStage.mutate(
                            { pipelineId: pipeline.id, stageId: modal.stage.id },
                            {
                                onSuccess: () => {
                                    toastSuccess('Bosqich oʻchirildi')
                                    close()
                                },
                            },
                        )
                    }
                />
            )}
        </div>
    )
}
