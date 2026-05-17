const { test, expect } = require('@playwright/test');
const FuelApiClient = require('../../api/fuelApi');
const ConfigManager = require('../../utils/configManager');

// API test suite for NSW Fuel API automation.
test.describe('NSW Fuel API Automation', () => {
  let apiClient, configManager;

  test.beforeEach(() => {
    // Initialize the API client and config manager before each test.
    apiClient = new FuelApiClient();
    configManager = new ConfigManager();
  });

  test('GET request validation - Get Access Token', async () => {
    // Request a fresh access token from the OAuth endpoint.
    const accessToken = await apiClient.getAccessToken();
    expect(accessToken).toBeDefined();
    expect(typeof accessToken).toBe('string');
    expect(accessToken.length).toBeGreaterThan(0);

    // Verify the access token is persisted in config.json.
    const updatedConfig = configManager.getApiConfig();
    expect(updatedConfig.accessToken).toBe(accessToken);
  });

  test('Request with query parameters - Get Reference Data', async () => {
    // Use the access token to request reference data.
    const accessToken = await apiClient.getAccessToken();
    const referenceData = await apiClient.getReferenceData(accessToken);
    expect(referenceData).toBeDefined();
    expect(referenceData).toHaveProperty('brands');
    expect(referenceData).toHaveProperty('fueltypes');
    expect(referenceData).toHaveProperty('stations');
  });

  test('Response validation - Validate Reference Data Structure', async () => {
    // Validate the full reference data response structure.
    const accessToken = await apiClient.getAccessToken();
    const referenceData = await apiClient.getReferenceData(accessToken);

    expect(referenceData.brands).toBeDefined();
    expect(referenceData.brands).toHaveProperty('items');
    expect(Array.isArray(referenceData.brands.items)).toBe(true);

    expect(referenceData.fueltypes).toBeDefined();
    expect(referenceData.fueltypes).toHaveProperty('items');
    expect(Array.isArray(referenceData.fueltypes.items)).toBe(true);

    expect(referenceData.stations).toBeDefined();
    expect(referenceData.stations).toHaveProperty('items');
    expect(Array.isArray(referenceData.stations.items)).toBe(true);

    // If stations are returned, validate the structure of the first item.
    if (referenceData.stations.items.length > 0) {
      const station = referenceData.stations.items[0];
      expect(station).toHaveProperty('brandid');
      expect(station).toHaveProperty('stationid');
      expect(station).toHaveProperty('brand');
      expect(station).toHaveProperty('code');
      expect(station).toHaveProperty('name');
      expect(station).toHaveProperty('address');
      expect(station).toHaveProperty('location');
      expect(station.location).toHaveProperty('latitude');
      expect(station.location).toHaveProperty('longitude');
      expect(station).toHaveProperty('isAdBlueAvailable');
      expect(typeof station.isAdBlueAvailable).toBe('boolean');
    }
  });

  test('Negative test case - Invalid Access Token', async () => {
    // Verify the API returns an error when an invalid token is used.
    try {
      await apiClient.getReferenceData('invalid_token');
      expect(true).toBe(false); // This should never happen.
    } catch (error) {
      expect(error.message).toContain('Failed to get reference data');
    }
  });
});