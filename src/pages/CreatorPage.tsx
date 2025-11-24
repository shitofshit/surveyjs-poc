import React, { useEffect, useState } from "react";
import { SurveyCreatorComponent, SurveyCreator } from "survey-creator-react";
import "survey-core/survey-core.min.css";
import "survey-creator-core/survey-creator-core.min.css";
import { useDispatch, useSelector } from "react-redux";
import { setSurveyJson } from "../store/surveySlice";
import SurveyCreatorTheme from "survey-creator-core/themes";
import { registerCreatorTheme, registerSurveyTheme } from "survey-creator-core";
import SurveyTheme from "survey-core/themes";
// ✅ Fixed Import
import type { RootState } from "../store/store";

const creatorOptions = {
  showLogicTab: true,
  isAutoSave: false,
  showThemeTab: true,
  showJsonEditorTab: false,
};

const CreatorPage: React.FC = () => {
  const dispatch = useDispatch();
  const savedSurveyJson = useSelector(
    (state: RootState) => state.survey.surveyJson
  );

  const [creator, setCreator] = useState<SurveyCreator | null>(null);

  useEffect(() => {
    const newCreator = new SurveyCreator(creatorOptions);
    newCreator.applyCreatorTheme(SurveyCreatorTheme.DefaultContrast);
    registerCreatorTheme(SurveyCreatorTheme);
    registerSurveyTheme(SurveyTheme);

    if (savedSurveyJson) {
      newCreator.JSON = savedSurveyJson;
    }

    newCreator.saveSurveyFunc = (
      saveNo: number,
      callback: (no: number, isSuccess: boolean) => void
    ) => {
      console.log("Saving survey...", newCreator.JSON);
      dispatch(setSurveyJson(newCreator.JSON));
      callback(saveNo, true);
    };

    setCreator(newCreator);
  }, [dispatch]);

  return (
    <div className="flex flex-1">
      {creator && <SurveyCreatorComponent creator={creator} />}
    </div>
  );
};

export default CreatorPage;