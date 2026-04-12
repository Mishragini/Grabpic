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
        return { profiles: profile_response.data.data, hasMore: profile_response.data.hasMore }
    } catch (error) {
        throw new Error(error instanceof AxiosError ? error.response?.data.detail : "Failed to get profiles :(")
    }
}

export const mergeProfiles = async (profiles_to_merge: string[], profile_to_merge_with: string) => {
    try {
        const api_response = await api.post("/api/profiles/duplicates/remove", {
            profile_id: profile_to_merge_with,
            duplicate_profile_ids: profiles_to_merge
        })
        return api_response.data
    } catch (error) {
        throw new Error(error instanceof AxiosError ? error.response?.data.detail : "Failed to merge profiles :(")

    }
}