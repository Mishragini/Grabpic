import { AxiosError } from "axios"
import api from "../apiCall"

export const getSpaces = async (page: number, per_page: number) => {
    try {
        const api_response = await api.get("/api/organizer/spaces", {
            params: {
                page,
                per_page
            }
        })
        return api_response.data.data
    } catch (error) {
        throw new Error(error instanceof AxiosError ? error.response?.data?.detail : "Failed to fetch the events:(")
    }
}

export const createSpace = async (data: { name: string }) => {
    try {
        const api_response = await api.post("/api/organizer/spaces", data)
        return api_response.data
    } catch (error) {
        throw new Error(error instanceof AxiosError ? error.response?.data.detail : "Failed to create event :(")
    }
}

export const getSpaceById = async (event_id: string) => {
    try {
        const api_response = await api.get(`/api/organizer/spaces/${event_id}`)
        return api_response.data.data
    } catch (error) {
        throw new Error(error instanceof AxiosError ? error.response?.data?.detail : "Failed to fetch the event:(")

    }
}

export const deleteEvent = async (event_id: string) => {
    try {
        const api_response = await api.delete(`/api/organizer/spaces/${event_id}`)
        return api_response
    } catch (error) {
        throw new Error(error instanceof AxiosError ? error.response?.data?.detail : "Failed to delete the event:(")
    }
}