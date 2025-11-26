import React, { useEffect, useState } from "react";
import { SurveyCreatorComponent, SurveyCreator } from "survey-creator-react";
import "survey-core/survey-core.min.css";
import "survey-creator-core/survey-creator-core.min.css";
import { useDispatch, useSelector } from "react-redux";
import SurveyCreatorTheme from "survey-creator-core/themes";
import { registerCreatorTheme, registerSurveyTheme } from "survey-creator-core";
import SurveyTheme from "survey-core/themes";
import type { RootState } from "../store/store";
import { createSurvey, getUsers, getSurveys, updateSurvey } from "../api";
import { MultiSelect } from "primereact/multiselect";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";

const creatorOptions = {
  showLogicTab: true,
  isAutoSave: false,
  showThemeTab: true,
  showJsonEditorTab: false,
};

const CreatorPage: React.FC = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.survey.currentUser);
  const savedSurveyJson = useSelector(
    (state: RootState) => state.survey.surveyJson
  );

  const [creator, setCreator] = useState<SurveyCreator | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [surveys, setSurveys] = useState<any[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Load users and surveys on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const usersData = await getUsers();
        setUsers(usersData);
        if (usersData && usersData.length > 0) {
          setSelectedUsers([usersData[0]]);
        }

        // Load all surveys for selection
        const surveysData = await getSurveys();
        setSurveys(surveysData);
      } catch (err) {
        console.error("Failed to load data", err);
      }
    };
    loadData();

    const newCreator = new SurveyCreator(creatorOptions);
    newCreator.applyCreatorTheme(SurveyCreatorTheme.DefaultContrast);
    registerCreatorTheme(SurveyCreatorTheme);
    registerSurveyTheme(SurveyTheme);

    setCreator(newCreator);
  }, [dispatch]);

  // Load selected survey into creator
  useEffect(() => {
    if (creator && selectedSurvey) {
      try {
        const jsonContent = JSON.parse(selectedSurvey.JsonContent);
        creator.JSON = jsonContent;
        setIsEditMode(true);

        // Load assigned users
        // Note: We'd need to fetch UserSurveys for this survey to populate selectedUsers
        // For now, keep current selection
      } catch (err) {
        console.error("Failed to load survey", err);
      }
    } else if (creator && !selectedSurvey) {
      creator.JSON = {};
      setIsEditMode(false);
    }
  }, [creator, selectedSurvey]);

  // Update save function whenever selectedUsers or isEditMode changes
  useEffect(() => {
    if (creator) {
      creator.saveSurveyFunc = async (
        saveNo: number,
        callback: (no: number, isSuccess: boolean) => void
      ) => {
        console.log("Saving survey to DB...", creator.JSON);
        try {
          const userIds = selectedUsers.map(u => u.Id);

          if (isEditMode && selectedSurvey) {
            // Update existing survey
            await updateSurvey(selectedSurvey.Id, selectedSurvey.Title || "My Survey", creator.JSON, userIds);
          } else {
            // Create new survey
            await createSurvey("My Survey", creator.JSON, userIds);
          }

          callback(saveNo, true);

          // Refresh surveys list
          const surveysData = await getSurveys();
          setSurveys(surveysData);
        } catch (error) {
          console.error("Failed to save survey", error);
          callback(saveNo, false);
        }
      };
    }
  }, [creator, selectedUsers, isEditMode, selectedSurvey]);

  const onNewSurvey = () => {
    setSelectedSurvey(null);
    setIsEditMode(false);
    if (creator) {
      creator.JSON = {};
    }
  };

  return (
    <div className="flex flex-column flex-1 h-full">
      <div className="p-3 bg-gray-900 flex align-items-center gap-3 flex-wrap">
        <span className="font-bold">Survey:</span>
        <Dropdown
          value={selectedSurvey}
          options={surveys}
          onChange={(e) => setSelectedSurvey(e.value)}
          optionLabel="Title"
          placeholder="New Survey"
          className="w-15rem"
          showClear
        />
        <Button
          label="New Survey"
          icon="pi pi-plus"
          onClick={onNewSurvey}
          size="small"
        />
        <span className="font-bold ml-3">Assign to Users:</span>
        <MultiSelect
          value={selectedUsers}
          options={users}
          onChange={(e) => setSelectedUsers(e.value)}
          optionLabel="Username"
          placeholder="Select Users"
          display="chip"
          className="w-20rem"
        />
      </div>
      <div className="flex-1 relative">
        {creator && <SurveyCreatorComponent creator={creator} />}
      </div>
    </div>
  );
};

export default CreatorPage;