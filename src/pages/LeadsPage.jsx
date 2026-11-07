import { useSearchParams } from 'react-router'
import { Kanban, List } from 'lucide-react'
import LeadsBoard from '../components/LeadsBoard.jsx'
import LeadsList from '../components/LeadsList.jsx'

const VIEW_KEY = 'deepcalls.leadsView'
const VIEWS = [
    { value: 'board', label: 'Kanban', icon: Kanban },
    { value: 'list', label: 'Roʻyxat', icon: List },
]

function readStoredView() {
    try {
        return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'board'
    } catch {
        return 'board'
    }
}

/**
 * Leads (contacts) as a kanban board or a list. The view is the `view` search param, falling back to the
 * last view used in this browser. `pipelineId` carries over between views.
 */
export default function LeadsPage() {
    const [searchParams, setSearchParams] = useSearchParams()
    const param = searchParams.get('view')
    const view = param === 'list' || param === 'board' ? param : readStoredView()

    const setView = (next) => {
        try {
            localStorage.setItem(VIEW_KEY, next)
        } catch {
            // the URL still carries the view
        }
        const params = new URLSearchParams({ view: next })
        const pipelineId = searchParams.get('pipelineId')
        if (pipelineId) params.set('pipelineId', pipelineId)
        setSearchParams(params)
    }

    const heading = (
        <div className="page-heading">
            <h1 className="page-title">Lidlar</h1>
            <div className="view-toggle" role="tablist" aria-label="Koʻrinish">
                {VIEWS.map(({ value, label, icon: Icon }) => (
                    <button
                        key={value}
                        type="button"
                        role="tab"
                        aria-selected={view === value}
                        className={`view-toggle-option${view === value ? ' view-toggle-option--active' : ''}`}
                        onClick={() => setView(value)}
                    >
                        <Icon size={15} aria-hidden="true" /> {label}
                    </button>
                ))}
            </div>
        </div>
    )

    return view === 'list' ? <LeadsList heading={heading} /> : <LeadsBoard heading={heading} />
}
