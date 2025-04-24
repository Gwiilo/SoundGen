///////////////////////////
// UI Behavior: Show/hide fieldsets and handle parameters
///////////////////////////
document.addEventListener('DOMContentLoaded', function() {
  // Show/hide correct parameter panels when sound type changes
  document.getElementById('soundType').addEventListener('change', function() {
    const type = this.value;
    const paramPanels = document.querySelectorAll('.sound-params');
    
    // Hide all parameter panels first
    paramPanels.forEach(panel => {
      panel.style.display = 'none';
    });
    
    // Show the selected one
    if (type === 'custom') {
      // For custom, show all parameters
      paramPanels.forEach(panel => {
        panel.style.display = 'block';
      });
    } else {
      // For specific presets, show only the relevant panel
      const selectedPanel = document.getElementById(`${type}Params`);
      if (selectedPanel) {
        selectedPanel.style.display = 'block';
      }
      
      // Apply preset values
      applyPresetValues(type);
    }
  });
  
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
  
  // Ensure the parameters are initially collapsed
  document.querySelectorAll('.collapsible-section').forEach(section => {
    // Make sure the content is actually hidden on page load
    if (section.classList.contains('collapsed')) {
      updateCollapsedState(section, true);
    }
  });
  
  // Add event listener for sound type changes
  document.getElementById('soundType').addEventListener('change', function() {
    updateSelectedParametersForType(this.value);
  });
  
  // Add event listener for the add parameter button
  document.getElementById('addParameterBtn').addEventListener('click', showParameterModal);
  
  // Initialize with default parameters for current sound type
  const initialSoundType = document.getElementById('soundType').value;
  updateSelectedParametersForType(initialSoundType);
});

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
  
  if (collapsed) {
    // Collapse the section
    content.style.maxHeight = '0';
    content.style.opacity = '0';
    content.style.paddingTop = '0';
    content.style.paddingBottom = '0';
    content.style.pointerEvents = 'none';
  } else {
    // Expand the section
    content.style.maxHeight = '1000px';
    content.style.opacity = '1';
    content.style.paddingTop = '';
    content.style.paddingBottom = '';
    content.style.pointerEvents = '';
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

// Load a sound from key
function loadSoundKey() {
  const inputKey = document.getElementById('soundKeyInput').value.trim();
  
  if (!inputKey) {
    alert("Please enter a sound key.");
    return;
  }
  
  // First try to load from library for backward compatibility
  if (soundLibrary[inputKey]) {
    applyParametersToUI(soundLibrary[inputKey]);
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
        
        // Store in library for future use
        soundLibrary[inputKey] = params;
        document.getElementById('soundKeyDisplay').textContent = inputKey;
        document.getElementById('playStatus').textContent = "External sound key loaded!";
      } catch (e) {
        console.error("Error decoding new format key:", e);
        alert("Invalid sound key format. Cannot decode.");
      }
    } else {
      // Legacy hash-based key - try to reverse-engineer basic parameters
      reverseEngineerSoundKey(inputKey);
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
function generateSoundKey() {
  const soundType = document.getElementById('soundType').value;
  const params = { soundType };

  // Only gather parameters that are selected
  for (const category in allParameters) {
    for (const param in allParameters[category].params) {
      if (selectedParameters.has(param)) {
        const element = document.getElementById(param);
        if (element) {
          if (element.type === "number" || element.tagName === "SELECT" || 
              element.classList.contains('slider')) {
            params[param] = element.type === "number" || element.classList.contains('slider') ? 
                            parseFloat(element.value) : element.value;
          }
        }
      }
    }
  }

  const paramString = JSON.stringify(params);
  
  // Generate both formats of keys
  // 1. Legacy hash format for compatibility
  const legacyKey = hashString(paramString).toString(16);
  // 2. New format: Base64 encoded JSON (more universal)
  const newFormatKey = 'SND:' + btoa(paramString);
  
  // We'll use the legacy key for now, but store both formats
  const keyToUse = legacyKey;
  soundLibrary[keyToUse] = params;
  
  // Also make the new format key accessible
  soundLibrary[newFormatKey] = params;
  
  document.getElementById("soundKeyDisplay").textContent = keyToUse;
  document.getElementById('playStatus').textContent = "Sound key generated! Click 'Play Sound' to hear it.";
  
  // Also update the input field with the new key
  document.getElementById('soundKeyInput').value = keyToUse;
}

// Try to reverse-engineer parameters from a hash-based key
function reverseEngineerSoundKey(key) {
  // We can't perfectly reverse a hash, but we can make educated guesses
  // based on key length and structure
  
  // Default parameters as fallback
  const params = {
    soundType: 'custom',
    windSpeed: 40,
    windGustiness: 0.5,
    waveHeight: 60,
    fireIntensity: 0.5,
    crackleFrequency: 5,
    refDistance: 5,
    rolloff: 1
  };
  
  // Look at key length to guess the sound type
  const keyLength = key.length;
  
  if (keyLength >= 6 && keyLength <= 8) {
    // Likely a wind sound
    params.soundType = 'wind';
  } else if (keyLength > 8 && keyLength <= 10) {
    // Likely fire or ocean
    const firstChar = parseInt(key.charAt(0), 16);
    params.soundType = firstChar % 2 === 0 ? 'fire' : 'ocean';
  } else {
    // Try other types or default to custom
    const firstTwoChars = parseInt(key.substring(0, 2), 16);
    if (firstTwoChars % 3 === 0) params.soundType = 'leaves';
    else if (firstTwoChars % 3 === 1) params.soundType = 'footsteps';
    else params.soundType = 'custom';
  }
  
  // Extract intensity parameters from key segments
  try {
    // Use portions of the key to set parameter values
    const segment1 = parseInt(key.substring(0, 2), 16) % 100; // 0-99
    const segment2 = parseInt(key.substring(2, 4), 16) % 100;
    const segment3 = parseInt(key.substring(4, 6), 16) % 10;
    
    // Normalize values to appropriate ranges
    const normalizedValue1 = segment1 / 100; // 0-0.99
    const normalizedValue2 = segment2 / 100;
    
    // Apply to appropriate parameters based on sound type
    switch(params.soundType) {
      case 'wind':
        params.windSpeed = segment1;
        params.windGustiness = normalizedValue2;
        params.turbulence = (normalizedValue1 + normalizedValue2) / 2;
        break;
      case 'fire':
        params.fireIntensity = normalizedValue1;
        params.crackleFrequency = segment3;
        params.crackleIntensity = normalizedValue2;
        break;
      case 'ocean':
        params.waveHeight = segment1;
        params.waveFrequency = normalizedValue1;
        params.surfIntensity = normalizedValue2;
        break;
      // ...cases for other sound types...
    }
    
    console.log("Reverse engineered parameters:", params);
    applyParametersToUI(params);
    
    // Store in library for future use
    soundLibrary[key] = params;
    document.getElementById('soundKeyDisplay').textContent = key;
    document.getElementById('playStatus').textContent = "External sound key reverse-engineered!";
  } catch (e) {
    console.error("Error reverse engineering key:", e);
    alert("Could not fully decode this sound key. Applied best-guess parameters.");
  }
}

///////////////////////////
// Procedural Synthesis Module
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
function playSoundFromKey(soundKey, orientation, position, options = {}) {
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

  // Set buffer and looping
  positionalAudio.setBuffer(buffer);
  if (["wind", "fire", "ocean", "noise", "mechanical"].includes(params.soundType)) {
    positionalAudio.setLoop(true);
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
  document.getElementById('durationValue').textContent = value;
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
    currentlyPlaying = playSoundFromKey(key, orientation, position, options);
    document.getElementById('playStatus').textContent = `Playing ${duration} seconds of sound...`;
    
    // Reset UI after playback completes - ensure timing matches the actual duration
    setTimeout(() => {
      // Cancel any ongoing animation
      if (playbackAnimationId) {
        cancelAnimationFrame(playbackAnimationId);
        playbackAnimationId = null;
      }
      
      // Reset button - ensure progress is at 100% before resetting
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
    } else if (section.style.display !== 'none') {
      section.style.display = 'none';
    }
  });
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
