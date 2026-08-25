const fs = require('fs');
const path = require('path');

const sampleRate = 44100;
const durationSeconds = 0.15;
const frequency = 1046.5; // C6, short crisp beep
const numSamples = Math.floor(sampleRate * durationSeconds);

const dataSize = numSamples * 2; // 16-bit mono
const buffer = Buffer.alloc(44 + dataSize);

buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + dataSize, 4);
buffer.write('WAVE', 8);
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20); // PCM
buffer.writeUInt16LE(1, 22); // mono
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(sampleRate * 2, 28); // byte rate
buffer.writeUInt16LE(2, 32); // block align
buffer.writeUInt16LE(16, 34); // bits per sample
buffer.write('data', 36);
buffer.writeUInt32LE(dataSize, 40);

for (let i = 0; i < numSamples; i++) {
  const t = i / sampleRate;
  const envelope = Math.min(1, (numSamples - i) / (numSamples * 0.3)) * Math.min(1, i / (numSamples * 0.05));
  const sample = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.6;
  const value = Math.max(-1, Math.min(1, sample)) * 32767;
  buffer.writeInt16LE(value | 0, 44 + i * 2);
}

const outPath = path.join(__dirname, '..', 'assets', 'sounds', 'beep.wav');
fs.writeFileSync(outPath, buffer);
console.log('Wrote', outPath, buffer.length, 'bytes');
