import { Navigate, Route, Routes } from 'react-router'
import Layout from './components/Layout.jsx'
import { PublicOnly, RequireAuth } from './components/RouteGuards.jsx'
import ContactPage from './pages/ContactPage.jsx'
import ContactsPage from './pages/ContactsPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import PipelinePage from './pages/PipelinePage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import SourcesPage from './pages/SourcesPage.jsx'

function App() {
    return (
        <Routes>
            <Route element={<PublicOnly/>}>
                <Route path="/login" element={<LoginPage/>}/>
                <Route path="/register" element={<RegisterPage/>}/>
            </Route>
            <Route element={<RequireAuth/>}>
                <Route element={<Layout/>}>
                    <Route index element={<Navigate to="/pipelines" replace/>}/>
                    <Route path="/pipelines" element={<PipelinePage/>}/>
                    <Route path="/pipelines/:pipelineId" element={<PipelinePage/>}/>
                    <Route path="/contacts" element={<ContactsPage/>}/>
                    <Route path="/contacts/:contactId" element={<ContactPage/>}/>
                    <Route path="/sources" element={<SourcesPage/>}/>
                    <Route path="/settings" element={<SettingsPage/>}/>
                    <Route path="*" element={<Navigate to="/pipelines" replace/>}/>
                </Route>
            </Route>
        </Routes>
    )
}

export default App
