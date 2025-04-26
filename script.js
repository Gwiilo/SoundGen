// Import functions from noise.js
import { getNoiseFromKey, getNoiseFromParams, playNoise } from './noise.js';

///////////////////////////
// UI Behavior: Show/hide fieldsets and handle parameters
///////////////////////////
document.addEventListener('DOMContentLoaded', function() {
  // Initialize parameter value displays for all sliders
  document.querySelectorAll('.slider').forEach(slider => {
    const id = slider.id;
    updateParamOutput(id);
  });
  
  // Add collapsible functionality to all sections
  document.querySelectorAll('.collapse-toggle').forEach(toggle => {
    toggle.addEventListener('click', function(e) {
      const section = this.closest('.collapsible-section');
      toggleSectionCollapse(section);
      
      // Stop event propagation to prevent any unintended behavior
      e.stopPropagation();
    });
  });
  
  // Ensure the parameters are initially collapsed but visible
  document.querySelectorAll('.collapsible-section').forEach(section => {
    // Remove any inline display:none
    section.style.display = 'block';
    
    // Make sure the content is actually hidden on page load
    if (section.classList.contains('collapsed')) {
      updateCollapsedState(section, true);
    }
  });
  
  // Add event listener for the add parameter button
  const addParamBtn = document.getElementById('addParameterBtn');
  if (addParamBtn) {
    addParamBtn.addEventListener('click', showParameterModal);
  }
  
  // Initialize with default parameters
  initializeDefaultParameters();
  
  // Add event listeners for preset selectors if they exist
  const presetCategory = document.getElementById('presetCategory');
  const presetSelector = document.getElementById('presetSelector');
  
  if (presetCategory) {
    presetCategory.addEventListener('change', updatePresetOptions);
  }
  
  if (presetSelector) {
    presetSelector.addEventListener('change', loadSelectedPreset);
  }
  
  // Wrap parameter labels and controls for better visibility
  wrapParameterControls();
  
  // Load presets data - handle the CORS issue with a fallback
  setupDefaultPresets(); // Always use default presets for local development
  
  // Set initial duration display
  const durationSlider = document.getElementById('playbackDuration');
  if (durationSlider) {
    updateDurationDisplay(durationSlider.value);
  }

  // Handle backward compatibility - create a hidden soundType element if not present
  if (!document.getElementById('soundType')) {
    const hiddenSoundType = document.createElement('input');
    hiddenSoundType.type = 'hidden';
    hiddenSoundType.id = 'soundType';
    hiddenSoundType.value = 'custom';
    document.body.appendChild(hiddenSoundType);
  }
  
  // Add CSS override to fix collapsible sections
  const styleOverride = document.createElement('style');
  styleOverride.textContent = `
    .collapsible-section {
      display: block !important;
    }
    .collapsible-section.collapsed .collapsible-content {
      max-height: 0 !important;
      overflow: hidden;
    }
    .collapsible-section:not(.collapsed) .collapsible-content {
      max-height: none !important;
      overflow: visible;
    }
  `;
  document.head.appendChild(styleOverride);
});

/**
 * Sets up default presets when fetch fails
 */
function setupDefaultPresets() {
  console.log("Using default preset data");
  // Define basic preset data inline to avoid CORS issues
  soundPresets = {
    categories: [
      {
        name: "Natural",
        presets: [
          {
            id: "gentle_wind",
            name: "Gentle Wind",
            description: "Light breeze through leaves",
            parameters: {
              windSpeed: 20,
              windGustiness: 0.3,
              turbulence: 0.2,
              refDistance: 5,
              rolloff: 1
            }
          },
          {
            id: "ocean_waves",
            name: "Ocean Waves",
            description: "Distant ocean waves breaking",
            parameters: {
              waveHeight: 60,
              waveFrequency: 0.4,
              surfIntensity: 0.7,
              oceanDepth: "medium",
              refDistance: 7,
              rolloff: 1.2
            }
          }
        ]
      },
      {
        name: "Electronic",
        presets: [
          {
            id: "bass_synth",
            name: "Bass Synth",
            description: "Deep synthesizer bass",
            parameters: {
              oscType: "sawtooth",
              oscFrequency: 80,
              harmonic1: 0.7,
              harmonic2: 4,
              noiseAmount: 0.05,
              filterType: "lowpass",
              filterCutoff: 500,
              refDistance: 5
            }
          }
        ]
      },
      {
        name: "Mechanical",
        presets: [
          {
            id: "idling_engine",
            name: "Idling Engine",
            description: "Car engine at idle",
            parameters: {
              rpm: 800,
              gearRatio: 0.3,
              friction: 0.3,
              metallic: 0.6,
              mechanicalLooseness: 0.2,
              mechanicalType: "engine",
              refDistance: 3,
              rolloff: 1.5
            }
          }
        ]
      }
    ]
  };
  
  populatePresetSelectors();
}

/**
 * Toggles the collapsed state of a section
 * @param {HTMLElement} section - The section to toggle
 */
function toggleSectionCollapse(section) {
  const isCollapsed = section.classList.contains('collapsed');
  section.classList.toggle('collapsed');
  updateCollapsedState(section, !isCollapsed);
}

/**
 * Updates the inline styles based on collapsed state
 * @param {HTMLElement} section - The section to update
 * @param {boolean} collapsed - Whether the section should be collapsed
 */
function updateCollapsedState(section, collapsed) {
  const content = section.querySelector('.collapsible-content');
  if (!content) return;
  
  // Remove any display:none that might be interfering
  section.style.display = 'block';
  
  if (collapsed) {
    // Collapse the section
    content.style.maxHeight = '0px';
    content.style.overflow = 'hidden'; // Ensure content is hidden
    // Force a reflow to ensure the browser applies the changes
    void content.offsetWidth;
  } else {
    // Expand the section
    content.style.maxHeight = '2000px'; // Use a large fixed value instead of scrollHeight
    content.style.overflow = 'visible'; // Make content visible
  }
}

// Update output values for sliders
function updateParamOutput(paramId) {
  const slider = document.getElementById(paramId);
  const output = document.getElementById(`${paramId}Output`);
  if (slider && output) {
    output.textContent = slider.value;
  }
}

// Preset parameter values for different sound types
const presetValues = {
  wind: {
    windSpeed: 40,
    windGustiness: 0.5,
    windDirection: 'N',
    turbulence: 0.3,
    groundMaterial: 'grass',
  },
  ocean: {
    waveHeight: 60,
    waveFrequency: 0.5,
    surfIntensity: 0.7,
    oceanDepth: 'medium',
  },
  leaves: {
    rustleIntensity: 0.5,
    leafType: 'generic',
    leafDensity: 50,
  },
  fire: {
    fireIntensity: 0.5,
    crackleFrequency: 5,
    crackleIntensity: 0.6,
    flickerSpeed: 1.0,
    fuelType: 'wood',
    flameTemp: 'neutral',
  },
  footsteps: {
    footstepVolume: 0.6,
    stepFrequency: 100,
    footwearType: 'sneakers',
    stepSurface: 'grass',
  },
  synthesizer: {
    oscType: 'sine',
    oscFrequency: 440,
    oscDetune: 0,
    harmonic1: 0.5,
    harmonic2: 0.3,
    harmonic3: 0.1,
    noiseAmount: 0.1,
    lfoRate: 4,
    lfoDepth: 0.2,
    lfoTarget: 'pitch'
  },
  percussion: {
    impactSharpness: 0.8,
    bodyResonance: 0.5,
    decayLength: 0.3,
    pitchBend: 0.2,
    materialHardness: 0.7,
    materialDensity: 0.6
  },
  noise: {
    noiseColor: 'white',
    noiseDensity: 0.7,
    lowFreqContent: 0.5,
    highFreqContent: 0.5,
    spectralTilt: -3
  },
  mechanical: {
    rpm: 600,
    gearRatio: 0.5,
    friction: 0.3,
    metallic: 0.7,
    mechanicalLooseness: 0.3
  },
  formant: {
    formant1: 500,
    formant2: 1500,
    formant3: 2500,
    breathiness: 0.3,
    vocalTension: 0.5,
    vibrato: 0.2,
    vibratoRate: 5
  }
};

// Apply preset values to form inputs
function applyPresetValues(soundType) {
  const preset = presetValues[soundType];
  if (!preset) return;
  
  // Apply preset values to form elements
  Object.keys(preset).forEach(param => {
    const element = document.getElementById(param);
    if (element) {
      element.value = preset[param];
      
      // Update slider displays if applicable
      if (element.classList.contains('slider')) {
        updateParamOutput(param);
      }
    }
  });
}

///////////////////////////
// Basic Three.js Setup
///////////////////////////
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 1, 1000);
camera.position.set(0, 10, 25);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create an AudioListener and add it to the camera.
const audioListener = new THREE.AudioListener();
camera.add(audioListener);

// Global list for moving audio objects for velocity updates.
const movingAudioObjects = [];
// Global noise buffers cache.
const cachedBuffers = {};

// Expose globals.
window.scene = scene;
window.audioListener = audioListener;

///////////////////////////
// Helper Functions
///////////////////////////
// djb2 hash function.
function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return hash >>> 0;
}

// Get cached noise buffer or create a new one.
function getCachedNoiseBuffer(audioCtx, key, duration) {
  try {
    const cacheKey = key + "_" + duration;
    if (cachedBuffers[cacheKey]) {
      return cachedBuffers[cacheKey];
    } else {
      const bufferSize = Math.floor(duration * audioCtx.sampleRate);
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      cachedBuffers[cacheKey] = buffer;
      return buffer;
    }
  } catch (error) {
    console.error("Error in getCachedNoiseBuffer:", error);
    // Return a minimal silent buffer as fallback
    return audioCtx.createBuffer(1, audioCtx.sampleRate, audioCtx.sampleRate);
  }
}

///////////////////////////
// Global Sound Library
///////////////////////////
// Map generated sound keys to parameter objects.
const soundLibrary = {};

/**
 * Updates the visibility of parameters in the UI based on selection
 */
function updateParameterVisibility() {
  // First hide all parameter inputs
  document.querySelectorAll('.parameter-control').forEach(control => {
    control.style.display = 'none';
  });
  
  // Show only selected parameters
  selectedParameters.forEach(param => {
    const paramControl = document.querySelector(`.parameter-control[data-param="${param}"]`);
    if (paramControl) {
      paramControl.style.display = 'block';
      
      // Create visualization canvas if it doesn't exist
      createParamVisualization(param);
    }
  });
  
  // Update section visibility
  document.querySelectorAll('.sound-params').forEach(section => {
    const sectionId = section.id;
    const categoryKey = sectionId.replace('Params', '');
    
    // Check if any parameter in this section is selected
    let hasVisibleParams = false;
    const params = allParameters[categoryKey]?.params;
    
    if (params) {
      Object.keys(params).some(param => {
        if (selectedParameters.has(param)) {
          hasVisibleParams = true;
          return true;
        }
        return false;
      });
    }
    
    // Show section if it has visible parameters
    if (hasVisibleParams) {
      section.style.display = 'block';
      
      // Ensure the content is visible if section is not collapsed
      if (!section.classList.contains('collapsed')) {
        const content = section.querySelector('.collapsible-content');
        if (content) {
          content.style.maxHeight = '2000px';
          content.style.overflow = 'visible';
        }
      }
    } else if (section.style.display !== 'none') {
      section.style.display = 'none';
    }
  });
}

// Fix loadSoundKey function to ensure all parameters are properly displayed
function loadSoundKey() {
  const inputKey = document.getElementById('soundKeyInput').value.trim();
  
  if (!inputKey) {
    alert("Please enter a sound key.");
    return;
  }
  
  // First try to load from library for backward compatibility
  if (soundLibrary[inputKey]) {
    applyParametersToUI(soundLibrary[inputKey]);
    updateParameterVisibility(); // Add this to ensure parameters are visible
    document.getElementById('soundKeyDisplay').textContent = inputKey;
    document.getElementById('playStatus').textContent = "Sound key loaded! Click 'Play Sound' to hear it.";
    return;
  }
  
  // If not in library, try to decode the key
  try {
    console.log("Attempting to decode external sound key:", inputKey);
    
    // Check if it's a newer format key (starts with 'SND:')
    if (inputKey.startsWith('SND:')) {
      try {
        // New format: Base64 encoded JSON
        const jsonString = atob(inputKey.substring(4));
        const params = JSON.parse(jsonString);
        applyParametersToUI(params);
        updateParameterVisibility(); // Add this to ensure parameters are visible
        
        // Store in library for future use
        soundLibrary[inputKey] = params;
        document.getElementById('soundKeyDisplay').textContent = inputKey;
        document.getElementById('playStatus').textContent = "External sound key loaded!";
      } catch (e) {
        console.error("Error decoding new format key:", e);
        alert("Invalid sound key format. Cannot decode.");
      }
    } else if (inputKey.startsWith('SK-')) {
      // New compact format
      try {
        const params = decodeCompactKey(inputKey);
        applyParametersToUI(params);
        updateParameterVisibility(); // Add this to ensure parameters are visible
        
        // Store in library for future use
        soundLibrary[inputKey] = params;
        document.getElementById('soundKeyDisplay').textContent = inputKey;
        document.getElementById('playStatus').textContent = "External sound key loaded!";
      } catch (e) {
        console.error("Error decoding compact key:", e);
        alert("Invalid compact key format. Cannot decode.");
      }
    } else {
      // Legacy hash-based key - try to reverse-engineer basic parameters
      reverseEngineerSoundKey(inputKey);
      updateParameterVisibility(); // Also update visibility here
    }
  } catch (error) {
    console.error("Failed to load sound key:", error);
    alert("Could not load this sound key. It may be in an unsupported format.");
  }
}

// Apply parameter values to the UI
function applyParametersToUI(params) {
  // Set the sound type dropdown
  if (params.soundType) {
    document.getElementById('soundType').value = params.soundType;
    
    // Show the appropriate parameter panels
    const paramPanels = document.querySelectorAll('.sound-params');
    paramPanels.forEach(panel => {
      panel.style.display = 'none';
    });
    
    if (params.soundType === 'custom') {
      // For custom, show all parameter panels
      paramPanels.forEach(panel => {
        panel.style.display = 'block';
      });
    } else {
      // For specific type, show only relevant panel
      const selectedPanel = document.getElementById(`${params.soundType}Params`);
      if (selectedPanel) {
        selectedPanel.style.display = 'block';
      }
    }
  }
  
  // Apply all parameters to form inputs
  Object.keys(params).forEach(param => {
    if (param !== 'soundType') {
      const element = document.getElementById(param);
      if (element) {
        element.value = params[param];
        if (element.classList.contains('slider')) {
          updateParamOutput(param);
        }
      }
    }
  });
  
  // Update selected parameters based on params object
  selectedParameters.clear();
  Object.keys(params).forEach(param => {
    if (param !== 'soundType') {
      selectedParameters.add(param);
    }
  });
  
  updateParameterTags();
}

// Handle generating universal sound keys (for backward compatibility)
/**
 * Generates a universal sound key that captures ALL parameters 
 */
function generateSoundKey() {
  const soundType = document.getElementById('soundType').value;
  const params = { soundType };

  // Only capture selected parameters instead of all parameters
  selectedParameters.forEach(param => {
    const element = document.getElementById(param);
    if (element) {
      if (element.type === "number" || element.tagName === "SELECT" || 
          element.classList.contains('slider')) {
        // Extract the value based on the element type
        let value;
        if (element.type === "number" || element.classList.contains('slider')) {
          value = parseFloat(element.value);
        } else {
          value = element.value;
        }
        params[param] = value;
      }
    }
  });

  // Create the noise object
  const noise = getNoiseFromParams(params);
  
  // Generate compact key (using the existing function)
  const compactKey = generateCompactKey(params);
  
  // We'll use the compact format for display
  const keyToUse = compactKey;
  
  // Store in our local library immediately
  soundLibrary[keyToUse] = params;
  
  // Also store in the noise.js library for later use
  import('./noise.js').then(module => {
    module.addSoundToLibrary(keyToUse, params);
  });
  
  document.getElementById("soundKeyDisplay").textContent = keyToUse;
  document.getElementById('playStatus').textContent = "Sound key generated! Click 'Play Sound' to hear it.";
  
  // Also update the input field with the new key
  document.getElementById('soundKeyInput').value = keyToUse;
}

// Also update the compact key generation function to only include selected parameters
/**
 * Generates a compact key from sound parameters
 * @param {Object} params - The sound parameters
 * @returns {string} A compact key
 */
