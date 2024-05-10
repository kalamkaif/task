const express = require("express");

const cors = require("cors");
const app = express();
const port = 3333;
const match = require("./data/match.json");
require("dotenv").config();

// Database Details

const DB_USER = process.env["DB_USER"] || "kkalamkaif";
const DB_PWD = process.env["DB_PWD"] || "otxdR56Jl4kArNdK";
const DB_URL = process.env["DB_URL"] || "task.y9bhjls.mongodb.net";
const DB_NAME = "task-jeff";
const DB_COLLECTION_NAME = "players";

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri =
  "mongodb+srv://" +
  DB_USER +
  ":" +
  DB_PWD +
  "@" +
  DB_URL +
  "/?retryWrites=true&w=majority";

// "mongodb+srv://kkalamkaif:otxdR56Jl4kArNdK@task.y9bhjls.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db;

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });

    db = client.db(DB_NAME);

    console.log("You successfully connected to MongoDB!");
  } finally {
  }
}

// Sample create document
async function sampleCreate() {
  const demo_doc = {
    item: "hw",
  };
  const demo_create = await db
    .collection(DB_COLLECTION_NAME)
    .insertOne(demo_doc);

  console.log(demo_create.insertedId);
}

app.use(cors());
app.use(express.json());
// Endpoints

app.get("/", async (req, res) => {
  res.send("Hello World!");
});

app.post("/add-team", (req, res) => {
  const { teamName, captain, viceCaptain, players } = req.body;

  if (
    !teamName ||
    !captain ||
    !viceCaptain ||
    !players ||
    !Array.isArray(players)
  ) {
    return res.status(400).json({ error: "Please fill all fields" });
  }
  if (captain.Player == viceCaptain.Player) {
    return res.status(400).json({
      error: "Caption and viceCaptain should not be same person",
    });
  }
  if (players.length != 11) {
    return res.status(400).json({ error: "No of playes must be 11" });
  }
  const arrayOfFirstPropertyValues = players.map((obj) => obj.Player);
  const s = new Set([...arrayOfFirstPropertyValues]);
  // console.log("first", s);
  if (Array.from(s).length != 11) {
    return res.status(400).json({
      error: "One or more Repeated Player",
    });
  }
  const arrayOfSecondPropertyValues = players.map((obj) => obj.Team);
  const s2 = new Set([...arrayOfSecondPropertyValues]);
  // console.log("first", s2, Array.from(s2));
  if (Array.from(s2).length == 1) {
    return res.status(400).json({
      error: "You cant select more than 10 players from a team",
    });
  }
  const filteredArray1 = players.filter((obj) => obj.Role === "WICKETKEEPER");
  const filteredArray2 = players.filter((obj) => obj.Role === "BATTER");
  const filteredArray3 = players.filter((obj) => obj.Role === "ALL-ROUNDER");
  const filteredArray4 = players.filter((obj) => obj.Role === "BOWLER");

  if (
    filteredArray1.length < 1 ||
    filteredArray2.length < 1 ||
    filteredArray3.length < 1 ||
    filteredArray4.length < 1 ||
    filteredArray1.length > 8 ||
    filteredArray2.length > 8 ||
    filteredArray3.length > 8 ||
    filteredArray4.length > 8
  ) {
    return res.status(400).json({
      error:
        "Atleast one Wicket Keeper, Batter, All Rounder, Bowler should be placed and not more than 8",
    });
  }

  const newTeam = { teamName, captain, viceCaptain, players };
  db.collection(DB_COLLECTION_NAME)
    .insertOne(newTeam)
    .then((result) => {
      return res.status(201).json({
        message: "Data inserted successfully",
        insertedId: result.insertedId,
        result: result,
      });
    })
    .catch((error) => {
      return res
        .status(500)
        .json({ message: "Failed to insert data into database", err: error });
    });
});

