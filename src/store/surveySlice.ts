import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface SurveyState {
  surveyJson: any; // Using any for now as SurveyJS JSON schema is complex
  results: any[];
  currentUser: any | null;
}

const initialState: SurveyState = {
  surveyJson: null,
  results: [],
  currentUser: null,
};

const surveySlice = createSlice({
  name: "survey",
  initialState,
  reducers: {
    setSurveyJson(state, action: PayloadAction<any>) {
      state.surveyJson = action.payload;
    },
    addResult(state, action: PayloadAction<any>) {
      state.results.push(action.payload);
    },
    setCurrentUser(state, action: PayloadAction<any>) {
      state.currentUser = action.payload;
    },
    logout(state) {
      state.currentUser = null;
    },
  },
});

export const { setSurveyJson, addResult, setCurrentUser, logout } =
  surveySlice.actions;
export default surveySlice.reducer;
