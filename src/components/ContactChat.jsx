import { Fragment, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, ChevronDown, ChevronUp, LoaderCircle, Paperclip, Pencil, SendHorizontal, Sparkles, Trash2 } from 'lucide-react'
import AnalysisResult from './AnalysisResult.jsx'
import AudioPlayer from './AudioPlayer.jsx'
import CallItem from './CallItem.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'
import { getErrorMessage } from '../api/client.js'
import { useUploadCall } from '../hooks/useCalls.js'
import { useCreateComment, useDeleteComment, useUpdateComment } from '../hooks/useComments.js'
import { useContactHistory } from '../hooks/useHistory.js'
import { usePermissions } from '../hooks/usePermissions.js'
import { INTENT_CATEGORY, LEVEL, SENTIMENT, label } from '../labels.js'
import { toastError, toastSuccess } from '../toast/toastStore.js'
import { dayOf, formatDayLabel, formatTime, fullName, initials } from '../utils/format.js'

const MAX_TEXT = 10_000
const MAX_FILE = 100 * 1024 * 1024
const ACCEPT = 'audio/*,.wav,.mp3,.aiff,.aac,.ogg,.opus,.flac,.m4a,.mp4,.webm'
const PAGE_SIZE = 30

/* -------------------------------------------------------------------------- */
/* Composer                                                                   */
/* -------------------------------------------------------------------------- */

/** Chat input: Enter sends a note, Shift+Enter adds a line, the paperclip uploads a call recording. */
function Composer({ contactId, canUpload, onSent }) {
    const [text, setText] = useState('')
    const [progress, setProgress] = useState(null)
    const fileRef = useRef(null)
    const createComment = useCreateComment()
    const uploadCall = useUploadCall()

    const send = () => {
        const value = text.trim()
        if (!value || createComment.isPending) return
        onSent()
        createComment.mutate({ contactId, text: value }, { onSuccess: () => setText('') })
    }

    const upload = (file) => {
        if (!file) return
        if (file.size > MAX_FILE) {
            toastError('Fayl hajmi 100 MB dan oshmasligi kerak')
            return
        }
        onSent()
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
                onSuccess: () => toastSuccess('Qoʻngʻiroq yuklandi. AI tahlili tayyor boʻlgach shu yerda chiqadi.'),
                onError: toastError,
                onSettled: () => setProgress(null),
            },
        )
    }

    return (
        <div className="chat-composer">
            {progress !== null && (
                <div className="chat-upload">
                    <LoaderCircle size={14} className="spin" />
                    <span>Qoʻngʻiroq yuklanmoqda… {progress}%</span>
                    <span className="chat-upload-bar">
                        <span style={{ width: `${progress}%` }} />
                    </span>
                </div>
            )}
            {createComment.isError && <p className="error small">{getErrorMessage(createComment.error)}</p>}
            <div className="chat-input">
                {canUpload && (
                    <>
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
                            className="chat-icon-button"
                            onClick={() => fileRef.current?.click()}
                            disabled={uploadCall.isPending}
                            title="Qoʻngʻiroq yozuvini yuklash"
                            aria-label="Qoʻngʻiroq yozuvini yuklash"
                        >
                            <Paperclip size={18} />
                        </button>
                    </>
                )}
                <textarea
                    className="chat-textarea"
                    placeholder="Izoh yozing…"
                    value={text}
                    maxLength={MAX_TEXT}
                    rows={Math.min(5, Math.max(1, text.split('\n').length))}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                            e.preventDefault()
                            send()
                        }
                    }}
                />
                <button
                    type="button"
                    className="chat-send"
                    onClick={send}
                    disabled={!text.trim() || createComment.isPending}
                    title="Yuborish (Enter)"
                    aria-label="Yuborish"
                >
                    <SendHorizontal size={18} />
                </button>
            </div>
        </div>
    )
}

