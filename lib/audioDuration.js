// Reads the true duration of a recorded audio Blob from its own metadata,
// instead of trusting a manually-ticked timer (which under-counts anything
// under 1s and can drift on longer recordings).
//
// Chrome/webm has a known quirk where a MediaRecorder-produced blob reports
// `duration: Infinity` until you seek near the end — so we detect that case
// and force the seek before resolving.
export function getBlobDuration(blob) {
  return new Promise((resolve) => {
    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    const url = URL.createObjectURL(blob);
    audio.src = url;

    function done(duration) {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(duration) && duration > 0 ? duration : null);
    }

    audio.addEventListener('loadedmetadata', () => {
      if (Number.isFinite(audio.duration)) {
        done(audio.duration);
        return;
      }
      // Force duration to resolve: seeking past the end makes the browser
      // compute the real duration and fire timeupdate with it set.
      audio.currentTime = 1e101;
      audio.addEventListener(
        'timeupdate',
        () => done(audio.duration),
        { once: true }
      );
    });

    audio.addEventListener('error', () => done(null), { once: true });
  });
}
