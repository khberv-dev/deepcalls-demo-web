import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import {
    COUNTRIES,
    DEFAULT_COUNTRY,
    detectCountry,
    flagEmoji,
    formatNational,
    isValidPhone,
    maxNationalLength,
    onlyDigits,
} from '../utils/phone.js'

function CountryPicker({ country, onSelect }) {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const rootRef = useRef(null)

    useEffect(() => {
        if (!open) return undefined
        const onPointerDown = (e) => {
            if (!rootRef.current?.contains(e.target)) setOpen(false)
        }
        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation() // don't close the surrounding modal
                setOpen(false)
            }
        }
        document.addEventListener('pointerdown', onPointerDown)
        document.addEventListener('keydown', onKeyDown, true)
        return () => {
            document.removeEventListener('pointerdown', onPointerDown)
            document.removeEventListener('keydown', onKeyDown, true)
        }
    }, [open])

    const q = query.trim().toLowerCase().replace(/^\+/, '')
    const filtered = q
        ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.dial.startsWith(q) || c.iso.toLowerCase() === q)
        : COUNTRIES

    const choose = (c) => {
        onSelect(c)
        setOpen(false)
        setQuery('')
    }

    return (
        <div className="country-picker" ref={rootRef}>
            <button
                type="button"
                className="country-button"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={open}
                title={country.name}
            >
                <span className="flag" aria-hidden="true">
                    {flagEmoji(country.iso)}
                </span>
                <span className="dial">+{country.dial}</span>
                <ChevronDown size={14} aria-hidden="true" />
            </button>
            {open && (
                <div className="country-popover">
                    <label className="country-search">
                        <Search size={14} aria-hidden="true" />
                        <input
                            autoFocus
                            value={query}
                            placeholder="Davlat yoki kod"
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault()
                                    if (filtered[0]) choose(filtered[0])
                                }
                            }}
                        />
                    </label>
                    <ul className="country-list" role="listbox">
                        {filtered.map((c) => (
                            <li key={c.iso}>
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={c.iso === country.iso}
                                    className={`country-option${c.iso === country.iso ? ' country-option--active' : ''}`}
                                    onClick={() => choose(c)}
                                >
                                    <span className="flag" aria-hidden="true">
                                        {flagEmoji(c.iso)}
                                    </span>
                                    <span className="country-name">{c.name}</span>
                                    <span className="muted">+{c.dial}</span>
                                </button>
                            </li>
                        ))}
                        {!filtered.length && <li className="country-empty">Topilmadi</li>}
                    </ul>
                </div>
            )}
        </div>
    )
}

/**
 * Phone number with a country picker (Uzbekistan by default).
 * `value` / `onChange` use the server's format: digits only, with the country code ("998901234567"),
 * or '' when the national part is empty.
 */
export default function PhoneInput({ value, onChange, autoFocus }) {
    const [picked, setPicked] = useState(() => detectCountry(value) ?? DEFAULT_COUNTRY)
    const digits = onlyDigits(value)
    // Trust the picked country while the value starts with its code (+7 is shared by RU and KZ);
    // otherwise (e.g. the row's value was replaced) detect it from the digits.
    const country = !digits || digits.startsWith(picked.dial) ? picked : (detectCountry(digits) ?? picked)
    const national = digits.startsWith(country.dial) ? digits.slice(country.dial.length) : digits
    const incomplete = digits && !isValidPhone(digits)

    const emit = (c, nationalDigits) => onChange(nationalDigits ? c.dial + nationalDigits : '')

    const handleInput = (e) => {
        const raw = e.target.value
        // A pasted international number ("+998 90 …", "00998…") switches the country.
        if (/^\s*(\+|00)/.test(raw)) {
            const full = onlyDigits(raw).replace(/^00/, '')
            const detected = detectCountry(full)
            if (detected) {
                setPicked(detected)
                emit(detected, full.slice(detected.dial.length).slice(0, maxNationalLength(detected)))
                return
            }
        }
        emit(country, onlyDigits(raw).slice(0, maxNationalLength(country)))
    }

    return (
        <div className={`phone-input${incomplete ? ' phone-input--invalid' : ''}`}>
            <CountryPicker
                country={country}
                onSelect={(c) => {
                    setPicked(c)
                    emit(c, national.slice(0, maxNationalLength(c)))
                }}
            />
            <input
                className="phone-number"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                value={formatNational(country, national)}
                placeholder={country.mask.replace(/#/g, '0')}
                onChange={handleInput}
                autoFocus={autoFocus}
            />
        </div>
    )
}
