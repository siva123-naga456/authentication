const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();
app.use(express.json());

let db = null;
const dbPath = path.join(__dirname, "covid19IndiaPortal.db");

// databaseConnection
const dbConnection = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    //app.local(3000);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
};
dbConnection();

//middleware function
const authenticateToken = (request, response, next) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "MY_SECRET_TOKEN", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        request.username = payload.username;
        next();
      }
    });
  }
};

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDbObjectsToResponseObject = (dbObjects) => {
  return {
    stateId: dbObjects.state_id,
    stateName: dbObjects.state_name,
    population: dbObjects.population,
  };
};

const convertDbObjectResponseObject = (dbObjects) => {
  return {
    districtId: dbObjects.district_id,
    districtName: dbObjects.district_name,
    cases: dbObjects.cases,
    cured: dbObjects.cured,
    active: dbObjects.active,
    deaths: dbObjects.deaths,
  };
};

const counting = (results) => {
  return {
    totalCases: results.cases,
    totalCured: results.cured,
    totalActive: results.active,
    totalDeaths: results.deaths,
  };
};

//login Api
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      const payload = {
        username: username,
      };
      const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//Returns a list of all states in the state table
app.get("/states/", authenticateToken, async (request, response) => {
  const getQuery = `select * from state order by state_id`;
  const result = await db.all(getQuery);
  response.send(
    result.map((eachPlayer) => convertDbObjectToResponseObject(eachPlayer))
  );
});

//Returns a state based on the state ID
app.get("/states/:stateId/", authenticateToken, async (request, response) => {
  const { stateId } = request.params;
  const getQuery = `select * from state where state_id=${stateId}`;
  const results = await db.get(getQuery);
  response.send(convertDbObjectsToResponseObject(results));
});

//Create a district in the district table
app.post("/districts/", authenticateToken, async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const insertQuery = `insert into district(district_name,state_id,cases,cured,active,deaths) 
  values('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  await db.run(insertQuery);
  response.send("District Successfully Added");
});

//Returns a district based on the district ID
app.get(
  "/districts/:districtId/",
  authenticateToken,
  async (request, response) => {
    const { districtId } = request.params;
    const getQuery = `select * from district where district_id=${districtId}`;
    const results = await db.get(getQuery);
    response.send(convertDbObjectResponseObject(results));
  }
);

//Deletes a district from the district table based on the district ID
app.delete(
  "/districts/:districtId/",
  authenticateToken,
  async (request, response) => {
    const { districtId } = request.params;
    const deleteQuery = `delete from district where district_id=${districtId}`;
    await db.run(deleteQuery);
    response.send("District Removed");
  }
);

//Updates the details of a specific district based on the district ID
app.put(
  "/districts/:districtId/",
  authenticateToken,
  async (request, response) => {
    const { districtId } = request.params;
    const {
      districtName,
      stateId,
      cases,
      cured,
      active,
      deaths,
    } = request.body;
    const updateQuery = `update district set district_name='${districtName}',state_id=${stateId},cases=${cases},cured=${cured},active=${active},deaths=${deaths} where district_id=${districtId}`;
    await db.run(updateQuery);
    response.send("District Details Updated");
  }
);

//Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID
app.get(
  "/states/:stateId/stats/",
  authenticateToken,
  async (request, response) => {
    const { stateId } = request.params;
    const getQuery = `select count(cases) as cases,count(cured) as cured,count(active) as active,count(deaths) as deaths from district where state_id=${stateId}`;
    const results = await db.get(getQuery);
    response.send(counting(results));
  }
);

module.exports = app;
