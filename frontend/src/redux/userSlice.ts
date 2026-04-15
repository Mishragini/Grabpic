import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "./store";
import type { Role } from "#/lib/types/type";

interface UserValue {
    user_id: string
    role: Role,
    username: string,
    avatar_url: string
}

interface UserState {
    value: UserValue | null
}

const initialState: UserState = {
    value: null
}
export const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        updateUser: (state, action) => {
            let { user_id, role, username, avatar_url } = action.payload
            state.value = {
                user_id,
                role,
                username,
                avatar_url
            }
        },
        clearUser: (state) => {
            state.value = null
        }
    }
})

export const { updateUser, clearUser } = userSlice.actions

export const selectUser = (state: RootState) => state.user.value

export default userSlice.reducer

