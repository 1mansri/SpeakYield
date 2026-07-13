export function createRecorder() {
  let mediaRecorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];
  let stream: MediaStream | null = null;

  async function start(): Promise<void> {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    chunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    mediaRecorder.start();
  }

  function stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!mediaRecorder) {
        reject(new Error("Recorder was never started"));
        return;
      }
      mediaRecorder.onstop = () => {
        // Sarvam's STT API only accepts bare MIME types (e.g. "audio/webm"), not the
        // ";codecs=opus" suffix MediaRecorder reports — strip it before upload.
        const baseType = (mediaRecorder?.mimeType || "audio/webm").split(";")[0];
        const blob = new Blob(chunks, { type: baseType });
        stream?.getTracks().forEach((track) => track.stop());
        resolve(blob);
      };
      mediaRecorder.stop();
    });
  }

  function cancel(): void {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.onstop = null;
      mediaRecorder.stop();
    }
    stream?.getTracks().forEach((track) => track.stop());
  }

  return { start, stop, cancel };
}

export type Recorder = ReturnType<typeof createRecorder>;
