const API_URL = "http://localhost:9180/surveyjs/api";

export const getSurveys = async (userId?: number) => {
  const url = userId
    ? `${API_URL}/surveys?userId=${userId}`
    : `${API_URL}/surveys`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch surveys");
  }
  return response.json();
};

export const createSurvey = async (
  title: string,
  jsonContent: any,
  userIds: number[] = []
) => {
  const response = await fetch(`${API_URL}/surveys`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, jsonContent, userIds }),
  });
  if (!response.ok) {
    throw new Error("Failed to create survey");
  }
  return response.json();
};

export const getUsers = async () => {
  const response = await fetch(`${API_URL}/users`);
  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }
  return response.json();
};

export const getSurveyById = async (surveyId: number) => {
  const response = await fetch(`${API_URL}/surveys/${surveyId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch survey");
  }
  return response.json();
};

export const updateSurvey = async (
  surveyId: number,
  title: string,
  jsonContent: any,
  userIds: number[] = []
) => {
  const response = await fetch(`${API_URL}/surveys/${surveyId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, jsonContent, userIds }),
  });
  if (!response.ok) {
    throw new Error("Failed to update survey");
  }
  return response.json();
};

export const saveResponse = async (
  surveyId: number,
  userId: number,
  responseData: any,
  isCompleted: boolean = true,
  score?: number,
  totalQuestions?: number,
  scorePercentage?: number
) => {
  const response = await fetch(`${API_URL}/responses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      surveyId,
      userId,
      responseData,
      isCompleted,
      score,
      totalQuestions,
      scorePercentage,
    }),
  });
  if (!response.ok) {
    throw new Error("Failed to save response");
  }
  return response.json();
};

export const getResponse = async (surveyId: number, userId: number) => {
  const response = await fetch(
    `${API_URL}/responses?surveyId=${surveyId}&userId=${userId}`
  );
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error("Failed to get response");
  }
  return response.json();
};
