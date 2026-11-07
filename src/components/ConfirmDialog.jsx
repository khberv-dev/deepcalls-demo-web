import Modal from './Modal.jsx'
import { getErrorMessage } from '../api/client.js'

/** Confirmation for destructive actions. `error` is the mutation error (e.g. a 409 explaining why delete is blocked). */
export default function ConfirmDialog({
    title,
    message,
    confirmLabel = 'Oʻchirish',
    onConfirm,
    onClose,
    isPending = false,
    error = null,
}) {
    return (
        <Modal
            title={title}
            onClose={onClose}
            size="sm"
            footer={
                <>
                    <button type="button" className="button button--ghost" onClick={onClose}>
                        Bekor qilish
                    </button>
                    <button type="button" className="button button--danger" onClick={onConfirm} disabled={isPending}>
                        {isPending ? 'Kuting…' : confirmLabel}
                    </button>
                </>
            }
        >
            <p>{message}</p>
            {error && <p className="error">{getErrorMessage(error)}</p>}
        </Modal>
    )
}
