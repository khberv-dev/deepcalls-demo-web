import { api } from './client.js'

/**
 * Upload a call recording for analysis.
 * @param {{ file: File, onUploadProgress?: (event: import('axios').AxiosProgressEvent) => void }} params
 */
export async function analyzeCall({ file, onUploadProgress }) {
    const formData = new FormData()
    formData.append('file', file)

    const { data } = await api.post('/calls/analyze', formData, { onUploadProgress })
    return data
}
