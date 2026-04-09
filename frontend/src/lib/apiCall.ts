import { getRouter } from '#/router'
import axios, { AxiosError } from 'axios'

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

export const fetchUser = async () => {
    try {
        const api_response = await api.get("api/auth/me")
        return api_response.data
    } catch (error) {
        throw new Error(error instanceof AxiosError ? error.response?.data?.detail : "Error while fetching user!");
    }

}


export const signup = async (data: FormData) => {
    try {
        const api_response = await api.post("api/auth/signup",
            data,
            {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            }
        )
        return api_response.data
    } catch (error) {
        throw new Error(error instanceof AxiosError ? error.response?.data?.detail : "Signup Failed!");
    }

}

export const login = async (data: { username: string, password: string }) => {
    try {
        const response = await api.post("/api/auth/login", data)
        return response.data
    } catch (error) {
        throw new Error(error instanceof AxiosError ? error.message : "Failed to login")
    }
}

export const logout = async () => {
    try {
        const response = await api.get("/api/auth/logout")
        return response.data
    } catch (error) {
        throw new Error(error instanceof AxiosError ? error.message : "Failed to logout!")
    }
}

export default api