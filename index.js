require("dotenv").config({ debug: process.env.DEBUG });
const express = require("express");
const morgan = require("morgan");
const { Sequelize, DataTypes, Model } = require("sequelize");

const sequelize = new Sequelize(
  process.env.POSTGRES_DB,
  process.env.POSTGRES_USER,
  process.env.POSTGRES_PASSWORD,
  {
    host: "localhost",
    port: process.env.POSTGRES_PORT,
    dialect: "postgres",
    pool: {
      max: 5,
      min: 0,
      idle: 10000,
    },
  }
);

// test connection
(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
})();

const Triplet = sequelize.define("Triplet", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    allowNull: false,
    autoIncrement: true,
  },
  request: {
    type: DataTypes.JSONB,
  },
  response: {
    type: DataTypes.JSONB,
  },
  replayResponse: {
    type: DataTypes.JSONB,
  },
});

(async () => {
  try {
    await sequelize.sync({ force: true });
    console.log("All models were synchronized successfully.");
  } catch (e) {
    console.error(e);
  }
})();

const app = express();
app.use(morgan("dev"));
app.use(express.json());

/**
 * Format of the json body: {
 *  request: JSON,
 *  response: JSON,
 *  replay: JSON,
 * }
 */
app.post("/replays", async (req, res) => {
  const data = req.body;
  const { request, response, replay } = data;
  try {
    Triplet.sync().then(() => {
      Triplet.create({ request, response, replayResponse: replay }).then(() =>
        res.end()
      );
    });
  } catch (e) {
    console.error(e);
    res.status(500).end();
  }
});

app.get("/all", async (req, res) => {
  const triplets = await Triplet.findAll();
  const out = JSON.stringify(triplets, null, 2);
  res.json(out);
});

app.listen(process.env.PORT, (err) => {
  if (err) console.error(err);
  console.log("Server is listening on PORT ", process.env.PORT);
});
