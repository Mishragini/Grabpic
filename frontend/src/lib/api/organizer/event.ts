import { AxiosError } from "axios";
import { uploadPhotos } from "./photos";
import { createSpace } from "./space";

export const createEvent = async ({ name, photos }: {
    name: string;
    photos: File[];
}) => {
    try {
        const space_response = await createSpace({ name })
        const event_id = space_response.id
        const upload_response = await uploadPhotos(photos, event_id)
        console.log("upload response...", upload_response)
        return { task_id: upload_response.task_id, event_id }
    } catch (error) {
        throw new Error(error instanceof AxiosError ? error.response?.data.detail : error instanceof Error ? error.message : "Failed to create Event :(")
    }
}