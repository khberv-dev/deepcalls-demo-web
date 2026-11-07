import { useSyncExternalStore } from 'react'
import { X } from 'lucide-react'
import { dismissToast, getToasts, subscribeToasts } from '../toast/toastStore.js'

export default function Toaster() {
    const toasts = useSyncExternalStore(subscribeToasts, getToasts)
    return (
        <div className="toaster" role="status" aria-live="polite">
            {toasts.map((t) => (
                <div key={t.id} className={`toast toast--${t.type}`}>
                    <span>{t.message}</span>
                    <button className="icon-button" onClick={() => dismissToast(t.id)} aria-label="Yopish">
                        <X size={16} />
                    </button>
                </div>
            ))}
        </div>
    )
}
