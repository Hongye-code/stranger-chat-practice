import { bindStartLink, createTopicPractice } from "./topic-practice.js";

const form = document.querySelector("#chat-form");
const progress = document.querySelector("#progress-copy");
const storageKey = "speak-grow:topic:stranger-chat:v1";

function values() {
  return Object.fromEntries(new FormData(form).entries());
}
function saveForm() {
  localStorage.setItem(storageKey, JSON.stringify(values()));
  updateProgress();
}
function restoreForm() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
    for (const [name, value] of Object.entries(saved)) {
      const field = form.elements.namedItem(name);
      if (field) field.value = value;
    }
  } catch {}
}
function completedItems(data = values()) {
  const questions = ["q-name", "q-place", "q-relationship", "q-work", "q-hobby", "q-travel"];
  return Number(String(data.intro || "").trim().length >= 6)
    + questions.filter((name) => String(data[name] || "").trim().length >= 4).length
    + Number(String(data.keyword || "").trim().length >= 2)
    + Number(String(data.handback || "").trim().length >= 6);
}
function updateProgress() {
  progress.textContent = `已准备 ${completedItems()} / 9 项`;
}
function feedback() {
  const data = values();
  const transcript = document.querySelector("#transcript").value.trim();
  const questionCount = ["q-name", "q-place", "q-relationship", "q-work", "q-hobby", "q-travel"].filter((name) => String(data[name] || "").trim().length >= 4).length;
  const items = [
    { pass: String(data.intro || "").trim().length >= 6, label: "完成介绍", detail: "准备一句 20 秒内能说完的自我介绍。" },
    { pass: questionCount > 0 || /[？?]/u.test(transcript), label: "问了问题", detail: `六类问题已准备 ${questionCount}/6。` },
    { pass: String(data.keyword || "").trim().length >= 2 && String(data["follow-up"] || "").trim().length >= 6, label: "接住关键词", detail: "写出关键词，并围绕它继续一句。" },
    { pass: String(data.handback || "").trim().length >= 6 || /[你您].*[？?]/u.test(transcript), label: "把话交回对方", detail: "说一点自己，再留一个容易回答的问题。" }
  ];
  document.querySelector("#feedback").innerHTML = items.map((item) => `<div class="feedback-item" data-pass="${item.pass}"><span class="feedback-mark">${item.pass ? "完成" : "待补"}</span><div><strong>${item.label}</strong><br><small>${item.detail}</small></div></div>`).join("");
}

restoreForm();
form.addEventListener("input", saveForm);
bindStartLink(document.querySelector("#start-button"), document.querySelector("#trainer"));
createTopicPractice({
  textarea: document.querySelector("#transcript"),
  timerNode: document.querySelector("#timer"),
  statusNode: document.querySelector("#practice-status"),
  storageKey: `${storageKey}:transcript`,
  controls: {
    record: document.querySelector("#record"), pause: document.querySelector("#pause"), stop: document.querySelector("#stop"), download: document.querySelector("#download"),
    transcribe: document.querySelector("#transcribe"), finishTranscription: document.querySelector("#finish-transcription")
  }
});
document.querySelector("#check-feedback").addEventListener("click", feedback);
updateProgress();
