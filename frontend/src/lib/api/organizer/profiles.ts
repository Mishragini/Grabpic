import { AxiosError } from "axios"
import api from "../apiCall"

export const mergeProfiles = async (profiles_to_merge: string[], profile_to_merge_with: string) => {
    try {
        const api_response = await api.post("/api/organizer/profiles/duplicates/remove", {
            profile_id: profile_to_merge_with,
            duplicate_profile_ids: profiles_to_merge
        })
        return api_response.data
    } catch (error) {
        throw new Error(error instanceof AxiosError ? error.response?.data.detail : "Failed to merge profiles :(")

    }
}


export const fetchInconclusiveProfiles = async (event_id: string, page: number = 0, per_page: number = 10) => {
    try {
        const api_response = await api.get("/api/organizer/profiles/inconclusives", {
            params: {
                event_id,
                page,
                per_page
            }
        })

        return { data: api_response.data.data.face_crops, hasMore: api_response.data.data.hasMore }
    } catch (error) {
        throw new Error(error instanceof AxiosError ? error.response?.data.detail : "Failed to fetch inconclusive profiles :(")
    }
}


export const assignInconclusiveProfile = async (inconclusive_profile_id: string, profile_id?: string) => {
    try {
        const data = { face_crop_id: inconclusive_profile_id, ...(profile_id && { profile_id }) }

        const api_response = await api.post("/api/organizer/profiles/face-crops", data)

        return api_response.data
    } catch (error) {
        throw new Error(error instanceof AxiosError ? error.response?.data.detail : "Failed to fetch assign profile :(")
    }
}