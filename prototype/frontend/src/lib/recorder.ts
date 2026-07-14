// Voice recorder that stops itself when the farmer stops speaking. Farmers don't know
// to tap "stop", and a fixed timer either cuts them off or waits awkwardly — so we watch
// the mic level and end the recording once a short trailing silence follows real speech.

export interface AutoStopOptions {
  // Live 0..1 loudness, for the on-screen "understanding" meter.
  onLevel?: (level: number) => void;
  // Fired once, the moment we're confident the farmer has started speaking.
  onSpeech?: () => void;
  // Trailing silence (ms) after speech that ends the recording.
  silenceMs?: number;
  // Hard cap (ms) so a noisy environment or held mic can't record forever.
  maxMs?: number;
  // Require at least this much speech before a silence can auto-stop.
  minSpeechMs?: number;
}

export interface RecordingSession {
  // Resolves with the recorded audio when auto-stopped, or via stop()/reaching maxMs.
  done: Promise<Blob>;
  // Stop early (e.g. the farmer is clearly finished) and resolve `done`.
  stop: () => void;
  // Abort with no result (screen dismissed) — `done` never resolves.
  cancel: () => void;
}

const SPEECH_THRESHOLD = 0.04; // RMS above this counts as speech, not room noise
const TICK_MS = 60;

export function recordWithAutoStop(options: AutoStopOptions = {}): RecordingSession {
  const { onLevel, onSpeech, silenceMs = 1400, maxMs = 12000, minSpeechMs = 350 } = options;

  let mediaRecorder: MediaRecorder | null = null;
  let stream: MediaStream | null = null;
  let audioContext: AudioContext | null = null;
  let ticker: ReturnType<typeof setInterval> | null = null;
  const chunks: Blob[] = [];

  let resolveDone!: (blob: Blob) => void;
  let rejectDone!: (err: unknown) => void;
  const done = new Promise<Blob>((resolve, reject) => {
    resolveDone = resolve;
    rejectDone = reject;
  });

  let settled = false;
  let speechDetected = false;
  const startedAt = Date.now();
  let lastLoudAt = startedAt;
  let speechStartedAt = 0;

  function teardown() {
    if (ticker) clearInterval(ticker);
    ticker = null;
    stream?.getTracks().forEach((track) => track.stop());
    audioContext?.close().catch(() => {});
  }

  // Finish and hand back the recorded audio. MediaRecorder.onstop flushes the last chunk.
  function finish() {
    if (settled || !mediaRecorder) return;
    settled = true;
    mediaRecorder.onstop = () => {
      const baseType = (mediaRecorder?.mimeType || "audio/webm").split(";")[0];
      resolveDone(new Blob(chunks, { type: baseType }));
      teardown();
    };
    if (mediaRecorder.state !== "inactive") mediaRecorder.stop();
  }

  function cancel() {
    if (settled) return;
    settled = true;
    if (mediaRecorder) mediaRecorder.onstop = null;
    if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop();
    teardown();
  }

  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((micStream) => {
      if (settled) {
        micStream.getTracks().forEach((t) => t.stop());
        return;
      }
      stream = micStream;
      mediaRecorder = new MediaRecorder(micStream);
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      mediaRecorder.start();

      audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(micStream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const buffer = new Float32Array(analyser.fftSize);

      ticker = setInterval(() => {
        analyser.getFloatTimeDomainData(buffer);
        let sumSquares = 0;
        for (let i = 0; i < buffer.length; i++) sumSquares += buffer[i] * buffer[i];
        const rms = Math.sqrt(sumSquares / buffer.length);

        // Normalise to a lively 0..1 range for the meter (RMS rarely exceeds ~0.3).
        onLevel?.(Math.min(1, rms / 0.3));

        const now = Date.now();
        if (rms > SPEECH_THRESHOLD) {
          lastLoudAt = now;
          if (!speechDetected) {
            speechDetected = true;
            speechStartedAt = now;
            onSpeech?.();
          }
        }

        const spokeEnough = speechDetected && now - speechStartedAt >= minSpeechMs;
        const silentLongEnough = now - lastLoudAt >= silenceMs;
        if ((spokeEnough && silentLongEnough) || now - startedAt >= maxMs) {
          finish();
        }
      }, TICK_MS);
    })
    .catch((err) => {
      settled = true;
      teardown();
      rejectDone(err);
    });

  return { done, stop: finish, cancel };
}
