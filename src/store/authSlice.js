import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  authState: false,
  session: []
}

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthState: (state, action) => {
      state.authState = action.payload
    },
    setSession: (state, action) => {
      state.session = action.payload
    }
  }
})

export const { setAuthState, setSession } = authSlice.actions

export const selectAuthState = state => state.auth?.authState
export const selectSession = state => state.auth?.session

export default authSlice.reducer
