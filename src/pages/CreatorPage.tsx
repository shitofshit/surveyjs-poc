import React, { useEffect, useState } from "react";
import { SurveyCreatorComponent, SurveyCreator } from "survey-creator-react";
import "survey-core/survey-core.min.css";
import "survey-creator-core/survey-creator-core.min.css";
import { useDispatch } from "react-redux";
import { setSurveyJson } from "../store/surveySlice";

const creatorOptions = {
  showLogicTab: false,
  isAutoSave: false,
};

const CreatorPage: React.FC = () => {
  const dispatch = useDispatch();
  const [creator, setCreator] = useState<SurveyCreator | null>(null);

  useEffect(() => {
    const newCreator = new SurveyCreator(creatorOptions);
    newCreator.saveSurveyFunc = (
      saveNo: number,
      callback: (no: number, isSuccess: boolean) => void
    ) => {
      // Save to Redux
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
