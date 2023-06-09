import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  isStarted: false,
  isFinish: false,
  isPlaying: false,
  appMode: null,
  preTracks: [],
  trackslist: [],
  passedTracks: [],
  selectedTracks: [],
  searchResult: [],
  searchResultUsed: null,
  numberOfPage: 0,
  total: 0,
  currentPage: 1,
  currentIndex: 0,
  nameOfPlaylist: "My Custom Playlist"
}

export const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setIsStarted: (state, action) => {
      state.isStarted = action.payload
    },
    setIsFinish: (state, action) => {
      state.isFinish = action.payload
    },
    setIsPlaying: (state, action) => {
      state.isPlaying = action.payload
    },
    setAppMode: (state, action) => {
      state.appMode = action.payload
    },
    setPreTracks: (state, action) => {
      state.preTracks = action.payload
    },
    setTracksList: (state, action) => {
      state.trackslist = action.payload
    },

    setPassedTracks: (state, action) => {
      state.passedTracks = action.payload
    },
    addPassedTracksItem(state, action) {
      if(!state.passedTracks.find((el) => el.uri == action.payload)){
        state.passedTracks.push(action.payload)
      }
    },
    setSelectedTracks: (state, action) => {
      state.selectedTracks = action.payload
    },
    addSelectedTracksItem(state, action) {
      if(!state.selectedTracks.find((el) => el.id == action.payload.id)){
        state.selectedTracks.push(action.payload)
      }
    },
    removeSelectedTracksItem(state, action) {
      state.selectedTracks.splice(action.payload, 1)
    },
    addSelectedTracksItemAtFirst(state, action) {
      if(!state.selectedTracks.find((el) => el.id == action.payload.id)){
        state.selectedTracks.push(action.payload)
        state.selectedTracks.unshift(state.selectedTracks.pop())
      }
    },

    setSearchResult: (state, action) => {
      state.searchResult = action.payload
    },
    setSearchResultUsed: (state, action) => {
      state.searchResultUsed = action.payload
    },
    setNumberOfPage: (state, action) => {
      state.numberOfPage = action.payload
    },
    setTotal: (state, action) => {
      state.total = action.payload
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload
    },
    setCurrentIndex: (state, action) => {
      state.currentIndex = action.payload
    },
    setNameOfPlaylist: (state, action) => {
      state.nameOfPlaylist = action.payload
    }
  }
})

export const { 
  setIsStarted, 
  setIsFinish, 
  setIsPlaying, 
  setAppMode, 
  setSelectedTracks, 
  addSelectedTracksItem, 
  removeSelectedTracksItem,
  addSelectedTracksItemAtFirst, 
  setPreTracks, 
  setTracksList, 
  setPassedTracks, 
  addPassedTracksItem, 
  setSearchResult, 
  setSearchResultUsed, 
  setNumberOfPage, 
  setTotal, 
  setCurrentPage, 
  setCurrentIndex, 
  setNameOfPlaylist 
} = appSlice.actions

export const selectIsStarted = state => state.app?.isStarted
export const selectIsFinish = state => state.app?.isFinish
export const selectIsPlaying = state => state.app?.isPlaying
export const selectAppMode = state => state.app?.appMode
export const selectPreTracks = state => state.app?.preTracks
export const selectTracksList = state => state.app?.trackslist
export const selectPassedTracks = state => state.app?.passedTracks
export const selectSelectedTracks = state => state.app?.selectedTracks
export const selectSearchResult = state => state.app?.searchResult
export const selectSearchResultUsed = state => state.app?.searchResultUsed
export const selectNumberOfPage = state => state.app?.numberOfPage
export const selectTotal = state => state.app?.total
export const selectCurrentPage = state => state.app?.currentPage
export const selectCurrentIndex = state => state.app?.currentIndex
export const selectNameOfPlaylist = state => state.app?.nameOfPlaylist

export default appSlice.reducer
