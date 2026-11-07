import { useEffect, useState } from 'react'
import { LoaderCircle, Play } from 'lucide-react'
import { fetchCallAudio } from '../api/calls.js'
import { getErrorMessage } from '../api/client.js'

/**
 * Loads the recording on demand (it needs the auth header, so it's fetched as a Blob) and plays it from an
 * object URL, which is revoked on unmount.
 */
export default function AudioPlayer({ callId }) {
    const [url, setUrl] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        return () => {
            if (url) URL.revokeObjectURL(url)
        }
    }, [url])

    const load = async () => {
        setLoading(true)
        setError(null)
        try {
            const blob = await fetchCallAudio(callId)
            setUrl(URL.createObjectURL(blob))
        } catch (e) {
            setError(getErrorMessage(e))
        } finally {
            setLoading(false)
        }
    }

    if (url) return <audio className="audio" src={url} controls autoPlay />

    return (
        <span className="audio-load">
            <button type="button" className="link-button" onClick={load} disabled={loading}>
                {loading ? <LoaderCircle size={14} className="spin" /> : <Play size={14} />} Tinglash
            </button>
            {error && <span className="error small">{error}</span>}
        </span>
    )
}