function generateCompactKey(params) {
  // Create a shorter representation of parameters
  const keyParts = [];
  
  // Start with sound type (abbreviated)
  const typeMap = {
    'wind': 'w',
    'ocean': 'o',
    'leaves': 'l',
    'fire': 'f',
    'footsteps': 'fs',
    'synthesizer': 'sy',
    'percussion': 'p',
    'noise': 'n',
    'mechanical': 'm',
    'formant': 'fm',
    'custom': 'c'
  };
  
  keyParts.push(typeMap[params.soundType] || 'c');
  
  // Helper to check if parameter is selected and add it if it is
  const addParamIfSelected = (param, multiplier = 100, digits = 2) => {
    if (params[param] !== undefined && selectedParameters.has(param)) {
      // Scale the parameter to an integer and format with leading zeros
      const value = Math.round(params[param] * multiplier);
      keyParts.push(value.toString().padStart(digits, '0'));
      return true;
    }
    return false;
  };
  
  // Add type-specific parameters that are selected
  switch (params.soundType) {
    case 'wind':
      addParamIfSelected('windSpeed', 1, 2);
      addParamIfSelected('windGustiness');
      addParamIfSelected('turbulence');
      break;
      
    case 'ocean':
      addParamIfSelected('waveHeight', 1, 2);
      addParamIfSelected('waveFrequency');
      addParamIfSelected('surfIntensity');
      break;
      
    case 'leaves':
      addParamIfSelected('rustleIntensity');
      addParamIfSelected('leafDensity', 1, 2);
      break;
      
    case 'fire':
      addParamIfSelected('fireIntensity');
      addParamIfSelected('crackleFrequency', 10, 2);
      addParamIfSelected('crackleIntensity');
      break;
      
    case 'footsteps':
      addParamIfSelected('footstepVolume');
      addParamIfSelected('stepFrequency', 1, 3);
      break;
      
    case 'synthesizer':
      // For synth, we'll encode oscillator type as a letter if it's selected
      if (selectedParameters.has('oscType')) {
        const oscTypeMap = {'sine': 'i', 'square': 'q', 'sawtooth': 'w', 'triangle': 't', 'custom': 'c'};
        keyParts.push(oscTypeMap[params.oscType] || 'i');
      }
      addParamIfSelected('oscFrequency', 0.1, 3);
      addParamIfSelected('harmonic1');
      addParamIfSelected('harmonic2');
      break;
      
    case 'percussion':
      addParamIfSelected('impactSharpness');
      addParamIfSelected('bodyResonance');
      addParamIfSelected('decayLength');
      break;
      
    case 'noise':
      // For noise, encode color as a letter if it's selected
      if (selectedParameters.has('noiseColor')) {
        const colorMap = {'white': 'w', 'pink': 'p', 'brown': 'b', 'blue': 'l', 'violet': 'v', 'grey': 'g'};
        keyParts.push(colorMap[params.noiseColor] || 'w');
      }
      addParamIfSelected('noiseDensity');
      addParamIfSelected('spectralTilt', 10, 2);
      break;
      
    case 'mechanical':
      addParamIfSelected('rpm', 0.1, 3);
      addParamIfSelected('friction');
      addParamIfSelected('mechanicalLooseness');
      break;
      
    case 'formant':
      addParamIfSelected('formant1', 0.1, 2);
      addParamIfSelected('formant2', 0.01, 2);
      addParamIfSelected('breathiness');
      addParamIfSelected('vibrato');
      break;
      
    case 'custom':
      // For custom, determine which parameters to include based on selections
      if (selectedParameters.has('oscType')) {
        const oscTypeMap = {'sine': 'i', 'square': 'q', 'sawtooth': 'w', 'triangle': 't', 'custom': 'c'};
        keyParts.push(oscTypeMap[params.oscType] || 'i');
        addParamIfSelected('oscFrequency', 0.1, 3);
      } else if (selectedParameters.has('impactSharpness')) {
        addParamIfSelected('impactSharpness');
        addParamIfSelected('bodyResonance');
      } else if (selectedParameters.has('noiseColor')) {
        const colorMap = {'white': 'w', 'pink': 'p', 'brown': 'b', 'blue': 'l', 'violet': 'v', 'grey': 'g'};
        keyParts.push(colorMap[params.noiseColor] || 'w');
        addParamIfSelected('noiseDensity');
      }
      break;
  }
  
  // Add spatial parameters if they're selected
  addParamIfSelected('refDistance', 1, 2);
  addParamIfSelected('rolloff', 10, 2);
  
  // Add a short hash to ensure uniqueness (last 6 characters of the full hash)
  const shortHash = hashString(JSON.stringify(params)).toString(16).substring(0, 6);
  keyParts.push(shortHash);
  
  // Join all parts with a separator and return
  return 'SK-' + keyParts.join('-');
}

/**
 * Decodes a compact key into sound parameters
 * @param {string} compactKey - The compact key to decode
 * @returns {Object} The decoded sound parameters
 */
function decodeCompactKey(compactKey) {
  // Skip the 'SK-' prefix
  const parts = compactKey.substring(3).split('-');
  
  if (parts.length < 3) {
    throw new Error("Invalid compact key format: too few parts");
  }
  
  // Start with an empty params object
  const params = {};
  
  // Decode sound type
  const typeMap = {
    'w': 'wind',
    'o': 'ocean',
    'l': 'leaves',
    'f': 'fire',
    'fs': 'footsteps',
    'sy': 'synthesizer',
    'p': 'percussion',
    'n': 'noise',
    'm': 'mechanical',
    'fm': 'formant',
    'c': 'custom'
  };
  
  params.soundType = typeMap[parts[0]] || 'custom';
  
  let index = 1;
  
  // Helper function to decode parameters
  const decodeParam = (param, multiplier = 100, digits = 2) => {
    if (index < parts.length - 1) {
      params[param] = parseInt(parts[index], 10) / multiplier;
      index++;
    }
  };
  
  // Decode type-specific parameters
  switch (params.soundType) {
    case 'wind':
      decodeParam('windSpeed', 1, 2);
      decodeParam('windGustiness');
      decodeParam('turbulence');
      break;
      
    case 'ocean':
      decodeParam('waveHeight', 1, 2);
      decodeParam('waveFrequency');
      decodeParam('surfIntensity');
      break;
      
    case 'leaves':
      decodeParam('rustleIntensity');
      decodeParam('leafDensity', 1, 2);
      break;
      
    case 'fire':
      decodeParam('fireIntensity');
      decodeParam('crackleFrequency', 10, 2);
      decodeParam('crackleIntensity');
      break;
      
    case 'footsteps':
      decodeParam('footstepVolume');
      decodeParam('stepFrequency', 1, 3);
      break;
      
    case 'synthesizer':
      // Decode oscillator type
      if (index < parts.length - 1) {
        const oscTypeMap = {'i': 'sine', 'q': 'square', 'w': 'sawtooth', 't': 'triangle', 'c': 'custom'};
        params.oscType = oscTypeMap[parts[index]] || 'sine';
        index++;
      }
      decodeParam('oscFrequency', 0.1, 3);
      decodeParam('harmonic1');
      decodeParam('harmonic2');
      break;
      
    case 'percussion':
      decodeParam('impactSharpness');
      decodeParam('bodyResonance');
      decodeParam('decayLength');
      break;
      
    case 'noise':
      // Decode noise color
      if (index < parts.length - 1) {
        const colorMap = {'w': 'white', 'p': 'pink', 'b': 'brown', 'l': 'blue', 'v': 'violet', 'g': 'grey'};
        params.noiseColor = colorMap[parts[index]] || 'white';
        index++;
      }
      decodeParam('noiseDensity');
      decodeParam('spectralTilt', 10, 2);
      break;
      
    case 'mechanical':
      decodeParam('rpm', 0.1, 3);
      decodeParam('friction');
      decodeParam('mechanicalLooseness');
      break;
      
    case 'formant':
      decodeParam('formant1', 0.1, 2);
      decodeParam('formant2', 0.01, 2);
      decodeParam('breathiness');
      decodeParam('vibrato');
      break;
      
    case 'custom':
      // For custom, we need to guess what parameters to decode
      // based on the available parts
      const firstPart = parts[index];
      
      if (['i', 'q', 'w', 't', 'c'].includes(firstPart)) {
        // Synth-like parameters
        const oscTypeMap = {'i': 'sine', 'q': 'square', 'w': 'sawtooth', 't': 'triangle', 'c': 'custom'};
        params.oscType = oscTypeMap[firstPart];
        index++;
        decodeParam('oscFrequency', 0.1, 3);
      } else if (['w', 'p', 'b', 'l', 'v', 'g'].includes(firstPart)) {
        // Noise-like parameters
        const colorMap = {'w': 'white', 'p': 'pink', 'b': 'brown', 'l': 'blue', 'v': 'violet', 'g': 'grey'};
        params.noiseColor = colorMap[firstPart];
        index++;
        decodeParam('noiseDensity');
      } else {
        // Try percussion-like parameters
        decodeParam('impactSharpness');
        decodeParam('bodyResonance');
      }
      break;
  }
  
  // Always decode spatial parameters
  decodeParam('refDistance', 1, 2);
  decodeParam('rolloff', 10, 2);
  
  // Add some reasonable defaults for parameters that might be missing
  if (params.soundType === 'wind' && !params.windSpeed) params.windSpeed = 40;
  if (params.soundType === 'ocean' && !params.waveHeight) params.waveHeight = 60;
  if (params.soundType === 'fire' && !params.fireIntensity) params.fireIntensity = 0.5;
  if (params.soundType === 'synthesizer' && !params.oscType) params.oscType = 'sine';
  if (params.soundType === 'noise' && !params.noiseColor) params.noiseColor = 'white';
  
  return params;
}

