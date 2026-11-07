import { useSyncExternalStore } from 'react'
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'
import { dismissToast, getToasts, subscribeToasts } from '../toast/toastStore.js'

const ICONS = { success: CircleCheck, error: CircleAlert, info: Info }

export default function Toaster() {
    const toasts = useSyncExternalStore(subscribeToasts, getToasts)
    return (
        <div className="toaster" role="status" aria-live="polite">
            {toasts.map((t) => {
                const Icon = ICONS[t.type] ?? Info
                return (
                    <div key={t.id} className={`toast toast--${t.type}`}>
                        <Icon size={16} className="toast-icon" aria-hidden="true" />
                        <span className="toast-message">{t.message}</span>
                        <button className="toast-close" onClick={() => dismissToast(t.id)} aria-label="Yopish">
                            <X size={14} />
                        </button>
                    </div>
                )
            })}
        </div>
    )
}
