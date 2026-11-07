import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export default function Modal({ title, onClose, children, footer, size = 'md' }) {
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === 'Escape') onClose()
        }
        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
    }, [onClose])

    return createPortal(
        <div
            className="modal-overlay"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
        >
            <div className={`modal modal--${size}`} role="dialog" aria-modal="true" aria-label={title}>
                <header className="modal-header">
                    <h2 className="modal-title">{title}</h2>
                    <button type="button" className="icon-button" onClick={onClose} aria-label="Yopish">
                        <X size={18} />
                    </button>
                </header>
                <div className="modal-body">{children}</div>
                {footer && <footer className="modal-footer">{footer}</footer>}
            </div>
        </div>,
        document.body,
    )
}
