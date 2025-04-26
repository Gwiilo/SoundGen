# SoundGen

Procedural sound generation library.

## How to integrate with your project

### Option 1: Git Submodule (recommended for active development)

Add SoundGen as a Git submodule:

```bash
# From your project root
git submodule add https://github.com/yourusername/soundgen.git soundgen
git submodule update --init --recursive
```

To update to the latest version later:

```bash
git submodule update --remote --merge
```

### Option 2: Direct download

If you prefer not to use Git submodules, you can directly download the files:

```bash
# Using curl
mkdir -p soundgen
curl -L https://github.com/yourusername/soundgen/archive/main.zip -o soundgen.zip
unzip soundgen.zip -d temp
cp -r temp/soundgen-main/* soundgen/
rm -rf temp soundgen.zip
```

## Usage Examples

```javascript
// Import the full SoundGen library
import SoundGen from './soundgen/integration.js';

// Or import specific functions
import { generateSoundKey, playNoise } from './soundgen/integration.js';

// Initialize with options
import { initializeSoundGen } from './soundgen/integration.js';
const soundgen = initializeSoundGen({
  defaultDuration: 3,
  volume: 0.8
});

// Generate a sound
const params = {
  soundType: 'wind',
  windSpeed: 50,
  turbulence: 0.7
};

// Generate a key
const key = soundgen.generateSoundKey(params);
console.log('Generated key:', key);

// Play sound (in browser context)
const audioContext = new AudioContext();
soundgen.playSound(params, audioContext);
```

## Usage Examples
```javascript
// Import the full SoundGen library
import SoundGen from './soundgen/integration.js';

// Or import specific functions
import { generateSoundKey, playNoise } from './soundgen/integration.js';

// Initialize with options
import { initializeSoundGen } from './soundgen/integration.js';
const soundgen = initializeSoundGen({
  defaultDuration: 3,
  volume: 0.8
});

// Generate a sound
const params = {
  soundType: 'wind',
  windSpeed: 50,
  turbulence: 0.7
};

// Generate a key
const key = soundgen.generateSoundKey(params);
console.log('Generated key:', key);

// Play sound (in browser context)
const audioContext = new AudioContext();
soundgen.playSound(params, audioContext);
```

## How to use it in another project

When integrating this into your project, you'd do something like this:

```javascript
// In your other project:
import SoundGen from './soundgen/integration.js';

// Use the library
const params = {
  soundType: 'wind',
  windSpeed: 40,
  turbulence: 0.3
};

// Generate a sound key
const key = SoundGen.generateSoundKey(params);

// Get sound data
const noise = SoundGen.getNoiseFromKey(key);

// Play the sound (if in a browser context)
const audioContext = new AudioContext();
SoundGen.playNoise(noise, {
  position: new THREE.Vector3(0, 0, 0),
  listener: audioContext.listener,
  duration: 5
});