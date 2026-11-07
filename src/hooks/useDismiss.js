import { useEffect } from 'react'

/**
 * Close a popover on a pointer-down outside `ref` or on Escape. Escape is caught in the capture phase and
 * stopped, so a popover inside a modal closes without closing the modal.
 */
export function useDismiss(ref, open, onClose) {
    useEffect(() => {
        if (!open) return undefined
        const onPointerDown = (e) => {
            if (!ref.current?.contains(e.target)) onClose()
        }
        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation()
                onClose()
            }
        }
        document.addEventListener('pointerdown', onPointerDown)
        document.addEventListener('keydown', onKeyDown, true)
        return () => {
            document.removeEventListener('pointerdown', onPointerDown)
            document.removeEventListener('keydown', onKeyDown, true)
        }
    }, [ref, open, onClose])
}
