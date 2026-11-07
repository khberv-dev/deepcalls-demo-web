import { useState } from 'react'
import { Link } from 'react-router'
import { getErrorMessage } from '../api/client.js'
import { useRegister } from '../hooks/useAuth.js'

export default function RegisterPage() {
    const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
    const register = useRegister()
    const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

    const handleSubmit = (e) => {
        e.preventDefault()
        const body = { firstName: form.firstName.trim(), email: form.email.trim(), password: form.password }
        if (form.lastName.trim()) body.lastName = form.lastName.trim()
        register.mutate(body) // on success <PublicOnly/> redirects into the app
    }

    return (
        <div className="auth-page">
            <form className="card auth-card" onSubmit={handleSubmit}>
                <div className="brand">DeepCalls</div>
                <h1 className="card-title">Roʻyxatdan oʻtish</h1>
                <div className="grid-2">
                    <label className="field">
                        <span className="field-label">Ism *</span>
                        <input
                            className="input"
                            value={form.firstName}
                            onChange={set('firstName')}
                            autoComplete="given-name"
                            required
                            maxLength={100}
                            autoFocus
                        />
                    </label>
                    <label className="field">
                        <span className="field-label">Familiya</span>
                        <input
                            className="input"
                            value={form.lastName}
                            onChange={set('lastName')}
                            autoComplete="family-name"
                            maxLength={100}
                        />
                    </label>
                </div>
                <label className="field">
                    <span className="field-label">Email *</span>
                    <input
                        className="input"
                        type="email"
                        value={form.email}
                        onChange={set('email')}
                        autoComplete="email"
                        required
                        maxLength={254}
                    />
                </label>
                <label className="field">
                    <span className="field-label">Parol *</span>
                    <input
                        className="input"
                        type="password"
                        value={form.password}
                        onChange={set('password')}
                        autoComplete="new-password"
                        required
                        minLength={8}
                        maxLength={128}
                    />
                    <span className="muted small">Kamida 8 ta belgi</span>
                </label>
                {register.isError && <p className="error">{getErrorMessage(register.error)}</p>}
                <button className="button button--block" type="submit" disabled={register.isPending}>
                    {register.isPending ? 'Yaratilmoqda…' : 'Hisob yaratish'}
                </button>
                <p className="muted small center">
                    Hisobingiz bormi? <Link to="/login">Kirish</Link>
                </p>
            </form>
        </div>
    )
}
