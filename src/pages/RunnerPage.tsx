import React, { useEffect, useState, useMemo } from "react";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import { useDispatch, useSelector } from "react-redux";
import { addResult } from "../store/surveySlice";
import { ContrastDarkPanelless } from "survey-core/themes";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { ListBox } from "primereact/listbox";
import { getSurveys } from "../api";
import type { RootState } from "../store/store";

const RunnerPage: React.FC = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.survey.currentUser);
  const [surveys, setSurveys] = useState<any[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<any>(null);
  const [surveyJson, setSurveyJson] = useState<any>(null);

  useEffect(() => {
    const loadSurveys = async () => {
      if (currentUser) {
        try {
          const data = await getSurveys(currentUser.Id);
          setSurveys(data);
        } catch (err) {
          console.error("Failed to load surveys", err);
        }
      }
    };
    loadSurveys();
  }, [currentUser]);

  const onSurveySelect = (e: { value: any }) => {
    setSelectedSurvey(e.value);
    if (e.value) {
      setSurveyJson(JSON.parse(e.value.JsonContent));
    } else {
      setSurveyJson(null);
    }
  };

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

  if (!currentUser) {
    return (
      <div className="flex justify-content-center align-items-center h-full">
        <Card title="Access Denied" className="text-center">
          <p>Please login from the Home page to view surveys.</p>
        </Card>
      </div>
    );
  }

  if (surveyJson) {
    return (
      <div className="flex flex-column h-full">
        <div className="p-2">
          <Button label="Back to List" icon="pi pi-arrow-left" onClick={() => { setSurveyJson(null); setSelectedSurvey(null); }} />
        </div>
        <div className="flex-1 overflow-y-auto">
          <Survey model={survey} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-content-center align-items-center h-full">
      <Card title="Available Surveys" className="w-full max-w-30rem text-center">
        {surveys.length === 0 ? (
          <p>No surveys assigned to you.</p>
        ) : (
          <div className="text-left">
            <ListBox
              value={selectedSurvey}
              options={surveys}
              onChange={onSurveySelect}
              optionLabel="Title"
              className="w-full"
              listStyle={{ maxHeight: '250px' }}
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default RunnerPage;
