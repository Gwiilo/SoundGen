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
      section.classList.toggle('collapsed');
      
      // Stop event propagation to prevent any unintended behavior
      e.stopPropagation();
    });
  });
});

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
}

// Handle generating universal sound keys (for backward compatibility)
function generateSoundKey() {
  const soundType = document.getElementById('soundType').value;
  const params = { soundType };

  // Gather parameters based on sound type
  if (soundType === "wind" || soundType === "custom") {
    params.windSpeed = parseFloat(document.getElementById("windSpeed").value);
    params.windGustiness = parseFloat(document.getElementById("windGustiness").value);
    params.windDirection = document.getElementById("windDirection").value;
    params.turbulence = parseFloat(document.getElementById("turbulence").value);
    params.groundMaterial = document.getElementById("groundMaterial").value;
  }
  
  if (soundType === "ocean" || soundType === "custom") {
    params.waveHeight = parseFloat(document.getElementById("waveHeight").value);
    params.waveFrequency = parseFloat(document.getElementById("waveFrequency").value);
    params.surfIntensity = parseFloat(document.getElementById("surfIntensity").value);
    params.oceanDepth = document.getElementById("oceanDepth").value;
  }
  
  if (soundType === "leaves" || soundType === "custom") {
    params.rustleIntensity = parseFloat(document.getElementById("rustleIntensity").value);
    params.leafType = document.getElementById("leafType").value;
    params.leafDensity = parseFloat(document.getElementById("leafDensity").value);
  }
  
  if (soundType === "fire" || soundType === "custom") {
    params.fireIntensity = parseFloat(document.getElementById("fireIntensity").value);
    params.crackleFrequency = parseFloat(document.getElementById("crackleFrequency").value);
    params.crackleIntensity = parseFloat(document.getElementById("crackleIntensity").value);
    params.flickerSpeed = parseFloat(document.getElementById("flickerSpeed").value);
    params.fuelType = document.getElementById("fuelType").value;
    params.flameTemp = document.getElementById("flameTemp").value;
  }
  
  if (soundType === "footsteps" || soundType === "custom") {
    params.footstepVolume = parseFloat(document.getElementById("footstepVolume").value);
    params.stepFrequency = parseFloat(document.getElementById("stepFrequency").value);
    params.footwearType = document.getElementById("footwearType").value;
    params.stepSurface = document.getElementById("stepSurface").value;
  }

  // Gather spatial parameters (common to all sounds)
  params.refDistance = parseFloat(document.getElementById("refDistance").value);
  params.rolloff = parseFloat(document.getElementById("rolloff").value);
  params.coneInner = parseFloat(document.getElementById("coneInner").value);
  params.coneOuter = parseFloat(document.getElementById("coneOuter").value);
  params.coneOuterGain = parseFloat(document.getElementById("coneOuterGain").value);

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
    case "custom":
      // For custom, determine which buffer to use based on parameters
      if (params.windSpeed !== undefined) {
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
  if (["wind", "fire", "ocean"].includes(params.soundType)) {
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
