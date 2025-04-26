/**
 * SoundGen Noise Module
 * Provides functions for procedural sound generation and playback
 */

// Cache for noise buffers to avoid regeneration
const cachedBuffers = {};

/**
 * Get cached noise buffer or create a new one
 * @param {AudioContext} audioCtx - The audio context
 * @param {string} key - Cache key for the buffer
 * @param {number} duration - Duration in seconds
 * @returns {AudioBuffer} The noise buffer
 */
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

/**
 * djb2 hash function for creating sound keys
 * @param {string} str - String to hash
 * @returns {number} Hash value
 */
function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return hash >>> 0;
}

/**
 * Sound library for storing presets
 */
const soundLibrary = {};

/**
 * Decodes a compact sound key into parameters
 * @param {string} compactKey - The compact key to decode
 * @returns {Object} The decoded parameters
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
      
      // Check if it's an oscillator type
      if (['i', 'q', 'w', 't', 'c'].includes(firstPart)) {
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
      }
      break;
  }
  
  // Always decode spatial parameters
  decodeParam('refDistance', 1, 2);
  decodeParam('rolloff', 10, 2);
  
  // Add reasonable defaults for parameters that might be missing
  if (params.soundType === 'wind' && !params.windSpeed) params.windSpeed = 40;
  if (params.soundType === 'ocean' && !params.waveHeight) params.waveHeight = 60;
  if (params.soundType === 'fire' && !params.fireIntensity) params.fireIntensity = 0.5;
  if (params.soundType === 'synthesizer' && !params.oscType) params.oscType = 'sine';
  if (params.soundType === 'noise' && !params.noiseColor) params.noiseColor = 'white';
  
  return params;
}

/**
 * The sound generator object containing methods for creating different sound buffers
 */
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
      const bufferSize = Math.floor(duration * audioCtx.sampleRate);
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      
      // Get wind parameters with defaults
      const windSpeed = params.windSpeed || 40;
      const windGustiness = params.windGustiness || 0.5;
      const turbulence = params.turbulence || 0.3;
      
      // Base frequency depends on wind speed
      const baseFreq = windSpeed / 100;
      
      // Generate wind noise with gusts
      for (let i = 0; i < bufferSize; i++) {
        const t = i / audioCtx.sampleRate;
        
        // Base noise
        let noise = Math.random() * 2 - 1;
        
        // Low frequency modulation for base wind
        const baseWind = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(2 * Math.PI * baseFreq * t));
        
        // Gusts - random short-term increases in volume
        let gustEffect = 0;
        if (windGustiness > 0) {
          const gustFreq = baseFreq * 2;
          const gustDepth = windGustiness * 0.7;
          gustEffect = Math.max(0, Math.sin(2 * Math.PI * gustFreq * t) * gustDepth);
          
          // Random gusts
          if (Math.random() < windGustiness * 0.01) {
            gustEffect += windGustiness * Math.random();
          }
        }
        
        // Apply turbulence
        if (turbulence > 0) {
          const turbFreq = baseFreq * 5;
          const turb = turbulence * Math.sin(2 * Math.PI * turbFreq * t) * 0.2;
          noise *= (1 + turb);
        }
        
        // Combine effects
        data[i] = noise * (baseWind + gustEffect) * (windSpeed / 100);
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
      console.error("Error creating wind buffer:", error);
      return this.createNoiseBuffer(audioCtx, 4);
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
      const surfIntensity = params.surfIntensity || 0.7;
      const oceanDepth = params.oceanDepth || 'medium';
      const shoreType = params.shoreType || 'sandy';
      const distance = params.oceanDistance || 0.5;
      const stormy = params.oceanStormy || 0.0;
      
      // Depth affects frequency content
      let depthFactor = 1.0;
      if (oceanDepth === 'shallow') depthFactor = 1.3;
      else if (oceanDepth === 'deep') depthFactor = 0.7;
      
      // Shore type affects high-frequency content
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
      
      // Create multiple wave cycles
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
      let lowPassNoise = 0;
      
      for (let i = 0; i < bufferSize; i++) {
        const t = i / audioCtx.sampleRate;
        
        // Base ocean noise
        const noise = Math.random() * 2 - 1;
        lowPassNoise = lowPassNoise * 0.98 + noise * 0.02;
        
        // Create wave pattern from multiple frequencies
        let wavePattern = 0;
        for (const wave of waveCycles) {
          wavePattern += Math.sin(2 * Math.PI * wave.frequency * t + wave.phase) * wave.amplitude;
        }
        wavePattern /= numWaves;
        
        // Add storm effect
        let stormNoise = 0;
        if (stormy > 0) {
          stormNoise = (Math.random() * 2 - 1) * stormy * 0.3;
        }
        
        // Apply surf splashes
        let splash = 0;
        for (const splashEvent of splashes) {
          const timeDiff = Math.abs(t - splashEvent.time);
          if (timeDiff < splashEvent.decay) {
            const splashEnv = Math.exp(-timeDiff / splashEvent.decay * 10);
            splash += ((Math.random() * 2 - 1) * 0.7 + 
                      Math.sin(2 * Math.PI * shoreFreq * timeDiff) * 0.3) * 
                      splashEnv * splashEvent.intensity * surfIntensity * shoreResonance;
          }
        }
        
        // Distance affects mix between surf and wave sounds
        const surfFactor = Math.max(0, 1 - distance);
        const waveFactor = distance * 0.7 + 0.3;
        
        // Combine all elements
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

  // Add all other sound creation methods here...
  // createFireBuffer, createLeavesBuffer, etc.
  
  // Dispatcher to create the right buffer based on sound type
  createSoundBuffer: function(audioCtx, params) {
    switch (params.soundType) {
      case "wind":
        return this.createWindBuffer(audioCtx, params);
      case "ocean":
        return this.createOceanBuffer(audioCtx, params);
      // Add cases for other sound types
      // case "leaves": return this.createLeavesBuffer(audioCtx, params);
      // case "fire": return this.createFireBuffer(audioCtx, params);
      default:
        console.warn("Unsupported sound type:", params.soundType, "using default noise");
        return this.createNoiseBuffer(audioCtx, 3);
    }
  }
};

