import { configureStore, combineReducers } from "@reduxjs/toolkit"
import { authSlice } from "./authSlice"
import { appSlice } from "./appSlice"
import { sessionSlice } from "./sessionSlice"
import { createWrapper } from "next-redux-wrapper"
import { persistReducer, persistStore } from "redux-persist"
import storage from "redux-persist/lib/storage"

const rootReducer = combineReducers({
  [authSlice.name]: authSlice.reducer,
  [appSlice.name]: appSlice.reducer,
  [sessionSlice.name]: sessionSlice.reducer,
})

const makeConfiguredStore = () =>
  configureStore({
    reducer: rootReducer,
    devTools: true
  })

export const makeStore = () => {
  const isServer = typeof window === "undefined"

  if (isServer) {
    return makeConfiguredStore()
  } else {
    // we need it only on client side

    const persistConfig = {
      key: "nextjs",
      blacklist: ["app", "auth"],
      whitelist: ["session"],
      storage
    }

    const persistedReducer = persistReducer(persistConfig, rootReducer)
    let store = configureStore({
      reducer: persistedReducer,
      devTools: process.env.NODE_ENV !== "production"
    })

    store.__persistor = persistStore(store) // Nasty hack

    return store
  }
}

export const wrapper = createWrapper(makeStore)
