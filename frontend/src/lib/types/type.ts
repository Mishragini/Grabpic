interface Profile {
    representative_crop_path: string;
    id: string;
    photo_url: string;
}

interface Photo {
    id: string,
    image_url: string
}

export type { Profile, Photo }