///////////////////////////
// Enhanced Sound Generator Module
///////////////////////////
const SoundGenerator = {
  // Reusable white noise buffer.
  createNoiseBuffer: function(audioCtx, duration) {
    try {
      if (!audioCtx || !audioCtx.createBuffer) {
        console.warn("Invalid audio context provided to createNoiseBuffer");
        return null;
      }
      return getCachedNoiseBuffer(audioCtx, "white", duration);
    } catch (error) {
      console.error("Error creating noise buffer:", error);
      // Create a silent buffer as fallback
      const sampleRate = audioCtx.sampleRate || 44100;
      const bufferSize = Math.floor((duration || 1) * sampleRate);
      const buffer = audioCtx.createBuffer(1, bufferSize, sampleRate);
      return buffer;
    }
  },

  // WIND buffer
  createWindBuffer: function(audioCtx, params) {
    try {
      const duration = 4;
      return this.createNoiseBuffer(audioCtx, duration);
    } catch (error) {
      console.error("Error creating wind buffer:", error);
      return audioCtx.createBuffer(1, audioCtx.sampleRate * 4, audioCtx.sampleRate);
    }
  },

  // OCEAN buffer
  createOceanBuffer: function(audioCtx, params) {
    try {
      const duration = 6;
      const bufferSize = Math.floor(duration * audioCtx.sampleRate);
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      
      const waveFreq = params.waveFrequency || 0.5;
      const waveHeight = (params.waveHeight || 60) / 100;
      
      for (let i = 0; i < bufferSize; i++) {
        const t = i / audioCtx.sampleRate;
        // Base ocean noise
        let noise = Math.random() * 2 - 1;
        // Add slow wave modulation
        const wave = Math.sin(2 * Math.PI * waveFreq * t) * 0.5;
        data[i] = (noise * 0.3 + wave * 0.7) * waveHeight;
      }
      return buffer;
    } catch (error) {
      console.error("Error creating ocean buffer:", error);
      return this.createNoiseBuffer(audioCtx, 6);
    }
  },

  // FIRE buffer with crackling
  createFireBuffer: function(audioCtx, params) {
    try {
      const duration = 4;
      const bufferSize = Math.floor(duration * audioCtx.sampleRate);
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      
      const crackleFreq = params.crackleFrequency || 5;
      const crackleIntensity = params.crackleIntensity || 0.6;
      const fireIntensity = params.fireIntensity || 0.5;
      
      // Create crackling fire sound
      for (let i = 0; i < bufferSize; i++) {
        const t = i / audioCtx.sampleRate;
        
        // Base fire noise (low frequency)
        let noise = Math.random() * 2 - 1;
        
        // Add crackling effect
        if (Math.random() < (crackleFreq / 100)) {
          // Randomly trigger crackling sounds
          const crackleLength = Math.floor(audioCtx.sampleRate * 0.05); // 50ms crackle
          if (i + crackleLength < bufferSize) {
            for (let j = 0; j < crackleLength; j++) {
              // Create a short sharp sound for the crackle
              const crackleEnv = Math.exp(-10 * (j / crackleLength));
              data[i + j] += (Math.random() * 2 - 1) * crackleEnv * crackleIntensity;
            }
          }
        }
        
        // Add slow modulation for the fire base
        const flicker = Math.sin(2 * Math.PI * 0.5 * t) * 0.2;
        data[i] = (noise * 0.3 + flicker) * fireIntensity;
      }
      
      // Normalize to avoid clipping
      let max = 0;
      for (let i = 0; i < bufferSize; i++) {
        max = Math.max(max, Math.abs(data[i]));
      }
      if (max > 1) {
        for (let i = 0; i < bufferSize; i++) {
          data[i] /= max;
        }
      }
      
      return buffer;
    } catch (error) {
      console.error("Error creating fire buffer:", error);
      return this.createNoiseBuffer(audioCtx, 4);
    }
  },

  // LEAVES buffer.
  createLeavesBuffer: function(audioCtx, params) {
    const duration = 1;
    return getCachedNoiseBuffer(audioCtx, "leaves", duration);
  },

  // FOOTSTEPS buffer.
  createFootstepsBuffer: function(audioCtx, params) {
    const duration = 0.3;
    const bufferSize = duration * audioCtx.sampleRate;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / audioCtx.sampleRate;
      const env = Math.exp(-10 * t);
      data[i] = Math.sin(2 * Math.PI * 150 * t) * env * (params.footstepVolume || 0.5);
    }
    return buffer;
  },

  // SYNTHESIZER buffer - creates complex waveforms with harmonics
  createSynthBuffer: function(audioCtx, params) {
    try {
      const duration = 4;
      const bufferSize = Math.floor(duration * audioCtx.sampleRate);
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      
      // Get parameters with defaults
      const oscType = params.oscType || 'sine';
      const frequency = params.oscFrequency || 440;
      const detune = params.oscDetune || 0;
      const detuneRatio = Math.pow(2, detune / 1200); // Convert cents to ratio
      const adjustedFreq = frequency * detuneRatio;
      
      // Harmonics strengths
      const h1 = params.harmonic1 || 0.5;
      const h2 = params.harmonic2 || 0.3;
      const h3 = params.harmonic3 || 0.1;
      
      // Noise amount
      const noiseAmt = params.noiseAmount || 0.1;
      
      // LFO parameters if available
      const lfoRate = params.lfoRate || 0;
      const lfoDepth = params.lfoDepth || 0;
      const lfoTarget = params.lfoTarget || 'pitch';
      
      // Generate the waveform
      for (let i = 0; i < bufferSize; i++) {
        const t = i / audioCtx.sampleRate;
        
        // Apply LFO to frequency if needed
        let freqMod = adjustedFreq;
        if (lfoTarget === 'pitch' && lfoRate > 0) {
          const lfo = Math.sin(2 * Math.PI * lfoRate * t);
          freqMod = adjustedFreq * (1 + lfo * lfoDepth * 0.1); // 10% max deviation
        }
        
        // Base oscillator
        let sample = 0;
        if (oscType === 'sine') {
          sample = Math.sin(2 * Math.PI * freqMod * t);
        } else if (oscType === 'square') {
          sample = Math.sign(Math.sin(2 * Math.PI * freqMod * t));
        } else if (oscType === 'sawtooth') {
          sample = ((t * freqMod) % 1) * 2 - 1;
        } else if (oscType === 'triangle') {
          sample = Math.abs(((t * freqMod) % 1) * 2 - 1) * 2 - 1;
        }
        
        // Add harmonics
        if (h1 > 0) sample += h1 * Math.sin(2 * Math.PI * freqMod * 2 * t); 
        if (h2 > 0) sample += h2 * Math.sin(2 * Math.PI * freqMod * 3 * t);
        if (h3 > 0) sample += h3 * Math.sin(2 * Math.PI * freqMod * 4 * t);
        
        // Normalize
        const maxAmplitude = 1 + h1 + h2 + h3;
        sample /= maxAmplitude;
        
        // Add noise if specified
        if (noiseAmt > 0) {
          const noise = (Math.random() * 2 - 1) * noiseAmt;
          sample = sample * (1 - noiseAmt) + noise;
        }
        
        // Apply amplitude LFO if needed
        if (lfoTarget === 'amplitude' && lfoRate > 0) {
          const lfo = 0.5 * (1 + Math.sin(2 * Math.PI * lfoRate * t));
          sample *= 1 - (lfoDepth * (1 - lfo));
        }
        
        data[i] = sample;
      }
      
      return buffer;
    } catch (error) {
      console.error("Error creating synth buffer:", error);
      return this.createNoiseBuffer(audioCtx, 2);
    }
  },
  
  // PERCUSSION buffer - creates impact and resonance sounds
  createPercussionBuffer: function(audioCtx, params) {
    try {
      const duration = 2; // Maximum duration
      const bufferSize = Math.floor(duration * audioCtx.sampleRate);
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      
      // Get parameters
      const impactSharpness = params.impactSharpness || 0.8;
      const bodyResonance = params.bodyResonance || 0.5;
      const decayLength = params.decayLength || 0.3;
      const pitchBend = params.pitchBend || 0.2;
      const materialHardness = params.materialHardness || 0.7;
      const materialDensity = params.materialDensity || 0.6;
      
      // Calculate sound parameters
      const baseFreq = 100 + materialHardness * 400; // 100-500Hz
      const decayTime = 0.1 + decayLength * 1.9; // 0.1-2s
      const attackTime = Math.max(0.001, 0.02 * (1 - impactSharpness));
      
      // Generate percussion sound
      for (let i = 0; i < bufferSize; i++) {
        const t = i / audioCtx.sampleRate;
        
        // Skip if beyond decay time
        if (t > decayTime) {
          data[i] = 0;
          continue;
        }
        
        // Calculate amplitude envelope
        let envelope;
        if (t < attackTime) {
          envelope = t / attackTime; // Linear attack
        } else {
          envelope = Math.exp(-(t - attackTime) / (decayTime * materialDensity));
        }
        
        // Calculate pitch bend
        const freqMod = baseFreq * (1 - (pitchBend * t / decayTime));
        
        // Generate main impact sound
        let impact = Math.sin(2 * Math.PI * freqMod * t);
        
        // Add higher frequency components for harder materials
        if (materialHardness > 0.3) {
          impact += materialHardness * Math.sin(2 * Math.PI * freqMod * 2.7 * t) * 0.5;
        }
        
        // Add body resonance
        let resonance = 0;
        if (bodyResonance > 0) {
          const resFreq1 = baseFreq * 1.5;
          const resFreq2 = baseFreq * 2.3;
          resonance = bodyResonance * (
            Math.sin(2 * Math.PI * resFreq1 * t) * Math.exp(-t / (decayTime * 1.2)) +
            Math.sin(2 * Math.PI * resFreq2 * t) * Math.exp(-t / (decayTime * 0.8)) * 0.6
          );
        }
        
        // Combine impact and resonance
        data[i] = (impact * (1 - bodyResonance/2) + resonance) * envelope;
      }
      
      // Normalize to avoid clipping
      let max = 0;
      for (let i = 0; i < bufferSize; i++) {
        max = Math.max(max, Math.abs(data[i]));
      }
      if (max > 1) {
        for (let i = 0; i < bufferSize; i++) {
          data[i] /= max;
        }
      }
      
      return buffer;
    } catch (error) {
      console.error("Error creating percussion buffer:", error);
      return this.createNoiseBuffer(audioCtx, 1);
    }
  },
  
  // COLORED NOISE buffer - different types of noise with spectral shaping
  createColoredNoiseBuffer: function(audioCtx, params) {
    try {
      const duration = 4;
      const bufferSize = Math.floor(duration * audioCtx.sampleRate);
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      
      // Get parameters
      const noiseColor = params.noiseColor || 'white';
      const noiseDensity = params.noiseDensity || 0.7;
      const lowFreqContent = params.lowFreqContent || 0.5;
      const highFreqContent = params.highFreqContent || 0.5;
      const spectralTilt = params.spectralTilt || -3; // dB/octave
      
      // Previous samples for filtering
      let lastSample = 0;
      let lastLastSample = 0;
      
      // Generate different colored noise
      for (let i = 0; i < bufferSize; i++) {
        // Base white noise
        let noise = Math.random() * 2 - 1;
        
        // Apply color filtering
        switch (noiseColor) {
          case 'pink': // Pink noise (-3 dB/octave)
            noise = (noise * 0.7 + lastSample * 0.3);
            break;
          case 'brown': // Brown/Red noise (-6 dB/octave)
            noise = (noise * 0.5 + lastSample * 0.5);
            break;
          case 'blue': // Blue noise (+3 dB/octave)
            noise = noise - (lastSample * 0.3);
            break;
          case 'white': // White noise (flat spectrum)
          default:
            // No additional filtering
            break;
        }
        
        // Apply custom spectral tilt
        if (spectralTilt !== 0) {
          const tiltFactor = Math.pow(10, spectralTilt / 20); // Convert dB to factor
          noise = noise * tiltFactor + lastSample * (1 - tiltFactor);
        }
        
        // Apply low/high frequency balance
        let lowNoise = (noise + lastSample + lastLastSample) / 3; // Simple low-pass
        let highNoise = noise - lastSample; // Simple high-pass
        
        // Mix according to parameters
        noise = lowNoise * lowFreqContent + highNoise * highFreqContent;
        
        // Store filtered result and update previous samples
        data[i] = noise * noiseDensity;
        lastLastSample = lastSample;
        lastSample = noise;
      }
      
      return buffer;
    } catch (error) {
      console.error("Error creating colored noise buffer:", error);
      return this.createNoiseBuffer(audioCtx, 2);
    }
  },
  
  // MECHANICAL buffer - create mechanical movement sounds
  createMechanicalBuffer: function(audioCtx, params) {
    try {
      const duration = 4;
      const bufferSize = Math.floor(duration * audioCtx.sampleRate);
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      
      // Get parameters
      const rpm = params.rpm || 600; // Rotations per minute
      const frequency = rpm / 60; // Convert to Hz
      const gearRatio = params.gearRatio || 0.5;
      const friction = params.friction || 0.3;
      const metallic = params.metallic || 0.7;
      const looseness = params.mechanicalLooseness || 0.3;
      
      // Generate mechanical sound
      for (let i = 0; i < bufferSize; i++) {
        const t = i / audioCtx.sampleRate;
        
        // Basic rotation
        let motorSound = Math.sin(2 * Math.PI * frequency * t);
        
        // Add gear meshing at higher frequency
        const gearFreq = frequency / gearRatio;
        motorSound += Math.sin(2 * Math.PI * gearFreq * t) * 0.7;
        
        // Add irregularities based on looseness
        if (looseness > 0) {
          const looseFreq = frequency * 2;
          const phaseVar = Math.sin(2 * Math.PI * looseFreq * t + Math.random() * looseness);
          motorSound += phaseVar * looseness * 0.5;
        }
        
        // Add friction noise
        if (friction > 0) {
          motorSound += (Math.random() * 2 - 1) * friction;
        }
        
        // Add metallic resonances
        if (metallic > 0) {
          const resonances = [frequency * 4, frequency * 6.7, frequency * 9.2];
          let metallicSound = 0;
          resonances.forEach((resFreq, idx) => {
            metallicSound += Math.sin(2 * Math.PI * resFreq * t) * 0.2 * metallic / (idx + 1);
          });
          motorSound += metallicSound;
        }
        
        data[i] = motorSound * 0.3; // Reduce amplitude to avoid clipping
      }
      
      // Final normalization
      let max = 0;
      for (let i = 0; i < bufferSize; i++) {
        max = Math.max(max, Math.abs(data[i]));
      }
      if (max > 1) {
        for (let i = 0; i < bufferSize; i++) {
          data[i] /= max;
        }
      }
      
      return buffer;
    } catch (error) {
      console.error("Error creating mechanical buffer:", error);
      return this.createNoiseBuffer(audioCtx, 2);
    }
  },
  
  // FORMANT buffer - creates vowel-like sounds using formant synthesis
  createFormantBuffer: function(audioCtx, params) {
    try {
      const duration = 3;
      const bufferSize = Math.floor(duration * audioCtx.sampleRate);
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      
      // Get parameters
      const formant1 = params.formant1 || 500;
      const formant2 = params.formant2 || 1500;
      const formant3 = params.formant3 || 2500;
      const breathiness = params.breathiness || 0.3;
      const tension = params.vocalTension || 0.5;
      const vibrato = params.vibrato || 0.2;
      const vibratoRate = params.vibratoRate || 5;
      const baseFreq = 120;
      
      // Create bandpass filters for formants
      const createFormant = (freq, t, q) => {
        const bandWidth = freq / q;
        const formantEnv = Math.exp(-t * 2);
        return Math.sin(2 * Math.PI * freq * t) * formantEnv;
      };
      
      // Generate formant sound
      for (let i = 0; i < bufferSize; i++) {
        const t = i / audioCtx.sampleRate;
        
        // Apply vibrato to base frequency
        let freqMod = baseFreq;
        if (vibrato > 0) {
          freqMod *= 1 + Math.sin(2 * Math.PI * vibratoRate * t) * vibrato * 0.1;
        }
        
        // Generate glottal pulse
        let glottalPulse;
        if (tension < 0.5) {
          // More relaxed vocal cords - softer tone
          glottalPulse = Math.sin(2 * Math.PI * freqMod * t);
        } else {
          // More tense vocal cords - richer harmonics
          const saw = ((t * freqMod) % 1) * 2 - 1;
          const sine = Math.sin(2 * Math.PI * freqMod * t);
          glottalPulse = sine * (1 - tension) + saw * tension;
        }
        
        // Apply formants
        const f1 = createFormant(formant1, t, 5);
        const f2 = createFormant(formant2, t, 7) * 0.5;
        const f3 = createFormant(formant3, t, 9) * 0.25;
        
        // Mix glottal pulse and formants
        let voice = glottalPulse * 0.3 + f1 * 0.4 + f2 * 0.2 + f3 * 0.1;
        
        // Add breathiness
        if (breathiness > 0) {
          const breath = (Math.random() * 2 - 1) * breathiness;
          voice = voice * (1 - breathiness*0.5) + breath;
        }
        
        data[i] = voice;
      }
      
      return buffer;
    } catch (error) {
      console.error("Error creating formant buffer:", error);
      return this.createNoiseBuffer(audioCtx, 1);
    }
  },

  // LEAVES buffer - improved with more realistic parameters
  createLeavesBuffer: function(audioCtx, params) {
    try {
      // Create a longer buffer for more realistic leaves rustling
      const duration = 4;
      const bufferSize = Math.floor(duration * audioCtx.sampleRate);
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      
      // Extract parameters with defaults
      const rustleIntensity = params.rustleIntensity || 0.5;
      const leafDensity = params.leafDensity !== undefined ? params.leafDensity / 100 : 0.5;
      const moisture = params.leafMoisture || 0.2; // How wet/dry the leaves are
      const seasonFactor = params.leafSeasonFactor || 0.5; // 0=spring (soft), 1=fall (crispy)
      const leafSize = params.leafSize || 0.5; // Size of leaves affects sound
      const leafType = params.leafType || 'generic';
      
      // Pre-calculate leaf type modifier
      let typeModifier = 1.0;
      if (leafType === 'oak') typeModifier = 1.2;
      else if (leafType === 'pine') typeModifier = 0.7;
      else if (leafType === 'maple') typeModifier = 1.1;
      else if (leafType === 'birch') typeModifier = 0.9;
      
      // Frequency ranges affected by parameters
      const baseFreqMin = 800 + (1 - moisture) * 1200 + seasonFactor * 1000;
      const baseFreqMax = baseFreqMin + 1200 + seasonFactor * 800;
      
      // Create various leaf sounds at different rates based on density
      let lastCrackle = -1000; // Time since last crackle
      const numCrackleSources = Math.ceil(leafDensity * 15) + 2; // More density = more sources
      const crackleSources = [];
      
      for (let i = 0; i < numCrackleSources; i++) {
        crackleSources.push({
          rate: 0.1 + Math.random() * 0.3, // How often this source creates sound
          lastTime: -Math.random() * 1000, // Randomize start times
          freq: baseFreqMin + Math.random() * (baseFreqMax - baseFreqMin),
          amplitude: 0.3 + Math.random() * 0.7
        });
      }
      
      // Generate leaf rustle sounds
      for (let i = 0; i < bufferSize; i++) {
        const t = i / audioCtx.sampleRate;
        let sample = 0;
        
        // Background rustle noise (filtered)
        let rustle = (Math.random() * 2 - 1) * 0.2 * rustleIntensity;
        
        // Seasonal and moisture filter 
        // (dry fall leaves are more high frequency, wet spring leaves more muffled)
        rustle = rustle * (1 - moisture * 0.7) * (0.4 + seasonFactor * 0.6);
        
        // Add occasional crackles from our crackle sources
        for (let src of crackleSources) {
          if (t - src.lastTime > src.rate / rustleIntensity) {
            // Time for a new crackle
            src.lastTime = t;
            src.freq = baseFreqMin + Math.random() * (baseFreqMax - baseFreqMin);
          }
          
          // Calculate crackle sound if it's active
          const crackleAge = t - src.lastTime;
          if (crackleAge < 0.05) { // Crackle duration
            // Create short, sharp filter sweep to simulate leaf crack
            const crackEnv = Math.exp(-crackleAge * (50 + seasonFactor * 100));
            const crackSound = Math.sin(2 * Math.PI * src.freq * crackleAge) * crackEnv;
            sample += crackSound * src.amplitude * leafDensity * (0.5 + seasonFactor * 0.5);
          }
        }
        
        // Add wind movement through leaves (subtle whistling)
        const windModulation = Math.sin(2 * Math.PI * 0.5 * t) * 0.1;
        
        // Combine all elements and apply leaf density
        data[i] = (rustle + sample + windModulation) * leafDensity * typeModifier;
      }
      
      // Normalize to avoid clipping
      let max = 0;
      for (let i = 0; i < bufferSize; i++) {
        max = Math.max(max, Math.abs(data[i]));
      }
      if (max > 1) {
        for (let i = 0; i < bufferSize; i++) {
          data[i] /= max;
        }
      }
      
      return buffer;
    } catch (error) {
      console.error("Error creating leaf rustle buffer:", error);
      return this.createNoiseBuffer(audioCtx, 4);
    }
  },

  // FIRE buffer - improved with more realistic parameters
  createFireBuffer: function(audioCtx, params) {
    try {
      const duration = 5;
      const bufferSize = Math.floor(duration * audioCtx.sampleRate);
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      
      // Extract enhanced parameters with defaults
      const fireIntensity = params.fireIntensity || 0.5;
      const crackleFreq = params.crackleFrequency || 5;
      const crackleIntensity = params.crackleIntensity || 0.6;
      const flickerSpeed = params.flickerSpeed || 1.0;
      const fuelType = params.fuelType || 'wood';
      const flameTemp = params.flameTemp || 'neutral';
      const emberIntensity = params.emberIntensity || 0.3;
      const windEffect = params.fireWindEffect || 0.2;
      
      // Adjust parameters based on fuel type
      let baseNoiseFreq = 1.0;
      let crackleFreqMod = 1.0;
      let crackleDecay = 0.05;
      
      if (fuelType === 'wood') {
        crackleFreqMod = 1.0;
        crackleDecay = 0.05;
      } else if (fuelType === 'gas') {
        crackleFreqMod = 0.2; // Less crackles
        baseNoiseFreq = 1.5; // Higher hiss
        crackleDecay = 0.02; // Shorter crackles
      } else if (fuelType === 'charcoal') {
        crackleFreqMod = 1.5; // More crackles
        baseNoiseFreq = 0.7; // Lower rumble
        crackleDecay = 0.08; // Longer crackles
      }
      
      // Temperature affects the base frequency
      let tempFactor = 1.0;
      if (flameTemp === 'cool') tempFactor = 0.8;
      else if (flameTemp === 'warm') tempFactor = 1.2;
      
      // Create ember pop timings (more intense fire = more embers)
      const numEmberSources = Math.ceil(fireIntensity * 10) + 2;
      const emberSources = [];
      for (let i = 0; i < numEmberSources; i++) {
        emberSources.push({
          time: Math.random() * duration,
          frequency: 800 + Math.random() * 1200,
          amplitude: 0.3 + Math.random() * 0.7
        });
      }
      
      // Current low frequency patterns for proper fire rumble simulation
      let lowFilter = 0;
      
      // Create crackling fire sound with more variation
      for (let i = 0; i < bufferSize; i++) {
        const t = i / audioCtx.sampleRate;
        
        // Base fire noise (varied frequency content based on parameters)
        // Use pink-like noise for more realistic fire base
        const noise = (Math.random() * 2 - 1);
        let lowPassNoise = lowFilter * 0.95 + noise * 0.05;
        lowFilter = lowPassNoise;
        
        // Add crackling effect with better variation
        let crackle = 0;
        if (Math.random() < (crackleFreq * crackleFreqMod / 100)) {
          // Randomly trigger crackling sounds with varied characteristics
          const crackleLength = Math.floor(audioCtx.sampleRate * crackleDecay * (0.8 + Math.random() * 0.4));
          if (i + crackleLength < bufferSize) {
            const crackleFrequency = 1000 + Math.random() * 2000;
            for (let j = 0; j < crackleLength; j++) {
              // Create a sharper, more varied crackle
              const cracklePhase = j / crackleLength;
              const crackleEnv = Math.exp(-10 * cracklePhase) * (1 - cracklePhase);
              const crackleSin = Math.sin(2 * Math.PI * crackleFrequency * (j / audioCtx.sampleRate));
              data[i + j] += crackleSin * crackleEnv * crackleIntensity * (0.8 + Math.random() * 0.4);
            }
          }
        }
        
        // Check for ember pops
        for (const ember of emberSources) {
          const timeDiff = Math.abs(t - ember.time);
          if (timeDiff < 0.08) { // Duration of ember pop
            const emberPop = Math.sin(2 * Math.PI * ember.frequency * timeDiff) * 
                            Math.exp(-timeDiff * 50) * ember.amplitude * emberIntensity;
            crackle += emberPop;
          }
        }
        
        // Add slow modulation for the fire base (based on flicker speed)
        const flicker = Math.sin(2 * Math.PI * flickerSpeed * 0.5 * t) * 0.2;
        
        // Add wind effect (causes volume fluctuations)
        const windMod = 1.0 + Math.sin(2 * Math.PI * 0.3 * t) * windEffect;
        
        // Combine all elements
        data[i] += ((lowPassNoise * 0.4 + flicker) * fireIntensity * tempFactor * baseNoiseFreq + crackle) * windMod;
      }
      
      // Normalize to avoid clipping
      let max = 0;
      for (let i = 0; i < bufferSize; i++) {
        max = Math.max(max, Math.abs(data[i]));
      }
      if (max > 1) {
        for (let i = 0; i < bufferSize; i++) {
          data[i] /= max;
        }
      }
      
      return buffer;
    } catch (error) {
      console.error("Error creating fire buffer:", error);
      return this.createNoiseBuffer(audioCtx, 4);
    }
  },
  
  // OCEAN buffer - significantly improved for more realistic waves
  createOceanBuffer: function(audioCtx, params) {
    try {
      const duration = 6;
      const bufferSize = Math.floor(duration * audioCtx.sampleRate);
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      
      // Extract enhanced parameters
      const waveFreq = params.waveFrequency || 0.5;
      const waveHeight = (params.waveHeight || 60) / 100;
      const surfIntensity = params.surfIntensity || 0.7;
      const oceanDepth = params.oceanDepth || 'medium';
      const shoreType = params.shoreType || 'sandy';  
      const distance = params.oceanDistance || 0.5; // 0=at shore, 1=distant
      const stormy = params.oceanStormy || 0.0; // How stormy the sea is
      
      // Depth affects frequency content
      let depthFactor = 1.0;
      if (oceanDepth === 'shallow') depthFactor = 1.3;
      else if (oceanDepth === 'deep') depthFactor = 0.7;
      
      // Shore type affects high-frequency content (bubbles, splashes)
      let shoreResonance = 1.0;
      let shoreFreq = 1000;
      if (shoreType === 'rocky') {
        shoreResonance = 1.4;
        shoreFreq = 1200;
      }
      else if (shoreType === 'pebbly') {
        shoreResonance = 1.2;
        shoreFreq = 900;
      }
      
      // Create multiple wave cycles with different frequencies for more natural sound
      const waveCycles = [];
      const numWaves = 3 + Math.floor(waveHeight * 2);
      
      for (let i = 0; i < numWaves; i++) {
        waveCycles.push({
          frequency: waveFreq * (0.8 + 0.4 * Math.random()),
          phase: Math.random() * Math.PI * 2,
          amplitude: 0.6 + 0.4 * Math.random()
        });
      }
      
      // Surf splash occurrences
      const numSplashes = Math.ceil(surfIntensity * 5) + Math.ceil(stormy * 5);
      const splashes = [];
      
      for (let i = 0; i < numSplashes; i++) {
        splashes.push({
          time: i * (duration / numSplashes) + Math.random() * 0.5,
          intensity: 0.5 + Math.random() * 0.5,
          decay: 0.1 + Math.random() * 0.2
        });
      }
      
      // Main ocean buffer generation
      let lowPassNoise = 0; // For low-frequency rumble
      
      for (let i = 0; i < bufferSize; i++) {
        const t = i / audioCtx.sampleRate;
        
        // Base ocean noise (filtered based on depth)
        const noise = Math.random() * 2 - 1;
        lowPassNoise = lowPassNoise * 0.98 + noise * 0.02; // Low-pass filter for rumble
        
        // Create wave pattern from multiple frequencies
        let wavePattern = 0;
        for (const wave of waveCycles) {
          wavePattern += Math.sin(2 * Math.PI * wave.frequency * t + wave.phase) * wave.amplitude;
        }
        wavePattern /= numWaves; // Normalize
        
        // Add storm effect (increases high-frequency content)
        let stormNoise = 0;
        if (stormy > 0) {
          stormNoise = (Math.random() * 2 - 1) * stormy * 0.3;
        }
        
        // Apply surf splashes
        let splash = 0;
        for (const splashEvent of splashes) {
          const timeDiff = Math.abs(t - splashEvent.time);
          if (timeDiff < splashEvent.decay) {
            // Create realistic splash with high-frequency content
            const splashEnv = Math.exp(-timeDiff / splashEvent.decay * 10);
            splash += ((Math.random() * 2 - 1) * 0.7 + 
                      Math.sin(2 * Math.PI * shoreFreq * timeDiff) * 0.3) * 
                      splashEnv * splashEvent.intensity * surfIntensity * shoreResonance;
          }
        }
        
        // Distance affects mix between surf and wave sounds
        const surfFactor = Math.max(0, 1 - distance);
        const waveFactor = distance * 0.7 + 0.3;
        
        // Combine all elements with proper weighting
        data[i] = (
          (lowPassNoise * 0.3 + noise * 0.1) * depthFactor * waveHeight * waveFactor + 
          wavePattern * 0.4 * waveHeight * depthFactor * (waveFactor + 0.2) +
          splash * surfFactor +
          stormNoise
        );
      }
      
      // Normalize
      let max = 0;
      for (let i = 0; i < bufferSize; i++) {
        max = Math.max(max, Math.abs(data[i]));
      }
      if (max > 1) {
        for (let i = 0; i < bufferSize; i++) {
          data[i] /= max;
        }
      }
      
      return buffer;
    } catch (error) {
      console.error("Error creating ocean buffer:", error);
      return this.createNoiseBuffer(audioCtx, 6);
    }
  },
  
  // FOOTSTEPS buffer - completely redesigned for realistic material-based footsteps
  createFootstepsBuffer: function(audioCtx, params) {
    try {
      // Longer duration for more natural step sound
      const duration = 0.7;
      const bufferSize = Math.floor(duration * audioCtx.sampleRate);
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      
      // Extract enhanced parameters
      const footstepVolume = params.footstepVolume || 0.6;
      const footwearType = params.footwearType || 'sneakers';
      const stepSurface = params.stepSurface || 'grass';
      const weight = params.stepWeight || 0.5; // 0=light, 1=heavy
      const wetness = params.surfaceWetness || 0; // 0=dry, 1=wet/puddle
      
      // Parameters derived from footwear type
      let impactSharpness = 0.5;
      let scrapeIntensity = 0.2;
      let highFreqContent = 0.5;
      
      switch (footwearType) {
        case 'sneakers':
          impactSharpness = 0.4;
          scrapeIntensity = 0.3;
          highFreqContent = 0.4;
          break;
        case 'boots':
          impactSharpness = 0.7;
          scrapeIntensity = 0.3;
          highFreqContent = 0.6;
          break;
        case 'sandals':
          impactSharpness = 0.3;
          scrapeIntensity = 0.5;
          highFreqContent = 0.5;
          break;
        case 'barefoot':
          impactSharpness = 0.2;
          scrapeIntensity = 0.1;
          highFreqContent = 0.3;
          break;
        case 'heels':
          impactSharpness = 0.9;
          scrapeIntensity = 0.2;
          highFreqContent = 0.8;
          break;
      }
      
      // Parameters derived from surface type
      let surfaceResonance = 0.3;
      let surfaceHardness = 0.5;
      let lowFreqResponse = 0.5;
      let surfaceGrain = 0.3; // For granular surfaces like gravel
      let surfaceCreak = 0; // For wooden surfaces
      
      switch (stepSurface) {
        case 'grass':
          surfaceResonance = 0.1;
          surfaceHardness = 0.2;
          lowFreqResponse = 0.3;
          surfaceGrain = 0.3;
          break;
        case 'gravel':
          surfaceResonance = 0.2;
          surfaceHardness = 0.5;
          lowFreqResponse = 0.4;
          surfaceGrain = 0.9;
          break;
        case 'wood':
          surfaceResonance = 0.7;
          surfaceHardness = 0.6;
          lowFreqResponse = 0.7;
          surfaceGrain = 0.1;
          surfaceCreak = 0.3;
          break;
        case 'tile':
          surfaceResonance = 0.8;
          surfaceHardness = 0.9;
          lowFreqResponse = 0.3;
          surfaceGrain = 0.05;
          break;
        case 'concrete':
          surfaceResonance = 0.4;
          surfaceHardness = 1.0;
          lowFreqResponse = 0.6;
          surfaceGrain = 0.1;
          break;
        case 'metal':
          surfaceResonance = 0.9;
          surfaceHardness = 1.0;
          lowFreqResponse = 0.2;
          surfaceGrain = 0.05;
          break;
        case 'carpet':
          surfaceResonance = 0.1;
          surfaceHardness = 0.1;
          lowFreqResponse = 0.2;
          surfaceGrain = 0.05;
          break;
        case 'snow':
          surfaceResonance = 0.1;
          surfaceHardness = 0.3;
          lowFreqResponse = 0.2;
          surfaceGrain = 0.4;
          break;
      }
      
      // Add wetness effects
      if (wetness > 0) {
        // Wet surfaces have more high-frequency splash content
        surfaceHardness *= (1 - wetness * 0.3); // Wet surfaces are slightly softer
        surfaceGrain *= (1 - wetness * 0.5); // Less grain sound when wet
        highFreqContent *= (1 + wetness * 0.7); // More high freq for splashes
      }
      
      // Adjust parameters based on weight
      const weightedImpact = impactSharpness * (0.7 + weight * 0.6);
      lowFreqResponse *= (0.5 + weight * 0.8); // Heavier steps have more bass
      
      // Calculate resonant frequency based on surface - harder surfaces are higher pitched
      const mainResonance = 100 + surfaceHardness * 400;
      
      // Create initial impact
      const attackTime = 0.002 + (1 - impactSharpness) * 0.01;
      const decayTime = 0.05 + (1 - surfaceHardness) * 0.3;
      
      // Step usually has two parts: heel strike and toe push-off
      const heelTime = 0;
      const toeTime = 0.15 + (1 - weight) * 0.1; // Lighter steps have faster toe follow-up
      
      // Create grain particles for granular surfaces (gravel, etc)
      const numGrains = Math.ceil(surfaceGrain * 20);
      const grains = [];
      
      for (let i = 0; i < numGrains; i++) {
        grains.push({
          time: 0.01 + Math.random() * 0.2,
          frequency: 2000 + Math.random() * 6000,
          amplitude: 0.3 + Math.random() * 0.7,
          decay: 0.01 + Math.random() * 0.05
        });
      }
      
      // Create splashes if wet
      const numSplashes = Math.ceil(wetness * 10);
      const splashes = [];
      
      for (let i = 0; i < numSplashes; i++) {
        splashes.push({
          time: 0.01 + Math.random() * 0.2,
          frequency: 3000 + Math.random() * 5000,
          amplitude: 0.4 + Math.random() * 0.6,
          decay: 0.02 + Math.random() * 0.1
        });
      }
      
      // Generate the footstep buffer
      for (let i = 0; i < bufferSize; i++) {
        const t = i / audioCtx.sampleRate;
        let sample = 0;
        
        // Heel strike (first impact)
        if (t >= heelTime) {
          const heelPhase = t - heelTime;
          let heelEnv;
          if (heelPhase < attackTime) {
            heelEnv = heelPhase / attackTime; // Linear attack
          } else {
            heelEnv = Math.exp(-(heelPhase - attackTime) / decayTime);
          }
          
          // Main impact sound with resonance
          const impact = Math.sin(2 * Math.PI * mainResonance * heelPhase) * 
                        surfaceHardness * heelEnv * weightedImpact;
          
          // Add low frequency thump for weight
          const thump = Math.sin(2 * Math.PI * (mainResonance * 0.5) * heelPhase) * 
                        lowFreqResponse * heelEnv * weight;
          
          // High frequency content for sharp impacts
          const highFreq = Math.sin(2 * Math.PI * mainResonance * 3 * heelPhase) * 
                          highFreqContent * heelEnv * surfaceHardness;
          
          sample += impact * 0.6 + thump * 0.3 + highFreq * 0.1;
          
          // Add resonance for resonant surfaces
          if (surfaceResonance > 0.3) {
            const resonFreq = mainResonance * 1.7;
            const resonance = Math.sin(2 * Math.PI * resonFreq * heelPhase) * 
                             Math.exp(-(heelPhase) / (decayTime * 2)) * 
                             surfaceResonance;
            sample += resonance * 0.3;
          }
        }
        
        // Toe push-off (second impact, softer)
        if (t >= toeTime) {
          const toePhase = t - toeTime;
          const toeEnv = Math.exp(-toePhase / (decayTime * 0.7));
          
          const toeImpact = Math.sin(2 * Math.PI * (mainResonance * 1.2) * toePhase) * 
                           surfaceHardness * toeEnv * weightedImpact * 0.4;
          
          sample += toeImpact * 0.3;
        }
        
        // Add grains for granular surfaces
        if (surfaceGrain > 0.1) {
          for (const grain of grains) {
            const grainPhase = t - grain.time;
            if (grainPhase > 0 && grainPhase < grain.decay * 3) {
              const grainEnv = Math.exp(-grainPhase / grain.decay);
              const grainSound = (Math.random() * 2 - 1) * grainEnv * grain.amplitude * surfaceGrain;
              sample += grainSound * 0.15;
            }
          }
        }
        
        // Add creaking for wooden surfaces
        if (surfaceCreak > 0.1 && t > 0.1 && t < 0.4) {
          const creakFreq = 800 + Math.sin(t * 20) * 400;
          const creakEnv = Math.sin(t * 15) * Math.exp(-(t - 0.1) / 0.3) * surfaceCreak;
          const creak = Math.sin(2 * Math.PI * creakFreq * t) * creakEnv * 0.1;
          sample += creak;
        }
        
        // Add splash sounds if wet
        if (wetness > 0.1) {
          for (const splash of splashes) {
            const splashPhase = t - splash.time;
            if (splashPhase > 0 && splashPhase < splash.decay * 3) {
              const splashEnv = Math.exp(-splashPhase / splash.decay);
              const splashNoise = (Math.random() * 2 - 1) * splashEnv * splash.amplitude * wetness;
              sample += splashNoise * 0.2;
            }
          }
        }
        
        // Add subtle friction/scuff sound based on footwear and surface
        if (scrapeIntensity > 0.1 && t > toeTime && t < toeTime + 0.2) {
          const scrapePhase = t - toeTime;
          const scrapeEnv = Math.exp(-scrapePhase / 0.1) * scrapePhase * 5;
          const scrapeNoise = (Math.random() * 2 - 1) * scrapeIntensity * scrapeEnv * 0.2;
          sample += scrapeNoise;
        }
        
        data[i] = sample * footstepVolume;
      }
      
      // Normalize to avoid clipping
      let max = 0;
      for (let i = 0; i < bufferSize; i++) {
        max = Math.max(max, Math.abs(data[i]));
      }
      if (max > 1) {
        for (let i = 0; i < bufferSize; i++) {
          data[i] /= max;
        }
      }
      
      return buffer;
    } catch (error) {
      console.error("Error creating footstep buffer:", error);
      return this.createNoiseBuffer(audioCtx, 0.3);
    }
  },

  // New function to combine multiple sound sources
  createLayeredSoundBuffer: function(audioCtx, params) {
    try {
      // Determine the maximum duration among all component sounds
      let maxDuration = 4; // Default duration
      const layerConfig = params.soundLayers || [];
      
      // Create each layer's buffer
      const layerBuffers = [];
      
      for (const layer of layerConfig) {
        let layerParams = {};
        
        // Copy main parameters and override with layer-specific ones
        Object.assign(layerParams, params);
        Object.assign(layerParams, layer.params);
        
        // Generate the appropriate buffer type
        let buffer;
        switch (layer.type) {
          case 'wind':
            buffer = this.createWindBuffer(audioCtx, layerParams);
            break;
          case 'ocean':
            buffer = this.createOceanBuffer(audioCtx, layerParams);
            break;
          case 'leaves':
            buffer = this.createLeavesBuffer(audioCtx, layerParams);
            break;
          case 'fire':
            buffer = this.createFireBuffer(audioCtx, layerParams);
            break;
          case 'footsteps':
            buffer = this.createFootstepsBuffer(audioCtx, layerParams);
            break;
          case 'synthesizer':
            buffer = this.createSynthBuffer(audioCtx, layerParams);
            break;
          case 'percussion':
            buffer = this.createPercussionBuffer(audioCtx, layerParams);
            break;
          case 'noise':
            buffer = this.createColoredNoiseBuffer(audioCtx, layerParams);
            break;
          default:
            buffer = this.createNoiseBuffer(audioCtx, 2);
            break;
        }
        
        layerBuffers.push({
          buffer: buffer,
          volume: layer.volume || 1.0
        });
        
        // Update max duration
        if (buffer.duration > maxDuration) {
          maxDuration = buffer.duration;
        }
      }
      
      // Create output buffer with the maximum duration
      const outputBuffer = audioCtx.createBuffer(
        1, // mono
        Math.ceil(audioCtx.sampleRate * maxDuration),
        audioCtx.sampleRate
      );
      const outputData = outputBuffer.getChannelData(0);
      
      // Mix all layers into the output buffer
      for (const layer of layerBuffers) {
        const layerData = layer.buffer.getChannelData(0);
        const layerVolume = layer.volume;
        
        // Add the layer data to the output buffer
        for (let i = 0; i < layerData.length; i++) {
          if (i < outputData.length) {
            outputData[i] += layerData[i] * layerVolume;
          }
        }
      }
      
      // Normalize to avoid clipping
      let max = 0;
      for (let i = 0; i < outputData.length; i++) {
        max = Math.max(max, Math.abs(outputData[i]));
      }
      if (max > 1) {
        for (let i = 0; i < outputData.length; i++) {
          outputData[i] /= max;
        }
      }
      
      return outputBuffer;
    } catch (error) {
      console.error("Error creating layered sound buffer:", error);
      return this.createNoiseBuffer(audioCtx, 3);
    }
  },
  
  // New environmental sound generator function
  createEnvironmentalSound: function(audioCtx, params) {
    // Extract environment type and conditions
    const environment = params.environment || 'outdoor';
    const weather = params.weather || 'clear';
    const timeOfDay = params.timeOfDay || 'day';
    const roomSize = params.roomSize || 'medium';
    
    // Build layered sound configuration
    const layerConfig = [];
    
    // Add ambient base layer based on environment
    if (environment === 'outdoor') {
      // Base outdoor ambience
      layerConfig.push({
        type: 'noise',
        params: {
          noiseColor: 'pink',
          noiseDensity: 0.2,
          spectralTilt: -6
        },
        volume: 0.2 // Quiet background ambience
      });
      
      // Add weather sounds
      if (weather === 'rainy') {
        layerConfig.push({
          type: 'noise',
          params: {
            noiseColor: 'white',
            noiseDensity: 0.8,
            spectralTilt: 2
          },
          volume: 0.6
        });
      } else if (weather === 'windy') {
        layerConfig.push({
          type: 'wind',
          params: {
            windSpeed: 70,
            windGustiness: 0.8,
            turbulence: 0.7
          },
          volume: 0.7
        });
      }
      
      // Add time-based sounds
      if (timeOfDay === 'night') {
        // Night crickets as a synthesizer
        layerConfig.push({
          type: 'synthesizer',
          params: {
            oscType: 'sine',
            oscFrequency: 4200,
            harmonic1: 0.6,
            lfoRate: 15,
            lfoDepth: 0.7
          },
          volume: 0.15
        });
      }
    } else {
      // Indoor ambience
      const roomFactor = roomSize === 'large' ? 0.8 : 
                        (roomSize === 'small' ? 0.3 : 0.5);
      
      layerConfig.push({
        type: 'noise',
        params: {
          noiseColor: 'brown',
          noiseDensity: 0.3 * roomFactor,
          spectralTilt: -8
        },
        volume: 0.15
      });
      
      // Add HVAC system hum for indoor environments
      layerConfig.push({
        type: 'mechanical',
        params: {
          rpm: 120,
          friction: 0.1,
          mechanicalLooseness: 0.1,
          mechanicalType: 'hvac'
        },
        volume: 0.2
      });
    }
    
    // Create the final layered sound
    params.soundLayers = layerConfig;
    return this.createLayeredSoundBuffer(audioCtx, params);
  }
};

