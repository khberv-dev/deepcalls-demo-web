import { api } from './client.js'

/** @param {{ firstName: string, lastName?: string, email: string, password: string }} body */
export async function register(body) {
    const { data } = await api.post('/auth/register', body)
    return data // { accessToken, user }
}

/** @param {{ email: string, password: string }} body */
export async function login(body) {
    const { data } = await api.post('/auth/login', body)
    return data // { accessToken, user }
}
