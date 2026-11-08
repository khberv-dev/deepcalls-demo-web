import {createRoot} from 'react-dom/client'
import {QueryClientProvider} from '@tanstack/react-query'
import {BrowserRouter} from 'react-router'
import './index.css'
import './theme/themeStore.js'
import App from './App.jsx'
import Toaster from './components/Toaster.jsx'
import {queryClient} from './queryClient.js'

const root = createRoot(document.getElementById('root'))

root.render(
    <QueryClientProvider client={queryClient}>
        <BrowserRouter>
            <App/>
            <Toaster/>
        </BrowserRouter>
    </QueryClientProvider>
)