///////////////////////////
// Envelope Scheduling (using exponential ramps)
///////////////////////////
function scheduleEnvelope(gainNode, audioCtx, duration, fadeInFraction, fadeOutFraction) {
  const now = audioCtx.currentTime;
  gainNode.gain.cancelScheduledValues(now);
  gainNode.gain.setValueAtTime(0, now);
  const fadeInTime = (fadeInFraction || 0.1) * duration;
  const fadeOutTime = (fadeOutFraction || 0.2) * duration;
  gainNode.gain.setTargetAtTime(1.0, now, fadeInTime / 3);
  gainNode.gain.setValueAtTime(1.0, now + duration - fadeOutTime);
  gainNode.gain.setTargetAtTime(0, now + duration - fadeOutTime, fadeOutTime / 3);
}

///////////////////////////
// Play Sound from Key (with improved spatial handling)
///////////////////////////
/**
 * Plays a sound based on the stored sound key.
 * @param {string} soundKey - The unique hash.
 * @param {THREE.Vector3} orientation - Direction vector.
 * @param {THREE.Vector3} position - Start position.
 * @param {Object} options - Additional options (e.g. velocity, duration, fadeIn, fadeOut).
 */
function playSoundFromKey(soundKey, orientation, position, options = {}, visualizationOptions = {}) {
  const params = soundLibrary[soundKey];
  if (!params) {
    console.error("Unknown sound key:", soundKey);
    return;
  }
  
  console.log("Creating sound for type:", params.soundType);
  const audioCtx = audioListener.context;
  
  // Create a sound object
  const soundObject = new THREE.Object3D();
  soundObject.position.copy(position);
  soundObject.lookAt(position.clone().add(orientation));
  scene.add(soundObject);

  // Choose the sound buffer based on type
  let buffer;
  switch (params.soundType) {
    case "wind":
      buffer = SoundGenerator.createWindBuffer(audioCtx, params);
      break;
    case "ocean":
      buffer = SoundGenerator.createOceanBuffer(audioCtx, params);
      break;
    case "leaves":
      buffer = SoundGenerator.createLeavesBuffer(audioCtx, params);
      break;
    case "fire":
      buffer = SoundGenerator.createFireBuffer(audioCtx, params);
      break;
    case "footsteps":
      buffer = SoundGenerator.createFootstepsBuffer(audioCtx, params);
      break;
    // New sound types
    case "synthesizer":
      buffer = SoundGenerator.createSynthBuffer(audioCtx, params);
      break;
    case "percussion":
      buffer = SoundGenerator.createPercussionBuffer(audioCtx, params);
      break;
    case "noise":
      buffer = SoundGenerator.createColoredNoiseBuffer(audioCtx, params);
      break;
    case "mechanical":
      buffer = SoundGenerator.createMechanicalBuffer(audioCtx, params);
      break;
    case "formant":
      buffer = SoundGenerator.createFormantBuffer(audioCtx, params);
      break;
    case "custom":
      // For custom, determine which buffer to use based on parameters
      if (params.oscType !== undefined) {
        buffer = SoundGenerator.createSynthBuffer(audioCtx, params);
      } else if (params.impactSharpness !== undefined) {
        buffer = SoundGenerator.createPercussionBuffer(audioCtx, params);
      } else if (params.noiseColor !== undefined) {
        buffer = SoundGenerator.createColoredNoiseBuffer(audioCtx, params);
      } else if (params.rpm !== undefined) {
        buffer = SoundGenerator.createMechanicalBuffer(audioCtx, params);
      } else if (params.formant1 !== undefined) {
        buffer = SoundGenerator.createFormantBuffer(audioCtx, params);
      } else if (params.windSpeed !== undefined) {
        buffer = SoundGenerator.createWindBuffer(audioCtx, params);
      } else if (params.waveHeight !== undefined) {
        buffer = SoundGenerator.createOceanBuffer(audioCtx, params);
      } else if (params.rustleIntensity !== undefined) {
        buffer = SoundGenerator.createLeavesBuffer(audioCtx, params);
      } else if (params.fireIntensity !== undefined) {
        buffer = SoundGenerator.createFireBuffer(audioCtx, params);
      } else if (params.footstepVolume !== undefined) {
        buffer = SoundGenerator.createFootstepsBuffer(audioCtx, params);
      } else {
        buffer = SoundGenerator.createNoiseBuffer(audioCtx, 3);
      }
      break;
    default:
      console.error("Unsupported sound type:", params.soundType);
      return;
  }
  
  // Create the positional audio object
  const positionalAudio = new THREE.PositionalAudio(audioListener);
  
  // Apply spatial parameters
  positionalAudio.setRefDistance(params.refDistance || 5);
  positionalAudio.setRolloffFactor(params.rolloff || 1);
  positionalAudio.setDistanceModel("exponential");
  positionalAudio.setDirectionalCone(
    params.coneInner || 60, 
    params.coneOuter || 180, 
    params.coneOuterGain || 0.1
  );

  // Set buffer but DON'T connect to destination yet if we have visualization
  positionalAudio.setBuffer(buffer);
  
  // Connect to analyzers if provided
  if (visualizationOptions.mainAnalyser) {
    try {
      // Get the AudioNode from the PositionalAudio object - FIXED using getOutput() instead of getSource()
      const source = positionalAudio.getOutput();
      
      if (source) {
        // Disconnect from the default destination - be careful not to disconnect too early
        // Keep a reference to the destination
        const destination = audioListener.context.destination;
        
        // Connect to main analyzer
        source.connect(visualizationOptions.mainAnalyser);
        
        // Connect main analyzer to the destination
        visualizationOptions.mainAnalyser.connect(destination);
        
        // Connect to parameter analyzers if needed
        if (visualizationOptions.parameterAnalysers) {
          Object.entries(visualizationOptions.parameterAnalysers).forEach(([param, analyser]) => {
            const gainNode = audioListener.context.createGain();
            gainNode.gain.value = 1.0;
            source.connect(gainNode);
            gainNode.connect(analyser);
            analyser.connect(destination);
          });
        }
        
        console.log("Successfully connected audio to visualization");
      } else {
        console.warn("Audio output not available for visualization");
      }
    } catch (error) {
      console.warn("Could not set up audio visualization:", error);
    }
  }
  
  // Add to the 3D object
  soundObject.add(positionalAudio);
  
  // Schedule envelope
  const duration = options.duration || 3;
  scheduleEnvelope(positionalAudio.gain, audioCtx, duration, options.fadeIn, options.fadeOut);
  
  // Start playback
  positionalAudio.play();
  
  // Apply appropriate audio processing based on sound type
  setTimeout(() => {
    try {
      const audioCtx = audioListener.context;
      
      // Apply specific processing based on sound type
      if ((params.soundType === "wind" || (params.soundType === "custom" && params.windSpeed !== undefined)) && positionalAudio.source) {
        console.log("Applying wind sound effects");
        
        const filter = audioCtx.createBiquadFilter();
        filter.type = "bandpass";
        let cutoff = 200 + (params.windSpeed / 100) * 1800;
        
        if (params.groundMaterial) {
          if (params.groundMaterial === "snow") cutoff += 200;
          else if (params.groundMaterial === "rock") cutoff -= 200;
          else if (params.groundMaterial === "sand") cutoff -= 100;
        }
        
        filter.frequency.value = cutoff;
        
        // Apply the filter
        positionalAudio.setFilter(filter);
      } 
      else if ((params.soundType === "ocean" || (params.soundType === "custom" && params.waveHeight !== undefined)) && positionalAudio.source) {
        console.log("Applying ocean sound effects");
        
        // Create low-pass filter for ocean sound
        const filter = audioCtx.createBiquadFilter();
        filter.type = "lowpass";
        let cutoff = 500;
        
        if (params.oceanDepth) {
          if (params.oceanDepth === "shallow") cutoff += 300;
          else if (params.oceanDepth === "deep") cutoff -= 200;
        }
        
        filter.frequency.value = cutoff;
        
        // Apply the filter
        positionalAudio.setFilter(filter);
      }
      else if ((params.soundType === "fire" || (params.soundType === "custom" && params.fireIntensity !== undefined)) && positionalAudio.source) {
        console.log("Applying fire sound effects");
        
        // Create filter for fire sound
        const filter = audioCtx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 800 + (params.fireIntensity || 0.5) * 1600;
        
        // Apply the filter
        positionalAudio.setFilter(filter);
      }
      // NEW: Apply synthesizer specific processing
      else if ((params.soundType === "synthesizer" || (params.soundType === "custom" && params.oscType !== undefined)) && positionalAudio.source) {
        console.log("Applying synthesizer sound effects");
        
        // Create filter based on filter parameters if available
        if (params.filterType && params.filterCutoff) {
          const filter = audioCtx.createBiquadFilter();
          filter.type = params.filterType || "lowpass";
          filter.frequency.value = params.filterCutoff || 2000;
          filter.Q.value = params.filterResonance || 1;
          
          // Apply the filter
          positionalAudio.setFilter(filter);
        }
      }
      // NEW: Apply noise specific processing
      else if ((params.soundType === "noise" || (params.soundType === "custom" && params.noiseColor !== undefined)) && positionalAudio.source) {
        console.log("Applying noise sound effects");
        
        // Create EQ for noise shaping
        const filter = audioCtx.createBiquadFilter();
        filter.type = "peaking";
        filter.frequency.value = 1000;
        filter.gain.value = params.spectralTilt || 0;
        
        // Apply the filter
        positionalAudio.setFilter(filter);
      }
      // NEW: Apply formant specific processing
      else if ((params.soundType === "formant" || (params.soundType === "custom" && params.formant1 !== undefined)) && positionalAudio.source) {
        console.log("Applying formant sound effects");
        
        // For formants, add subtle reverb simulation
        if (params.breathiness > 0.5) {
          const filter = audioCtx.createBiquadFilter();
          filter.type = "highpass";
          filter.frequency.value = 500;
          positionalAudio.setFilter(filter);
        }
      }
    } catch (error) {
      console.warn("Could not apply audio effects:", error);
    }
  }, 50); // Small delay to ensure audio is initialized
  
  // Set timeout to clean up
  setTimeout(() => {
    if (positionalAudio.isPlaying) {
      positionalAudio.stop();
    }
    scene.remove(soundObject);
  }, duration * 1000);
  
  // Handle moving audio objects
  if (options.velocity) {
    movingAudioObjects.push({
      object: soundObject,
      velocity: options.velocity.clone()
    });
  }
  
  return positionalAudio;
}

