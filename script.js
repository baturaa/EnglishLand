
const TG_BOT_TOKEN = "8563380473:AAG8wKjWbjps44ei-r5o74cdk97oybwy4b8";
const TG_CHAT_ID = "913189764";
const TG_PARSE_MODE = "HTML";


let elWho, elClass, elStart, elDirection, elCountry, elPhone, elSuccess, elError, sendBtn;

document.addEventListener("DOMContentLoaded", () => {
  elWho = document.getElementById("who");
  elClass = document.getElementById("class");
  elStart = document.getElementById("start");
  elDirection = document.getElementById("direction");
  elCountry = document.getElementById("country");
  elPhone = document.getElementById("phone");
  elSuccess = document.getElementById("success");
  elError = document.getElementById("formError");
  sendBtn = document.getElementById("sendBtn");


  if (elCountry) {
    elCountry.addEventListener("change", () => {
      updateFlag();
      updatePhoneCode(true);
    });
  }

  if (sendBtn) {
    sendBtn.addEventListener("click", sendForm);
  }

  updateFlag();
  updatePhoneCode(false);
});


function showError(msg) {
  if (!elError) return alert(msg);
  elError.style.display = "block";
  elError.textContent = msg;
}

function clearError() {
  if (!elError) return;
  elError.style.display = "none";
  elError.textContent = "";
}

function setLoading(isLoading) {
  if (!sendBtn) return;
  sendBtn.disabled = isLoading;
  sendBtn.style.opacity = isLoading ? "0.7" : "";
  sendBtn.style.pointerEvents = isLoading ? "none" : "";
}

function onlyDigits(str) {
  return (str || "").replace(/\D/g, "");
}


function updateFlag() {
  if (!elCountry) return;
  const opt = elCountry.options[elCountry.selectedIndex];
  const iso = (opt?.dataset?.iso || "").toLowerCase();
  if (!iso) return;

  elCountry.style.backgroundImage =
    `url("https://cdn.jsdelivr.net/npm/flag-icons@6.6.6/flags/4x3/${iso}.svg")`;
}


function updatePhoneCode(force = true) {
  if (!elCountry || !elPhone) return;

  const code = elCountry.value; // "+7", "+1", ...
  let val = (elPhone.value || "").trim();

  // Удаляем старый код в начале (любой +цифры)
  const removed = val.replace(/^\+\d+\s*/, "");


  if (!val && !force) {
    elPhone.value = `${code} `;
    return;
  }


  elPhone.value = removed ? `${code} ${removed}` : `${code} `;


  elPhone.focus();
  elPhone.setSelectionRange(elPhone.value.length, elPhone.value.length);
}


function getFormData() {
  const who = elWho.value.trim();
  const klass = elClass.value.trim();
  const start = elStart.value.trim();
  const direction = elDirection.value.trim();
  const countryText = elCountry.options[elCountry.selectedIndex]?.text || "";
  const rawPhone = elPhone.value.trim();

  return { who, klass, start, direction, countryText, phone: rawPhone };
}

function validateForm(data) {
  if (!data.who) return "Выберите: Для кого выбираете образование?";
  if (!data.klass) return "Выберите: В каком классе учитесь?";
  if (!data.start) return "Выберите: Когда планируете начало обучения?";
  if (!data.direction) return "Выберите: Какое направление интересует?";

  const digits = onlyDigits(data.phone);
  if (!digits || digits.length < 8) return "Введите корректный номер телефона.";

  if (!TG_BOT_TOKEN || TG_BOT_TOKEN.includes("PASTE_")) return "Не настроен TG_BOT_TOKEN (в script.js).";
  if (!TG_CHAT_ID || TG_CHAT_ID.includes("PASTE_")) return "Не настроен TG_CHAT_ID (в script.js).";

  return null;
}


async function sendToTelegram(message) {
  const url = `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TG_CHAT_ID,
      text: message,
      parse_mode: TG_PARSE_MODE,
      disable_web_page_preview: true
    })
  });

  const json = await res.json();
  if (!json.ok) throw new Error(json.description || "Telegram API error");
  return json;
}


async function sendForm() {
  try {
    clearError();

    const data = getFormData();
    const err = validateForm(data);
    if (err) return showError(err);

    const msg =
      `<b>Новая заявка (Чехия / бюджет)</b>\n` +
      `• <b>Кто:</b> ${escapeHtml(data.who)}\n` +
      `• <b>Класс:</b> ${escapeHtml(data.klass)}\n` +
      `• <b>Старт:</b> ${escapeHtml(data.start)}\n` +
      `• <b>Направление:</b> ${escapeHtml(data.direction)}\n` +
      `• <b>Страна:</b> ${escapeHtml(data.countryText)}\n` +
      `• <b>Телефон:</b> <code>${escapeHtml(data.phone)}</code>`;

    setLoading(true);
    await sendToTelegram(msg);

    // Покажем успех
    if (elSuccess) elSuccess.style.display = "block";

    // Очистка
    elWho.selectedIndex = 0;
    elClass.selectedIndex = 0;
    elStart.selectedIndex = 0;
    elDirection.selectedIndex = 0;


    elCountry.selectedIndex = 0;
    updateFlag();

    elPhone.value = "";
    updatePhoneCode(false);

  } catch (e) {
    console.error(e);
    showError("Не удалось отправить. Проверь token/chat_id и консоль (F12).");
  } finally {
    setLoading(false);
  }
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
