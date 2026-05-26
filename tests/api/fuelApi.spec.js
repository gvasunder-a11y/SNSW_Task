const { test, expect } = require('@playwright/test');
const FuelApiClient = require('../../api/fuelApiClient');
const { attachApiExchange } = require('../../utils/apiEvidenceHelper');

function expectSuccessfulStatus(status) {
  expect(status).toBeGreaterThanOrEqual(200);
  expect(status).toBeLessThan(300);
}

// API tests validate the lower-level NSW Fuel API integration separately from UI flows.
// Keeping this coverage outside UI tests gives faster feedback and clearer failure causes.
test.describe('NSW Fuel API Automation', () => {
  let fuelApiClient;

  test.beforeEach(() => {
    // Create a fresh client so each test owns its request headers and generated metadata.
    fuelApiClient = new FuelApiClient();
  });

  test('GET request validation - Get Access Token', async ({}, testInfo) => {
    const response = await fuelApiClient.getAccessTokenResponse({
      validateStatus: () => true
    });
    await attachApiExchange(testInfo, 'Get Access Token', response);

    expect(response.config.method).toBe('get');
    expect(response.config.url).toContain('/oauth/client_credential/accesstoken');
    expectSuccessfulStatus(response.status);

    const accessToken = response.data.access_token;
    expect(accessToken).toBeTruthy();
    expect(typeof accessToken).toBe('string');
    expect(accessToken.length).toBeGreaterThan(10);
  });

  test('Request with query parameters - Get Access Token grant type', async ({}, testInfo) => {
    const response = await fuelApiClient.getAccessTokenResponse({
      validateStatus: () => true
    });
    await attachApiExchange(testInfo, 'Get Access Token With Grant Type', response);

    expect(response.config.params).toMatchObject({
      grant_type: 'client_credentials'
    });
    expectSuccessfulStatus(response.status);
    expect(response.data.access_token).toBeTruthy();
  });

  test('Response validation - Get Reference Data', async ({}, testInfo) => {
    // Uses the token from the auth API to call the reference-data endpoint.
    // The response is persisted by the client as an execution artifact for review.
    const accessTokenResponse = await fuelApiClient.getAccessTokenResponse({
      validateStatus: () => true
    });
    await attachApiExchange(testInfo, 'Get Access Token For Reference Data', accessTokenResponse);
    expectSuccessfulStatus(accessTokenResponse.status);

    const accessToken = accessTokenResponse.data.access_token;
    const response = await fuelApiClient.getReferenceDataResponse(accessToken, {
      validateStatus: () => true
    });
    await attachApiExchange(testInfo, 'Get Reference Data', response);

    console.log(JSON.stringify(response.data, null, 2));

    expectSuccessfulStatus(response.status);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.data).toBeTruthy();
    expect(typeof response.data).toBe('object');
    expect(Object.keys(response.data).length).toBeGreaterThan(0);
  });

  test('Negative API validation - invalid token returns non-2xx status', async ({}, testInfo) => {
    const response = await fuelApiClient.getReferenceDataResponse('invalid-token', {
      validateStatus: () => true
    });
    await attachApiExchange(testInfo, 'Get Reference Data With Invalid Token', response);

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(600);
    expect(response.status < 200 || response.status >= 300).toBe(true);
    expect(response.data).toBeTruthy();
  });

  test('Validate transaction ID generation', async () => {
    // Header metadata check: NSW API requests require a six-digit transaction identifier.
    const transactionId = fuelApiClient.generateTransactionId();

    expect(transactionId).toBeTruthy();
    expect(transactionId).toHaveLength(6);
    expect(Number.isNaN(Number(transactionId))).toBe(false);
  });

  test('Validate current timestamp generation', async () => {
    // Header metadata check: timestamp should be produced in the expected date/time shape.
    const timestamp = fuelApiClient.getCurrentTimestamp();

    expect(timestamp).toBeTruthy();
    expect(typeof timestamp).toBe('string');
    expect(timestamp).toContain('/');
    expect(timestamp).toContain(':');
  });
});
