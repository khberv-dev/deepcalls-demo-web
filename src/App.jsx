import { useState } from 'react'
import UploadCard from './components/UploadCard.jsx'
import AnalysisResult from './components/AnalysisResult.jsx'

function App() {
    const [result, setResult] = useState(null)

    return (
        <main className="container">
            <h1 className="page-title">DeepCalls</h1>
            <UploadCard onResult={setResult}/>
            {result && <AnalysisResult data={result}/>}
        </main>
    )
}

export default App
