/**
 * Sets up event listeners for UI elements
 * This replaces inline event handlers with proper event listeners
 * to comply with Content Security Policy
 */

document.addEventListener('DOMContentLoaded', function() {
  // Wait a small amount of time to ensure script.js has executed and exposed functions
  setTimeout(function() {
    // Generate Sound Key button
    const generateKeyBtn = document.getElementById('generateKeyBtn');
    if (generateKeyBtn) {
      generateKeyBtn.addEventListener('click', function() {
        if (typeof window.generateSoundKey === 'function') {
          window.generateSoundKey();
        } else {
          console.error("generateSoundKey function is not available");
        }
      });
    }
    
    // Play Sound button
    const playBtn = document.getElementById('playBtn');
    if (playBtn) {
      playBtn.addEventListener('click', function() {
        if (typeof window.playSoundFromUI === 'function') {
          window.playSoundFromUI();
        } else {
          console.error("playSoundFromUI function is not available");
        }
      });
    }
    
    // Download Sound button
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', function() {
        if (typeof window.downloadSoundFromUI === 'function') {
          window.downloadSoundFromUI();
        } else {
          console.error("downloadSoundFromUI function is not available");
        }
      });
    }
    
    // Load Sound Key button
    const loadKeyButton = document.getElementById('loadKeyButton');
    if (loadKeyButton) {
      loadKeyButton.addEventListener('click', function() {
        if (typeof window.loadSoundKey === 'function') {
          window.loadSoundKey();
        } else {
          console.error("loadSoundKey function is not available");
        }
      });
    }
    
    // Randomize Parameters button
    const randomizeBtn = document.getElementById('randomizeBtn');
    if (randomizeBtn) {
      randomizeBtn.addEventListener('click', function() {
        if (typeof window.randomizeParameters === 'function') {
          window.randomizeParameters();
        } else {
          console.error("randomizeParameters function is not available");
        }
      });
    }
    
    // Save Preset button
    const savePresetBtn = document.getElementById('savePresetBtn');
    if (savePresetBtn) {
      savePresetBtn.addEventListener('click', function() {
        if (typeof window.showSavePresetModal === 'function') {
          window.showSavePresetModal();
        } else {
          console.error("showSavePresetModal function is not available");
        }
      });
    }
    
    // Playback Duration slider
    const durationSlider = document.getElementById('playbackDuration');
    if (durationSlider) {
      durationSlider.addEventListener('input', function() {
        if (typeof window.updateDurationDisplay === 'function') {
          window.updateDurationDisplay(this.value);
        } else {
          console.error("updateDurationDisplay function is not available");
        }
      });
    }
    
    // All slider inputs for parameter output updates
    document.querySelectorAll('.slider').forEach(slider => {
      slider.addEventListener('input', function() {
        if (typeof window.updateParamOutput === 'function') {
          window.updateParamOutput(this.id);
        } else {
          console.error("updateParamOutput function is not available");
        }
      });
    });
    
    console.log('Event handlers initialized successfully');
  }, 100); // Small delay to ensure script.js has executed
});
