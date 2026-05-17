const fs = require('fs');
const path = require('path');

// ConfigManager provides central read access to non-secret framework config.
// Page objects and API clients use this helper instead of hardcoding URLs or test data.
class ConfigManager {
  constructor() {
    // Resolve the config path once so callers can instantiate this class from any folder.
    this.configPath = path.join(__dirname, '../config/config.json');
    this._cachedConfig = null;
  }

  getConfig() {
    // Cache config after first read to avoid repeated file I/O during a test.
    if (!this._cachedConfig) {
      this._cachedConfig = JSON.parse(
        fs.readFileSync(this.configPath, 'utf8')
      );
    }

    return this._cachedConfig;
  }

  updateConfig(key, value) {
    // Utility retained for future non-secret runtime config updates.
    // Current API access tokens are deliberately not persisted through this method.
    const config = this.getConfig();
    const keys = key.split('.');

    let obj = config;
    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]];
    }

    obj[keys[keys.length - 1]] = value;

    fs.writeFileSync(
      this.configPath,
      JSON.stringify(config, null, 2)
    );

    this._cachedConfig = config;
  }

  getTestData() {
    // Returns all reusable test data, such as plate numbers.
    return this.getConfig().testData;
  }

  getApiConfig() {
    // Returns API configuration, including the API base URL.
    return this.getConfig().api;
  }

  getUiConfig() {
    // Returns UI configuration, including the Service NSW base URL.
    return this.getConfig().ui;
  }

  // Happy-path plate number used by the renewal UI scenario.
  getHappyPathPlate() {
    return this.getConfig()?.testData?.plateNumbers?.happyPath;
  }

  // Negative plate number used to validate the renewal app error state.
  getNegativePlate() {
    return this.getConfig()?.testData?.plateNumbers?.negative;
  }
}

module.exports = ConfigManager;
