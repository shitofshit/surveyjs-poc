import React from 'react';
import { Card } from 'primereact/card';

const HomePage: React.FC = () => {
  return (
    <div className="flex justify-content-center mt-5">
      <Card title="Welcome to Wilson POC on SurveyJS" className="text-center">
        <p className="m-0">
          Select an option from the menu above to start creating or taking surveys.
        </p>
      </Card>
    </div>
  );
};

export default HomePage;
