const fs = require('fs');
const path = require('path');

// ConfigManager provides centralized access to the JSON config file.
// It reads and updates configuration values used across UI and API tests.
class ConfigManager {
  constructor() {
    // Build an absolute path to the shared config file.
    this.configPath = path.join(__dirname, '../config/config.json');
  }

  getConfig() {
    // Load the JSON file and parse it into a JavaScript object.
    return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
  }

  updateConfig(key, value) {
    // Read the current config, update a nested key, and write it back.
    const config = this.getConfig();
    const keys = key.split('.');
    let obj = config;
    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
  }

  getTestData() {
    // Return test data values such as plate numbers from the config.
    return this.getConfig().testData;
  }

  getApiConfig() {
    // Return the API-specific configuration section.
    return this.getConfig().api;
  }

  getUiConfig() {
    // Return the UI-specific configuration section.
    return this.getConfig().ui;
  }
}

module.exports = ConfigManager;