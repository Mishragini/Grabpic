import { AxiosError } from "axios"
import api from "../apiCall"

export const fetchProfilePhotos = async (profile_id: string, page: number, per_page: number) => {
    try {
        const api_response = await api.get("/attendee/photos/", {
            params: {
                profile_id,
                page,
                per_page
            }
        })
        return { data: api_response.data?.data?.photos, hasMore: api_response.data?.data?.hasMore }
    } catch (error) {
        throw new Error(error instanceof AxiosError ? error.response?.data?.detail : "Failed to fetch photos for the event :(")
    }
}