/**
 * SoundGen Integration Module
 * Provides a clean interface for using SoundGen in other projects
 */

import {
    getNoiseFromKey,
    getNoiseFromParams,
    playNoise,
    SoundGenerator as SoundGenUtils,
    generateSoundKey,
    decodeCompactKey
  } from './noise.js';
  
  /**
   * SoundGenerator class - Main interface for the sound generation system
   */
  class SoundGenerator {
    constructor(options = {}) {
      console.log('SoundGen initialized with options:', options);
      this.volume = options.volume || 0.5;
      this.sounds = {};
      this.currentAmbient = null;
      this.options = options;
      this.audioContext = null;
      
      // Try to initialize audio context if we're in a browser
      try {
        if (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
          this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
      } catch (e) {
        console.warn('Failed to initialize AudioContext:', e);
      }
    }
    
    /**
     * Play a specific sound
     * @param {string} soundName - Name of the sound to play
     * @returns {Object} The sound object
     */
    playSound(soundName) {
      console.log('SoundGen: playing sound', soundName);
      
      // If we're in development mode with limited sound support, just log
      if (!this.audioContext) {
        return null;
      }
      
      try {
        // Map sound names to parameters
        const soundParams = {
          'jump': { soundType: 'percussion', impactSharpness: 0.8, bodyResonance: 0.4, decayLength: 0.3 },
          'wind': { soundType: 'wind', windSpeed: 40, windGustiness: 0.5, turbulence: 0.3 },
          'ocean': { soundType: 'ocean', waveHeight: 60, waveFrequency: 0.5, surfIntensity: 0.7 },
          'footsteps': { soundType: 'percussion', impactSharpness: 0.4, bodyResonance: 0.2, decayLength: 0.1 }
        };
        
        // Get params for the requested sound or use a default
        const params = soundParams[soundName] || { soundType: 'noise', noiseColor: 'white' };
        
        // Create noise from params
        const noise = getNoiseFromParams(params);
        
        // Use basic Web Audio API for simple sounds since we might not have THREE.js integration
        const buffer = SoundGenUtils.createSoundBuffer(this.audioContext, params);
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        
        // Create gain node for volume control
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = this.volume;
        
        // Connect and play
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        source.start();
        
        return source;
      } catch (e) {
        console.error('Error playing sound:', e);
        return null;
      }
    }
    
    /**
     * Set ambient sound based on environment
     * @param {string} biome - Biome type (desert, forest, mountain, etc.)
     */
    setAmbient(biome) {
      if (this.currentAmbient === biome) return;
      console.log('SoundGen: setting ambient to', biome);
      this.currentAmbient = biome;
      
      // In a full implementation, this would change the ambient sound
      // For now we just log the change
    }
  }
  
  // Re-export everything by default for convenience
  export default {
    getNoiseFromKey,
    getNoiseFromParams,
    playNoise,
    SoundGenerator,  // Now exporting our class
    generateSoundKey,
    decodeCompactKey,
    initializeSoundGen
  };
  
  // Also export individual functions for named imports
  export {
    getNoiseFromKey,
    getNoiseFromParams,
    playNoise,
    SoundGenerator,  // Now exporting our class
    generateSoundKey,
    decodeCompactKey
  };
  
  /**
   * Initialize SoundGen with options
   * @param {Object} options - Configuration options
   * @returns {Object} Configured SoundGen instance
   */
  export function initializeSoundGen(options = {}) {
    return new SoundGenerator(options);
  }
  