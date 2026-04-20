import { AxiosError } from "axios"
import api from "../apiCall"

export const matchSelfie = async (photo_url: string, event_id: string) => {
    try {
        // Convert base64 data URL to a Blob
        const url_res = await fetch(photo_url)
        const blob = await url_res.blob()

        //wrap the blob in a file 
        const file = new File([blob], "selfie.png", { type: "image/png" })

        const form_data = new FormData()
        form_data.append("photo", file)
        form_data.append("event_id", event_id)

        const api_response = await api.post("/attendee/profiles/match-selfie", form_data)
        return api_response.data?.data
    } catch (error) {
        throw new Error(error instanceof AxiosError ? error.response?.data?.detail : "Failed to fetch matching profile")
    }
}