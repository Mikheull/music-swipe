import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  sessionSaved: false,
  savedAppMode: null,
  savedTracklist: [],
  savedPassedTracks: [],
  savedSelectedTracks: [],
  savedSearchResultUsed: null,
  savedNumberOfPage: 0,
  savedTotal: 0,
  savedCurrentPage: 1,
  savedCurrentIndex: 0,
  savedNameOfPlaylist: 'My Custom Playlist',
}

export const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    setSessionSaved: (state, action) => {
      state.sessionSaved = action.payload
    },

    setSavedAppMode: (state, action) => {
      state.savedAppMode = action.payload
    },
    setSavedTracklist: (state, action) => {
      state.savedTracklist = action.payload
    },
    setSavedPassedTracks: (state, action) => {
      state.savedPassedTracks = action.payload
    },
    addSavedPassedTracksItem(state, action) {
      if(!state.savedPassedTracks.find((el) => el.uri == action.payload)){
        state.savedPassedTracks.push(action.payload)
      }
    },
    setSavedSelectedTracks: (state, action) => {
      state.savedSelectedTracks = action.payload
    },
    addSavedSelectedTracksItem(state, action) {
      if(!state.savedSelectedTracks.find((el) => el.id == action.payload.id)){
        state.savedSelectedTracks.push(action.payload)
      }
    },
    removeSavedSelectedTracksItem(state, action) {
      state.savedSelectedTracks.splice(action.payload, 1)
    },
    addSavedSelectedTracksItemAtFirst(state, action) {
      if(!state.savedSelectedTracks.find((el) => el.id == action.payload.id)){
        state.savedSelectedTracks.push(action.payload)
        state.savedSelectedTracks.unshift(state.savedSelectedTracks.pop())
      }
    },
    setSavedSearchResultUsed: (state, action) => {
      state.savedSearchResultUsed = action.payload
    },
    setSavedNumberOfPage: (state, action) => {
      state.savedNumberOfPage = action.payload
    },
    setSavedTotal: (state, action) => {
      state.savedTotal = action.payload
    },
    setSavedCurrentPage: (state, action) => {
      state.savedCurrentPage = action.payload
    },
    setSavedCurrentIndex: (state, action) => {
      state.savedCurrentIndex = action.payload
    },
    setSavedNameOfPlaylist: (state, action) => {
      state.savedNameOfPlaylist = action.payload
    }
  }
})

export const { setSessionSaved, setSavedAppMode, setSavedTracklist, setSavedPassedTracks, addSavedPassedTracksItem, setSavedSelectedTracks, addSavedSelectedTracksItem, removeSavedSelectedTracksItem, addSavedSelectedTracksItemAtFirst, setSavedSearchResultUsed, setSavedNumberOfPage, setSavedTotal, setSavedCurrentPage, setSavedCurrentIndex, setSavedNameOfPlaylist } = sessionSlice.actions

export const selectSessionSaved = state => state.session?.sessionSaved
export const selectSavedAppMode = state => state.session?.savedAppMode
export const selectSavedTracklist = state => state.session?.savedTracklist
export const selectSavedPassedTracks = state => state.session?.savedPassedTracks
export const selectSavedSelectedTracks = state => state.session?.savedSelectedTracks
export const selectSavedSearchResultUsed = state => state.session?.savedNameOfPlaylist
export const selectSavedNumberOfPage = state => state.session?.savedNumberOfPage
export const selectSavedTotal = state => state.session?.savedTotal
export const selectSavedCurrentPage = state => state.session?.savedCurrentPage
export const selectSavedCurrentIndex = state => state.session?.savedCurrentIndex
export const selectSavedNameOfPlaylist = state => state.session?.savedNameOfPlaylist

export default sessionSlice.reducer
