'use strict';

require("dotenv").config();
const express = require('express');
const exphbs = require('express-handlebars');
const smartcar = require('smartcar');
const axios = require('axios');

const app = express();
app.engine(
  '.hbs',
  exphbs({
    defaultLayout: 'main',
    extname: '.hbs',
  }),
);
app.set('view engine', '.hbs');
const port = 8000;

const client = new smartcar.AuthClient({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URI,
  scope: ['required:read_vehicle_info', "required:read_location", "required:read_tires", "required:read_odometer", "required:read_battery"],
  testMode: true,
});

// global variable to save our accessToken
let access;

app.get('/login', function(req, res) {
  const authUrl = client.getAuthUrl();

  res.render('home', {
    url: authUrl,
  });
});

app.get('/exchange', function(req, res) {
  const code = req.query.code;

  return client.exchangeCode(code)
    .then(function(_access) {
      // in a production app you'll want to store this in some kind of persistent storage
      access = _access;
      res.redirect('/vehicle');
    });
});

app.get('/vehicle', function(req, res) {
  return smartcar.getVehicleIds(access.accessToken)
    .then(function(data) {
      // the list of vehicle ids
      return data.vehicles;
    })
    .then(async function(vehicleIds) {
      const response = {
        vehicleArray: []
      };

      vehicleIds.map((id) => {
        let car = new smartcar.Vehicle(id, access.accessToken);
        response.vehicleArray.push(car.info());
      });
      await Promise.all(response.vehicleArray);
      return response;
    })
    .then(function(info) {
      const updatedObj = Object.assign({}, info);
      updatedObj.refreshToken = access.refreshToken;
      res.json(updatedObj);
    });
});

app.get('/getVehicleData', async function(req, res) {
  const id = req.query.vehicleId;
  const distanceUrl = `https://api.smartcar.com/v1.0/vehicles/${id}/odometer`;
  const batteryLevel = `https://api.smartcar.com/v1.0/vehicles/${id}/battery`;
  const tirePressure = `https://api.smartcar.com/v1.0/vehicles/${id}/tires/pressure`;
  const location = `https://api.smartcar.com/v1.0/vehicles/${id}/location`;
  const vehicleData = {};

  
  vehicleData.distance = await axios({
    method: "GET",
    url: distanceUrl,
    headers: { 'Authorization': `Bearer ${access.accessToken}` }
  })
    .then(info => info.data);
  
  vehicleData.batteryLevel = await axios({
    method: "GET",
    url: batteryLevel,
    headers: { 'Authorization': `Bearer ${access.accessToken}` }
  })
    .then(info => info.data)
    .catch(err => console.log('battery', err))

  vehicleData.location = await axios({
    method: "GET",
    url: location,
    headers: { 'Authorization': `Bearer ${access.accessToken}` }
  })
    .then(info => info.data)
    .catch(err => console.log('tire pressure', err))

  res.json(vehicleData);
});

app.listen(port, () => console.log(`Listening on port ${port}`));