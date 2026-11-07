import { useState } from 'react'
import { Check, Lock, Minus, Pencil, Plus, Trash2 } from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import RoleModal from '../components/RoleModal.jsx'
import Spinner from '../components/Spinner.jsx'
import { getErrorMessage } from '../api/client.js'
import { usePermissions } from '../hooks/usePermissions.js'
import { useDeleteRole, useRoles } from '../hooks/useRoles.js'
import { PERMISSION_RESOURCES } from '../labels.js'
import { toastSuccess } from '../toast/toastStore.js'

function Flag({ on }) {
    return on ? (
        <Check size={15} className="flag flag--on" aria-label="ha" />
    ) : (
        <Minus size={15} className="flag" aria-label="yoʻq" />
    )
}

export default function RolesPage() {
    const { canWriteRole } = usePermissions()
    const { data: roles, isLoading, error } = useRoles()
    const deleteRole = useDeleteRole()
    const [modal, setModal] = useState(null) // { type: 'edit', role? } | { type: 'delete', role }

    const close = () => {
        deleteRole.reset()
        setModal(null)
    }

    return (
        <div className="page">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Rollar</h1>
                    <p className="muted">
                        Rol boshqa foydalanuvchilarning yozuvlariga kirishni beradi. Tahrirlash ruxsati koʻrishni ham oʻz
                        ichiga oladi.
                    </p>
                </div>
                {canWriteRole && (
                    <button className="button" onClick={() => setModal({ type: 'edit' })}>
                        <Plus size={16} /> Yangi rol
                    </button>
                )}
            </header>

            {isLoading ? (
                <Spinner />
            ) : error ? (
                <p className="error">{getErrorMessage(error)}</p>
            ) : (
                <div className="table-wrap">
                    <table className="table">
                        <thead>
                            <tr>
                                <th rowSpan={2}>Rol</th>
                                {PERMISSION_RESOURCES.map(({ key, label }) => (
                                    <th key={key} colSpan={2} className="th-group">
                                        {label}
                                    </th>
                                ))}
                                {canWriteRole && <th rowSpan={2} />}
                            </tr>
                            <tr>
                                {PERMISSION_RESOURCES.map(({ key }) => [
                                    <th key={`${key}-r`} className="th-sub">
                                        Koʻrish
                                    </th>,
                                    <th key={`${key}-w`} className="th-sub">
                                        Tahrir
                                    </th>,
                                ])}
                            </tr>
                        </thead>
                        <tbody>
                            {roles.map((role) => (
                                <tr key={role.id}>
                                    <td>
                                        <span className="inline-icon strong-plain">
                                            {role.isSystem && <Lock size={13} className="muted" />} {role.name}
                                        </span>
                                    </td>
                                    {PERMISSION_RESOURCES.map(({ key }) => [
                                        <td key={`${key}-r`} className="td-flag">
                                            <Flag on={role[`canRead${key}`] || role[`canWrite${key}`]} />
                                        </td>,
                                        <td key={`${key}-w`} className="td-flag">
                                            <Flag on={role[`canWrite${key}`]} />
                                        </td>,
                                    ])}
                                    {canWriteRole && (
                                        <td className="row-actions">
                                            {role.isSystem ? (
                                                <span className="muted small">Tizim roli</span>
                                            ) : (
                                                <>
                                                    <button
                                                        className="icon-button"
                                                        title="Tahrirlash"
                                                        onClick={() => setModal({ type: 'edit', role })}
                                                    >
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button
                                                        className="icon-button"
                                                        title="Oʻchirish"
                                                        onClick={() => setModal({ type: 'delete', role })}
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {modal?.type === 'edit' && <RoleModal key={modal.role?.id ?? 'new'} role={modal.role} onClose={close} />}
            {modal?.type === 'delete' && (
                <ConfirmDialog
                    title="Rolni oʻchirish"
                    message={`“${modal.role.name}” roli oʻchiriladi. Agar bu rol foydalanuvchilarga berilgan boʻlsa, avval ularga boshqa rol bering.`}
                    isPending={deleteRole.isPending}
                    error={deleteRole.error}
                    onClose={close}
                    onConfirm={() =>
                        deleteRole.mutate(modal.role.id, {
                            onSuccess: () => {
                                toastSuccess('Rol oʻchirildi')
                                close()
                            },
                        })
                    }
                />
            )}
        </div>
    )
}
