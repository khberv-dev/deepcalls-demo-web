import { LoaderCircle } from 'lucide-react'

export default function Spinner({ label = 'Yuklanmoqda…' }) {
    return (
        <div className="spinner">
            <LoaderCircle className="spin" size={20} aria-hidden="true" />
            <span>{label}</span>
        </div>
    )
}
