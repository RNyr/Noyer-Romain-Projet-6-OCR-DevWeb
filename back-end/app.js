//----- EXPRESS -----//

const express = require("express");

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});

//----- MONGODB -----//

const mongoose = require("mongoose");

mongoose
  .connect(
    `mongodb+srv://${ACCOUNT}:${PASSWORD}@cluster0.d10dglr.mongodb.net/test`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("Connexion à MongoDB réussie !"))
  .catch(() => console.log("Connexion à MongoDB échouée !"));

//----- ROUTES -----//

const sauceRoutes = require("./routes/sauce");
const userRoutes = require("./routes/user");

app.use("/api/sauces", sauceRoutes);
app.use("/api/auth", userRoutes);

const path = require("path");

app.use("/images", express.static(path.join(__dirname, "images")));

module.exports = app;
