/**
 * SoundGen Integration Helper
 * Makes it easier to use SoundGen in other projects
 */
import * as SoundGen from './noise.js';

// Re-export everything
export default SoundGen;

// Make it easy to access specific functions
export const {
  getNoiseFromKey,
  getNoiseFromParams,
  playNoise,
  SoundGenerator,
  generateSoundKey,
  decodeCompactKey
} = SoundGen;

/**
 * Initialize SoundGen in another project
 * @param {Object} options - Configuration options 
 * @returns {Object} - The initialized SoundGen instance
 */
export function initializeSoundGen(options = {}) {
  console.log('SoundGen initialized with options:', options);
  
  // Return a configured instance of SoundGen
  return {
    ...SoundGen,
    // Add any custom initialization here
    createSound: (params) => {
      const noise = getNoiseFromParams(params);
      return noise;
    },
    playSound: (params, audioContext) => {
      const noise = getNoiseFromParams(params);
      // Handle browser vs Node.js environments
      if (typeof window !== 'undefined' && window.AudioContext) {
        // Browser environment
        return playNoise(noise, {
          audioContext: audioContext || new AudioContext(),
          ...options
        });
      } else {
        // Node.js or other environment without AudioContext
        return { params: noise.params };
      }
    }
  };
}
