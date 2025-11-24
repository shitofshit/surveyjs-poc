import React, { useMemo } from "react";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../store/store";
import { addResult } from "../store/surveySlice";
import { ContrastDarkPanelless } from "survey-core/themes";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Link } from "react-router-dom";

const RunnerPage: React.FC = () => {
  const surveyJson = useSelector((state: RootState) => state.survey.surveyJson);
  const dispatch = useDispatch();

  const survey = useMemo(() => {
    if (!surveyJson) return null;
    const survey = new Model(surveyJson);
    survey.applyTheme(ContrastDarkPanelless);
    survey.onComplete.add((sender) => {
      console.log("Survey results:", sender.data);
      dispatch(addResult(sender.data));
    });
    return survey;
  }, [surveyJson, dispatch]);

  if (!surveyJson) {
    return (
      <div className="flex justify-content-center align-items-center h-screen">
        <Card
          title="No Survey Found"
          className="text-center flex flex-1 align-items-center justify-content-center"
          style={{
            maxWidth: "50rem",
          }}
        >
          <p className="m-0 mb-3">Please create a survey first.</p>
          <Link to="/creator">
            <Button label="Go to Creator" severity="danger" />
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Card>
        <Survey model={survey} />
      </Card>
    </div>
  );
};

export default RunnerPage;
