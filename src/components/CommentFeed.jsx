import { useRef, useState } from 'react'
import { ChevronDown, ChevronUp, Pencil, Sparkles, StickyNote, Trash2, Upload } from 'lucide-react'
import AnalysisResult from './AnalysisResult.jsx'
import AudioPlayer from './AudioPlayer.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'
import { getErrorMessage } from '../api/client.js'
import { useUploadCall } from '../hooks/useCalls.js'
import { useContactComments, useCreateComment, useDeleteComment, useUpdateComment } from '../hooks/useComments.js'
import { INTENT_CATEGORY, LEVEL, SENTIMENT, label } from '../labels.js'
import { toastError, toastSuccess } from '../toast/toastStore.js'
import { formatDateTime } from '../utils/format.js'

const MAX_TEXT = 10_000
const MAX_FILE = 100 * 1024 * 1024
const ACCEPT = 'audio/*,.wav,.mp3,.aiff,.aac,.ogg,.opus,.flac,.m4a,.mp4,.webm'

function Composer({ contactId }) {
    const [text, setText] = useState('')
    const [progress, setProgress] = useState(null)
    const fileRef = useRef(null)
    const createComment = useCreateComment()
    const uploadCall = useUploadCall()

    const submitNote = (e) => {
        e.preventDefault()
        const value = text.trim()
        if (!value) return
        createComment.mutate({ contactId, text: value }, { onSuccess: () => setText('') })
    }

    const upload = (file) => {
        if (!file) return
        if (file.size > MAX_FILE) {
            toastError('Fayl hajmi 100 MB dan oshmasligi kerak')
            return
        }
        setProgress(0)
        uploadCall.mutate(
            {
                contactId,
                file,
                onUploadProgress: (event) => {
                    if (event.total) setProgress(Math.round((event.loaded / event.total) * 100))
                },
            },
            {
                onSuccess: () => toastSuccess('Qoʻngʻiroq yuklandi. AI tahlili tayyor boʻlgach shu yerda paydo boʻladi.'),
                onError: toastError,
                onSettled: () => setProgress(null),
            },
        )
    }

    return (
        <form className="composer" onSubmit={submitNote}>
            <textarea
                className="input textarea"
                placeholder="Izoh yozing…"
                value={text}
                maxLength={MAX_TEXT}
                rows={2}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitNote(e)
                }}
            />
            {createComment.isError && <p className="error">{getErrorMessage(createComment.error)}</p>}
            <div className="composer-actions">
                <input
                    ref={fileRef}
                    type="file"
                    accept={ACCEPT}
                    hidden
                    onChange={(e) => {
                        upload(e.target.files?.[0])
                        e.target.value = ''
                    }}
                />
                <button
                    type="button"
                    className="button button--ghost"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploadCall.isPending}
                >
                    <Upload size={14} />
                    {progress !== null ? `Yuklanmoqda… ${progress}%` : 'Qoʻngʻiroq yuklash'}
                </button>
                <button type="submit" className="button" disabled={!text.trim() || createComment.isPending}>
                    {createComment.isPending ? 'Saqlanmoqda…' : 'Izoh qoʻshish'}
                </button>
            </div>
        </form>
    )
}

