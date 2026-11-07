import { useState } from 'react'
import { Navigate, NavLink, useNavigate, useParams } from 'react-router'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import ContactModal from '../components/ContactModal.jsx'
import KanbanColumn from '../components/KanbanColumn.jsx'
import PipelineModal from '../components/PipelineModal.jsx'
import Spinner from '../components/Spinner.jsx'
import StageModal from '../components/StageModal.jsx'
import { getErrorMessage } from '../api/client.js'
import { useMoveContact } from '../hooks/useContacts.js'
import { useDeletePipeline, useDeleteStage, usePipelines, useReorderStages } from '../hooks/usePipelines.js'
import { toastError, toastSuccess } from '../toast/toastStore.js'

const MAX_STAGES = 30

export default function PipelinePage() {
    const { pipelineId } = useParams()
    const navigate = useNavigate()
    const { data: pipelines, isLoading, error } = usePipelines()

    // Which modal is open: { type: 'contact' | 'stage' | 'pipeline' | 'deleteStage' | 'deletePipeline', ... }
    const [modal, setModal] = useState(null)
    const close = () => setModal(null)

    const moveContact = useMoveContact()
    const reorderStages = useReorderStages()
    const deleteStage = useDeleteStage()
    const deletePipeline = useDeletePipeline()

    if (isLoading) return <Spinner />
    if (error) return <p className="error page-pad">{getErrorMessage(error)}</p>

    const pipeline = pipelines.find((p) => p.id === pipelineId)
    if (!pipeline && pipelines.length) return <Navigate to={`/pipelines/${pipelines[0].id}`} replace />

    const openNewPipeline = () => setModal({ type: 'pipeline' })

    if (!pipeline) {
        return (
            <div className="page">
                <div className="empty-state">
                    <h1 className="page-title">Voronkalar yoʻq</h1>
                    <p className="muted">Kontaktlarni bosqichlar boʻyicha boshqarish uchun voronka yarating.</p>
                    <button className="button" onClick={openNewPipeline}>
                        <Plus size={16} /> Voronka yaratish
                    </button>
                </div>
                {modal?.type === 'pipeline' && (
                    <PipelineModal onClose={close} onCreated={(p) => navigate(`/pipelines/${p.id}`)} />
                )}
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
            <header className="page-header">
                <div className="tabs">
                    {pipelines.map((p) => (
                        <NavLink
                            key={p.id}
                            to={`/pipelines/${p.id}`}
                            className={({ isActive }) => `tab${isActive ? ' tab--active' : ''}`}
                        >
                            {p.name}
                        </NavLink>
                    ))}
                    <button className="tab tab--add" onClick={openNewPipeline} title="Yangi voronka">
                        <Plus size={16} />
                    </button>
                </div>
                <div className="page-actions">
                    <button
                        className="button button--ghost"
                        onClick={() => setModal({ type: 'pipeline', pipeline })}
                        title="Nomini oʻzgartirish"
                    >
                        <Pencil size={16} />
                    </button>
                    <button
                        className="button button--ghost"
                        onClick={() => setModal({ type: 'deletePipeline' })}
                        title="Voronkani oʻchirish"
                    >
                        <Trash2 size={16} />
                    </button>
                    <button
                        className="button button--ghost"
                        onClick={() => setModal({ type: 'stage' })}
                        disabled={stages.length >= MAX_STAGES}
                        title={stages.length >= MAX_STAGES ? `Eng koʻpi ${MAX_STAGES} ta bosqich` : undefined}
                    >
                        <Plus size={16} /> Bosqich
                    </button>
                    <button className="button" onClick={() => setModal({ type: 'contact', initial: { pipelineId: pipeline.id } })}>
                        <Plus size={16} /> Kontakt
                    </button>
                </div>
            </header>

            <div className="kanban">
                {stages.map((stage) => (
                    <KanbanColumn
                        key={stage.id}
                        stage={stage}
                        onOpenContact={(contact) => navigate(`/contacts/${contact.id}`)}
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
            </div>

            {modal?.type === 'contact' && (
                <ContactModal key={modal.contact?.id ?? 'new'} contact={modal.contact} initial={modal.initial} onClose={close} />
            )}
            {modal?.type === 'stage' && <StageModal pipelineId={pipeline.id} stage={modal.stage} onClose={close} />}
            {modal?.type === 'pipeline' && (
                <PipelineModal
                    pipeline={modal.pipeline}
                    onClose={close}
                    onCreated={(p) => navigate(`/pipelines/${p.id}`)}
                />
            )}
            {modal?.type === 'deleteStage' && (
                <ConfirmDialog
                    title="Bosqichni oʻchirish"
                    message={`“${modal.stage.name}” bosqichi oʻchiriladi. Bosqichda kontaktlar boʻlsa, avval ularni boshqa bosqichga koʻchiring.`}
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
            {modal?.type === 'deletePipeline' && (
                <ConfirmDialog
                    title="Voronkani oʻchirish"
                    message={`“${pipeline.name}” voronkasi va uning barcha bosqichlari oʻchiriladi. Voronkada kontaktlar boʻlsa, avval ularni koʻchiring yoki oʻchiring.`}
                    isPending={deletePipeline.isPending}
                    error={deletePipeline.error}
                    onClose={() => {
                        deletePipeline.reset()
                        close()
                    }}
                    onConfirm={() =>
                        deletePipeline.mutate(pipeline.id, {
                            onSuccess: () => {
                                toastSuccess('Voronka oʻchirildi')
                                close()
                                navigate('/pipelines', { replace: true })
                            },
                        })
                    }
                />
            )}
        </div>
    )
}
