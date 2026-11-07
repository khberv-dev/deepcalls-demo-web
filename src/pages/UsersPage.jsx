import { useState } from 'react'
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import Spinner from '../components/Spinner.jsx'
import UserModal from '../components/UserModal.jsx'
import { getErrorMessage } from '../api/client.js'
import { useDebouncedValue } from '../hooks/useDebouncedValue.js'
import { usePermissions } from '../hooks/usePermissions.js'
import { useRoles } from '../hooks/useRoles.js'
import { useDeleteUser, useUsers } from '../hooks/useUsers.js'
import { toastSuccess } from '../toast/toastStore.js'
import { formatDate, fullName, initials } from '../utils/format.js'

const LIMIT = 20

export default function UsersPage() {
    const { userId, canWriteUser, canReadRole } = usePermissions()
    const [search, setSearch] = useState('')
    const [roleId, setRoleId] = useState('')
    const [page, setPage] = useState(1)
    const debouncedSearch = useDebouncedValue(search.trim(), 350)
    const [modal, setModal] = useState(null) // { type: 'edit', user? } | { type: 'delete', user }

    const { data: roles = [] } = useRoles({ enabled: canReadRole })
    const { data, isLoading, isFetching, error } = useUsers({ search: debouncedSearch, roleId, page, limit: LIMIT })
    const deleteUser = useDeleteUser()
    const totalPages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1

    const close = () => {
        deleteUser.reset()
        setModal(null)
    }

    return (
        <div className="page">
            <header className="page-header">
                <h1 className="page-title">
                    Foydalanuvchilar {data && <span className="muted">({data.total})</span>}
                </h1>
                {canWriteUser && (
                    <button className="button" onClick={() => setModal({ type: 'edit' })}>
                        <Plus size={16} /> Yangi foydalanuvchi
                    </button>
                )}
            </header>

            <div className="filters">
                <label className="search">
                    <Search size={16} aria-hidden="true" />
                    <input
                        className="input"
                        type="search"
                        placeholder="Ism yoki email boʻyicha qidirish"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                            setPage(1)
                        }}
                    />
                </label>
                {canReadRole && (
                    <select
                        className="input"
                        value={roleId}
                        onChange={(e) => {
                            setRoleId(e.target.value)
                            setPage(1)
                        }}
                    >
                        <option value="">Barcha rollar</option>
                        {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                                {role.name}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {isLoading ? (
                <Spinner />
            ) : error ? (
                <p className="error">{getErrorMessage(error)}</p>
            ) : !data.items.length ? (
                <div className="empty-state">
                    <p className="muted">Hech narsa topilmadi</p>
                </div>
            ) : (
                <div className={`table-wrap${isFetching ? ' is-fetching' : ''}`}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Ism</th>
                                <th>Email</th>
                                <th>Rol</th>
                                <th>Qoʻshilgan</th>
                                {canWriteUser && <th />}
                            </tr>
                        </thead>
                        <tbody>
                            {data.items.map((user) => (
                                <tr key={user.id}>
                                    <td>
                                        <div className="name-cell">
                                            <span className="avatar avatar--sm">{initials(user)}</span>
                                            <span className="strong-plain">
                                                {fullName(user)}
                                                {user.id === userId && <span className="muted small"> (siz)</span>}
                                            </span>
                                        </div>
                                    </td>
                                    <td>{user.email}</td>
                                    <td>
                                        {user.role ? (
                                            <span className={`badge${user.role.isSystem ? ' badge--system' : ''}`}>
                                                {user.role.name}
                                            </span>
                                        ) : (
                                            <span className="muted">Rolsiz</span>
                                        )}
                                    </td>
                                    <td className="muted">{formatDate(user.createdAt)}</td>
                                    {canWriteUser && (
                                        <td className="row-actions">
                                            <button
                                                className="icon-button"
                                                title="Tahrirlash"
                                                onClick={() => setModal({ type: 'edit', user })}
                                            >
                                                <Pencil size={15} />
                                            </button>
                                            <button
                                                className="icon-button"
                                                title={user.id === userId ? 'Oʻzingizni oʻchira olmaysiz' : 'Oʻchirish'}
                                                disabled={user.id === userId}
                                                onClick={() => setModal({ type: 'delete', user })}
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {data && data.total > LIMIT && (
                <div className="pagination">
                    <button className="button button--ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                        <ChevronLeft size={16} /> Oldingi
                    </button>
                    <span className="muted">
                        {page} / {totalPages}
                    </span>
                    <button
                        className="button button--ghost"
                        disabled={page >= totalPages}
                        onClick={() => setPage(page + 1)}
                    >
                        Keyingi <ChevronRight size={16} />
                    </button>
                </div>
            )}

            {modal?.type === 'edit' && <UserModal key={modal.user?.id ?? 'new'} user={modal.user} onClose={close} />}
            {modal?.type === 'delete' && (
                <ConfirmDialog
                    title="Foydalanuvchini oʻchirish"
                    message={`${fullName(modal.user)} (${modal.user.email}) va unga tegishli hamma narsa — lidlar, qoʻngʻiroqlar, yozuvlar, izohlar, voronkalar va manbalar — butunlay oʻchiriladi. Bu amalni qaytarib boʻlmaydi.`}
                    confirmLabel="Butunlay oʻchirish"
                    isPending={deleteUser.isPending}
                    error={deleteUser.error}
                    onClose={close}
                    onConfirm={() =>
                        deleteUser.mutate(modal.user.id, {
                            onSuccess: () => {
                                toastSuccess('Foydalanuvchi oʻchirildi')
                                close()
                            },
                        })
                    }
                />
            )}
        </div>
    )
}