/**
 * Schedule an amplitude envelope for a sound
 * @param {GainNode} gainNode - The gain node to control
 * @param {AudioContext} audioCtx - The audio context
 * @param {number} duration - Duration in seconds
 * @param {number} fadeInFraction - Portion of duration for fade in
 * @param {number} fadeOutFraction - Portion of duration for fade out
 */
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

/**
 * Get a sound buffer from a sound key
 * @param {string} soundKey - The sound key
 * @returns {Object} Object containing sound parameters and audio generation function
 */
export function getNoiseFromKey(soundKey) {
  let params;
  
  // Check if it's a stored key in our library
  if (soundLibrary[soundKey]) {
    params = soundLibrary[soundKey];
  }
  // Check if it's a compact key (SK- format)
  else if (soundKey.startsWith('SK-')) {
    try {
      params = decodeCompactKey(soundKey);
    } catch (error) {
      console.error("Error decoding sound key:", error);
      // Return basic noise parameters as fallback
      params = { soundType: 'noise', noiseColor: 'white' };
    }
  }
  // Fallback for unknown keys
  else {
    console.warn("Unknown sound key format:", soundKey);
    params = { soundType: 'noise', noiseColor: 'white' };
  }
  
  return {
    params: params,
    createBuffer: function(audioCtx) {
      return SoundGenerator.createSoundBuffer(audioCtx, this.params);
    }
  };
}

/**
 * Get a sound buffer from parameters
 * @param {Object} params - Sound parameters
 * @returns {Object} Object containing sound parameters and audio generation function
 */
