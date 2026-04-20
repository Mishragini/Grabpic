import { AxiosError } from "axios";
import api from "./apiCall";

export const fetchUser = async () => {
    try {
        const api_response = await api.get("/auth/me")
        return api_response.data.data.user
    } catch (error) {
        throw new Error(error instanceof AxiosError ? error.response?.data?.detail : "Error while fetching user :(");
    }

}


export const signup = async (data: FormData) => {
    try {
        const api_response = await api.post("/auth/signup",
            data,
            {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            }
        )
        return api_response.data
    } catch (error) {
        throw new Error(error instanceof AxiosError ? error.response?.data?.detail : "Signup Failed :(");
    }

}

export const login = async (data: { username: string, password: string }) => {
    try {
        const response = await api.post("/auth/login", data)
        return response.data.data
    } catch (error) {
        throw new Error(error instanceof AxiosError ? error.response?.data?.detail : "Failed to login :(")
    }
}

export const logout = async () => {
    try {
        const response = await api.get("/auth/logout")
        return response.data
    } catch (error) {
        throw new Error(error instanceof AxiosError ? error.response?.data?.detail : "Failed to logout :(")
    }
}