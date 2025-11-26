import React from "react";
import { Menubar } from "primereact/menubar";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../store/store";
import { logout } from "../store/surveySlice";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.survey.currentUser);

  const items = [
    {
      label: "Home",
      icon: "pi pi-home",
      command: () => navigate("/"),
    },
    {
      label: "Create Survey",
      icon: "pi pi-file-edit",
      command: () => navigate("/creator"),
    },
    // Only show "Take Survey" if a user is logged in
    ...(currentUser ? [{
      label: "Take Survey",
      icon: "pi pi-list",
      command: () => navigate("/runner"),
    }] : []),
  ];

  const end = currentUser ? (
    <div className="flex align-items-center gap-2">
      <span className="font-bold">{currentUser.Username}</span>
      <i className="pi pi-sign-out cursor-pointer" onClick={() => dispatch(logout())} title="Logout"></i>
    </div>
  ) : null;

  return <Menubar model={items} end={end} className='h-3rem' />;
};

export default Header;
