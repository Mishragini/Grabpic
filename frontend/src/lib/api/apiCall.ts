import { getRouter } from '#/router'
import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true
})

api.interceptors.response.use(
    res => res,
    err => {
        if (err.response?.status === 401) {
            const router = getRouter()
            router.navigate({ to: "/login" })
        }
        return Promise.reject(err)
    }
)

export default api