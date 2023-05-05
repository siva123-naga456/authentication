const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();

app.use(express.json());
let db = null;

const dbPath = path.join(__dirname, "moviesData.db");
//db connection

const dbConnection = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
};
dbConnection();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    movieName: dbObject.movie_name,
  };
};

//function for Ap3
const convertDbObjectsToResponseObject = (dbObjects) => {
  return {
    movieId: dbObjects.movie_id,
    directorId: dbObjects.director_id,
    movieName: dbObjects.movie_name,
    leadActor: dbObjects.lead_actor,
  };
};

const convertDirectorDbObjectToResponseObject = (eachPlayer) => {
  return {
    directorId: eachPlayer.director_id,
    directorName: eachPlayer.director_name,
  };
};
//Returns a list of all movie names in the movie table
app.get("/movies/", async (request, response) => {
  const getQuery = `select * from movie order by movie_id`;
  const result = await db.all(getQuery);
  response.send(
    result.map((eachPlayer) => convertDbObjectToResponseObject(eachPlayer))
  );
});

//Creates a new movie in the movie table

app.post("/movies/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const insertQuery = `insert into movie(director_id,movie_name,lead_actor) values(${directorId},'${movieName}','${leadActor}');`;
  await db.run(insertQuery);
  response.send("Movie Successfully Added");
});

//Returns a movie based on the movie ID

app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getQuery = `select * from movie where movie_id=${movieId}`;
  const results = await db.get(getQuery);
  response.send(convertDbObjectsToResponseObject(results));
});

//Updates the details of a movie in the movie table based on the movie ID
app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const { directorId, movieName, leadActor } = request.body;
  const updateQuery = `update movie set director_id=${directorId},movie_name='${movieName}',lead_actor='${leadActor}' where movie_id=${movieId}`;
  await db.run(updateQuery);
  response.send("Movie Details Updated");
});

//Deletes a movie from the movie table based on the movie ID
app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteQuery = `delete from movie where movie_id=${movieId}`;
  await db.run(deleteQuery);
  response.send("Movie Removed");
});

//Returns a list of all directors in the director table
app.get("/directors/", async (request, response) => {
  const getQuery = `select * from director order by director_id`;
  const result = await db.all(getQuery);
  response.send(
    result.map((eachPlayer) =>
      convertDirectorDbObjectToResponseObject(eachPlayer)
    )
  );
});

//Returns a list of all movie names directed by a specific director
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getQuery = `select * from movie where director_id=${directorId}`;
  const result = await db.all(getQuery);
  response.send(
    result.map((eachPlayer) => convertDbObjectToResponseObject(eachPlayer))
  );
});
module.exports = app;
