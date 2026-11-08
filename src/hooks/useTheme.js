import { useSyncExternalStore } from 'react'
import { getTheme, setTheme, subscribeTheme } from '../theme/themeStore.js'

/** [theme, setTheme] where theme is 'light' | 'dark'. */
export function useTheme() {
    return [useSyncExternalStore(subscribeTheme, getTheme), setTheme]
}
