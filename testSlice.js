import { createSlice } from "@reduxjs/toolkit";

export const {
  actions: { setLoading },
  reducer,
  name,
} = createSlice({
  name: "test",
  initialState: {
    loading: true,
  },
  reducers: {
    setLoading: (state, payload) => {
      state.loading = payload.payload;
    },
  },
});
