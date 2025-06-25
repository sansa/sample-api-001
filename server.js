import express from "express";
import bodyParser from "body-parser";
import userRoutes from "./routes/user.route.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Welcome to the VerdeFlow Test API!");
});

app.use("/api/users", userRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
