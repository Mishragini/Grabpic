import { AxiosError } from "axios"
import api from "./apiCall"
import type { Role } from "../types/type"

export const fetchEventProfiles = async (event_id: string, page: number = 0, per_page: number = 10, role: Role) => {
    try {
        const profile_response = await api.get(`/${role}/profiles/`, {
            params: {
                event_id,
                page,
                per_page
            }
        })
        return { profiles: profile_response.data?.data?.profiles, hasMore: profile_response.data?.data?.hasMore }
    } catch (error) {
        throw new Error(error instanceof AxiosError ? error.response?.data?.detail : "Failed to get profiles :(")
    }
}