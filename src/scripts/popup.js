import { browserAPI, CONFIG_KEYS } from './commons.js';

// Configuration elements
const configureButton = document.getElementById('configure');

// Open configuration page in the popup
configureButton.addEventListener('click', () => {
    window.location.href = 'config.html';
});
