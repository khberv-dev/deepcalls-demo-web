import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { getErrorMessage } from '../api/client.js'
import { useLogin } from '../hooks/useAuth.js'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const login = useLogin()
    const location = useLocation()

    const handleSubmit = (e) => {
        e.preventDefault()
        // On success the token is stored and <PublicOnly/> redirects.
        login.mutate({ email: email.trim(), password })
    }

    return (
        <div className="auth-page">
            <form className="card auth-card" onSubmit={handleSubmit}>
                <div className="brand">DeepCalls</div>
                <h1 className="card-title">Tizimga kirish</h1>
                <label className="field">
                    <span className="field-label">Email</span>
                    <input
                        className="input"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                        autoFocus
                    />
                </label>
                <label className="field">
                    <span className="field-label">Parol</span>
                    <input
                        className="input"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                    />
                </label>
                {login.isError && <p className="error">{getErrorMessage(login.error)}</p>}
                <button className="button button--block" type="submit" disabled={login.isPending}>
                    {login.isPending ? 'Kirilmoqda…' : 'Kirish'}
                </button>
                <p className="muted small center">
                    Hisobingiz yoʻqmi? <Link to="/register" state={location.state}>Roʻyxatdan oʻtish</Link>
                </p>
            </form>
        </div>
    )
}
