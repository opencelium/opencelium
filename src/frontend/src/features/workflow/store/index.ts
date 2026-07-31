import { configureStore } from '@reduxjs/toolkit';
import connectionReducer from './connection/connectionSlice';

export const createLegacyStore = () => configureStore({
  reducer: {
    connection: connectionReducer,
  },
});

const store = createLegacyStore();

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
