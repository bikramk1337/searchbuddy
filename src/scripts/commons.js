// Browser API compatibility
export const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Common configuration keys
export const CONFIG_KEYS = {
    OLLAMA_URL: 'ollamaUrl',
    SELECTED_MODEL: 'selectedModel',
    CONNECTION_TESTED: 'connectionTested'
};

// Test connection to Ollama server
export async function testOllamaConnection(url) {
    try {
        const response = await fetch(`${url}/api/tags`);
        await response.json();
        return true;
    } catch (error) {
        console.error('Connection test failed:', error);
        return false;
    }
}

// Get stored configuration
export async function getConfig() {
    return new Promise(resolve => 
        browserAPI.storage.local.get([
            CONFIG_KEYS.OLLAMA_URL,
            CONFIG_KEYS.SELECTED_MODEL,
            CONFIG_KEYS.CONNECTION_TESTED
        ], resolve)
    );
}

// Save configuration
export async function saveConfig(config) {
    return new Promise((resolve, reject) => {
        browserAPI.storage.local.set(config, () => {
            if (browserAPI.runtime.lastError) {
                reject(browserAPI.runtime.lastError);
            } else {
                resolve();
            }
        });
    });
}