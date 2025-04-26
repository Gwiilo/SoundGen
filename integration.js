/**
 * SoundGen Integration Module
 * Minimal import interface for using SoundGen in other projects
 */

// Import only what's needed from noise.js
import { 
  getNoiseFromKey, 
  getNoiseFromParams, 
  playNoise, 
  generateSoundKey,
  decodeCompactKey,
  SoundGenerator
} from './noise.js';

// Export clean public API
export {
  getNoiseFromKey,
  getNoiseFromParams,
  playNoise,
  generateSoundKey,
  decodeCompactKey,
  SoundGenerator
};

// Default export for convenience
export default {
  getNoiseFromKey,
  getNoiseFromParams,
  playNoise,
  generateSoundKey,
  decodeCompactKey,
  SoundGenerator
};

/**
 * Initialize SoundGen with options
 * @param {Object} options - Configuration options
 * @returns {Object} Configured SoundGen instance
 */
export function initializeSoundGen(options = {}) {
  console.log('SoundGen initialized with options:', options);
  
  return {
    // Core functions
    getNoiseFromKey,
    getNoiseFromParams,
    playNoise,
    generateSoundKey,
    decodeCompactKey,
    
    // Additional convenience methods
    createSound: (params) => getNoiseFromParams(params),
    playSound: (params, audioContext) => {
      const noise = getNoiseFromParams(params);
      if (typeof window !== 'undefined' && window.AudioContext) {
        return playNoise(noise, {
          audioContext: audioContext || new (window.AudioContext || window.webkitAudioContext)(),
          duration: options.defaultDuration || 3,
          volume: options.volume || 1.0
        });
      } else {
        return { params: noise.params };
      }
    }
  };
}
