import { AxiosError } from "axios"
import api from "./apiCall"

export const fetchEventProfiles = async (event_id: string, page: number, per_page: number) => {
    try {
        const profile_response = await api.get("/api/profiles", {
            params: {
                event_id,
                page,
                per_page
            }
        })
        return profile_response.data
    } catch (error) {
        throw new Error(error instanceof AxiosError ? error.response?.data.detail : "Failed to get profiles :(")
    }
}