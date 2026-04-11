import { AxiosError } from "axios";
import { uploadPhotos } from "./photos";
import { createSpace } from "./space";

export const createEvent = async ({ name, photos }: {
    name: string;
    photos: File[];
}) => {
    try {
        const space_response = await createSpace({ name })
        const event_id = space_response.data.id
        const upload_response = await uploadPhotos(photos, event_id)
        return upload_response
    } catch (error) {
        throw new Error(error instanceof AxiosError ? error.response?.data.detail : error instanceof Error ? error.message : "Failed to create Event :(")
    }
}