/* -------------------------------------------------------------------------- */
/* Messages                                                                   */
/* -------------------------------------------------------------------------- */

/** Bubble wrapper: avatar on the left for others, right-aligned for the current user. */
function Message({ mine, avatar, meta, actions, variant, children }) {
    return (
        <div className={`msg${mine ? ' msg--mine' : ''}`}>
            {!mine && <div className="msg-avatar">{avatar}</div>}
            <div className="msg-body">
                <div className="msg-meta">{meta}</div>
                <div className="msg-row">
                    <div className={`bubble${variant ? ` bubble--${variant}` : ''}`}>{children}</div>
                    {actions && <div className="msg-actions">{actions}</div>}
                </div>
            </div>
        </div>
    )
}

function CommentActions({ onEdit, onDelete }) {
    return (
        <>
            <button type="button" className="icon-button" title="Tahrirlash" onClick={onEdit}>
                <Pencil size={13} />
            </button>
            <button type="button" className="icon-button" title="Oʻchirish" onClick={onDelete}>
                <Trash2 size={13} />
            </button>
        </>
    )
}

function EditBox({ initial, onCancel, mutation, onSave }) {
    const [draft, setDraft] = useState(initial)
    return (
        <div className="bubble-edit">
            <textarea
                className="input textarea"
                value={draft}
                maxLength={MAX_TEXT}
                rows={3}
                autoFocus
                onChange={(e) => setDraft(e.target.value)}
            />
            {mutation.isError && <p className="error small">{getErrorMessage(mutation.error)}</p>}
            <div className="bubble-edit-actions">
                <button type="button" className="button button--ghost" onClick={onCancel}>
                    Bekor qilish
                </button>
                <button
                    type="button"
                    className="button"
                    disabled={!draft.trim() || mutation.isPending}
                    onClick={() => onSave(draft.trim())}
                >
                    Saqlash
                </button>
            </div>
        </div>
    )
}

const edited = (entity) => entity.updatedAt && entity.updatedAt !== entity.createdAt

function NoteMessage({ item, mine, author, canEdit, onDelete }) {
    const comment = item.entity
    const [editing, setEditing] = useState(false)
    const update = useUpdateComment()

    return (
        <Message
            mine={mine}
            avatar={<span className="avatar avatar--sm">{initials(author)}</span>}
            meta={
                <>
                    {!mine && <strong>{author}</strong>}
                    <span>{formatTime(item.createdAt)}</span>
                    {edited(comment) && <span>· tahrirlangan</span>}
                </>
            }
            actions={canEdit && !editing && <CommentActions onEdit={() => setEditing(true)} onDelete={() => onDelete(comment)} />}
        >
            {editing ? (
                <EditBox
                    initial={comment.text}
                    mutation={update}
                    onCancel={() => setEditing(false)}
                    onSave={(text) => update.mutate({ id: comment.id, text }, { onSuccess: () => setEditing(false) })}
                />
            ) : (
                <p className="bubble-text">{comment.text}</p>
            )}
        </Message>
    )
}

