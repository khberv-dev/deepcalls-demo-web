import { AudioLines } from 'lucide-react'

export default function Brand() {
    return (
        <div className="brand">
            <span className="brand-mark" aria-hidden="true">
                <AudioLines size={16} strokeWidth={2.5} />
            </span>
            <span className="brand-name">DeepCalls</span>
        </div>
    )
}