export function getNoiseFromParams(params) {
  // Set default sound type if not provided
  if (!params.soundType) {
    // Try to guess the sound type from the parameters
    if (params.windSpeed !== undefined) {
      params.soundType = 'wind';
    } else if (params.waveHeight !== undefined) {
      params.soundType = 'ocean';
    } else if (params.oscType !== undefined) {
      params.soundType = 'synthesizer';
    } else {
      params.soundType = 'noise'; // Default
    }
  }
  
  return {
    params: params,
    createBuffer: function(audioCtx) {
      return SoundGenerator.createSoundBuffer(audioCtx, this.params);
    }
  };
}

/**
 * Play a noise at a specific location in Three.js scene
 * @param {Object} noise - The noise object returned from getNoiseFromKey or getNoiseFromParams
 * @param {Object} options - Playback options
 * @param {THREE.Vector3} options.position - Position vector
 * @param {THREE.AudioListener} options.listener - Three.js AudioListener
 * @param {THREE.Scene} options.scene - Three.js Scene
 * @param {number} options.duration - Duration in seconds
 * @param {number} options.fadeIn - Fade in time as fraction of duration
 * @param {number} options.fadeOut - Fade out time as fraction of duration
 * @returns {THREE.PositionalAudio} The Three.js PositionalAudio object
 */
export function playNoise(noise, options) {
  if (!noise || !options.listener || !options.scene) {
    console.error("Missing required parameters for playNoise");
    return null;
  }
  
  const position = options.position || new THREE.Vector3(0, 0, 0);
  const duration = options.duration || 3;
  const fadeIn = options.fadeIn || 0.1;
  const fadeOut = options.fadeOut || 0.2;
  
  // Create the audio context from the listener
  const audioCtx = options.listener.context;
  
  // Create sound buffer
  const buffer = noise.createBuffer(audioCtx);
  if (!buffer) {
    console.error("Failed to create audio buffer");
    return null;
  }
  
  // Create a sound object
  const soundObject = new THREE.Object3D();
  soundObject.position.copy(position);
  options.scene.add(soundObject);
  
  // Create the positional audio
  const positionalAudio = new THREE.PositionalAudio(options.listener);
  
  // Apply spatial parameters
  positionalAudio.setRefDistance(noise.params.refDistance || 5);
  positionalAudio.setRolloffFactor(noise.params.rolloff || 1);
  positionalAudio.setDistanceModel("exponential");
  
  // Add directional cone if available
  if (noise.params.coneInner) {
    positionalAudio.setDirectionalCone(
      noise.params.coneInner, 
      noise.params.coneOuter || 180, 
      noise.params.coneOuterGain || 0.1
    );
  }
  
  // Set buffer
  positionalAudio.setBuffer(buffer);
  
  // Add to sound object
  soundObject.add(positionalAudio);
  
  // Schedule envelope
  scheduleEnvelope(positionalAudio.gain, audioCtx, duration, fadeIn, fadeOut);
  
  // Start playback
  positionalAudio.play();
  
  // Set timeout to clean up
  setTimeout(() => {
    if (positionalAudio.isPlaying) {
      positionalAudio.stop();
    }
    options.scene.remove(soundObject);
  }, duration * 1000);
  
  return positionalAudio;
}

// Add sound key to library for later use
export function addSoundToLibrary(key, params) {
  soundLibrary[key] = params;
}

// Initialize with some basic presets
const initializePresets = function() {
  addSoundToLibrary("SK-w-40-50-30-05-10-ef51ce", {
    soundType: "wind",
    windSpeed: 40,
    windGustiness: 0.5, 
    turbulence: 0.3,
    refDistance: 5,
    rolloff: 1
  });
  
  addSoundToLibrary("SK-o-60-05-07-05-10-bf27ad", {
    soundType: "ocean",
    waveHeight: 60,
    waveFrequency: 0.5,
    surfIntensity: 0.7,
    oceanDepth: "medium",
    refDistance: 5,
    rolloff: 1
  });
};

// Initialize presets
initializePresets();

// Clean export interface
export {
  getNoiseFromKey,
  getNoiseFromParams,
  playNoise,
  SoundGenerator,
  generateSoundKey, 
  decodeCompactKey
};
