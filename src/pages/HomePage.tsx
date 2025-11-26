import React, { useEffect, useState } from "react";
import { Card } from "primereact/card";
import { Dropdown } from "primereact/dropdown";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentUser } from "../store/surveySlice";
import { getUsers } from "../api";
import type { RootState } from "../store/store";

const HomePage: React.FC = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.survey.currentUser);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await getUsers();
        setUsers(data);
      } catch (err) {
        console.error("Failed to load users", err);
      }
    };
    loadUsers();
  }, []);

  const onUserChange = (e: { value: any }) => {
    dispatch(setCurrentUser(e.value));
  };

  return (
    <div className="flex justify-content-center align-items-center h-full">
      <Card title="Welcome to SurveyJS POC" className="text-center">
        <p className="m-0 mb-4">
          This application demonstrates SurveyJS Creator and Runner with React and
          Redux Persist.
        </p>
        <div className="flex flex-column gap-2">
          <label htmlFor="user-select" className="font-bold">Select User to Login:</label>
          <Dropdown
            id="user-select"
            value={currentUser}
            options={users}
            onChange={onUserChange}
            optionLabel="Username"
            placeholder="Select a User"
            className="w-full"
          />
        </div>
        {currentUser && <p className="mt-3 text-green-500">Logged in as: <b>{currentUser.Username}</b></p>}
      </Card>
    </div>
  );
};

export default HomePage;
