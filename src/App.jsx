import { Navigate, Route, Routes, useParams } from 'react-router'
import Layout from './components/Layout.jsx'
import { PublicOnly, RequireAuth, RequirePermission } from './components/RouteGuards.jsx'
import ContactPage from './pages/ContactPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import LeadsPage from './pages/LeadsPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import RolesPage from './pages/RolesPage.jsx'
import SourcesPage from './pages/SourcesPage.jsx'
import UsersPage from './pages/UsersPage.jsx'

/** Old /contacts/:id links → /leads/:id */
function ContactRedirect() {
    const { contactId } = useParams()
    return <Navigate to={`/leads/${contactId}`} replace/>
}

function App() {
    return (
        <Routes>
            <Route element={<PublicOnly/>}>
                <Route path="/login" element={<LoginPage/>}/>
                <Route path="/register" element={<RegisterPage/>}/>
            </Route>
            <Route element={<RequireAuth/>}>
                <Route element={<Layout/>}>
                    <Route index element={<Navigate to="/leads" replace/>}/>
                    <Route path="/leads" element={<LeadsPage/>}/>
                    <Route path="/leads/:contactId" element={<ContactPage/>}/>
                    {/* Old URLs from before pipelines and contacts were merged into leads */}
                    <Route path="/pipelines/*" element={<Navigate to="/leads?view=board" replace/>}/>
                    <Route path="/contacts" element={<Navigate to="/leads?view=list" replace/>}/>
                    <Route path="/contacts/:contactId" element={<ContactRedirect/>}/>
                    <Route path="/sources" element={<SourcesPage/>}/>
                    <Route element={<RequirePermission permission="canReadUser"/>}>
                        <Route path="/users" element={<UsersPage/>}/>
                    </Route>
                    <Route element={<RequirePermission permission="canReadRole"/>}>
                        <Route path="/roles" element={<RolesPage/>}/>
                    </Route>
                    <Route path="*" element={<Navigate to="/leads" replace/>}/>
                </Route>
            </Route>
        </Routes>
    )
}

export default App