/** AI analysis of a call: always on the "incoming" side, attributed to the AI (uploaded by `author`). */
function AnalysisMessage({ item, author, canEdit, onDelete }) {
    const comment = item.entity
    const details = comment.details
    const [editing, setEditing] = useState(false)
    const [expanded, setExpanded] = useState(false)
    const update = useUpdateComment()

    return (
        <Message
            avatar={
                <span className="avatar avatar--sm avatar--ai">
                    <Sparkles size={14} />
                </span>
            }
            meta={
                <>
                    <strong className="msg-ai-name">AI tahlili</strong>
                    <span>{formatTime(item.createdAt)}</span>
                    {author && <span>· yukladi: {author}</span>}
                </>
            }
            variant="ai"
            actions={canEdit && !editing && <CommentActions onEdit={() => setEditing(true)} onDelete={() => onDelete(comment)} />}
        >
            {editing ? (
                <EditBox
                    initial={comment.text}
                    mutation={update}
                    onCancel={() => setEditing(false)}
                    onSave={(text) => update.mutate({ id: comment.id, text }, { onSuccess: () => setEditing(false) })}
                />
            ) : (
                <p className="bubble-text">{comment.text}</p>
            )}
            {details && (
                <>
                    <div className="feed-chips">
                        <span className={`badge badge--${details.purchaseLikelihood?.level}`}>
                            Xarid: {details.purchaseLikelihood?.score ?? '—'}% · {label(LEVEL, details.purchaseLikelihood?.level)}
                        </span>
                        <span className={`badge badge--${details.clientSentiment}`}>{label(SENTIMENT, details.clientSentiment)}</span>
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
        </Message>
    )
}

function CallMessage({ item, mine, author, canWrite }) {
    return (
        <Message
            mine={mine}
            avatar={<span className="avatar avatar--sm">{initials(author)}</span>}
            meta={
                <>
                    {!mine && <strong>{author}</strong>}
                    <span>{formatTime(item.createdAt)}</span>
                    <span>· qoʻngʻiroq yozuvi</span>
                </>
            }
            variant="call"
        >
            <CallItem call={item.entity} canWrite={canWrite} />
        </Message>
    )
}

/** Stage change: a centered system line. Names are copies made at the time of the move. */
function StageChangeMessage({ item, author }) {
    const c = item.entity
    const chip = (name) => <span className="stage-chip">{name}</span>
    let body
    if (!c.fromStageId && c.toStageId) {
        body = (
            <>
                voronkaga qoʻshdi: {c.toPipelineName} <ArrowRight size={12} /> {chip(c.toStageName)}
            </>
        )
    } else if (c.fromStageId && !c.toStageId) {
        body = (
            <>
                voronkadan chiqardi: {c.fromPipelineName} · {chip(c.fromStageName)}
            </>
        )
    } else if (c.fromPipelineId === c.toPipelineId) {
        body = (
            <>
                {chip(c.fromStageName)} <ArrowRight size={12} /> {chip(c.toStageName)}
            </>
        )
    } else {
        body = (
            <>
                {c.fromPipelineName} · {chip(c.fromStageName)} <ArrowRight size={12} /> {c.toPipelineName} · {chip(c.toStageName)}
            </>
        )
    }
    return (
        <div className="msg-system">
            <span className="msg-system-inner">
                <strong>{author}</strong> {body}
                <span className="msg-system-time">{formatTime(item.createdAt)}</span>
            </span>
        </div>
    )
}

/* -------------------------------------------------------------------------- */
/* Chat                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The lead's whole history (notes, AI analyses, calls, stage changes) as one chat: oldest at the top, newest at
 * the bottom, composer underneath. Older entries load when scrolling to the top.
 * Own comments are always editable; others' need canWriteComment. `canWrite` (own lead or canWriteContact) allows
 * uploading and managing calls.
 */
export default function ContactChat({ contact, canWrite }) {
    const contactId = contact.id
    const { userId, canWriteComment } = usePermissions()
    const { data, isLoading, error, hasNextPage, fetchNextPage, isFetchingNextPage } = useContactHistory(contactId, 'all', {
        limit: PAGE_SIZE,
    })
    const deleteComment = useDeleteComment()
    const [toDelete, setToDelete] = useState(null)

    // The API returns newest first; a chat reads oldest → newest.
    const items = useMemo(() => (data ? [...data.items].reverse() : []), [data])
    const oldestId = items[0]?.id ?? null
    const newestId = items.at(-1)?.id ?? null

    // Scroll handling: start at the bottom, follow new messages while the user is at the bottom, and keep the
    // viewport steady when older messages are added above.
    const scrollRef = useRef(null)
    const scrollState = useRef({ newestId: null, oldestId: null, height: 0, atBottom: true })

    useLayoutEffect(() => {
        const el = scrollRef.current
        if (!el || !newestId) return
        const prev = scrollState.current
        if (!prev.newestId) el.scrollTop = el.scrollHeight
        else if (oldestId !== prev.oldestId && newestId === prev.newestId) el.scrollTop += el.scrollHeight - prev.height
        else if (prev.atBottom) el.scrollTop = el.scrollHeight
        scrollState.current = { ...prev, newestId, oldestId, height: el.scrollHeight }
    }, [oldestId, newestId])

    const onScroll = () => {
        const el = scrollRef.current
        const state = scrollState.current
        state.atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
        state.height = el.scrollHeight
        if (el.scrollTop < 120 && hasNextPage && !isFetchingNextPage) fetchNextPage()
    }

    const stickToBottom = () => {
        scrollState.current.atBottom = true
    }

    const authorOf = (item) => (item.userId === userId ? 'Siz' : fullName(item.user) || 'Foydalanuvchi')

    const closeDelete = () => {
        deleteComment.reset()
        setToDelete(null)
    }

    const renderItem = (item) => {
        const mine = item.userId === userId
        const author = authorOf(item)
        if (item.type === 'comment') {
            const canEdit = item.entity.userId === userId || canWriteComment
            return item.entity.type === 'call_analysis' ? (
                <AnalysisMessage item={item} author={author} canEdit={canEdit} onDelete={setToDelete} />
            ) : (
                <NoteMessage item={item} mine={mine} author={author} canEdit={canEdit} onDelete={setToDelete} />
            )
        }
        if (item.type === 'call') return <CallMessage item={item} mine={mine} author={author} canWrite={canWrite} />
        if (item.type === 'pipeline') return <StageChangeMessage item={item} author={author} />
        return null
    }

    return (
        <section className="card chat">
            <header className="chat-header">
                <h2 className="panel-title">
                    Tarix {data && <span className="count">{data.total}</span>}
                </h2>
                <span className="muted small">Izohlar, qoʻngʻiroqlar va bosqich oʻzgarishlari</span>
            </header>

            <div className="chat-scroll" ref={scrollRef} onScroll={onScroll}>
                {hasNextPage && (
                    <button
                        type="button"
                        className="chat-older"
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                    >
                        {isFetchingNextPage ? 'Yuklanmoqda…' : 'Oldingi yozuvlar'}
                    </button>
                )}
                {isLoading && <p className="muted small center">Yuklanmoqda…</p>}
                {error && <p className="error center">{getErrorMessage(error)}</p>}
                {data && !items.length && (
                    <div className="chat-empty">
                        <p className="strong-plain">Hali yozuvlar yoʻq</p>
                        <p className="muted small">
                            Izoh yozing yoki qoʻngʻiroq yozuvini yuklang — AI tahlili shu yerda paydo boʻladi.
                        </p>
                    </div>
                )}
                {items.map((item, index) => {
                    const newDay = index === 0 || dayOf(item.createdAt) !== dayOf(items[index - 1].createdAt)
                    return (
                        <Fragment key={item.id}>
                            {newDay && (
                                <div className="chat-day">
                                    <span>{formatDayLabel(item.createdAt)}</span>
                                </div>
                            )}
                            {renderItem(item)}
                        </Fragment>
                    )
                })}
            </div>

            <Composer contactId={contactId} canUpload={canWrite} onSent={stickToBottom} />

            {toDelete && (
                <ConfirmDialog
                    title={toDelete.type === 'call_analysis' ? 'AI tahlilini oʻchirish' : 'Izohni oʻchirish'}
                    message="Bu yozuv butunlay oʻchiriladi."
                    isPending={deleteComment.isPending}
                    error={deleteComment.error}
                    onClose={closeDelete}
                    onConfirm={() => deleteComment.mutate({ id: toDelete.id, contactId }, { onSuccess: closeDelete })}
                />
            )}
        </section>
    )
}
