const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());
let db = null;
const dbPath = path.join(__dirname, "covid19India.db");

// databaseConnection
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
//function for Api1
const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictDbObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//Returns a list of all states in the state table
app.get("/states/", async (request, response) => {
  const getQuery = `select * from state order by state_id`;
  const result = await db.all(getQuery);
  response.send(
    result.map((eachPlayer) => convertDbObjectToResponseObject(eachPlayer))
  );
});

//Returns a state based on the state ID
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getQuery = `select * from state where state_id=${stateId}`;
  const results = await db.get(getQuery);
  response.send({
    stateId: results.state_id,
    stateName: results.state_name,
    population: results.population,
  });
});

//Create a district in the district table
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const insertQuery = `insert into district(district_name,state_id,cases,cured,active,deaths) 
  values('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  await db.run(insertQuery);
  response.send("District Successfully Added");
});

//Returns a district based on the district ID
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getQuery = `select * from district where district_id=${districtId}`;
  const district = await db.get(getQuery);
  response.send(convertDistrictDbObjectToResponseObject(district));
});

//Deletes a district from the district table based on the district ID
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `delete from district where district_id=${districtId}`;
  await db.run(deleteQuery);
  response.send("District Removed");
});

//Updates the details of a specific district based on the district ID
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateQuery = `update district set district_name='${districtName}',state_id=${stateId},cases=${cases},cured=${cured},active=${active},deaths=${deaths} where district_id=${districtId}`;
  await db.run(updateQuery);
  response.send("District Details Updated");
});

//Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getQuery = `select sum(cases), sum(cured),sum(active),sum(deaths) from district where state_id=${stateId}`;
  const results = await db.get(getQuery);
  response.send({
    totalCases: results["sum(cases)"],
    totalCured: results["sum(cured)"],
    totalActive: results["sum(active)"],
    totalDeaths: results["sum(deaths)"],
  });
});

//Returns an object containing the state name of a district based on the district ID
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getQuery = `select state_id from district where district_id=${districtId}`;
  const result = await db.get(getQuery);
  const getStateNameQuery = `select state_name as stateName from state where state_id = ${result.state_id};`;
  const getStateNameQueryResponse = await db.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});

module.exports = app;
