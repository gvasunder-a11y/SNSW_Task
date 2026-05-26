const axios = require('axios');
const fs = require('fs');
const path = require('path');
const ConfigManager = require('../utils/configManager');
require('dotenv').config();

// FuelApiClient centralises NSW Fuel API authentication and reference-data calls.
// Tests use this client instead of constructing HTTP requests directly in specs.
class FuelApiClient {
  constructor() {
    // Base URL comes from config so the same client can be pointed at another environment.
    this.configManager = new ConfigManager();
    this.baseUrl = this.configManager.getApiConfig().baseUrl;

    // Secrets are intentionally loaded from environment variables, not config.json.
    this.apiKey = process.env.API_KEY;
    this.apiSecret = process.env.API_SECRET;
    this.authHeader = process.env.AUTH_HEADER;
  }

  async getAccessToken() {
    // Request a fresh OAuth token for each API flow.
    // The token is returned to the caller and not written into tracked config.
    const response = await this.getAccessTokenResponse();
    return response.data.access_token;
  }

  async getAccessTokenResponse(options = {}) {
    const { headers = {}, params = {}, ...requestOptions } = options;

    try {
      const response = await axios.get(`${this.baseUrl}/oauth/client_credential/accesstoken`, {
        params: { grant_type: 'client_credentials', ...params },
        timeout: 30000,
        headers: {
          'Authorization': this.authHeader,
          'accept': 'application/json',
          ...headers
        },
        ...requestOptions
      });

      return response;
    } catch (error) {
      // Surface a clear message in Playwright reports if authentication fails.
      throw new Error(`Failed to get access token: ${error.message}`);
    }
  }

  async getReferenceData(accessToken) {
    const response = await this.getReferenceDataResponse(accessToken);
    return response.data;
  }

  async getReferenceDataResponse(accessToken, options = {}) {
    // Build unique request metadata required by the NSW API gateway.
    const transactionId = this.generateTransactionId();
    const timestamp = this.getCurrentTimestamp();
    const { headers = {}, ...requestOptions } = options;

    try {
      const response = await axios.get(`${this.baseUrl}/FuelCheckRefData/v1/fuel/lovs`, {
        timeout: 30000,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=utf-8',
          'apikey': this.apiKey,
          'transactionid': transactionId,
          'requesttimestamp': timestamp,
          'if-modified-since': timestamp,
          'accept': 'application/json',
          ...headers
        },
        ...requestOptions
      });

      if (response.status >= 200 && response.status < 300) {
        // Persist response data as an artifact for interview/review evidence.
        const responsePath = path.join(__dirname, '../test-results/reference-data.json');
        fs.mkdirSync(path.dirname(responsePath), { recursive: true });
        fs.writeFileSync(responsePath, JSON.stringify(response.data, null, 2));
      }

      return response;
    } catch (error) {
      // Keep API failures actionable in the report.
      throw new Error(`Failed to get reference data: ${error.message}`);
    }
  }

  generateTransactionId() {
    // NSW API metadata expects a six-digit transaction identifier.
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  getCurrentTimestamp() {
    // NSW API headers use a day-first timestamp format.
    const now = new Date();
    return now.toLocaleDateString('en-GB') + ' ' + now.toLocaleTimeString('en-GB', { hour12: false });
  }
}

module.exports = FuelApiClient;
