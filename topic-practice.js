import { createAudioRecorder } from "./modules/recording.js";
import { createTranscriber } from "./modules/transcription.js";

export function createTopicPractice({ textarea, timerNode, statusNode, controls, storageKey, onTranscript }) {
  let seconds = 60;
  let timerId = null;
  const recorder = createAudioRecorder({
    onState(state) {
      statusNode.textContent = state.message;
      controls.download.disabled = !state.canDownload;
    }
  });
  const transcriber = createTranscriber({
    getText: () => textarea.value,
    onText(value) {
      textarea.value = value;
      save();
    },
    onState(message) { statusNode.textContent = message; },
    onRecordingChange(state) {
      controls.transcribe.textContent = state === "recording" ? "暂停转写" : state === "paused" ? "继续转写" : "开始浏览器转写";
    }
  });

  function renderTime() {
    timerNode.textContent = `00:${String(seconds).padStart(2, "0")}`;
  }
  function save() {
    localStorage.setItem(storageKey, textarea.value);
    onTranscript?.(textarea.value);
  }
  function stopTimer() {
    if (timerId) window.clearInterval(timerId);
    timerId = null;
  }
  function startTimer() {
    if (timerId) return;
    if (seconds <= 0) seconds = 60;
    timerId = window.setInterval(() => {
      seconds -= 1;
      renderTime();
      if (seconds <= 0) {
        stopTimer();
        recorder.stop();
        transcriber.stop("60 秒结束。原稿已保留，可以继续编辑或查看反馈。");
      }
    }, 1000);
  }

  textarea.value = localStorage.getItem(storageKey) || "";
  textarea.addEventListener("input", save);
  controls.record.addEventListener("click", () => { recorder.start(); startTimer(); });
  controls.pause.addEventListener("click", () => { recorder.pause(); stopTimer(); });
  controls.stop.addEventListener("click", () => { recorder.stop(); transcriber.stop(); stopTimer(); });
  controls.download.addEventListener("click", () => recorder.download());
  controls.transcribe.addEventListener("click", () => {
    if (controls.transcribe.textContent.includes("暂停")) transcriber.pause();
    else { transcriber.sync(textarea.value); transcriber.start(); startTimer(); }
  });
  controls.finishTranscription.addEventListener("click", () => { transcriber.stop(); stopTimer(); });
  window.addEventListener("pagehide", () => { recorder.cleanup(); transcriber.stop(); stopTimer(); });
  renderTime();
  return { save, getTranscript: () => textarea.value };
}

export function bindStartLink(button, target) {
  button.addEventListener("click", () => {
    target.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    target.querySelector("textarea, input, button")?.focus({ preventScroll: true });
  });
}
