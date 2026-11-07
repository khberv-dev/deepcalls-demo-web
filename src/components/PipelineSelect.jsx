import { useCallback, useRef, useState } from 'react'
import { Check, ChevronDown, Kanban, Settings2 } from 'lucide-react'
import { useDismiss } from '../hooks/useDismiss.js'

const leadCount = (pipeline) => pipeline.stages.reduce((sum, s) => sum + (s.contactsCount ?? 0), 0)

/** Pipeline dropdown for the board, with a "manage pipelines" action at the end of the options. */
export default function PipelineSelect({ pipelines, value, onChange, onManage }) {
    const [open, setOpen] = useState(false)
    const rootRef = useRef(null)
    const close = useCallback(() => setOpen(false), [])
    useDismiss(rootRef, open, close)

    const current = pipelines.find((p) => p.id === value)

    return (
        <div className="select-menu" ref={rootRef}>
            <button
                type="button"
                className="select-trigger"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <Kanban size={15} className="select-trigger-icon" aria-hidden="true" />
                <span className="select-trigger-label">{current?.name ?? 'Voronka'}</span>
                <ChevronDown size={15} className="select-trigger-chevron" aria-hidden="true" />
            </button>
            {open && (
                <div className="select-popover">
                    <span className="select-group-label">Voronkalar</span>
                    <ul className="select-options" role="listbox">
                        {pipelines.map((p) => (
                            <li key={p.id}>
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={p.id === value}
                                    className={`select-option${p.id === value ? ' select-option--active' : ''}`}
                                    onClick={() => {
                                        onChange(p.id)
                                        close()
                                    }}
                                >
                                    <span className="select-option-label">{p.name}</span>
                                    <span className="select-option-meta">{leadCount(p)}</span>
                                    <Check size={15} className="select-option-check" aria-hidden="true" />
                                </button>
                            </li>
                        ))}
                    </ul>
                    <div className="select-footer">
                        <button
                            type="button"
                            className="select-option"
                            onClick={() => {
                                close()
                                onManage()
                            }}
                        >
                            <Settings2 size={15} aria-hidden="true" />
                            <span className="select-option-label">Voronkalarni boshqarish</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
