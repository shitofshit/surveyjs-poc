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

// POST save survey response
app.post("/surveyjs/api/responses", async (req, res) => {
  const {
    surveyId,
    userId,
    responseData,
    isCompleted,
    score,
    totalQuestions,
    scorePercentage,
  } = req.body;
  try {
    // Check for existing incomplete response
    const checkRequest = new sql.Request();
    checkRequest.input("surveyId", sql.Int, surveyId);
    checkRequest.input("userId", sql.Int, userId);

    const checkResult = await checkRequest.query`
      SELECT TOP 1 Id, IsCompleted 
      FROM SurveyResponses 
      WHERE SurveyId = @surveyId AND UserId = @userId 
      ORDER BY CreatedAt DESC
    `;

    let existingId = null;
    if (checkResult.recordset.length > 0) {
      const lastResponse = checkResult.recordset[0];
      if (!lastResponse.IsCompleted) {
        existingId = lastResponse.Id;
      }
    }

    const request = new sql.Request();
    request.input("surveyId", sql.Int, surveyId);
    request.input("userId", sql.Int, userId);
    request.input("responseData", sql.NVarChar, JSON.stringify(responseData));
    request.input("isCompleted", sql.Bit, isCompleted || false);
    request.input("score", sql.Int, score !== undefined ? score : null);
    request.input(
      "totalQuestions",
      sql.Int,
      totalQuestions !== undefined ? totalQuestions : null
    );
    request.input(
      "scorePercentage",
      sql.Decimal(5, 2),
      scorePercentage !== undefined ? scorePercentage : null
    );

    if (existingId) {
      // UPDATE existing incomplete response
      request.input("id", sql.Int, existingId);
      if (isCompleted) {
        await request.query`
            UPDATE SurveyResponses 
            SET ResponseData = @responseData, 
                IsCompleted = @isCompleted, 
                CompletedAt = GETDATE(),
                Score = @score,
                TotalQuestions = @totalQuestions,
                ScorePercentage = @scorePercentage
            WHERE Id = @id
         `;
      } else {
        await request.query`
            UPDATE SurveyResponses 
            SET ResponseData = @responseData,
                Score = @score,
                TotalQuestions = @totalQuestions,
                ScorePercentage = @scorePercentage
            WHERE Id = @id
         `;
      }
      res.status(200).json({ message: "Response updated" });
    } else {
      // INSERT new response
      if (isCompleted) {
        await request.query`
          INSERT INTO SurveyResponses (SurveyId, UserId, ResponseData, IsCompleted, CompletedAt, Score, TotalQuestions, ScorePercentage)
          VALUES (@surveyId, @userId, @responseData, @isCompleted, GETDATE(), @score, @totalQuestions, @scorePercentage)
        `;
      } else {
        await request.query`
          INSERT INTO SurveyResponses (SurveyId, UserId, ResponseData, IsCompleted, Score, TotalQuestions, ScorePercentage)
          VALUES (@surveyId, @userId, @responseData, @isCompleted, @score, @totalQuestions, @scorePercentage)
        `;
      }
      res.status(201).json({ message: "Response saved" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// GET survey response for a user
app.get("/surveyjs/api/responses", async (req, res) => {
  const { surveyId, userId } = req.query;
  try {
    const request = new sql.Request();
    request.input("surveyId", sql.Int, surveyId);
    request.input("userId", sql.Int, userId);

    const result = await request.query`
      SELECT TOP 1 * FROM SurveyResponses 
      WHERE SurveyId = @surveyId AND UserId = @userId 
      ORDER BY CreatedAt DESC
    `;

    if (result.recordset.length > 0) {
      res.json(result.recordset[0]);
    } else {
      res.status(404).json({ message: "No response found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
