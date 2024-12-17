import { browserAPI, CONFIG_KEYS, testOllamaConnection, saveConfig } from './commons.js';

// Configuration elements
const ollamaUrlInput = document.getElementById('ollama-url');
const modelSelect = document.getElementById('model-select');
const refreshButton = document.getElementById('refresh-models');
const saveButton = document.getElementById('save-config');
const backButton = document.getElementById('back-button');
const connectionStatus = document.getElementById('connection-status');
const modelSection = document.getElementById('model-section');

let connectionTestTimeout;

// Initialize page
async function initializePage() {
    // Load saved configuration
    const config = await new Promise(resolve => 
        browserAPI.storage.local.get([
            CONFIG_KEYS.OLLAMA_URL,
            CONFIG_KEYS.SELECTED_MODEL,
            CONFIG_KEYS.CONNECTION_TESTED
        ], resolve)
    );
    
    // If we have a saved URL, use it instead of the default
    if (config[CONFIG_KEYS.OLLAMA_URL]) {
        ollamaUrlInput.value = config[CONFIG_KEYS.OLLAMA_URL];
        if (config[CONFIG_KEYS.CONNECTION_TESTED]) {
            // If connection was previously tested successfully, show that status
            updateConnectionStatus('Connection successful! Loading models...', 'success');
            showModelSection(true);
            await fetchModels();
            modelSelect.value = config[CONFIG_KEYS.SELECTED_MODEL] || '';
            updateSaveButton();
            return;
        }
    }

    // Test the connection (either default or saved URL)
    testConnection();
}

// Test connection to Ollama
async function testConnection() {
    const url = ollamaUrlInput.value.trim();
    if (!url) {
        updateConnectionStatus('Please enter Ollama URL', 'error');
        return false;
    }

    try {
        updateConnectionStatus('Testing connection...', '');
        const isConnected = await testOllamaConnection(url);
        
        if (isConnected) {
            updateConnectionStatus('Connection successful! Loading models...', 'success');
            showModelSection(true);
            await fetchModels();
            await saveConfig({
                [CONFIG_KEYS.OLLAMA_URL]: url,
                [CONFIG_KEYS.CONNECTION_TESTED]: true
            });
            return true;
        } else {
            throw new Error('Connection failed');
        }
    } catch (error) {
        console.error('Connection test failed:', error);
        updateConnectionStatus('Connection failed. Please check URL and try again.', 'error');
        showModelSection(false);
        return false;
    }
}

function updateConnectionStatus(message, status) {
    connectionStatus.textContent = message;
    connectionStatus.className = `status ${status}`;
}

function showModelSection(show) {
    modelSection.style.display = show ? 'block' : 'none';
    modelSection.classList.toggle('active', show);
    modelSelect.disabled = !show;
    if (!show) {
        saveButton.disabled = true;
    }
}

// Fetch available models
async function fetchModels() {
    const url = ollamaUrlInput.value.trim();
    const currentSelection = modelSelect.value; // Store current selection
    
    try {
        modelSelect.innerHTML = '<option value="">Loading models...</option>';
        modelSelect.disabled = true;
        
        const response = await fetch(`${url}/api/tags`);
        const data = await response.json();
        
        modelSelect.innerHTML = ''; // Clear existing options
        
        // Add empty option as default
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select a model';
        modelSelect.appendChild(defaultOption);
        
        if (data.models && data.models.length > 0) {
            data.models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.name;
                option.textContent = model.name;
                modelSelect.appendChild(option);
            });
            
            modelSelect.disabled = false;
            // Restore previous selection if it exists in the new list
            if (currentSelection && data.models.some(m => m.name === currentSelection)) {
                modelSelect.value = currentSelection;
            }
        } else {
            throw new Error('No models found');
        }
    } catch (error) {
        console.error('Error fetching models:', error);
        modelSelect.innerHTML = '<option value="">No models available</option>';
        modelSelect.disabled = true;
    }
    updateSaveButton();
}

function updateSaveButton() {
    const url = ollamaUrlInput.value.trim();
    const model = modelSelect.value;
    saveButton.disabled = !url || !model || modelSelect.disabled;
}

// Event listeners
refreshButton.addEventListener('click', fetchModels);
backButton.addEventListener('click', () => {
    window.location.href = 'popup.html';
});

ollamaUrlInput.addEventListener('input', () => {
    // Clear any existing timeout
    if (connectionTestTimeout) {
        clearTimeout(connectionTestTimeout);
    }

    modelSection.style.display = 'none';
    modelSelect.disabled = true;
    saveButton.disabled = true;
    
    const url = ollamaUrlInput.value.trim();
    if (!url) {
        updateConnectionStatus('Please enter Ollama URL', 'error');
        return;
    }

    updateConnectionStatus('Testing connection...', '');
    
    // Set a new timeout to test connection after user stops typing
    connectionTestTimeout = setTimeout(() => {
        testConnection();
    }, 500);
});

modelSelect.addEventListener('change', updateSaveButton);

saveButton.addEventListener('click', async () => {
    const url = ollamaUrlInput.value.trim();
    const model = modelSelect.value;

    try {
        await saveConfig({
            [CONFIG_KEYS.OLLAMA_URL]: url,
            [CONFIG_KEYS.SELECTED_MODEL]: model,
            [CONFIG_KEYS.CONNECTION_TESTED]: true
        });
        updateConnectionStatus('Configuration saved successfully!', 'success');
        
        // Reset status message after 2 seconds
        setTimeout(() => {
            updateConnectionStatus('Connection successful!', 'success');
        }, 2000);
    } catch (error) {
        console.error('Error saving configuration:', error);
        updateConnectionStatus('Failed to save configuration', 'error');
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', initializePage);