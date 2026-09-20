require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");

const connectDB = require("./src/db/db");
const authRoutes = require("./src/routes/auth.routes");
const repositoryRoutes = require("./src/routes/repository.routes");
const codeFileRoutes = require("./src/routes/codeFile.routes");
const cors = require("cors");

const app = express();

connectDB();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json()); 
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/repositories", repositoryRoutes);
app.use("/api", codeFileRoutes);
app.get("/", (req, res) => {
  res.json({
    message: "TLC Backend is running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "TLC Vault API is healthy",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});