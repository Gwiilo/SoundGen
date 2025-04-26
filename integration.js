/**
 * SoundGen Integration Module
 * Provides a clean interface for using SoundGen in other projects
 */

import {
  getNoiseFromKey,
  getNoiseFromParams,
  playNoise,
  SoundGenerator,
  generateSoundKey,
  decodeCompactKey
} from './noise.js';

// Re-export everything by default for convenience
export default {
  getNoiseFromKey,
  getNoiseFromParams,
  playNoise,
  SoundGenerator,
  generateSoundKey,
  decodeCompactKey,
  initializeSoundGen
};

// Also export individual functions for named imports
export {
  getNoiseFromKey,
  getNoiseFromParams,
  playNoise,
  SoundGenerator,
  generateSoundKey,
  decodeCompactKey
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
    
    // Convenience methods
    createSound: (params) => getNoiseFromParams(params),
    playSound: (params, audioContext) => {
      const noise = getNoiseFromParams(params);
      if (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
        return playNoise(noise, {
          audioContext: audioContext || new (window.AudioContext || window.webkitAudioContext)(),
          duration: options.defaultDuration || 3,
          volume: options.volume || 1.0,
          position: options.position || new THREE.Vector3(0, 0, 0),
          listener: options.listener || audioContext?.listener,
          scene: options.scene
        });
      } else {
        return { params: noise.params };
      }
    }
  };
}
