import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowUpRight, Pencil, Plus, Trash2 } from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import SourceIcon from '../components/SourceIcon.jsx'
import SourceModal from '../components/SourceModal.jsx'
import Spinner from '../components/Spinner.jsx'
import { getErrorMessage } from '../api/client.js'
import { useDeleteSource, useSources } from '../hooks/useSources.js'
import { toastSuccess } from '../toast/toastStore.js'
import { formatDate } from '../utils/format.js'

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
                    <h1 className="page-title">
                        Manbalar {sources && <span className="muted">({sources.length})</span>}
                    </h1>
                    <p className="muted">Lidlar qayerdan kelgani: Instagram, Telegram, sayt va boshqalar.</p>
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
                    <button className="button" onClick={() => setModal({ type: 'edit' })}>
                        <Plus size={16} /> Manba qoʻshish
                    </button>
                </div>
            ) : (
                <div className="table-wrap">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Nomi</th>
                                <th>Belgi</th>
                                <th>Qoʻshilgan</th>
                                <th>Lidlar</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {sources.map((source) => (
                                <tr key={source.id}>
                                    <td>
                                        <div className="name-cell">
                                            <span className="source-icon source-icon--sm">
                                                <SourceIcon icon={source.icon} size={15} />
                                            </span>
                                            <span className="strong-plain">{source.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        {source.icon ? (
                                            <code className="code" title={source.icon}>
                                                {source.icon}
                                            </code>
                                        ) : (
                                            <span className="muted">—</span>
                                        )}
                                    </td>
                                    <td className="muted">{formatDate(source.createdAt)}</td>
                                    <td>
                                        <Link className="inline-icon" to={`/leads?view=list&sourceId=${source.id}`}>
                                            Koʻrish <ArrowUpRight size={14} />
                                        </Link>
                                    </td>
                                    <td className="row-actions">
                                        <button
                                            className="icon-button"
                                            onClick={() => setModal({ type: 'edit', source })}
                                            title="Tahrirlash"
                                        >
                                            <Pencil size={15} />
                                        </button>
                                        <button
                                            className="icon-button"
                                            onClick={() => setModal({ type: 'delete', source })}
                                            title="Oʻchirish"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {modal?.type === 'edit' && <SourceModal key={modal.source?.id ?? 'new'} source={modal.source} onClose={close} />}
            {modal?.type === 'delete' && (
                <ConfirmDialog
                    title="Manbani oʻchirish"
                    message={`“${modal.source.name}” manbasi oʻchiriladi. Bu manbadagi lidlar saqlanib qoladi, lekin manbasiz boʻladi.`}
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
