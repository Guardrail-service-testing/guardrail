require('dotenv').config({ debug: process.env.DEBUG })
const express = require('express')
const morgan = require('morgan')
const { Sequelize, DataTypes, Model } = require('sequelize');



const sequelize = new Sequelize(
  process.env.POSTGRES_DB,
  process.env.POSTGRES_USER,
  process.env.POSTGRES_PASSWORD,
  {
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
  });

// test connection
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();

const CapturedExchange = sequelize.define('CapturedExchange', {
  gor_id: DataTypes.STRING,
  unix_timestamp: DataTypes.INTEGER,
  latency: DataTypes.INTEGER,
  raw_request: DataTypes.JSON,
  raw_response: DataTypes.JSON,
})

const ReplayedExchange = sequelize.define('ReplayedExchange', {
  gor_id: DataTypes.STRING,
  unix_timestamp: DataTypes.INTEGER,
  latency: DataTypes.INTEGER,
  raw_response: DataTypes.JSON,
})

CapturedExchange.hasMany(ReplayedExchange, { foreignKey: 'gor_id' });

(async () => {
  try {
    await sequelize.sync({ force: true });
    console.log("All models were synchronized successfully.");
  } catch (e) {
    console.error(e)
  }
})();