///////////////////////////
// Smooth Position Updates
///////////////////////////
function updateMovingAudio(deltaTime) {
  const damping = 0.1;
  movingAudioObjects.forEach(item => {
    const displacement = item.velocity.clone().multiplyScalar(deltaTime);
    const targetPos = item.object.position.clone().add(displacement);
    item.object.position.lerp(targetPos, damping);
  });
}

///////////////////////////
// Animation Loop
///////////////////////////
let prevTime = performance.now();
function animate() {
  const currentTime = performance.now();
  const deltaTime = (currentTime - prevTime) / 1000;
  prevTime = currentTime;
  updateMovingAudio(deltaTime);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

///////////////////////////
// Play Sound via UI Button
///////////////////////////
function updateDurationDisplay(value) {
  const durationValue = document.getElementById('durationValue');
  if (durationValue) {  // Add null check here
    durationValue.textContent = value;
  }
}

// Track active sounds and animation
let currentlyPlaying = null;
let playbackStartTime = 0;
let playbackDuration = 0;
let playbackAnimationId = null;

// Progress animation using lerp for smoothness
function updatePlaybackProgress() {
  const playButton = document.querySelector('.play-btn');
  
  // Calculate elapsed time and progress percentage
  const currentTime = performance.now();
  const elapsedTime = (currentTime - playbackStartTime) / 1000;
  const rawProgress = Math.min(elapsedTime / playbackDuration, 1.0);
  
  // Update progress width directly using linear timing (more accurate)
  playButton.style.setProperty('--progress-width', `${rawProgress * 100}%`);
  
  // Continue animation if still playing
  if (rawProgress < 1.0) {
    playbackAnimationId = requestAnimationFrame(updatePlaybackProgress);
  } else {
    // Ensure we reach 100% at the end
    playButton.style.setProperty('--progress-width', '100%');
  }
}

function playSoundFromUI() {
  const key = document.getElementById("soundKeyDisplay").textContent;
  console.log("Attempting to play sound with key:", key);
  
  if (!key) {
    alert("Please generate a sound key first by clicking the 'Generate Sound Key' button.");
    return;
  }
  
  // Get duration from slider
  const duration = parseInt(document.getElementById("playbackDuration").value);
  playbackDuration = duration; // Store globally for animation
  console.log("Playing sound for", duration, "seconds");
  
  // Update UI to show sound is playing
  const playButton = document.querySelector('.play-btn');
  playButton.querySelector('span').textContent = "Playing...";
  playButton.disabled = true;
  
  // Reset and start progress animation
  playButton.style.setProperty('--progress-width', '0%');
  playbackStartTime = performance.now();
  if (playbackAnimationId) {
    cancelAnimationFrame(playbackAnimationId);
  }
  playbackAnimationId = requestAnimationFrame(updatePlaybackProgress);
  
  // Ensure audio context is running (needed for some browsers)
  if (audioListener.context.state === 'suspended') {
    console.log("Resuming audio context");
    audioListener.context.resume();
  }
  
  const orientation = new THREE.Vector3(0, 0, -1);
  const position = new THREE.Vector3(0, 5, 0);
  const options = {
    velocity: new THREE.Vector3(0.5, 0, 0),
    duration: duration,
    fadeIn: 0.2,
    fadeOut: 0.3
  };
  
  try {
    // Get noise from key using our new module
    const noise = getNoiseFromKey(key);
    
    // Set up audio analysis for visualization
    const audioCtx = audioListener.context;
    
    // Clear any existing analysers
    parameterAnalysers = {};
    
    // Create parameter-specific analysers with better settings
    selectedParameters.forEach(param => {
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;  // Increased from 128
      analyser.smoothingTimeConstant = 0.5;  // Less smoothing for more movement
      parameterAnalysers[param] = analyser;
    });
    
    // Ensure the main analyser is connected to the audio context destination
    if (!mainAnalyser) {
      initializeVisualization();
    }
    
    // Use our new module to play the sound
    currentlyPlaying = playNoise(noise, {
      position: position,
      listener: audioListener,
      scene: scene,
      duration: duration,
      fadeIn: 0.2,
      fadeOut: 0.3
    });
    
    document.getElementById('playStatus').textContent = `Playing ${duration} seconds of sound...`;
    
    // Start visualization
    startVisualization();
    
    // Reset UI after playback completes
    setTimeout(() => {
      // Cancel any ongoing animation
      if (playbackAnimationId) {
        cancelAnimationFrame(playbackAnimationId);
        playbackAnimationId = null;
      }
      
      // Stop visualization
      stopVisualization();
      
      // Ensure progress is at 100% before resetting
      playButton.style.setProperty('--progress-width', '100%');
      
      // Small delay to ensure the progress bar is seen at 100% before resetting
      setTimeout(() => {
        playButton.querySelector('span').textContent = "Play Sound";
        playButton.disabled = false;
        playButton.style.removeProperty('--progress-width');
        document.getElementById('playStatus').textContent = "";
        currentlyPlaying = null;
      }, 100);
      
    }, duration * 1000);
    
  } catch (error) {
    console.error("Error playing sound:", error);
    playButton.querySelector('span').textContent = "Play Sound";
    playButton.disabled = false;
    playButton.style.removeProperty('--progress-width');
    document.getElementById('playStatus').textContent = "Error playing sound, check console";
    
    // Cancel animation on error
    if (playbackAnimationId) {
      cancelAnimationFrame(playbackAnimationId);
      playbackAnimationId = null;
    }
  }
}

// Add CSS rule for progress animation - using linear timing for accuracy
document.head.insertAdjacentHTML('beforeend', `
  <style>
    .play-btn::before {
      width: var(--progress-width, 0%);
      transition: none; /* Remove transition for precise control */
    }
  </style>
`);

/**
 * Generates random parameters for the selected sound type
 */
function randomizeParameters() {
  const soundType = document.getElementById('soundType').value;
  
  // Helper function to get random number in range
  function getRandomInRange(min, max, isInteger = false) {
    const value = Math.random() * (max - min) + min;
    return isInteger ? Math.floor(value) : value;
  }
  
  // Helper function to get random item from array
  function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
  
  // Randomize based on sound type
  if (soundType === "wind" || soundType === "custom") {
    document.getElementById("windSpeed").value = getRandomInRange(10, 90, true);
    document.getElementById("windGustiness").value = getRandomInRange(0, 1).toFixed(1);
    document.getElementById("turbulence").value = getRandomInRange(0, 1).toFixed(1);
    
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const materials = ["grass", "snow", "rock", "sand"];
    
    document.getElementById("windDirection").value = getRandomItem(directions);
    document.getElementById("groundMaterial").value = getRandomItem(materials);
  }
  
  if (soundType === "ocean" || soundType === "custom") {
    const waveHeight = getRandomInRange(20, 80, true);
    document.getElementById("waveHeight").value = waveHeight;
    updateParamOutput("waveHeight");
    
    const waveFrequency = getRandomInRange(0.2, 1.5).toFixed(1);
    document.getElementById("waveFrequency").value = waveFrequency;
    updateParamOutput("waveFrequency");
    
    const surfIntensity = getRandomInRange(0.3, 0.9).toFixed(1);
    document.getElementById("surfIntensity").value = surfIntensity;
    updateParamOutput("surfIntensity");
    
    const depths = ["shallow", "medium", "deep"];
    document.getElementById("oceanDepth").value = getRandomItem(depths);
  }
  
  if (soundType === "leaves" || soundType === "custom") {
    document.getElementById("rustleIntensity").value = getRandomInRange(0.2, 0.8).toFixed(1);
    document.getElementById("leafDensity").value = getRandomInRange(20, 80, true);
    
    const leafTypes = ["generic", "oak", "pine", "maple", "birch"];
    document.getElementById("leafType").value = getRandomItem(leafTypes);
  }
  
  if (soundType === "fire" || soundType === "custom") {
    const fireIntensity = getRandomInRange(0.3, 0.8).toFixed(1);
    document.getElementById("fireIntensity").value = fireIntensity;
    updateParamOutput("fireIntensity");
    
    const crackleFrequency = getRandomInRange(2, 8).toFixed(1);
    document.getElementById("crackleFrequency").value = crackleFrequency;
    updateParamOutput("crackleFrequency");
    
    const crackleIntensity = getRandomInRange(0.3, 0.8).toFixed(1);
    document.getElementById("crackleIntensity").value = crackleIntensity;
    updateParamOutput("crackleIntensity");
    
    const flickerSpeed = getRandomInRange(0.5, 3).toFixed(1);
    document.getElementById("flickerSpeed").value = flickerSpeed;
    updateParamOutput("flickerSpeed");
    
    const fuelTypes = ["wood", "gas", "charcoal"];
    document.getElementById("fuelType").value = getRandomItem(fuelTypes);
    
    const flameTemps = ["cool", "neutral", "warm"];
    document.getElementById("flameTemp").value = getRandomItem(flameTemps);
  }
  
  if (soundType === "footsteps" || soundType === "custom") {
    document.getElementById("footstepVolume").value = getRandomInRange(0.3, 0.9).toFixed(1);
    document.getElementById("stepFrequency").value = getRandomInRange(60, 160, true);
    
    const footwearTypes = ["sneakers", "boots", "sandals", "barefoot"];
    document.getElementById("footwearType").value = getRandomItem(footwearTypes);
    
    const surfaces = ["grass", "gravel", "wood", "tile"];
    document.getElementById("stepSurface").value = getRandomItem(surfaces);
  }
  
  // NEW: Synthesizer randomization
  if (soundType === "synthesizer" || soundType === "custom") {
    // Base oscillator parameters
    const oscTypes = ["sine", "square", "sawtooth", "triangle", "custom"];
    document.getElementById("oscType").value = getRandomItem(oscTypes);
    document.getElementById("oscFrequency").value = getRandomInRange(50, 1000, true);
    updateParamOutput("oscFrequency");
    document.getElementById("oscDetune").value = getRandomInRange(-50, 50, true);
    updateParamOutput("oscDetune");
    
    // Harmonics and noise
    document.getElementById("harmonic1").value = getRandomInRange(0, 0.8).toFixed(2);
    updateParamOutput("harmonic1");
    document.getElementById("harmonic2").value = getRandomInRange(0, 0.6).toFixed(2);
    updateParamOutput("harmonic2");
    document.getElementById("harmonic3").value = getRandomInRange(0, 0.4).toFixed(2);
    updateParamOutput("harmonic3");
    document.getElementById("noiseAmount").value = getRandomInRange(0, 0.5).toFixed(2);
    updateParamOutput("noiseAmount");
    
    // LFO parameters
    document.getElementById("lfoRate").value = getRandomInRange(0.1, 8).toFixed(1);
    updateParamOutput("lfoRate");
    document.getElementById("lfoDepth").value = getRandomInRange(0, 0.6).toFixed(2);
    updateParamOutput("lfoDepth");
    const lfoTargets = ["pitch", "amplitude", "filter"];
    document.getElementById("lfoTarget").value = getRandomItem(lfoTargets);
    
    // Filter parameters
    const filterTypes = ["lowpass", "highpass", "bandpass", "notch"];
    document.getElementById("filterType").value = getRandomItem(filterTypes);
    document.getElementById("filterCutoff").value = getRandomInRange(200, 5000, true);
    updateParamOutput("filterCutoff");
    document.getElementById("filterResonance").value = getRandomInRange(0.2, 8).toFixed(1);
    updateParamOutput("filterResonance");
    
    // Envelope parameters
    document.getElementById("envelopeAttack").value = getRandomInRange(0.001, 1).toFixed(3);
    updateParamOutput("envelopeAttack");
    document.getElementById("envelopeRelease").value = getRandomInRange(0.05, 3).toFixed(2);
    updateParamOutput("envelopeRelease");
  }
  
  // NEW: Percussion randomization
  if (soundType === "percussion" || soundType === "custom") {
    document.getElementById("impactSharpness").value = getRandomInRange(0.3, 1).toFixed(2);
    updateParamOutput("impactSharpness");
    document.getElementById("bodyResonance").value = getRandomInRange(0.2, 0.9).toFixed(2);
    updateParamOutput("bodyResonance");
    document.getElementById("decayLength").value = getRandomInRange(0.1, 0.8).toFixed(2);
    updateParamOutput("decayLength");
    document.getElementById("pitchBend").value = getRandomInRange(0, 0.6).toFixed(2);
    updateParamOutput("pitchBend");
    document.getElementById("materialHardness").value = getRandomInRange(0.2, 0.9).toFixed(2);
    updateParamOutput("materialHardness");
    document.getElementById("materialDensity").value = getRandomInRange(0.3, 0.8).toFixed(2);
    updateParamOutput("materialDensity");
    
    // Additional percussion parameters
    const percTypes = ["drum", "woodblock", "metal", "membrane", "glass"];
    document.getElementById("percussionType").value = getRandomItem(percTypes);
    document.getElementById("strikeVelocity").value = getRandomInRange(0.3, 1).toFixed(2);
    updateParamOutput("strikeVelocity");
    document.getElementById("strikePosition").value = getRandomInRange(0.1, 0.9).toFixed(2);
    updateParamOutput("strikePosition");
    document.getElementById("resonantModes").value = getRandomInRange(1, 5, true);
    updateParamOutput("resonantModes");
  }
  
  // NEW: Noise randomization
  if (soundType === "noise" || soundType === "custom") {
    const noiseColors = ["white", "pink", "brown", "blue", "violet", "grey"];
    document.getElementById("noiseColor").value = getRandomItem(noiseColors);
    document.getElementById("noiseDensity").value = getRandomInRange(0.3, 0.9).toFixed(2);
    updateParamOutput("noiseDensity");
    document.getElementById("lowFreqContent").value = getRandomInRange(0.2, 0.8).toFixed(2);
    updateParamOutput("lowFreqContent");
    document.getElementById("highFreqContent").value = getRandomInRange(0.2, 0.8).toFixed(2);
    updateParamOutput("highFreqContent");
    document.getElementById("spectralTilt").value = getRandomInRange(-10, 6, true);
    updateParamOutput("spectralTilt");
    
    // Additional noise parameters
    document.getElementById("noiseModulation").value = getRandomInRange(0, 0.5).toFixed(2);
    updateParamOutput("noiseModulation");
    document.getElementById("noiseModRate").value = getRandomInRange(0.2, 5).toFixed(1);
    updateParamOutput("noiseModRate");
    document.getElementById("bandpassCenter").value = getRandomInRange(300, 5000, true);
    updateParamOutput("bandpassCenter");
    document.getElementById("bandpassWidth").value = getRandomInRange(100, 2000, true);
    updateParamOutput("bandpassWidth");
    document.getElementById("noiseQuantization").value = getRandomInRange(1, 16, true);
    updateParamOutput("noiseQuantization");
  }
  
  // NEW: Mechanical randomization
  if (soundType === "mechanical" || soundType === "custom") {
    document.getElementById("rpm").value = getRandomInRange(100, 1000, true);
    updateParamOutput("rpm");
    document.getElementById("gearRatio").value = getRandomInRange(0.2, 1.5).toFixed(2);
    updateParamOutput("gearRatio");
    document.getElementById("friction").value = getRandomInRange(0.1, 0.7).toFixed(2);
    updateParamOutput("friction");
    document.getElementById("metallic").value = getRandomInRange(0.2, 0.9).toFixed(2);
    updateParamOutput("metallic");
    document.getElementById("mechanicalLooseness").value = getRandomInRange(0.1, 0.6).toFixed(2);
    updateParamOutput("mechanicalLooseness");
    
    // Additional mechanical parameters
    const mechTypes = ["motor", "engine", "gears", "belt", "hydraulic"];
    document.getElementById("mechanicalType").value = getRandomItem(mechTypes);
    document.getElementById("motorLoadFactor").value = getRandomInRange(0.1, 0.8).toFixed(2);
    updateParamOutput("motorLoadFactor");
    document.getElementById("rpmFluctuation").value = getRandomInRange(0.05, 0.5).toFixed(2);
    updateParamOutput("rpmFluctuation");
    document.getElementById("mechanicalResonance").value = getRandomInRange(100, 1500, true);
    updateParamOutput("mechanicalResonance");
    document.getElementById("surfaceContact").value = getRandomInRange(0.2, 0.7).toFixed(2);
    updateParamOutput("surfaceContact");
  }
  
  // NEW: Formant randomization
  if (soundType === "formant" || soundType === "custom") {
    document.getElementById("formant1").value = getRandomInRange(250, 700, true);
    updateParamOutput("formant1");
    document.getElementById("formant2").value = getRandomInRange(900, 2200, true);
    updateParamOutput("formant2");
    document.getElementById("formant3").value = getRandomInRange(1800, 3500, true);
    updateParamOutput("formant3");
    document.getElementById("breathiness").value = getRandomInRange(0.1, 0.7).toFixed(2);
    updateParamOutput("breathiness");
    document.getElementById("vocalTension").value = getRandomInRange(0.2, 0.8).toFixed(2);
    updateParamOutput("vocalTension");
    document.getElementById("vibrato").value = getRandomInRange(0, 0.5).toFixed(2);
    updateParamOutput("vibrato");
    document.getElementById("vibratoRate").value = getRandomInRange(2, 8).toFixed(1);
    updateParamOutput("vibratoRate");
    
    // Additional formant parameters
    const vowels = ["a", "e", "i", "o", "u"];
    document.getElementById("vocalPreset").value = getRandomItem(vowels);
    document.getElementById("glottalOpenQuotient").value = getRandomInRange(0.3, 0.8).toFixed(2);
    updateParamOutput("glottalOpenQuotient");
    document.getElementById("throatLength").value = getRandomInRange(0.7, 1.3).toFixed(2);
    updateParamOutput("throatLength");
    document.getElementById("tonguePosition").value = getRandomInRange(0.2, 0.8).toFixed(2);
    updateParamOutput("tonguePosition");
    document.getElementById("mouthOpening").value = getRandomInRange(0.3, 0.9).toFixed(2);
    updateParamOutput("mouthOpening");
  }
  
  // Always randomize spatial parameters
  document.getElementById("refDistance").value = getRandomInRange(3, 20, true);
  document.getElementById("rolloff").value = getRandomInRange(0.5, 3).toFixed(1);
  document.getElementById("coneInner").value = getRandomInRange(30, 120, true);
  document.getElementById("coneOuter").value = getRandomInRange(150, 300, true);
  document.getElementById("coneOuterGain").value = getRandomInRange(0.05, 0.3).toFixed(2);
  
  document.getElementById('playStatus').textContent = "Parameters randomized! Generate a sound key to save them.";
}

// Define all available parameters by category
const allParameters = {
  basic: {
    name: "Basic",
    params: {
      refDistance: "Reference Distance",
      rolloff: "Rolloff Factor",
      coneInner: "Cone Inner Angle",
      coneOuter: "Cone Outer Angle",
      coneOuterGain: "Cone Outer Gain"
    }
  },
  wind: {
    name: "Wind",
    params: {
      windSpeed: "Wind Speed",
      windGustiness: "Wind Gustiness",
      windDirection: "Wind Direction",
      turbulence: "Turbulence",
      groundMaterial: "Ground Material"
    }
  },
  ocean: {
    name: "Ocean",
    params: {
      waveHeight: "Wave Height",
      waveFrequency: "Wave Frequency",
      surfIntensity: "Surf Intensity",
      oceanDepth: "Ocean Depth"
    }
  },
  leaves: {
    name: "Leaves",
    params: {
      rustleIntensity: "Rustle Intensity",
      leafType: "Leaf Type",
      leafDensity: "Leaf Density"
    }
  },
  fire: {
    name: "Fire",
    params: {
      fireIntensity: "Fire Intensity",
      crackleFrequency: "Crackle Frequency",
      crackleIntensity: "Crackle Intensity",
      flickerSpeed: "Flicker Speed",
      fuelType: "Fuel Type",
      flameTemp: "Flame Temperature"
    }
  },
  footsteps: {
    name: "Footsteps",
    params: {
      footstepVolume: "Footstep Volume",
      stepFrequency: "Step Frequency",
      footwearType: "Footwear Type",
      stepSurface: "Step Surface"
    }
  },
  synthesizer: {
    name: "Synthesizer",
    params: {
      oscType: "Oscillator Type",
      oscFrequency: "Frequency",
      oscDetune: "Detune",
      harmonic1: "1st Harmonic",
      harmonic2: "2nd Harmonic",
      harmonic3: "3rd Harmonic",
      noiseAmount: "Noise Amount",
      lfoRate: "LFO Rate",
      lfoDepth: "LFO Depth",
      lfoTarget: "LFO Target",
      filterType: "Filter Type",
      filterCutoff: "Filter Cutoff",
      filterResonance: "Filter Resonance",
      envelopeAttack: "Attack Time",
      envelopeRelease: "Release Time"
    }
  },
  percussion: {
    name: "Percussion",
    params: {
      impactSharpness: "Impact Sharpness",
      bodyResonance: "Body Resonance",
      decayLength: "Decay Length",
      pitchBend: "Pitch Bend",
      materialHardness: "Material Hardness",
      materialDensity: "Material Density",
      percussionType: "Percussion Type",
      strikeVelocity: "Strike Velocity",
      strikePosition: "Strike Position",
      resonantModes: "Resonant Modes"
    }
  },
  noise: {
    name: "Noise",
    params: {
      noiseColor: "Noise Color",
      noiseDensity: "Noise Density",
      lowFreqContent: "Low Frequency Content",
      highFreqContent: "High Frequency Content",
      spectralTilt: "Spectral Tilt",
      noiseModulation: "Modulation Amount",
      noiseModRate: "Modulation Rate",
      bandpassCenter: "Bandpass Center",
      bandpassWidth: "Bandpass Width",
      noiseQuantization: "Quantization"
    }
  },
  mechanical: {
    name: "Mechanical",
    params: {
      rpm: "RPM",
      gearRatio: "Gear Ratio",
      friction: "Friction",
      metallic: "Metallic Quality",
      mechanicalLooseness: "Mechanical Looseness",
      mechanicalType: "Mechanism Type",
      motorLoadFactor: "Load Factor",
      rpmFluctuation: "RPM Fluctuation",
      mechanicalResonance: "Resonance Frequency",
      surfaceContact: "Surface Contact"
    }
  },
  formant: {
    name: "Formant",
    params: {
      formant1: "Formant 1",
      formant2: "Formant 2",
      formant3: "Formant 3",
      breathiness: "Breathiness",
      vocalTension: "Vocal Tension",
      vibrato: "Vibrato Amount",
      vibratoRate: "Vibrato Rate",
      vocalPreset: "Vowel Preset",
      glottalOpenQuotient: "Glottal Open Quotient",
      throatLength: "Throat Length",
      tonguePosition: "Tongue Position",
      mouthOpening: "Mouth Opening"
    }
  }
};

// Store currently selected parameters and category colors
let selectedParameters = new Set();
let categoryColors = {};

/**
 * Updates selected parameters based on the sound type
 * @param {string} soundType - The selected sound type
 */
function updateSelectedParametersForType(soundType) {
  // Clear currently selected parameters
  selectedParameters.clear();
  
  // Always add basic spatial parameters
  selectedParameters.add('refDistance');
  selectedParameters.add('rolloff');
  
  // Add parameters specific to the sound type
  if (soundType === 'wind' || soundType === 'custom') {
    selectedParameters.add('windSpeed');
    selectedParameters.add('windGustiness');
    selectedParameters.add('turbulence');
  }
  
  if (soundType === 'ocean' || soundType === 'custom') {
    selectedParameters.add('waveHeight');
    selectedParameters.add('waveFrequency');
    selectedParameters.add('surfIntensity');
  }
  
  if (soundType === 'leaves' || soundType === 'custom') {
    selectedParameters.add('rustleIntensity');
    selectedParameters.add('leafDensity');
  }
  
  if (soundType === 'fire' || soundType === 'custom') {
    selectedParameters.add('fireIntensity');
    selectedParameters.add('crackleFrequency');
    selectedParameters.add('crackleIntensity');
  }
  
  if (soundType === 'footsteps' || soundType === 'custom') {
    selectedParameters.add('footstepVolume');
    selectedParameters.add('stepFrequency');
  }
  
  if (soundType === 'synthesizer' || soundType === 'custom') {
    selectedParameters.add('oscType');
    selectedParameters.add('oscFrequency');
    selectedParameters.add('harmonic1');
    selectedParameters.add('lfoRate');
  }
  
  if (soundType === 'percussion' || soundType === 'custom') {
    selectedParameters.add('impactSharpness');
    selectedParameters.add('bodyResonance');
    selectedParameters.add('decayLength');
  }
  
  if (soundType === 'noise' || soundType === 'custom') {
    selectedParameters.add('noiseColor');
    selectedParameters.add('noiseDensity');
    selectedParameters.add('spectralTilt');
  }
  
  if (soundType === 'mechanical' || soundType === 'custom') {
    selectedParameters.add('rpm');
    selectedParameters.add('friction');
    selectedParameters.add('mechanicalLooseness');
  }
  
  if (soundType === 'formant' || soundType === 'custom') {
    selectedParameters.add('formant1');
    selectedParameters.add('formant2');
    selectedParameters.add('breathiness');
    selectedParameters.add('vibrato');
  }
  
  // Update the visual representation
  updateParameterTags();
  updateParameterVisibility();
}

/**
 * Updates the parameter tags based on selected parameters
 */
function updateParameterTags() {
  const container = document.getElementById('selectedParameters');
  container.innerHTML = '';
  
  // Group parameters by category
  const parametersByCategory = {};
  
  // First, organize parameters by category
  selectedParameters.forEach(param => {
    let categoryKey = null;
    let paramName = param;
    
    // Find which category this parameter belongs to
    for (const category in allParameters) {
      if (allParameters[category].params[param]) {
        categoryKey = category;
        paramName = allParameters[category].params[param];
        break;
      }
    }
    
    if (categoryKey) {
      if (!parametersByCategory[categoryKey]) {
        parametersByCategory[categoryKey] = [];
      }
      parametersByCategory[categoryKey].push({ key: param, name: paramName });
    }
  });
  
  // Ensure we have colors for each category
  updateCategoryColors(Object.keys(parametersByCategory));
  
  // Now create tags for each category
  Object.keys(parametersByCategory).forEach(category => {
    // Create a category group
    const categoryGroup = document.createElement('div');
    categoryGroup.className = 'param-category-group';
    categoryGroup.style.marginBottom = '10px';
    
    // Add parameters for this category
    parametersByCategory[category].forEach(param => {
      const tag = document.createElement('div');
      tag.className = 'param-tag';
      tag.style.backgroundColor = `hsla(${categoryColors[category]}, 85%, 35%, 0.6)`;
      tag.style.borderColor = `hsl(${categoryColors[category]}, 85%, 45%)`;
      
      tag.innerHTML = `
        <span>${param.name}</span>
        <span class="remove-tag" data-param="${param.key}">×</span>
      `;
      
      // Add click handler to remove tag
      tag.querySelector('.remove-tag').addEventListener('click', function() {
        const paramToRemove = this.getAttribute('data-param');
        selectedParameters.delete(paramToRemove);
        updateParameterTags();
        updateParameterVisibility();
      });
      
      categoryGroup.appendChild(tag);
    });
    
    container.appendChild(categoryGroup);
  });
}

/**
 * Assigns colors to categories for visual distinction
 * @param {Array} categories - List of category keys to assign colors to
 */
function updateCategoryColors(categories) {
  // Assign colors if they don't exist already
  const totalColors = categories.length;
  categories.forEach((category, i) => {
    if (!categoryColors[category]) {
      // Create evenly distributed hue values using the simplified formula
      const hue = i / totalColors * 360;
      categoryColors[category] = hue;
    }
  });
}

/**
 * Shows the parameter selection modal
 */
function showParameterModal() {
  // Create modal elements
  const overlay = document.createElement('div');
  overlay.className = 'param-modal-overlay';
  
  const modal = document.createElement('div');
  modal.className = 'param-modal';
  
  modal.innerHTML = `
    <h3>Select Parameters</h3>
    <div class="param-categories"></div>
    <div class="param-modal-actions">
      <button class="secondary-btn" id="cancelParams">Cancel</button>
      <button class="primary-btn" id="confirmParams">Confirm</button>
    </div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Populate categories
  const categoriesContainer = modal.querySelector('.param-categories');
  
  for (const catKey in allParameters) {
    const category = allParameters[catKey];
    
    const categoryEl = document.createElement('div');
    categoryEl.className = 'param-category';
    
    // Check if all parameters in this category are selected
    const categoryParams = Object.keys(category.params);
    const allSelected = categoryParams.every(param => selectedParameters.has(param));
    
    // Create category header with checkbox
    let categoryHeader = `
      <div class="param-category-header">
        <div class="param-option category-checkbox">
          <input type="checkbox" id="category-${catKey}" ${allSelected ? 'checked' : ''} data-category="${catKey}">
          <label for="category-${catKey}" class="param-category-title">${category.name}</label>
        </div>
      </div>
    `;
    
    let categoryBody = '<div class="param-options">';
    
    for (const paramKey in category.params) {
      const isChecked = selectedParameters.has(paramKey) ? 'checked' : '';
      categoryBody += `
        <div class="param-option">
          <input type="checkbox" id="param-${paramKey}" ${isChecked} data-param="${paramKey}" data-category="${catKey}">
          <label for="param-${paramKey}">${category.params[paramKey]}</label>
        </div>
      `;
    }
    
    categoryBody += '</div>';
    
    categoryEl.innerHTML = categoryHeader + categoryBody;
    
    // Add color indicator based on category
    if (categoryColors[catKey]) {
      const colorIndicator = document.createElement('div');
      colorIndicator.className = 'category-color-indicator';
      colorIndicator.style.backgroundColor = `hsl(${categoryColors[catKey]}, 85%, 45%)`;
      categoryEl.querySelector('.param-category-header').appendChild(colorIndicator);
    }
    
    categoriesContainer.appendChild(categoryEl);
    
    // Add event handler for category checkbox
    categoryEl.querySelector(`#category-${catKey}`).addEventListener('change', function() {
      const isChecked = this.checked;
      const category = this.getAttribute('data-category');
      const checkboxes = categoryEl.querySelectorAll(`.param-option input[data-category="${category}"]`);
      
      checkboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
      });
    });
    
    // Add event handlers for parameter checkboxes to update category checkbox
    const paramCheckboxes = categoryEl.querySelectorAll('.param-option input[type="checkbox"][data-param]');
    paramCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', function() {
        updateCategoryCheckbox(catKey, categoryEl);
      });
    });
  }
  
  // Add event handlers for modal buttons
  document.getElementById('cancelParams').addEventListener('click', function() {
    document.body.removeChild(overlay);
  });
  
  document.getElementById('confirmParams').addEventListener('click', function() {
    // Gather all selected parameters
    const checkboxes = modal.querySelectorAll('input[type="checkbox"][data-param]');
    selectedParameters.clear();
    
    checkboxes.forEach(checkbox => {
      if (checkbox.checked) {
        selectedParameters.add(checkbox.getAttribute('data-param'));
      }
    });
    
    updateParameterTags();
    updateParameterVisibility();
    
    // Fix: Force update of collapsible sections
    document.querySelectorAll('.collapsible-section').forEach(section => {
      // If the section has visible parameters, ensure it's displayed properly
      if (section.querySelector('.parameter-control[style*="display: block"]')) {
        section.style.display = 'block';
        
        // Ensure the collapse state is correct
        if (!section.classList.contains('collapsed')) {
          updateCollapsedState(section, false);
        } else {
          updateCollapsedState(section, true);
        }
      } else {
        section.style.display = 'none';
      }
    });
    
    document.body.removeChild(overlay);
  });
}