function CommentItem({ comment, onDelete }) {
    const [editing, setEditing] = useState(false)
    const [draft, setDraft] = useState(comment.text)
    const [expanded, setExpanded] = useState(false)
    const updateComment = useUpdateComment()
    const isAi = comment.type === 'call_analysis'
    const details = comment.details

    const save = () => {
        const text = draft.trim()
        if (!text) return
        updateComment.mutate({ id: comment.id, text }, { onSuccess: () => setEditing(false) })
    }

    return (
        <li className={`feed-item${isAi ? ' feed-item--ai' : ''}`}>
            <span className="feed-icon">{isAi ? <Sparkles size={14} /> : <StickyNote size={14} />}</span>
            <div className="feed-content">
                <div className="feed-head">
                    <strong>{isAi ? 'AI qoʻngʻiroq tahlili' : 'Izoh'}</strong>
                    <span className="muted small">{formatDateTime(comment.createdAt)}</span>
                    <div className="feed-actions">
                        <button
                            type="button"
                            className="icon-button"
                            title="Tahrirlash"
                            onClick={() => {
                                setDraft(comment.text)
                                setEditing(true)
                            }}
                        >
                            <Pencil size={13} />
                        </button>
                        <button type="button" className="icon-button" title="Oʻchirish" onClick={() => onDelete(comment)}>
                            <Trash2 size={13} />
                        </button>
                    </div>
                </div>

                {editing ? (
                    <div className="feed-edit">
                        <textarea
                            className="input textarea"
                            value={draft}
                            maxLength={MAX_TEXT}
                            rows={3}
                            autoFocus
                            onChange={(e) => setDraft(e.target.value)}
                        />
                        {updateComment.isError && <p className="error">{getErrorMessage(updateComment.error)}</p>}
                        <div className="composer-actions">
                            <button type="button" className="button button--ghost" onClick={() => setEditing(false)}>
                                Bekor qilish
                            </button>
                            <button
                                type="button"
                                className="button"
                                onClick={save}
                                disabled={!draft.trim() || updateComment.isPending}
                            >
                                Saqlash
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="feed-text">{comment.text}</p>
                )}

                {isAi && details && (
                    <>
                        <div className="feed-chips">
                            <span className={`badge badge--${details.purchaseLikelihood?.level}`}>
                                Xarid: {details.purchaseLikelihood?.score ?? '—'}% ·{' '}
                                {label(LEVEL, details.purchaseLikelihood?.level)}
                            </span>
                            <span className={`badge badge--${details.clientSentiment}`}>
                                {label(SENTIMENT, details.clientSentiment)}
                            </span>
                            <span className="badge">{label(INTENT_CATEGORY, details.clientIntent?.category)}</span>
                            <span className="badge badge--plain">Operator: {details.operatorPerformance?.score ?? '—'}/10</span>
                        </div>
                        <div className="feed-footer">
                            {comment.callId && <AudioPlayer callId={comment.callId} />}
                            <button type="button" className="link-button" onClick={() => setExpanded((v) => !v)}>
                                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                {expanded ? 'Yopish' : 'Batafsil tahlil'}
                            </button>
                        </div>
                        {expanded && <AnalysisResult data={details} />}
                    </>
                )}
            </div>
        </li>
    )
}

export default function CommentFeed({ contactId }) {
    const { data, isLoading, error, hasNextPage, fetchNextPage, isFetchingNextPage } = useContactComments(contactId)
    const deleteComment = useDeleteComment()
    const [toDelete, setToDelete] = useState(null)

    const closeDelete = () => {
        deleteComment.reset()
        setToDelete(null)
    }

    return (
        <section className="card panel feed">
            <Composer contactId={contactId} />

            {isLoading && <p className="muted small">Yuklanmoqda…</p>}
            {error && <p className="error">{getErrorMessage(error)}</p>}
            {data && !data.items.length && (
                <p className="muted small center feed-empty">
                    Hali izohlar yoʻq. Izoh yozing yoki qoʻngʻiroq yozuvini yuklang: AI tahlili shu yerda chiqadi.
                </p>
            )}

            <ul className="feed-list">
                {data?.items.map((comment) => (
                    <CommentItem key={comment.id} comment={comment} onDelete={setToDelete} />
                ))}
            </ul>

            {hasNextPage && (
                <button
                    type="button"
                    className="button button--ghost feed-more"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                >
                    {isFetchingNextPage ? 'Yuklanmoqda…' : 'Yana koʻrsatish'}
                </button>
            )}

            {toDelete && (
                <ConfirmDialog
                    title={toDelete.type === 'call_analysis' ? 'AI tahlilini oʻchirish' : 'Izohni oʻchirish'}
                    message="Bu yozuv butunlay oʻchiriladi."
                    isPending={deleteComment.isPending}
                    error={deleteComment.error}
                    onClose={closeDelete}
                    onConfirm={() =>
                        deleteComment.mutate({ id: toDelete.id, contactId }, { onSuccess: closeDelete })
                    }
                />
            )}
        </section>
    )
}
