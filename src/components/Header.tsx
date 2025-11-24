import React from 'react';
import { Menubar } from 'primereact/menubar';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const navigate = useNavigate();

  const items = [
    {
      label: 'Home',
      icon: 'pi pi-fw pi-home',
      command: () => { navigate('/'); }
    },
    {
      label: 'Create Survey',
      icon: 'pi pi-fw pi-pencil',
      command: () => { navigate('/creator'); }
    },
    {
      label: 'Take Survey',
      icon: 'pi pi-fw pi-check-square',
      command: () => { navigate('/runner'); }
    }
  ];

  return <Menubar model={items} className='h-3rem' />;
};

export default Header;
