import React, { useEffect, useState, useMemo } from "react";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import { useDispatch, useSelector } from "react-redux";
import { addResult } from "../store/surveySlice";
import { ContrastDarkPanelless } from "survey-core/themes";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { ListBox } from "primereact/listbox";
import { getSurveys, saveResponse, getResponse } from "../api";
import type { RootState } from "../store/store";

const RunnerPage: React.FC = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.survey.currentUser);
  const [surveys, setSurveys] = useState<any[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<any>(null);
  const [surveyJson, setSurveyJson] = useState<any>(null);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [existingResponse, setExistingResponse] = useState<any>(null);

  useEffect(() => {
    const loadSurveys = async () => {
      if (currentUser) {
        try {
          const data = await getSurveys(currentUser.Id);

          // Add DisplayTitle from JSON
          const surveysWithDisplayTitle = data.map((survey: any) => {
            try {
              const jsonContent = JSON.parse(survey.JsonContent);
              return {
                ...survey,
                DisplayTitle: jsonContent.title || survey.Title || "Survey Default Name"
              };
            } catch {
              return {
                ...survey,
                DisplayTitle: survey.Title || "Survey Default Name"
              };
            }
          });

          setSurveys(surveysWithDisplayTitle);
        } catch (err) {
          console.error("Failed to load surveys", err);
        }
      }
    };
    loadSurveys();
  }, [currentUser]);

  // Check if user has completed or started this survey
  useEffect(() => {
    const checkCompletion = async () => {
      if (selectedSurvey && currentUser) {
        try {
          const response = await getResponse(selectedSurvey.Id, currentUser.Id);
          if (response) {
            if (response.IsCompleted) {
              setHasCompleted(true);
            } else {
              setHasCompleted(false);
              console.log("Found incomplete survey, will restore progress");
            }
            setExistingResponse(response);
          } else {
            setHasCompleted(false);
            setExistingResponse(null);
          }
        } catch (err) {
          console.error("Failed to check completion", err);
          setHasCompleted(false);
        }
      }
    };
    checkCompletion();
  }, [selectedSurvey, currentUser]);

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

    // Restore incomplete response if exists
    if (existingResponse && !existingResponse.IsCompleted) {
      try {
        const savedData = JSON.parse(existingResponse.ResponseData);
        survey.data = savedData;
        console.log("Restored incomplete survey data");
      } catch (err) {
        console.error("Failed to restore survey data", err);
      }
    }

    // Auto-save progress with debouncing
    let saveTimeout: any;

    survey.onValueChanged.add(async (sender) => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(async () => {
        if (selectedSurvey && currentUser) {
          try {
            await saveResponse(selectedSurvey.Id, currentUser.Id, sender.data, false);
            console.log("Progress auto-saved");
          } catch (err) {
            console.error("Failed to auto-save progress", err);
          }
        }
      }, 3000); // Save 3 seconds after last change
    });

    // Immediate save on page change
    survey.onCurrentPageChanged.add(async (sender) => {
      if (selectedSurvey && currentUser) {
        try {
          await saveResponse(selectedSurvey.Id, currentUser.Id, sender.data, false);
          console.log("Progress saved on page change");
        } catch (err) {
          console.error("Failed to save progress", err);
        }
      }
    });

    survey.onComplete.add(async (sender) => {
      console.log("Survey results:", sender.data);
      dispatch(addResult(sender.data));

      // Calculate score
      let score = 0;
      let totalQuestions = 0;
      let scorePercentage = 0;

      const quizQuestions = sender.getAllQuestions().filter((q: any) => q.correctAnswer !== undefined);
      totalQuestions = quizQuestions.length;

      if (totalQuestions > 0) {
        score = sender.getCorrectedAnswerCount();
        scorePercentage = Math.round((score / totalQuestions) * 100 * 100) / 100;
        console.log(`Score: ${score}/${totalQuestions} (${scorePercentage}%)`);
      }

      // Save final completed response
      if (selectedSurvey && currentUser) {
        try {
          await saveResponse(
            selectedSurvey.Id,
            currentUser.Id,
            sender.data,
            true, // isCompleted: true
            totalQuestions > 0 ? score : undefined,
            totalQuestions > 0 ? totalQuestions : undefined,
            totalQuestions > 0 ? scorePercentage : undefined
          );
          console.log("Survey completed and saved");
          setHasCompleted(true);
        } catch (err) {
          console.error("Failed to save response", err);
        }
      }
    });

    return survey;
  }, [surveyJson, dispatch, selectedSurvey, currentUser, existingResponse]);

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
    if (hasCompleted && existingResponse) {
      return (
        <div className="flex flex-column h-full p-4">
          <Card title="Survey Completed" className="mb-3">
            <p>You have already completed this survey on {new Date(existingResponse.CompletedAt).toLocaleString()}.</p>
            {existingResponse.ScorePercentage !== null && existingResponse.ScorePercentage !== undefined && (
              <div className="mt-3 p-3 bg-primary-100 border-round text-center">
                <h3 className="mt-0 mb-2">Your Score</h3>
                <div className="text-6xl font-bold text-primary mb-2">
                  {existingResponse.ScorePercentage}%
                </div>
                <div className="text-sm text-600">
                  ({existingResponse.Score} out of {existingResponse.TotalQuestions} correct)
                </div>
              </div>
            )}
            <Button
              label="Back to Survey List"
              icon="pi pi-arrow-left"
              onClick={() => { setSurveyJson(null); setSelectedSurvey(null); }}
              className="mt-3"
            />
          </Card>
          <Card title="Your Responses" className="flex-1">
            <pre className="text-sm">{JSON.stringify(JSON.parse(existingResponse.ResponseData), null, 2)}</pre>
          </Card>
        </div>
      );
    }

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
              optionLabel="DisplayTitle"
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
