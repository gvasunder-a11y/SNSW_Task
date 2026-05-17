const axios = require('axios');
const fs = require('fs');
const path = require('path');
const ConfigManager = require('../utils/configManager');
require('dotenv').config();

// FuelApiClient handles authentication and reference data requests for the NSW Fuel API.
class FuelApiClient {
  constructor() {
    // Base URL for the NSW Fuel API.
    this.baseUrl = 'https://api.onegov.nsw.gov.au';
    // Load API credentials from environment variables.
    this.apiKey = process.env.API_KEY;
    this.apiSecret = process.env.API_SECRET;
    this.authHeader = process.env.AUTH_HEADER;
    // Config manager writes runtime values back to config.json.
    this.configManager = new ConfigManager();
  }

  async getAccessToken() {
    // Request a new OAuth access token using client credentials.
    try {
      const response = await axios.get(`${this.baseUrl}/oauth/client_credential/accesstoken`, {
        params: { grant_type: 'client_credentials' },
        headers: {
          'Authorization': this.authHeader,
          'accept': 'application/json'
        }
      });

      const accessToken = response.data.access_token;
      // Persist the latest access token in config.json for other tests.
      this.configManager.updateConfig('api.accessToken', accessToken);
      return accessToken;
    } catch (error) {
      // Bubble up a descriptive error if the token request fails.
      throw new Error(`Failed to get access token: ${error.message}`);
    }
  }

  async getReferenceData(accessToken) {
    // Build request headers and unique metadata for the reference data call.
    const transactionId = this.generateTransactionId();
    const timestamp = this.getCurrentTimestamp();

    try {
      const response = await axios.get(`${this.baseUrl}/FuelCheckRefData/v1/fuel/lovs`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=utf-8',
          'apikey': this.apiKey,
          'transactionid': transactionId,
          'requesttimestamp': timestamp,
          'if-modified-since': timestamp,
          'accept': 'application/json'
        }
      });

      // Persist the API response to the test-results folder for review.
      const responsePath = path.join(__dirname, '../test-results/reference-data.json');
      fs.writeFileSync(responsePath, JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      // Bubble up a descriptive error if the reference data request fails.
      throw new Error(`Failed to get reference data: ${error.message}`);
    }
  }

  generateTransactionId() {
    // Generate a random six-digit transaction identifier.
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  getCurrentTimestamp() {
    // Format the current date and time as dd/MM/yyyy hh:mm:ss.
    const now = new Date();
    return now.toLocaleDateString('en-GB') + ' ' + now.toLocaleTimeString('en-GB', { hour12: false });
  }
}

module.exports = FuelApiClient;