/**
 * Updates the category checkbox based on individual parameter selections
 * @param {string} category - The category key
 * @param {HTMLElement} categoryEl - The category element containing checkboxes
 */
function updateCategoryCheckbox(category, categoryEl) {
  const paramCheckboxes = categoryEl.querySelectorAll(`.param-option input[data-category="${category}"][data-param]`);
  const categoryCheckbox = categoryEl.querySelector(`#category-${category}`);
  
  let allChecked = true;
  let allUnchecked = true;
  
  paramCheckboxes.forEach(checkbox => {
    if (checkbox.checked) {
      allUnchecked = false;
    } else {
      allChecked = false;
    }
  });
  
  categoryCheckbox.checked = allChecked;
  categoryCheckbox.indeterminate = !allChecked && !allUnchecked;
}

/**
 * Checks if a parameter is selected
 * @param {string} paramId - The parameter ID to check
 * @returns {boolean} True if parameter is selected
 */
function isParameterSelected(paramId) {
  return selectedParameters.has(paramId);
}

// Initialize parameter system on page load
document.addEventListener('DOMContentLoaded', function() {
  // ...existing code...
  
  // Wrap parameter labels and controls with a container for better visibility control
  wrapParameterControls();
  
  // Initialize with default parameters for current sound type
  const initialSoundType = document.getElementById('soundType').value;
  updateSelectedParametersForType(initialSoundType);
});

