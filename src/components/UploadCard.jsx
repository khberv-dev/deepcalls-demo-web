import { useRef, useState } from 'react'
import { useAnalyzeCall } from '../hooks/useAnalyzeCall.js'
import { getErrorMessage } from '../api/client.js'

function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function UploadCard({ onResult }) {
    const inputRef = useRef(null)
    const [file, setFile] = useState(null)
    const [dragging, setDragging] = useState(false)
    const [progress, setProgress] = useState(0)
    const { mutate, isPending, isError, error, reset } = useAnalyzeCall()

    const pickFile = (picked) => {
        if (!picked) return
        setFile(picked)
        setProgress(0)
        reset()
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setDragging(false)
        if (!isPending) pickFile(e.dataTransfer.files?.[0])
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!file) return
        setProgress(0)
        mutate(
            {
                file,
                onUploadProgress: (event) => {
                    if (event.total) setProgress(Math.round((event.loaded / event.total) * 100))
                },
            },
            { onSuccess: (data) => onResult?.(data) },
        )
    }

    const uploadDone = progress >= 100

    return (
        <form className="card upload-card" onSubmit={handleSubmit}>
            <h2 className="card-title">Analyze a call</h2>
            <p className="muted">Upload a call recording to get a summary, intent and operator evaluation.</p>

            <div
                className={`dropzone${dragging ? ' dropzone--active' : ''}${isPending ? ' dropzone--disabled' : ''}`}
                onClick={() => !isPending && inputRef.current?.click()}
                onDragOver={(e) => {
                    e.preventDefault()
                    setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && !isPending) inputRef.current?.click()
                }}
            >
                <input
                    ref={inputRef}
                    type="file"
                    name="file"
                    accept="audio/*,video/*"
                    hidden
                    onChange={(e) => pickFile(e.target.files?.[0])}
                />
                {file ? (
                    <>
                        <strong className="file-name">{file.name}</strong>
                        <span className="muted">{formatSize(file.size)} · click to change</span>
                    </>
                ) : (
                    <>
                        <strong>Drop a file here</strong>
                        <span className="muted">or click to browse</span>
                    </>
                )}
            </div>

            {isPending && (
                <div className="progress">
                    <div className="progress-bar" style={{ width: `${progress}%` }} />
                    <span className="progress-label">
                        {uploadDone ? 'Analyzing…' : `Uploading… ${progress}%`}
                    </span>
                </div>
            )}

            {isError && <p className="error">{getErrorMessage(error)}</p>}

            <button className="button" type="submit" disabled={!file || isPending}>
                {isPending ? 'Analyzing…' : 'Analyze'}
            </button>
        </form>
    )
}
