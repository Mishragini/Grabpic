interface Profile {
    representative_crop_path: string;
    id: string;
    photo_url: string;
}

interface Photo {
    id: string,
    photo_url: string
}

export enum Role {
    organizer = "organizer",
    attendee = "attendee"
}

interface Event {
    id: string;
    invite_code: string;
    name: string;
}

export type { Profile, Photo, Event }