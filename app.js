const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
//db connection
const dbConnection = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    //app.listen(3000);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
};
dbConnection();

//api1 function
const dataConvertingToResultFormat = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

//ap12 function
const dataConvertingResultFormat = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

//api5 function
const matchDataResultFormat = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

//Returns a list of all the players in the player table
app.get("/players/", async (request, response) => {
  const getQuery = `select * from player_details order by player_id`;
  const result = await db.all(getQuery);
  response.send(
    result.map((eachItem) => dataConvertingToResultFormat(eachItem))
  );
});

//Returns a specific player based on the player ID
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getQuery = `select * from player_details where player_id=${playerId}`;
  const result = await db.get(getQuery);
  response.send(dataConvertingResultFormat(result));
});

//Updates the details of a specific player based on the player ID
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerName = request.body;
  const putQuery = `update player_details set player_name='${playerName}' where player_id=${playerId}`;
  await db.run(putQuery);
  response.send("Player Details Updated");
});

//Returns the match details of a specific match
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getQuery = `select * from match_details where match_id=${matchId}`;
  const result = await db.get(getQuery);
  response.send({
    matchId: result.match_id,
    match: result.match,
    year: result.year,
  });
});

//Returns a list of all the matches of a player
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getQuery = `select * from match_details natural join player_match_score where player_id=${playerId}`;
  const matchResult = await db.all(getQuery);
  response.send(matchResult.map((eachItem) => matchDataResultFormat(eachItem)));
});

//Returns a list of players of a specific match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
	    SELECT
	      player_details.player_id AS playerId,
	      player_details.player_name AS playerName
	    FROM player_match_score NATURAL JOIN player_details
        WHERE match_id=${matchId};`;
  const matchResult = await db.all(getMatchPlayersQuery);
  response.send(matchResult);
});

//Returns the statistics of the total score, fours, sixes of a specific player based on the player ID
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScored = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;
  const result = await db.get(getPlayerScored);
  response.send(result);
});

module.exports = app;