/**
 * Wraps parameter labels and controls with container elements for visibility control
 */
function wrapParameterControls() {
  // Process all form elements
  document.querySelectorAll('.sound-params').forEach(section => {
    const sectionId = section.id;
    const categoryKey = sectionId.replace('Params', '');
    const params = allParameters[categoryKey]?.params;
    
    if (!params) return;
    
    // Find all parameter inputs in this section
    Object.keys(params).forEach(paramKey => {
      const input = document.getElementById(paramKey);
      if (!input) return;
      
      // Find the label for this input
      const label = document.querySelector(`label[for="${paramKey}"]`);
      if (!label) return;
      
      // Group related elements (label, input, output if exists)
      const container = document.createElement('div');
      container.className = 'parameter-control';
      container.dataset.param = paramKey;
      
      // Move the label into the container
      label.parentNode.insertBefore(container, label);
      container.appendChild(label);
      
      // Move the input into the container
      container.appendChild(input);
      
      // If there's an output span, move it too
      const output = document.getElementById(`${paramKey}Output`);
      if (output) {
        container.appendChild(output);
      }
    });
  });
}

// Global variable to store loaded presets
let soundPresets = {
  categories: []
};

/**
 * Populates the preset category and preset selector dropdowns
 */
function populatePresetSelectors() {
  const categorySelect = document.getElementById('presetCategory');
  if (!categorySelect) return; // Exit if element doesn't exist
  
  // Clear existing options except the "All" option
  while (categorySelect.options.length > 1) {
    categorySelect.remove(1);
  }
  
  // Add categories from presets
  soundPresets.categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.name;
    option.textContent = category.name;
    categorySelect.appendChild(option);
  });
  
  // Trigger update of preset options
  updatePresetOptions();
}

/**
 * Updates the preset options based on the selected category
 */
function updatePresetOptions() {
  const categorySelect = document.getElementById('presetCategory');
  const presetSelect = document.getElementById('presetSelector');
  
  if (!categorySelect || !presetSelect) return; // Exit if elements don't exist
  
  const selectedCategory = categorySelect.value;
  
  // Clear existing options except the "Custom" option
  while (presetSelect.options.length > 1) {
    presetSelect.remove(1);
  }
  
  // Add relevant presets
  if (selectedCategory === 'all') {
    // Add all presets from all categories
    soundPresets.categories.forEach(category => {
      // Add category group
      const group = document.createElement('optgroup');
      group.label = category.name;
      
      // Add presets for this category
      category.presets.forEach(preset => {
        const option = document.createElement('option');
        option.value = preset.id;
        option.textContent = preset.name;
        group.appendChild(option);
      });
      
      presetSelect.appendChild(group);
    });
  } else {
    // Add presets for the selected category
    const category = soundPresets.categories.find(cat => cat.name === selectedCategory);
    if (category) {
      category.presets.forEach(preset => {
        const option = document.createElement('option');
        option.value = preset.id;
        option.textContent = preset.name;
        presetSelect.appendChild(option);
      });
    }
  }
  
  // Reset to custom if no preset is selected
  if (presetSelect.options.length <= 1) {
    presetSelect.value = 'custom';
  }
  
  // Update description and load preset if needed
  loadSelectedPreset();
}

/**
 * Loads the selected preset
 */
function loadSelectedPreset() {
  const presetSelect = document.getElementById('presetSelector');
  const descriptionElement = document.getElementById('presetDescription');
  
  // Add null checks to avoid errors
  if (!presetSelect || !descriptionElement) {
    console.warn("Preset elements not found in the DOM");
    return;
  }
  
  const selectedPreset = presetSelect.value;
  
  // Clear description
  descriptionElement.textContent = '';
  
  // If custom selected, do nothing
  if (selectedPreset === 'custom') {
    return;
  }
  
  // Find the selected preset
  let preset = null;
  for (const category of soundPresets.categories) {
    const foundPreset = category.presets.find(p => p.id === selectedPreset);
    if (foundPreset) {
      preset = foundPreset;
      break;
    }
  }
  
  // If preset found, load it
  if (preset) {
    // Display description
    descriptionElement.textContent = preset.description;
    
    // Apply parameters
    const params = preset.parameters;
    
    // Update selected parameters
    selectedParameters.clear();
    for (const param in params) {
      selectedParameters.add(param);
    }
    
    // Apply parameter values to UI
    for (const param in params) {
      const element = document.getElementById(param);
      if (element) {
        element.value = params[param];
        
        // Update slider displays if applicable
        if (element.classList.contains('slider')) {
          updateParamOutput(param);
        }
      }
    }
    
    // Update parameter tags and visibility
    updateParameterTags();
    updateParameterVisibility();
    
    const playStatus = document.getElementById('playStatus');
    if (playStatus) {
      playStatus.textContent = `Preset "${preset.name}" loaded!`;
    }
  }
}

/**
 * Shows the save preset modal
 */