function playersPoints(player) {
  var points = 0;
  sum = 0;
  const batsmenScore = match.filter((obj) => obj.batter === player.Player);
  const arrayOfScore = batsmenScore.map((obj) => obj.batsman_run);
  for (let i = 0; i < arrayOfScore.length; i++) {
    sum += arrayOfScore[i];
  }
  // console.log("kk", arrayOfScore, sum);
  if (
    sum === 0 &&
    (player.Role === "BATTER" ||
      player.Role === "WICKETKEEPER" ||
      player.Role === "ALL-ROUNDER")
  ) {
    points -= 2;
  }
  if (sum >= 100) {
    points += 16;
  }
  if (sum < 99 && sum >= 50) {
    // console.log("added");
    points += 8;
  }
  if (sum < 50 && sum >= 30) {
    points += 4;
  }

  for (let i = 0; i < arrayOfScore.length; i++) {
    if (arrayOfScore[i] == 6) {
      points += 8;
    } else if (arrayOfScore[i] == 4) {
      points += 5;
    } else {
      points += arrayOfScore[i];
    }
  }
  // console.log("Batting score: ", points);
  const bowlingScore = match.filter((obj) => obj.bowler === player.Player);
  const arrayOfBowlingScore = bowlingScore.map((obj) => obj.kind);
  const arrayOfBowlingScore1 = arrayOfBowlingScore.filter(
    (value) => value != "NA"
  );
  // console.log(arrayOfBowlingScore1);
  const arrayOfBowlerScore = bowlingScore.map((obj) => obj.total_run);
  var subArrays = [];
  const subArrayLength = 6;

  for (let i = 0; i < arrayOfBowlerScore.length; i += subArrayLength) {
    const subArray = arrayOfBowlerScore.slice(i, i + subArrayLength);
    subArrays.push(subArray);
  }

  if (subArrays.length > 1) {
    for (const subArray of subArrays) {
      for (let i = 0; i < subArray.length; i++) {
        const oversum = subArray.reduce((acc, curr) => acc + curr, 0);

        if (oversum === 0) {
          console.log("maiden: ", oversum);
          points += 12;
        }
      }
    }
  }
  const noOfWickets = arrayOfBowlingScore1.length;
  // console.log("no", noOfWickets);
  if (noOfWickets === 5) {
    points += 16;
  }
  if (noOfWickets === 4) {
    points += 8;
  }
  if (noOfWickets === 3) {
    points += 4;
  }
  if (noOfWickets >= 1) {
    for (let i = 0; i < arrayOfBowlingScore1.length; i++) {
      if (arrayOfBowlingScore1[i] != "Run Out") {
        points += 25;
      }
      if (arrayOfBowlingScore1[i] === "lbw" || "Bowled") {
        points += 8;
      }
    }
  }
  const catchScore = match.filter(
    (obj) => obj.fielders_involved === player.Player
  );
  const arrayOfCatchScore = catchScore.map((obj) => obj.kind);
  if (arrayOfCatchScore.length >= 1) {
    for (let i = 0; i < arrayOfCatchScore.length; i++) {
      if (arrayOfCatchScore[i] === "caught") {
        points += 8;
      }
      if (arrayOfCatchScore[i] === "Stumping") {
        points += 12;
      }
      if (arrayOfCatchScore[i] === "Run out") {
        points += 6;
      }
    }
  }
  function findFrequency(arr) {
    return arr.reduce((frequencyMap, value) => {
      frequencyMap[value] = (frequencyMap[value] || 0) + 1;
      return frequencyMap;
    }, {});
  }

  const frequencyMap = findFrequency(arrayOfCatchScore);
  // console.log("fm", frequencyMap, frequencyMap.caught);
  if (frequencyMap.caught >= 3) {
    points += 4;
  }
  // console.log("kk", catchScore, arrayOfCatchScore);
  return points;
}

app.post("/process-result", (req, res) => {
  try {
    const player = req.body.player;
    var result = playersPoints(player);

    return res.status(200).json({ message: "success", "Player Score": result });
  } catch (error) {
    return res.status(500).json({ message: "failed", error: error });
  }
});

app.post("/team-result", (req, res) => {
  try {
    const { teamName, captain, viceCaptain, players } = req.body;
    var playersScore = [];
    // console.log(players);
    if (
      !teamName ||
      !captain ||
      !viceCaptain ||
      !players ||
      !Array.isArray(players)
    ) {
      return res.status(400).json({ error: "Please fill all fields" });
    }
    for (let i = 0; i < players.length; i++) {
      var playerScore = playersPoints(players[i]);
      if (captain.Player === players[i].Player) {
        playersScore.push(playerScore * 2);
        // console.log("caption: ", players[i].Player, playerScore);
      } else if (viceCaptain.Player === players[i].Player) {
        playersScore.push(playerScore * (3 / 2));
        // console.log("vice caption: ", players[i].Player, playerScore);
      } else {
        // console.log(players[i].Player, playerScore);
        playersScore.push(playerScore);
      }
    }

    const teamPoints = playersScore.reduce((a, c) => a + c, 0);
    // console.log(playersScore, teamPoints);
    return res
      .status(200)
      .json({ message: "success", "Team Score": teamPoints });
  } catch (error) {
    return res.status(500).json({ message: "failed", error: error });
  }
});

app.get("/demo", async (req, res) => {
  await sampleCreate();
  res.send({ status: 1, message: "demo" });
});

//

app.listen(port, () => {
  run();
  console.log(`App listening on port ${port}`);
});
