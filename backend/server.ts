import express from "express";
import cors from "cors";
import { connectDB, sql } from "./db";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Connect to Database
connectDB();

// Routes
app.get("/", (req, res) => {
  res.send("SurveyJS API is running");
});

// GET all surveys (optional filter by userId)
app.get("/surveyjs/api/surveys", async (req, res) => {
  const userId = req.query.userId;
  try {
    const request = new sql.Request();
    let query = "SELECT * FROM Surveys";

    if (userId) {
      request.input("userId", sql.Int, userId);
      query = `
        SELECT s.* FROM Surveys s
        JOIN UserSurveys us ON s.Id = us.SurveyId
        WHERE us.UserId = @userId
      `;
    }

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// POST create a survey
app.post("/surveyjs/api/surveys", async (req, res) => {
  const { title, jsonContent, userIds } = req.body;
  const transaction = new sql.Transaction();
  try {
    await transaction.begin();
    const request = new sql.Request(transaction);
    request.input("title", sql.NVarChar, title);
    request.input("jsonContent", sql.NVarChar, JSON.stringify(jsonContent));

    // Insert Survey with Version 1
    const surveyResult =
      await request.query`INSERT INTO Surveys (Title, JsonContent, Version) OUTPUT INSERTED.Id VALUES (@title, @jsonContent, 1)`;
    const surveyId = surveyResult.recordset[0].Id;

    // Insert User Assignments
    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      for (const userId of userIds) {
        const userRequest = new sql.Request(transaction);
        userRequest.input("userId", sql.Int, userId);
        userRequest.input("surveyId", sql.Int, surveyId);
        await userRequest.query`INSERT INTO UserSurveys (UserId, SurveyId, AccessRole) VALUES (@userId, @surveyId, 'Viewer')`;
      }
    }

    await transaction.commit();
    res.status(201).json({ message: "Survey Created", surveyId });
  } catch (err) {
    console.error(err);
    if (transaction) await transaction.rollback();
    res.status(500).send("Server Error");
  }
});

// PUT update a survey
app.put("/surveyjs/api/surveys/:id", async (req, res) => {
  const surveyId = req.params.id;
  const { title, jsonContent, userIds } = req.body;
  const transaction = new sql.Transaction();
  try {
    await transaction.begin();
    const request = new sql.Request(transaction);
    request.input("surveyId", sql.Int, surveyId);
    request.input("title", sql.NVarChar, title);
    request.input("jsonContent", sql.NVarChar, JSON.stringify(jsonContent));

    // Update Survey and increment version
    await request.query`
      UPDATE Surveys 
      SET Title = @title, 
          JsonContent = @jsonContent, 
          Version = Version + 1,
          UpdatedAt = GETDATE()
      WHERE Id = @surveyId
    `;

    // Update User Assignments - delete existing and insert new
    if (userIds && Array.isArray(userIds)) {
      const deleteRequest = new sql.Request(transaction);
      deleteRequest.input("surveyId", sql.Int, surveyId);
      await deleteRequest.query`DELETE FROM UserSurveys WHERE SurveyId = @surveyId`;

      if (userIds.length > 0) {
        for (const userId of userIds) {
          const userRequest = new sql.Request(transaction);
          userRequest.input("userId", sql.Int, userId);
          userRequest.input("surveyId", sql.Int, surveyId);
          await userRequest.query`INSERT INTO UserSurveys (UserId, SurveyId, AccessRole) VALUES (@userId, @surveyId, 'Viewer')`;
        }
      }
    }

    await transaction.commit();
    res.status(200).json({ message: "Survey Updated", surveyId });
  } catch (err) {
    console.error(err);
    if (transaction) await transaction.rollback();
    res.status(500).send("Server Error");
  }
});

// GET all users
app.get("/surveyjs/api/users", async (req, res) => {
  try {
    const result = await sql.query`SELECT * FROM Users`;
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
