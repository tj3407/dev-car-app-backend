require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const pino = require("express-pino-logger")();
const smartcar = require("smartcar");

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(pino);
const PORT = process.env.PORT || 8000;

let access = "";

const client = new smartcar.AuthClient({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URI,
  scope: ["required:read_vehicle_info"],
  testMode: true,
});

app.get("/api/exchange", function (req, res) {
  const code = req.query.code;
  res.header("Access-Control-Allow-Origin", "*");
  // TODO: Request Step 1: Obtain an access token
  return client.exchangeCode(code).then(function (_access) {
    // in a production app you'll want to store this in some kind of persistent storage
    access = _access;

    res.sendStatus(200);
  });
});

app.get("/api/vehicle", function (req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  return smartcar
    .getVehicleIds(access.accessToken)
    .then((data) => data.vehicles)
    .then((vehicleIds) => {
      let vehicleArray = [];
      vehicleIds.map((id) => {
        let car = new smartcar.Vehicle(id, access.accessToken);
        vehicleArray.push(car.info());
      });
      return Promise.all(vehicleArray);
    })
    .then((data) => res.json(data));
});

app.get("/api/vehicle/:id/odometer", function (req, res) {
  const carId = req.params.id;

  res.header("Access-Control-Allow-Origin", "*");
  let car = new smartcar.Vehicle(carId, access.accessToken);
  car.odometer().then((data) => res.json(data));
});

app.get("/api/vehicle/:id/engine/oil", function (req, res) {
  const carId = req.params.id;

  res.header("Access-Control-Allow-Origin", "*");
  let car = new smartcar.Vehicle(carId, access.accessToken);
  car.oil().then((data) => res.json(data));
});

app.get("/api/vehicle/:id/battery", function (req, res) {
  const carId = req.params.id;

  res.header("Access-Control-Allow-Origin", "*");
  let car = new smartcar.Vehicle(carId, access.accessToken);
  car.battery().then((data) => res.json(data));
});

app.get("/api/vehicle/:id/location", function (req, res) {
  const carId = req.params.id;

  res.header("Access-Control-Allow-Origin", "*");
  let car = new smartcar.Vehicle(carId, access.accessToken);
  car.location().then((data) => res.json(data));
});

app.get("/api/vehicle/:id/charge", function (req, res) {
  const carId = req.params.id;

  res.header("Access-Control-Allow-Origin", "*");
  let car = new smartcar.Vehicle(carId, access.accessToken);
  car.charge().then((data) => res.json(data));
});

app.get("/api/vehicle/:id/fuel", function (req, res) {
  const carId = req.params.id;

  res.header("Access-Control-Allow-Origin", "*");
  let car = new smartcar.Vehicle(carId, access.accessToken);
  car.fuel().then((data) => res.json(data));
});

app.get("/api/vehicle/:id/tires/pressure", function (req, res) {
  const carId = req.params.id;

  res.header("Access-Control-Allow-Origin", "*");
  let car = new smartcar.Vehicle(carId, access.accessToken);
  car.tirePressure().then((data) => res.json(data));
});

app.get("/api/vehicle/:id/vin", function (req, res) {
  const carId = req.params.id;

  res.header("Access-Control-Allow-Origin", "*");
  let car = new smartcar.Vehicle(carId, access.accessToken);
  car.vin().then((data) => res.json(data));
});

app.listen(PORT, () =>
  console.log("Express server is running on localhost:" + PORT)
);
