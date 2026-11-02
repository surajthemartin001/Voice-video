/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Finds the offset and size of the 'data' chunk in a WAV buffer.
 */
export function findWavDataOffset(buf: Uint8Array): { dataOffset: number; dataSize: number } {
  // Check RIFF and WAVE signatures
  if (buf.length < 44) {
    throw new Error('Buffer too small to be a valid WAV file');
  }

  const riff = String.fromCharCode(...buf.slice(0, 4));
  const wave = String.fromCharCode(...buf.slice(8, 12));
  if (riff !== 'RIFF' || wave !== 'WAVE') {
    throw new Error('Invalid WAV header: Missing RIFF/WAVE marker');
  }

  let offset = 12;
  while (offset + 8 <= buf.length) {
    const chunkId = String.fromCharCode(...buf.slice(offset, offset + 4));
    const chunkSize =
      buf[offset + 4] |
      (buf[offset + 5] << 8) |
      (buf[offset + 6] << 16) |
      (buf[offset + 7] << 24);

    if (chunkId === 'data') {
      return {
        dataOffset: offset + 8,
        dataSize: Math.min(chunkSize, buf.length - (offset + 8)),
      };
    }

    offset += 8 + chunkSize;
  }

  // Fallback to standard 44-byte header if data chunk wasn't located by loop
  return {
    dataOffset: 44,
    dataSize: Math.max(0, buf.length - 44),
  };
}

/**
 * Concatenates multiple WAV buffers into a single valid WAV buffer.
 * Updates the 32-bit RIFF chunk size and data subchunk size.
 */
export function concatWavBuffers(buffers: Uint8Array[]): Uint8Array {
  if (!buffers || buffers.length === 0) {
    return new Uint8Array(0);
  }
  if (buffers.length === 1) {
    return buffers[0];
  }

  const first = buffers[0];
  const firstData = findWavDataOffset(first);
  const header = first.slice(0, firstData.dataOffset);

  // Extract PCM data portions from all buffers
  const pcmSlices: Uint8Array[] = [];
  let totalDataLength = 0;

  for (const buf of buffers) {
    const { dataOffset, dataSize } = findWavDataOffset(buf);
    const pcm = buf.slice(dataOffset, dataOffset + dataSize);
    pcmSlices.push(pcm);
    totalDataLength += pcm.length;
  }

  // Allocate new Uint8Array for output
  const output = new Uint8Array(header.length + totalDataLength);

  // Copy header
  output.set(header, 0);

  // Copy PCM data
  let currentOffset = header.length;
  for (const slice of pcmSlices) {
    output.set(slice, currentOffset);
    currentOffset += slice.length;
  }

  // Update RIFF total size at bytes 4-7: (total file size - 8)
  const totalRiffSize = output.length - 8;
  output[4] = totalRiffSize & 0xff;
  output[5] = (totalRiffSize >> 8) & 0xff;
  output[6] = (totalRiffSize >> 16) & 0xff;
  output[7] = (totalRiffSize >> 24) & 0xff;

  // Update 'data' subchunk size at (dataOffset - 4) to (dataOffset - 1)
  const dataSizeOffset = firstData.dataOffset - 4;
  output[dataSizeOffset] = totalDataLength & 0xff;
  output[dataSizeOffset + 1] = (totalDataLength >> 8) & 0xff;
  output[dataSizeOffset + 2] = (totalDataLength >> 16) & 0xff;
  output[dataSizeOffset + 3] = (totalDataLength >> 24) & 0xff;

  return output;
}
