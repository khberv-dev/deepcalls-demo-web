import { useState } from 'react'
import { Copy, ExternalLink, FileText, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import FormModal from '../components/FormModal.jsx'
import Spinner from '../components/Spinner.jsx'
import { getErrorMessage } from '../api/client.js'
import { useDeleteForm, useForms, useRegenerateFormLink, useSetFormActive } from '../hooks/useForms.js'
import { usePipelines } from '../hooks/usePipelines.js'
import { toastError, toastSuccess } from '../toast/toastStore.js'

async function copyLink(link) {
    try {
        await navigator.clipboard.writeText(link)
        toastSuccess('Havola nusxalandi')
    } catch {
        toastError('Havolani nusxalab boʻlmadi')
    }
}

function ActiveSwitch({ form }) {
    const setActive = useSetFormActive()
    const on = form.isActive
    return (
        <button
            type="button"
            className="switch-button"
            role="switch"
            aria-checked={on}
            disabled={setActive.isPending}
            onClick={() =>
                setActive.mutate(
                    { id: form.id, isActive: !on },
                    { onSuccess: () => toastSuccess(on ? 'Forma oʻchirildi' : 'Forma yoqildi'), onError: toastError },
                )
            }
            title={on ? 'Formani oʻchirish' : 'Formani yoqish'}
        >
            <span className="switch" aria-hidden="true">
                <span className="switch-thumb" />
            </span>
            <span className="small">{on ? 'Faol' : 'Oʻchiq'}</span>
        </button>
    )
}

export default function FormsPage() {
    const { data: forms, isLoading, error } = useForms()
    const { data: pipelines = [] } = usePipelines()
    const deleteForm = useDeleteForm()
    const regenerate = useRegenerateFormLink()
    const [modal, setModal] = useState(null) // { type: 'edit', form? } | { type: 'delete' | 'link', form }

    const close = () => {
        deleteForm.reset()
        regenerate.reset()
        setModal(null)
    }
    const pipelineName = (id) => pipelines.find((p) => p.id === id)?.name

    return (
        <div className="page">
            <header className="page-header">
                <div>
                    <h1 className="page-title">
                        Formalar {forms && <span className="muted">({forms.length})</span>}
                    </h1>
                    <p className="muted">Havolasini ulashing: har bir toʻldirilgan forma yangi lid boʻlib tushadi.</p>
                </div>
                <button className="button" onClick={() => setModal({ type: 'edit' })}>
                    <Plus size={16} /> Yangi forma
                </button>
            </header>

            {isLoading ? (
                <Spinner />
            ) : error ? (
                <p className="error">{getErrorMessage(error)}</p>
            ) : !forms.length ? (
                <div className="empty-state">
                    <p className="muted">Hali formalar yoʻq</p>
                </div>
            ) : (
                <div className="table-wrap">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Nomi</th>
                                <th>Havola</th>
                                <th>Lidlar qayerga</th>
                                <th>Yuborilgan</th>
                                <th>Holat</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {forms.map((form) => (
                                <tr key={form.id}>
                                    <td>
                                        <div className="name-cell">
                                            <span className="source-icon source-icon--sm">
                                                {form.logoUrl ? (
                                                    <img src={form.logoUrl} alt="" className="form-thumb" />
                                                ) : (
                                                    <FileText size={15} />
                                                )}
                                            </span>
                                            <span className="strong-plain">{form.name}</span>
                                            <span className="muted small">{form.fields.length} maydon</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="inline-icon">
                                            <code className="code" title={form.link}>
                                                {form.link}
                                            </code>
                                            <button className="icon-button" onClick={() => copyLink(form.link)} title="Nusxalash">
                                                <Copy size={14} />
                                            </button>
                                            <a className="icon-button" href={form.link} target="_blank" rel="noreferrer" title="Ochish">
                                                <ExternalLink size={14} />
                                            </a>
                                        </div>
                                    </td>
                                    <td>
                                        {form.source || form.stage ? (
                                            <div className="inline-icon">
                                                {form.source && <span className="badge badge--plain">{form.source.name}</span>}
                                                {form.stage && (
                                                    <span>
                                                        {pipelineName(form.stage.pipelineId) ?? 'Voronka'} → {form.stage.name}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="muted">Voronkasiz</span>
                                        )}
                                    </td>
                                    <td>
                                        <span className="count">{form.submissionsCount}</span>
                                    </td>
                                    <td>
                                        <ActiveSwitch form={form} />
                                    </td>
                                    <td className="row-actions">
                                        <button className="icon-button" onClick={() => setModal({ type: 'edit', form })} title="Tahrirlash">
                                            <Pencil size={15} />
                                        </button>
                                        <button
                                            className="icon-button"
                                            onClick={() => setModal({ type: 'link', form })}
                                            title="Yangi havola yaratish"
                                        >
                                            <RefreshCw size={15} />
                                        </button>
                                        <button className="icon-button" onClick={() => setModal({ type: 'delete', form })} title="Oʻchirish">
                                            <Trash2 size={15} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {modal?.type === 'edit' && <FormModal key={modal.form?.id ?? 'new'} form={modal.form} onClose={close} />}
            {modal?.type === 'link' && (
                <ConfirmDialog
                    title="Yangi havola"
                    message={`“${modal.form.name}” uchun yangi havola yaratiladi. Eski havola darhol ishlamay qoladi — uni ulashgan joylaringizda yangilashingiz kerak boʻladi.`}
                    confirmLabel="Yangi havola yaratish"
                    isPending={regenerate.isPending}
                    error={regenerate.error}
                    onClose={close}
                    onConfirm={() =>
                        regenerate.mutate(modal.form.id, {
                            onSuccess: () => {
                                toastSuccess('Yangi havola yaratildi')
                                close()
                            },
                        })
                    }
                />
            )}
            {modal?.type === 'delete' && (
                <ConfirmDialog
                    title="Formani oʻchirish"
                    message={`“${modal.form.name}” formasi va uning havolasi oʻchiriladi. Forma orqali kelgan lidlar saqlanib qoladi.`}
                    isPending={deleteForm.isPending}
                    error={deleteForm.error}
                    onClose={close}
                    onConfirm={() =>
                        deleteForm.mutate(modal.form.id, {
                            onSuccess: () => {
                                toastSuccess('Forma oʻchirildi')
                                close()
                            },
                        })
                    }
                />
            )}
        </div>
    )
}
