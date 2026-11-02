/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Returns the best supported video MIME type for MediaRecorder in the current browser.
 */
export function getSupportedVideoMimeType(): string {
  if (typeof MediaRecorder === 'undefined') {
    return 'video/webm';
  }

  const candidateTypes = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=h264,opus',
    'video/mp4;codecs=h264,aac',
    'video/mp4',
    'video/webm',
  ];

  for (const type of candidateTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return 'video/webm';
}

/**
 * Creates a clean downloadable filename for the recorded lip-sync video.
 */
export function generateVideoFilename(
  prefix = 'assistant-lipsync',
  voiceName = 'kore',
  extension = 'webm'
): string {
  const safePrefix = prefix.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const safeVoice = voiceName.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `${safePrefix}-${safeVoice}-${timestamp}.${extension}`;
}

/**
 * Initiates the browser download of a video Blob directly to the user's gallery / downloads.
 */
export function triggerVideoDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.style.display = 'none';
  anchor.href = url;
  anchor.download = filename;

  document.body.appendChild(anchor);
  anchor.click();

  setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, 1000);
}
