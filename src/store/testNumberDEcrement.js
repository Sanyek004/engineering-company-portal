import { createSlice } from "@reduxjs/toolkit";

export const {
  actions: { setNumberDecrement },
  reducer,
  name,
} = createSlice({
  name: "test",
  initialState: {
    number: 100,
  },
  reducers: {
    setNumberDecrement: (state, payload) => {
      state.number = state.number - payload.payload;
    },
  },
});
