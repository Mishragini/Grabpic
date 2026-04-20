import { AxiosError } from "axios"
import api from "../apiCall"

export const fetchEventByInviteCode = async (invite_code: string) => {
    try {
        const api_response = await api.get("/attendee/spaces/", {
            params: {
                invite_code
            }
        })
        return api_response.data.data.event
    } catch (error) {
        throw new Error(error instanceof AxiosError ? error.response?.data.detail : "Failed to get event :(")

    }
}

export const getSpaceById = async (event_id: string) => {
    try {
        const api_response = await api.get(`/attendee/spaces/${event_id}`)
        return api_response.data.data.event
    } catch (error) {
        throw new Error(error instanceof AxiosError ? error.response?.data?.detail : "Failed to fetch the event:(")

    }
}