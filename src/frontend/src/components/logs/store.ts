
import { configureStore } from '@reduxjs/toolkit';
import connectionLogReducer from './entities/connection/redux_toolkit/slices/ConnectionLogSlice';

export const store = configureStore({
  reducer: {
    connectionLog: connectionLogReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
