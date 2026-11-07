import { useState } from 'react'
import { AlertCircle, FileAudio, LoaderCircle, RotateCcw, Trash2 } from 'lucide-react'
import AudioPlayer from './AudioPlayer.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'
import { getErrorMessage } from '../api/client.js'
import { useContactCalls, useDeleteCall, useRetryCall } from '../hooks/useCalls.js'
import { CALL_STATUS } from '../labels.js'
import { toastError, toastSuccess } from '../toast/toastStore.js'
import { formatDateTime, formatSize } from '../utils/format.js'

function CallStatus({ status }) {
    const pending = status === 'created' || status === 'analyzing'
    return (
        <span className={`badge badge--call-${status}`}>
            {pending && <LoaderCircle size={11} className="spin" />} {CALL_STATUS[status] ?? status}
        </span>
    )
}

export default function CallsPanel({ contactId }) {
    const { data, isLoading, error } = useContactCalls(contactId)
    const retryCall = useRetryCall()
    const deleteCall = useDeleteCall()
    const [toDelete, setToDelete] = useState(null)

    const closeDelete = () => {
        deleteCall.reset()
        setToDelete(null)
    }

    return (
        <section className="card panel">
            <h2 className="panel-title">
                Qoʻngʻiroqlar {data && <span className="count">{data.total}</span>}
            </h2>
            {isLoading && <p className="muted small">Yuklanmoqda…</p>}
            {error && <p className="error">{getErrorMessage(error)}</p>}
            {data && !data.items.length && <p className="muted small">Hali qoʻngʻiroq yuklanmagan</p>}
            <ul className="call-list">
                {data?.items.map((call) => (
                    <li key={call.id} className="call-item">
                        <div className="call-item-head">
                            <FileAudio size={15} className="muted" aria-hidden="true" />
                            <span className="call-file" title={call.fileName}>
                                {call.fileName}
                            </span>
                            <CallStatus status={call.status} />
                        </div>
                        <div className="muted small">
                            {formatDateTime(call.createdAt)} · {formatSize(call.size)}
                        </div>
                        {call.status === 'failed' && call.error && (
                            <div className="error small inline-icon">
                                <AlertCircle size={13} /> {call.error}
                            </div>
                        )}
                        <div className="call-item-actions">
                            <AudioPlayer callId={call.id} />
                            {call.status === 'failed' && (
                                <button
                                    type="button"
                                    className="link-button"
                                    disabled={retryCall.isPending}
                                    onClick={() =>
                                        retryCall.mutate(call.id, {
                                            onSuccess: () => toastSuccess('Qoʻngʻiroq qayta navbatga qoʻyildi'),
                                            onError: toastError,
                                        })
                                    }
                                >
                                    <RotateCcw size={13} /> Qayta urinish
                                </button>
                            )}
                            <button
                                type="button"
                                className="icon-button call-delete"
                                title={call.status === 'analyzing' ? 'Tahlil vaqtida oʻchirib boʻlmaydi' : 'Oʻchirish'}
                                disabled={call.status === 'analyzing'}
                                onClick={() => setToDelete(call)}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </li>
                ))}
            </ul>

            {toDelete && (
                <ConfirmDialog
                    title="Qoʻngʻiroqni oʻchirish"
                    message={`“${toDelete.fileName}” yozuvi oʻchiriladi. Uning AI tahlili izohlarda saqlanib qoladi.`}
                    isPending={deleteCall.isPending}
                    error={deleteCall.error}
                    onClose={closeDelete}
                    onConfirm={() =>
                        deleteCall.mutate(
                            { id: toDelete.id, contactId },
                            {
                                onSuccess: () => {
                                    toastSuccess('Qoʻngʻiroq oʻchirildi')
                                    closeDelete()
                                },
                            },
                        )
                    }
                />
            )}
        </section>
    )
}
