import { useState } from 'react'
import { Link } from 'react-router'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import SourceIcon from '../components/SourceIcon.jsx'
import SourceModal from '../components/SourceModal.jsx'
import Spinner from '../components/Spinner.jsx'
import { getErrorMessage } from '../api/client.js'
import { useDeleteSource, useSources } from '../hooks/useSources.js'
import { toastSuccess } from '../toast/toastStore.js'

export default function SourcesPage() {
    const { data: sources, isLoading, error } = useSources()
    const deleteSource = useDeleteSource()
    const [modal, setModal] = useState(null) // { type: 'edit', source? } | { type: 'delete', source }
    const close = () => {
        deleteSource.reset()
        setModal(null)
    }

    return (
        <div className="page">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Manbalar</h1>
                    <p className="muted">Kontaktlar qayerdan kelgani: Instagram, Telegram, sayt va boshqalar.</p>
                </div>
                <button className="button" onClick={() => setModal({ type: 'edit' })}>
                    <Plus size={16} /> Yangi manba
                </button>
            </header>

            {isLoading ? (
                <Spinner />
            ) : error ? (
                <p className="error">{getErrorMessage(error)}</p>
            ) : !sources.length ? (
                <div className="empty-state">
                    <p className="muted">Hali manbalar yoʻq</p>
                </div>
            ) : (
                <ul className="source-list">
                    {sources.map((source) => (
                        <li key={source.id} className="card source-item">
                            <span className="source-icon">
                                <SourceIcon icon={source.icon} size={20} />
                            </span>
                            <div className="source-info">
                                <strong>{source.name}</strong>
                                <Link className="muted small" to={`/contacts?sourceId=${source.id}`}>
                                    Kontaktlarni koʻrish
                                </Link>
                            </div>
                            <button className="icon-button" onClick={() => setModal({ type: 'edit', source })} title="Tahrirlash">
                                <Pencil size={16} />
                            </button>
                            <button className="icon-button" onClick={() => setModal({ type: 'delete', source })} title="Oʻchirish">
                                <Trash2 size={16} />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {modal?.type === 'edit' && <SourceModal source={modal.source} onClose={close} />}
            {modal?.type === 'delete' && (
                <ConfirmDialog
                    title="Manbani oʻchirish"
                    message={`“${modal.source.name}” manbasi oʻchiriladi. Bu manbadagi kontaktlar saqlanib qoladi, lekin manbasiz boʻladi.`}
                    isPending={deleteSource.isPending}
                    error={deleteSource.error}
                    onClose={close}
                    onConfirm={() =>
                        deleteSource.mutate(modal.source.id, {
                            onSuccess: () => {
                                toastSuccess('Manba oʻchirildi')
                                close()
                            },
                        })
                    }
                />
            )}
        </div>
    )
}
