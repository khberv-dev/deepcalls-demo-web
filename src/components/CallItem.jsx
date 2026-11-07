import { useState } from 'react'
import { AlertCircle, FileAudio, LoaderCircle, RotateCcw, Trash2 } from 'lucide-react'
import AudioPlayer from './AudioPlayer.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'
import { useDeleteCall, useRetryCall } from '../hooks/useCalls.js'
import { CALL_STATUS } from '../labels.js'
import { toastError, toastSuccess } from '../toast/toastStore.js'
import { formatDateTime, formatSize } from '../utils/format.js'

export function CallStatus({ status }) {
    const pending = status === 'created' || status === 'analyzing'
    return (
        <span className={`badge badge--call-${status}`}>
            {pending && <LoaderCircle size={11} className="spin" />} {CALL_STATUS[status] ?? status}
        </span>
    )
}

/**
 * One call recording: status, player, retry (failed only) and delete (not while analyzing).
 * `canWrite`: own contact, or another user's with canWriteContact.
 */
export default function CallItem({ call, canWrite }) {
    const retryCall = useRetryCall()
    const deleteCall = useDeleteCall()
    const [confirmDelete, setConfirmDelete] = useState(false)

    const closeDelete = () => {
        deleteCall.reset()
        setConfirmDelete(false)
    }

    return (
        <div className="call-item">
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
                {canWrite && call.status === 'failed' && (
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
                {canWrite && (
                    <button
                        type="button"
                        className="icon-button call-delete"
                        title={call.status === 'analyzing' ? 'Tahlil vaqtida oʻchirib boʻlmaydi' : 'Oʻchirish'}
                        disabled={call.status === 'analyzing'}
                        onClick={() => setConfirmDelete(true)}
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </div>

            {confirmDelete && (
                <ConfirmDialog
                    title="Qoʻngʻiroqni oʻchirish"
                    message={`“${call.fileName}” yozuvi oʻchiriladi. Uning AI tahlili tarixda saqlanib qoladi.`}
                    isPending={deleteCall.isPending}
                    error={deleteCall.error}
                    onClose={closeDelete}
                    onConfirm={() =>
                        deleteCall.mutate(
                            { id: call.id, contactId: call.contactId },
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
        </div>
    )
}
