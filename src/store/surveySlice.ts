import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface SurveyState {
  surveyJson: any; // Using any for now as SurveyJS JSON schema is complex
  results: any[];
}

const initialState: SurveyState = {
  surveyJson: null,
  results: [],
};

const surveySlice = createSlice({
  name: 'survey',
  initialState,
  reducers: {
    setSurveyJson: (state, action: PayloadAction<any>) => {
      state.surveyJson = action.payload;
    },
    addResult: (state, action: PayloadAction<any>) => {
      state.results.push(action.payload);
    },
  },
});

export const { setSurveyJson, addResult } = surveySlice.actions;
export default surveySlice.reducer;