function showSavePresetModal() {
  // Create modal elements
  const overlay = document.createElement('div');
  overlay.className = 'param-modal-overlay';
  
  const modal = document.createElement('div');
  modal.className = 'param-modal';
  
  modal.innerHTML = `
    <h3>Save Current as Preset</h3>
    <div class="preset-form">
      <div class="form-group">
        <label for="newPresetName">Preset Name:</label>
        <input type="text" id="newPresetName" placeholder="Enter a name for this preset">
      </div>
      
      <div class="form-group">
        <label for="newPresetCategory">Category:</label>
        <select id="newPresetCategory">
          ${soundPresets.categories.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('')}
          <option value="new">+ New Category</option>
        </select>
      </div>
      
      <div class="form-group" id="newCategoryGroup" style="display:none;">
        <label for="newCategoryName">New Category Name:</label>
        <input type="text" id="newCategoryName" placeholder="Enter new category name">
      </div>
      
      <div class="form-group">
        <label for="newPresetDescription">Description:</label>
        <textarea id="newPresetDescription" placeholder="Brief description of this sound preset"></textarea>
      </div>
    </div>
    <div class="param-modal-actions">
      <button class="secondary-btn" id="cancelSavePreset">Cancel</button>
      <button class="primary-btn" id="confirmSavePreset">Save Preset</button>
    </div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Show/hide new category input
  const categorySelect = document.getElementById('newPresetCategory');
  categorySelect.addEventListener('change', function() {
    const newCategoryGroup = document.getElementById('newCategoryGroup');
    newCategoryGroup.style.display = this.value === 'new' ? 'block' : 'none';
  });
  
  // Add event handlers for modal buttons
  document.getElementById('cancelSavePreset').addEventListener('click', function() {
    document.body.removeChild(overlay);
  });
  
  document.getElementById('confirmSavePreset').addEventListener('click', function() {
    const presetName = document.getElementById('newPresetName').value.trim();
    const categoryValue = document.getElementById('newPresetCategory').value;
    const categoryName = categoryValue === 'new' ? 
                         document.getElementById('newCategoryName').value.trim() : 
                         categoryValue;
    const description = document.getElementById('newPresetDescription').value.trim();
    
    if (!presetName) {
      alert('Please enter a name for your preset.');
      return;
    }
    
    if (categoryValue === 'new' && !categoryName) {
      alert('Please enter a name for the new category.');
      return;
    }
    
    // Create preset ID from name (slug format)
    const presetId = presetName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // Gather current parameters
    const params = {};
    selectedParameters.forEach(param => {
      const element = document.getElementById(param);
      if (element) {
        if (element.type === "number" || element.tagName === "SELECT" || 
            element.classList.contains('slider')) {
          params[param] = element.type === "number" || element.classList.contains('slider') ? 
                          parseFloat(element.value) : element.value;
        }
      }
    });
    
    // Create preset object
    const newPreset = {
      id: presetId,
      name: presetName,
      description: description,
      parameters: params
    };
    
    // Find or create category
    let category = soundPresets.categories.find(c => c.name === categoryName);
    if (!category) {
      category = {
        name: categoryName,
        presets: []
      };
      soundPresets.categories.push(category);
    }
    
    // Add preset to category
    category.presets.push(newPreset);
    
    // Update UI
    populatePresetSelectors();
    
    // Select the new preset
    document.getElementById('presetCategory').value = categoryName;
    updatePresetOptions();
    document.getElementById('presetSelector').value = presetId;
    loadSelectedPreset();
    
    // Show success message
    document.getElementById('playStatus').textContent = `Preset "${presetName}" saved successfully!`;
    
    // Close modal
    document.body.removeChild(overlay);
    
    // Offer to download updated presets JSON
    setTimeout(() => {
      if (confirm('Would you like to download the updated presets file?\n\nYou can save it as "presets.json" to permanently add this preset.')) {
        downloadPresetsJson();
      }
    }, 500);
  });
}

/**
 * Downloads the current presets as a JSON file
 */
function downloadPresetsJson() {
  const dataStr = JSON.stringify(soundPresets, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = 'presets.json';
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
}

/**
 * Initialize with default parameters instead of using soundType
 */
function initializeDefaultParameters() {
  // Clear currently selected parameters
  selectedParameters.clear();
  
  // Add basic spatial parameters
  selectedParameters.add('refDistance');
  selectedParameters.add('rolloff');
  
  // Add some default synthesizer parameters
  selectedParameters.add('oscType');
  selectedParameters.add('oscFrequency');
  selectedParameters.add('harmonic1');
  selectedParameters.add('noiseAmount');
  
  // Update the visual representation
  updateParameterTags();
  updateParameterVisibility();
}

// Helper function to create WAV from AudioBuffer
function createWavFromAudioBuffer(audioBuffer) {
  const numChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length * numChannels * 2; // 2 bytes per sample for 16-bit audio
  const buffer = new ArrayBuffer(44 + length);
  const view = new DataView(buffer);
  
  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // RIFF chunk length
  view.setUint32(4, 36 + length, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // Format chunk identifier
  writeString(view, 12, 'fmt ');
  // Format chunk length
  view.setUint32(16, 16, true);
  // Sample format (raw)
  view.setUint16(20, 1, true);
  // Channel count
  view.setUint16(22, numChannels, true);
  // Sample rate
  view.setUint32(24, audioBuffer.sampleRate, true);
  // Byte rate (sample rate * block align)
  view.setUint32(28, audioBuffer.sampleRate * numChannels * 2, true);
  // Block align (channel count * bytes per sample)
  view.setUint16(32, numChannels * 2, true);
  // Bits per sample
  view.setUint16(34, 16, true);
  // Data chunk identifier
  writeString(view, 36, 'data');
  // Data chunk length
  view.setUint32(40, length, true);
  
  // Write the audio data
  const channels = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(audioBuffer.getChannelData(i));
  }
  
  let offset = 44;
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][i]));
      // Convert float sample to 16-bit PCM
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }
  
  return buffer;
}

// Helper function to write strings to DataView
function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Download sound function
function downloadSoundFromUI() {
  const key = document.getElementById("soundKeyDisplay").textContent;
  if (!key) {
    alert("Please generate a sound key first by clicking the 'Generate Sound Key' button.");
    return;
  }
  
  // Get parameters from the key - check both local library and try to import from noise.js
  let params = soundLibrary[key];
  
  if (!params) {
    // Try to fetch from noise.js module as a fallback
    import('./noise.js').then(module => {
      try {
        const noise = module.getNoiseFromKey(key);
        if (noise && noise.params) {
          // Save to local library for future use
          soundLibrary[key] = noise.params;
          // Proceed with download
          continueDownload(noise.params);
        } else {
          alert("Could not find parameters for this sound key. Please regenerate the sound key.");
        }
      } catch (error) {
        console.error("Error fetching parameters:", error);
        alert("Error loading sound parameters. Please try regenerating the sound key.");
      }
    }).catch(error => {
      console.error("Failed to load noise.js module:", error);
      alert("Could not access sound parameters. Please try again.");
    });
    return;
  }
  
  // Continue with the download if we have params
  continueDownload(params);
  
  // Helper function to continue download process with parameters
  function continueDownload(params) {
    // Get duration from slider
    const duration = parseInt(document.getElementById("playbackDuration").value);
    
    // Show user that download is being prepared
    document.getElementById('playStatus').textContent = "Preparing sound download...";
    
    // Create an audio context
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    try {
      // Create buffer based on sound type
      let buffer;
      
      switch (params.soundType) {
        case "wind":
          buffer = SoundGenerator.createWindBuffer(audioCtx, params);
          break;
        case "ocean":
          buffer = SoundGenerator.createOceanBuffer(audioCtx, params);
          break;
        case "leaves":
          buffer = SoundGenerator.createLeavesBuffer(audioCtx, params);
          break;
        case "fire":
          buffer = SoundGenerator.createFireBuffer(audioCtx, params);
          break;
        case "footsteps":
          buffer = SoundGenerator.createFootstepsBuffer(audioCtx, params);
          break;
        case "synthesizer":
          buffer = SoundGenerator.createSynthBuffer(audioCtx, params);
          break;
        case "percussion":
          buffer = SoundGenerator.createPercussionBuffer(audioCtx, params);
          break;
        case "noise":
          buffer = SoundGenerator.createColoredNoiseBuffer(audioCtx, params);
          break;
        case "mechanical":
          buffer = SoundGenerator.createMechanicalBuffer(audioCtx, params);
          break;
        case "formant":
          buffer = SoundGenerator.createFormantBuffer(audioCtx, params);
          break;
        case "environmental":
          buffer = SoundGenerator.createEnvironmentalSound(audioCtx, params);
          break;
        case "layered":
          buffer = SoundGenerator.createLayeredSoundBuffer(audioCtx, params);
          break;
        case "custom":
          // For custom, determine which buffer to use based on parameters
          // For layered sounds, check if there's a soundLayers property
          if (params.soundLayers) {
            buffer = SoundGenerator.createLayeredSoundBuffer(audioCtx, params);
          } else if (params.environment) {
            buffer = SoundGenerator.createEnvironmentalSound(audioCtx, params);
          } else if (params.oscType !== undefined) {
            buffer = SoundGenerator.createSynthBuffer(audioCtx, params);
          } else if (params.impactSharpness !== undefined) {
            buffer = SoundGenerator.createPercussionBuffer(audioCtx, params);
          } else if (params.noiseColor !== undefined) {
            buffer = SoundGenerator.createColoredNoiseBuffer(audioCtx, params);
          } else if (params.rpm !== undefined) {
            buffer = SoundGenerator.createMechanicalBuffer(audioCtx, params);
          } else if (params.formant1 !== undefined) {
            buffer = SoundGenerator.createFormantBuffer(audioCtx, params);
          } else if (params.windSpeed !== undefined) {
            buffer = SoundGenerator.createWindBuffer(audioCtx, params);
          } else if (params.waveHeight !== undefined) {
            buffer = SoundGenerator.createOceanBuffer(audioCtx, params);
          } else if (params.rustleIntensity !== undefined) {
            buffer = SoundGenerator.createLeavesBuffer(audioCtx, params);
          } else if (params.fireIntensity !== undefined) {
            buffer = SoundGenerator.createFireBuffer(audioCtx, params);
          } else if (params.footstepVolume !== undefined || params.stepSurface !== undefined) {
            buffer = SoundGenerator.createFootstepsBuffer(audioCtx, params);
          } else {
            buffer = SoundGenerator.createNoiseBuffer(audioCtx, duration);
          }
          break;
        default:
          buffer = SoundGenerator.createNoiseBuffer(audioCtx, duration);
      }
      
      if (!buffer) {
        throw new Error("Could not create audio buffer");
      }
      
      // IMPROVED: Create a longer buffer if needed for ALL sound types
      // This ensures the downloaded sound will have the full requested duration
      let needsExtension = buffer.duration < duration;
      let needsRendering = false;
      
      if (needsExtension) {
        // Create a new buffer with the exact requested duration
        const newBuffer = audioCtx.createBuffer(
          buffer.numberOfChannels,
          Math.ceil(audioCtx.sampleRate * duration),
          audioCtx.sampleRate
        );
        
        // Loop the original buffer into the new one
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
          const newData = newBuffer.getChannelData(channel);
          const originalData = buffer.getChannelData(channel);
          const originalLength = originalData.length;
          
          if (originalLength === 0) continue;
          
          // Properly loop the original data to fill the new buffer
          let srcPosition = 0;
          for (let i = 0; i < newData.length; i++) {
            // Better looping logic with smoother transitions
            newData[i] = originalData[srcPosition];
            srcPosition = (srcPosition + 1) % originalLength;
          }
        }
        
        buffer = newBuffer;
      }
      
      // Apply basic audio processing if needed
      if (params.soundType === "wind" && params.windSpeed !== undefined) {
        // ... existing wind processing code ...
        needsRendering = true;
      }
      
      // Define the finish download function
      function finishDownload() {
        // Convert the buffer to WAV format
        const wavBuffer = createWavFromAudioBuffer(buffer);
        
        // Create a Blob and download link
        const blob = new Blob([wavBuffer], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        
        // Create filename in the requested format: "noise [sound key].wav"
        const filename = `noise ${key}.wav`;
        
        // Create and trigger a download link
        const downloadLink = document.createElement("a");
        downloadLink.href = url;
        downloadLink.download = filename;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Clean up
        URL.revokeObjectURL(url);
        audioCtx.close();
        
        document.getElementById('playStatus').textContent = "Sound downloaded successfully!";
      }
      
      if (needsRendering) {
        // For sounds that need processing, use an offline audio context
        const offlineCtx = new OfflineAudioContext(
          buffer.numberOfChannels,
          buffer.length,
          buffer.sampleRate
        );
        
        const offlineSource = offlineCtx.createBufferSource();
        offlineSource.buffer = buffer;
        
        // Apply effects specific to the sound type
        if (params.soundType === "wind" && params.windSpeed !== undefined) {
          const filter = offlineCtx.createBiquadFilter();
          filter.type = "bandpass";
          let cutoff = 200 + (params.windSpeed / 100) * 1800;
          filter.frequency.value = cutoff;
          
          offlineSource.connect(filter);
          filter.connect(offlineCtx.destination);
        } else {
          offlineSource.connect(offlineCtx.destination);
        }
        
        offlineSource.start();
        
        // Render and use the processed buffer
        offlineCtx.startRendering().then(processedBuffer => {
          buffer = processedBuffer;
          finishDownload();
        }).catch(err => {
          console.error("Rendering failed:", err);
          // Fallback to unprocessed buffer
          finishDownload();
        });
      } else {
        // For sounds that don't need processing, proceed directly
        finishDownload();
      }
    } catch (error) {
      console.error("Error generating sound for download:", error);
      document.getElementById('playStatus').textContent = "Error generating sound for download.";
      audioCtx.close();
    }
  }
}

// Global variables for audio visualization
let mainAnalyser = null;
let parameterAnalysers = {};
let visualizationAnimationId = null;
let visualizationActive = false;

/**
 * Initializes audio visualization components
 */
function initializeVisualization() {
  // Create main analyser for combined output with better settings
  const audioCtx = audioListener.context;
  mainAnalyser = audioCtx.createAnalyser();
  mainAnalyser.fftSize = 512;  // Higher for better resolution
  mainAnalyser.smoothingTimeConstant = 0.6;  // Less smoothing for more movement
}

/**
 * Creates a parameter-specific visualization
 * @param {string} param - The parameter ID
 */
function createParamVisualization(param) {
  const paramControl = document.querySelector(`.parameter-control[data-param="${param}"]`);
  if (!paramControl) return;
  
  // Check if visualization already exists
  if (paramControl.querySelector('.param-visualization')) return;
  
  // Find the category for this parameter
  let categoryKey = null;
  for (const category in allParameters) {
    if (allParameters[category].params[param]) {
      categoryKey = category;
      break;
    }
  }
  
  // Create canvas for visualization with explicit styling
  const canvas = document.createElement('canvas');
  canvas.className = 'param-visualization';
  canvas.height = 30;
  canvas.width = paramControl.clientWidth || 300;
  canvas.dataset.param = param;
  canvas.style.display = 'block';  // Make sure it's visible
  canvas.style.marginTop = '5px';
  canvas.style.marginBottom = '10px';
  canvas.style.border = '1px solid #ccc';
  canvas.style.borderRadius = '4px';
  
  // Set data attribute for styling
  if (categoryKey && categoryColors[categoryKey]) {
    canvas.dataset.category = categoryKey;
    canvas.dataset.color = categoryColors[categoryKey];
  }
  
  // Add to parameter control
  paramControl.appendChild(canvas);
  
  // Create analyzer for this parameter if needed
  if (!parameterAnalysers[param] && audioListener) {
    const audioCtx = audioListener.context;
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;  // Higher resolution
    analyser.smoothingTimeConstant = 0.5;  // Less smoothing for more movement
    parameterAnalysers[param] = analyser;
  }
  
  // Initialize with a flat line visualization
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = categoryKey && categoryColors[categoryKey] ? 
                      `hsl(${categoryColors[categoryKey]}, 85%, 45%)` : '#666';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height/2);
  ctx.lineTo(canvas.width, canvas.height/2);
  ctx.stroke();
}

/**
 * Updates visualizations for all parameters and the main output
 */
function updateVisualizations() {
  if (!visualizationActive) return;
  
  // Update main visualization
  const mainCanvas = document.getElementById('mainVisualization');
  if (mainCanvas && mainAnalyser) {
    drawVisualization(mainCanvas, mainAnalyser, 'rgba(39, 174, 96, 0.5)');
  }
  
  // Update parameter visualizations
  selectedParameters.forEach(param => {
    const canvas = document.querySelector(`.param-visualization[data-param="${param}"]`);
    const analyser = parameterAnalysers[param];
    
    if (canvas && analyser) {
      // Get color from the category
      let color = '#666';
      const categoryKey = canvas.dataset.category;
      if (categoryKey && categoryColors[categoryKey]) {
        color = `hsla(${categoryColors[categoryKey]}, 85%, 45%, 0.7)`;
      }
      
      drawVisualization(canvas, analyser, color);
    }
  });
  
  // Continue animation loop
  visualizationAnimationId = requestAnimationFrame(updateVisualizations);
}

/**
 * Draws the audio data visualization on a canvas
 * @param {HTMLCanvasElement} canvas - The canvas to draw on
 * @param {AnalyserNode} analyser - The audio analyser node
 * @param {string} color - The color to use for drawing
 */
function drawVisualization(canvas, analyser, color) {
  if (!analyser) return;
  
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  
  // Get audio data - we can use frequency data for more visible movement
  analyser.getByteFrequencyData(dataArray);
  
  const canvasCtx = canvas.getContext('2d');
  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
  
  canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
  
  canvasCtx.lineWidth = 2;
  canvasCtx.strokeStyle = color;
  canvasCtx.beginPath();
  
  const sliceWidth = canvas.width / bufferLength;
  let x = 0;
  
  for (let i = 0; i < bufferLength; i++) {
    // Normalize to use the full height of the canvas
    const v = dataArray[i] / 256.0;
    const y = canvas.height - (v * canvas.height);
    
    if (i === 0) {
      canvasCtx.moveTo(x, y);
    } else {
      canvasCtx.lineTo(x, y);
    }
    
    x += sliceWidth;
  }
  
  // Add a baseline
  canvasCtx.lineTo(canvas.width, canvas.height/2);
  canvasCtx.stroke();
}

/**
 * Starts the audio visualization
 */
function startVisualization() {
  if (visualizationActive) return;
  visualizationActive = true;
  
  // Create visualizations for all parameters
  selectedParameters.forEach(createParamVisualization);
  
  // Make sure the main visualization canvas is visible
  const mainCanvas = document.getElementById('mainVisualization');
  if (mainCanvas) {
    mainCanvas.style.display = 'block';
    const playButton = document.querySelector('.play-btn');
    if (playButton) {
      mainCanvas.width = playButton.clientWidth || 200;
      mainCanvas.height = playButton.clientHeight || 40;
    }
  }
  
  // Reset any existing animation
  if (visualizationAnimationId) {
    cancelAnimationFrame(visualizationAnimationId);
  }
  
  // Start animation loop with a small delay to make sure audio is connected
  setTimeout(() => {
    updateVisualizations();
  }, 100);
}

/**
 * Stops the audio visualization
 */
function stopVisualization() {
  visualizationActive = false;
  if (visualizationAnimationId) {
    cancelAnimationFrame(visualizationAnimationId);
    visualizationAnimationId = null;
  }
}

// Initialize visualization on page load
document.addEventListener('DOMContentLoaded', function() {
  // ...existing code...
  
  // Create main visualization canvas in the play button
  const playButton = document.querySelector('.play-btn');
  if (playButton) {
    // Check if canvas already exists
    let canvas = document.getElementById('mainVisualization');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'mainVisualization';
      canvas.className = 'btn-visualization';
      canvas.style.position = 'absolute'; 
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.pointerEvents = 'none'; // Don't interfere with button clicks
      canvas.style.opacity = '0.7';
      canvas.style.zIndex = '1';
      playButton.style.position = 'relative'; // Ensure button can have absolute positioned children
      playButton.insertBefore(canvas, playButton.firstChild);
    }
    
    // Resize canvas to match button size
    setTimeout(() => {
      canvas.width = playButton.clientWidth || 200;
      canvas.height = playButton.clientHeight || 40;
    }, 100);
  }
  
  // Initialize audio visualization
  initializeVisualization();
  
  // Add window resize handler for responsive canvases
  window.addEventListener('resize', resizeVisualizations);
  
  // Add some CSS to ensure visualizations are visible
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    .param-visualization {
      display: block !important;
      width: 100%;
      margin-top: 5px;
      margin-bottom: 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    .btn-visualization {
      display: block !important;
    }
  `;
  document.head.appendChild(styleEl);
});

/**
 * Resize all visualization canvases to match their container sizes
 */
function resizeVisualizations() {
  // Resize main visualization
  const mainCanvas = document.getElementById('mainVisualization');
  const playButton = document.querySelector('.play-btn');
  
  if (mainCanvas && playButton) {
    mainCanvas.width = playButton.clientWidth || 200;
    mainCanvas.height = playButton.clientHeight || 40;
  }
  
  // Resize parameter visualizations
  document.querySelectorAll('.param-visualization').forEach(canvas => {
    const container = canvas.parentElement;
    if (container) {
      canvas.width = container.clientWidth || 300;
    }
  });
}

// Add visibility observer to properly size canvases when they become visible
document.addEventListener('DOMContentLoaded', function() {
  // ...existing code...
  
  // Create an intersection observer to handle visualizations in collapsed sections
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // If a parameter control becomes visible, ensure its visualization is sized correctly
        const paramControl = entry.target;
        const canvas = paramControl.querySelector('.param-visualization');
        if (canvas) {
          canvas.width = paramControl.clientWidth;
        }
      }
    });
  });
  
  // Observe all parameter controls
  document.querySelectorAll('.parameter-control').forEach(control => {
    observer.observe(control);
  });
  
  // When a collapsible section is toggled, resize visualizations inside it
  document.querySelectorAll('.collapse-toggle').forEach(toggle => {
    toggle.addEventListener('click', function() {
      setTimeout(resizeVisualizations, 300); // Wait for animation to complete
    });
  });
});

/*
// Update parameter visibility to include visualization creation
function updateParameterVisibility() {
  // First hide all parameter inputs
  document.querySelectorAll('.parameter-control').forEach(control => {
    control.style.display = 'none';
  });
  
  // Show only selected parameters
  selectedParameters.forEach(param => {
    const paramControl = document.querySelector(`.parameter-control[data-param="${param}"]`);
    if (paramControl) {
      paramControl.style.display = 'block';
      
      // Create visualization canvas if it doesn't exist
      createParamVisualization(param);
    }
  });
  
  // Update section visibility
  document.querySelectorAll('.sound-params').forEach(section => {
    const sectionId = section.id;
    const categoryKey = sectionId.replace('Params', '');
    
    // Check if any parameter in this section is selected
    let hasVisibleParams = false;
    const params = allParameters[categoryKey]?.params;
    
    if (params) {
      Object.keys(params).some(param => {
        if (selectedParameters.has(param)) {
          hasVisibleParams = true;
          return true;
        }
        return false;
      });
    }
    
    // Show section if it has visible parameters
    if (hasVisibleParams) {
      section.style.display = 'block';
      
      // Ensure the content is visible if section is not collapsed
      if (!section.classList.contains('collapsed')) {
        const content = section.querySelector('.collapsible-content');
        if (content) {
          content.style.maxHeight = '2000px';
          content.style.overflow = 'visible';
        }
      }
    } else if (section.style.display !== 'none') {
      section.style.display = 'none';
    }
  });
}

*/

// Make key functions available globally for event handlers
window.generateSoundKey = generateSoundKey;
window.loadSoundKey = loadSoundKey;
window.playSoundFromUI = playSoundFromUI;
window.downloadSoundFromUI = downloadSoundFromUI;
window.randomizeParameters = randomizeParameters;
window.showSavePresetModal = showSavePresetModal;
window.updateDurationDisplay = updateDurationDisplay;
window.updateParamOutput = updateParamOutput;