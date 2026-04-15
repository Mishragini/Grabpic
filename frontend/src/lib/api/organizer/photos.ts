import { AxiosError } from "axios"
import api from "../apiCall"

export const uploadPhotos = async (photos: File[], event_id: string) => {
    try {
        const form_data = new FormData()
        form_data.append("event_id", event_id)
        photos.forEach(photo => form_data.append("photos", photo))
        const api_response = await api.post("/api/organizer/photos/upload", form_data, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        })
        return api_response.data
    } catch (error) {
        throw new Error(error instanceof AxiosError ? error.response?.data.detail : "Failed to upload photos :(")
    }
}

export const fetchEventPhotos = async (event_id: string, page: number, per_page: number) => {
    try {
        const api_response = await api.get("/api/organizer/photos", {
            params: {
                event_id,
                page,
                per_page
            }
        })
        return { data: api_response.data.data, hasMore: api_response.data.hasMore }
    } catch (error) {
        throw new Error(error instanceof AxiosError ? error.response?.data.detail : "Failed to fetch photos for the event :(")
    }
}