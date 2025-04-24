///////////////////////////
// UI Behavior: Show/hide fieldsets
///////////////////////////
document.getElementById('soundType').addEventListener('change', function() {
  const type = this.value;
  document.getElementById('windParams').style.display = (type === 'wind') ? 'block' : 'none';
  document.getElementById('leavesParams').style.display = (type === 'leaves') ? 'block' : 'none';
  document.getElementById('fireParams').style.display = (type === 'fire') ? 'block' : 'none';
  document.getElementById('footstepsParams').style.display = (type === 'footsteps') ? 'block' : 'none';
});

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

function generateSoundKey() {
  const soundType = document.getElementById('soundType').value;
  const params = { soundType };

  // Gather type-specific parameters.
  if (soundType === "wind") {
    params.windSpeed = parseFloat(document.getElementById("windSpeed").value);
    params.windGustiness = parseFloat(document.getElementById("windGustiness").value);
    params.windDirection = document.getElementById("windDirection").value;
    params.turbulence = parseFloat(document.getElementById("turbulence").value);
    params.groundMaterial = document.getElementById("groundMaterial").value;
  } else if (soundType === "leaves") {
    params.rustleIntensity = parseFloat(document.getElementById("rustleIntensity").value);
    params.leafType = document.getElementById("leafType").value;
    params.leafDensity = parseFloat(document.getElementById("leafDensity").value);
  } else if (soundType === "fire") {
    params.fireIntensity = parseFloat(document.getElementById("fireIntensity").value);
    params.crackleFrequency = parseFloat(document.getElementById("crackleFrequency").value);
    params.flickerSpeed = parseFloat(document.getElementById("flickerSpeed").value);
    params.fuelType = document.getElementById("fuelType").value;
    params.flameTemp = document.getElementById("flameTemp").value;
  } else if (soundType === "footsteps") {
    params.footstepVolume = parseFloat(document.getElementById("footstepVolume").value);
    params.stepFrequency = parseFloat(document.getElementById("stepFrequency").value);
    params.footwearType = document.getElementById("footwearType").value;
    params.stepSurface = document.getElementById("stepSurface").value;
  }

  // Gather spatial parameters (common to all sounds).
  params.refDistance = parseFloat(document.getElementById("refDistance").value);
  params.rolloff = parseFloat(document.getElementById("rolloff").value);
  params.coneInner = parseFloat(document.getElementById("coneInner").value);
  params.coneOuter = parseFloat(document.getElementById("coneOuter").value);
  params.coneOuterGain = parseFloat(document.getElementById("coneOuterGain").value);

  const paramString = JSON.stringify(params);
  const key = hashString(paramString).toString(16);
  soundLibrary[key] = params;
  document.getElementById("soundKeyDisplay").textContent = key;
  document.getElementById('playStatus').textContent = "Sound key generated! Click 'Play Sound' to hear it.";
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

  // WIND buffer.
  createWindBuffer: function(audioCtx, params) {
    try {
      const duration = 4;
      return this.createNoiseBuffer(audioCtx, duration);
    } catch (error) {
      console.error("Error creating wind buffer:", error);
      return audioCtx.createBuffer(1, audioCtx.sampleRate * 4, audioCtx.sampleRate);
    }
  },

  // LEAVES buffer.
  createLeavesBuffer: function(audioCtx, params) {
    const duration = 1;
    return getCachedNoiseBuffer(audioCtx, "leaves", duration);
  },

  // FIRE buffer.
  createFireBuffer: function(audioCtx, params) {
    const duration = 4;
    return this.createNoiseBuffer(audioCtx, duration);
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
    case "leaves":
      buffer = SoundGenerator.createLeavesBuffer(audioCtx, params);
      break;
    case "fire":
      buffer = SoundGenerator.createFireBuffer(audioCtx, params);
      break;
    case "footsteps":
      buffer = SoundGenerator.createFootstepsBuffer(audioCtx, params);
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
  if (["wind", "fire"].includes(params.soundType)) {
    positionalAudio.setLoop(true);
  }
  
  // Add to the 3D object
  soundObject.add(positionalAudio);
  
  // Schedule envelope
  const duration = options.duration || 3;
  scheduleEnvelope(positionalAudio.gain, audioCtx, duration, options.fadeIn, options.fadeOut);
  
  // Start playback
  positionalAudio.play();
  
  // Setup audio processing AFTER playback starts
  setTimeout(() => {
    try {
      // Get access to the Web Audio API context
      const audioCtx = audioListener.context;
      
      if (params.soundType === "wind" && positionalAudio.source) {
        console.log("Applying wind sound effects");
        
        // Create filter
        const filter = audioCtx.createBiquadFilter();
        filter.type = "bandpass";
        let cutoff = 200 + (params.windSpeed / 100) * 1800;
        
        // Adjust cutoff based on ground material
        if (params.groundMaterial === "snow") cutoff += 200;
        else if (params.groundMaterial === "rock") cutoff -= 200;
        else if (params.groundMaterial === "sand") cutoff -= 100;
        filter.frequency.value = cutoff;
        
        // Create LFO for wind effects
        const lfo = audioCtx.createOscillator();
        const lfoGain = audioCtx.createGain();
        lfo.frequency.value = params.windGustiness * 0.5;
        lfoGain.gain.value = 50;
        
        // Connect LFO to filter frequency
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();
        
        // Instead of trying to modify Three.js internal audio chain,
        // we'll just apply a filter to the sound output
        // This is safer than disconnecting the source
        const gainNode = positionalAudio.gain;
        const gainValue = gainNode.gain.value;
        
        // Create a new filter and gain in the chain
        const additionalGain = audioCtx.createGain();
        additionalGain.gain.value = gainValue;
        
        // Apply the filter to the audio output
        positionalAudio.setFilter(filter);
      } 
      else if (params.soundType === "fire" && positionalAudio.source) {
        console.log("Applying fire sound effects");
        
        // Fire sound processing - use the built-in filter method
        const filter = audioCtx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 500 + (params.fireIntensity || 0.5) * 2500;
        
        // Use the Three.js setFilter method instead of manual connections
        positionalAudio.setFilter(filter);
      }
    } catch (error) {
      console.warn("Could not apply audio effects:", error);
    }
  }, 50); // Small delay to ensure audio is initialized
  
  // Set timeout to remove when done
  setTimeout(() => {
    if (positionalAudio.isPlaying) {
      positionalAudio.stop();
    }
    scene.remove(soundObject);
  }, duration * 1000);
  
  // If velocity provided, add to moving audio list
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

// Track active sounds
let currentlyPlaying = null;

function playSoundFromUI() {
  const key = document.getElementById("soundKeyDisplay").textContent;
  console.log("Attempting to play sound with key:", key);
  
  if (!key) {
    alert("Please generate a sound key first by clicking the 'Generate Sound Key' button.");
    return;
  }
  
  // Get duration from slider
  const duration = parseInt(document.getElementById("playbackDuration").value);
  console.log("Playing sound for", duration, "seconds");
  
  // Update UI to show sound is playing
  const playButton = document.querySelector('button[onclick="playSoundFromUI()"]');
  playButton.textContent = "Playing...";
  playButton.disabled = true;
  
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
    
    // Reset UI after playback completes
    setTimeout(() => {
      playButton.textContent = "Play Sound";
      playButton.disabled = false;
      document.getElementById('playStatus').textContent = "";
      currentlyPlaying = null;
    }, duration * 1000);
    
  } catch (error) {
    console.error("Error playing sound:", error);
    playButton.textContent = "Play Sound";
    playButton.disabled = false;
    document.getElementById('playStatus').textContent = "Error playing sound, check console";
  }
}
