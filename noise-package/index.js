/**
 * Noise Generator package
 * This provides a clean API for other projects to use the noise functions
 */

const noiseFunctions = require('../functions/noise-core');

// Re-export the core functions
module.exports = {
  /**
   * Generate noise parameters from a key
   * @param {string} key - The sound key
   * @returns {Object} Noise parameters
   */
  getNoiseFromKey: noiseFunctions.getNoiseFromKey,
  
  /**
   * Generate a sound key from parameters
   * @param {Object} params - Sound parameters
   * @returns {string} Generated sound key
   */
  generateSoundKey: noiseFunctions.generateSoundKey,
  
  /**
   * Generate noise data from parameters
   * @param {Object} params - Sound parameters
   * @returns {Object} Generated noise data
   */
  getNoiseFromParams: noiseFunctions.getNoiseFromParams,
  
  /**
   * Sound generator functionality
   */
  SoundGenerator: noiseFunctions.SoundGenerator
};
