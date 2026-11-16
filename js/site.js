import { facts, partners, text } from "./content.js?v=20";

const LANGS = ["en", "zh-Hant", "zh-Hans"];
const LANG_KEY = "rhysend-lang";
const DRAFT_KEY = "rhysend-draft";

const currentLang = () => {
  const saved = localStorage.getItem(LANG_KEY);
  return LANGS.includes(saved) ? saved : "en";
};

const dict = () => text[currentLang()];

const forms = () => [...document.querySelectorAll("form.note")];

const STATUS_KEYS = ["opened", "needNote"];

const translateStatus = (d) => {
  document.querySelectorAll("[data-status]").forEach((el) => {
    const current = el.textContent;
    if (!current) return;
    for (const language of LANGS) {
      for (const key of STATUS_KEYS) {
        if (text[language][key] === current) {
          el.textContent = d[key];
          return;
        }
      }
    }
  });
};

const paintFacts = (d) => {
  document.querySelectorAll("[data-fact]").forEach((el) => {
    const key = el.dataset.fact;
    const value = facts[key];
    const slot = el.querySelector("[data-fact-value]");
    if (!value || !slot) {
      el.hidden = true;
      if (slot) slot.textContent = "";
      return;
    }
    const label = d[`${key}Label`];
    el.hidden = false;
    slot.textContent = value;
    if (slot.tagName === "A") {
      if (key === "email") slot.href = `mailto:${value}`;
      if (key === "phone") slot.href = `tel:${value.replace(/[^\d+]/g, "")}`;
    }
    if (label) slot.setAttribute("aria-label", `${label} ${value}`);
  });
};

const apply = (language) => {
  const d = text[language];
  document.documentElement.lang = language === "zh-Hant" ? "zh-Hant-HK" : language;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const value = d[el.dataset.i18n];
    if (value != null) el.textContent = value;
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = d[el.dataset.i18nPlaceholder] || "";
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const value = d[el.dataset.i18nAria];
    if (value) el.setAttribute("aria-label", value);
  });
  const page = document.body.dataset.page;
  if (page === "blog" || page === "projects") {
    if (!document.querySelector(".entry")) {
      const title = page === "blog" ? d.navBlog : d.navProjects;
      document.title = `${title} | ${d.tabTitle}`;
    }
  } else if (d.tabTitle) {
    document.title = d.tabTitle;
  }
  const description = document.querySelector('meta[name="description"]');
  if (description && !document.querySelector(".entry") && d.descriptions?.[page]) description.setAttribute("content", d.descriptions[page]);
  document.querySelectorAll(".logo").forEach((img) => {
    if (d.logoAlt) img.alt = d.logoAlt;
  });
  document.querySelectorAll(".partner-logo").forEach((img) => {
    if (d.odoo) img.alt = d.odoo;
  });
  document.querySelectorAll("[data-lang]").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.lang === language));
  });
  paintFacts(d);
  translateStatus(d);
  localStorage.setItem(LANG_KEY, language);
  document.documentElement.classList.remove("booting");
};

const readDraft = () => {
  try {
    return JSON.parse(sessionStorage.getItem(DRAFT_KEY)) || {};
  } catch {
    return {};
  }
};

const writeDraft = (source) => {
  const note = source.querySelector("textarea")?.value || "";
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ note }));
  forms().forEach((form) => {
    if (form === source) return;
    const area = form.querySelector("textarea");
    if (area && area.value !== note) area.value = note;
  });
};

const restoreDraft = () => {
  const draft = readDraft();
  forms().forEach((form) => {
    if (typeof draft.note === "string") form.querySelector("textarea").value = draft.note;
  });
};

const bindForms = () => {
  forms().forEach((form) => {
    form.addEventListener("input", () => writeDraft(form));
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const d = dict();
      const area = form.querySelector("textarea");
      const note = area.value.trim();
      const status = form.querySelector("[data-status]");
      if (!note) {
        status.textContent = d.needNote;
        area.focus();
        return;
      }
      if (!facts.email) return;
      const body = note;
      status.textContent = d.opened;
      window.location.href = `mailto:${facts.email}?subject=${encodeURIComponent(d.subject)}&body=${encodeURIComponent(body)}`;
    });
  });
};

const bindPartner = () => {
  document.querySelectorAll("[data-partners]").forEach((list) => {
    list.replaceChildren();
    for (const partner of partners) {
      if (!partner?.src) continue;
      const item = document.createElement("li");
      const img = document.createElement("img");
      img.alt = partner.name || "";
      img.hidden = true;
      img.addEventListener("load", () => {
        img.hidden = false;
      });
      img.addEventListener("error", () => item.remove());
      img.src = `${document.body.dataset.baseurl || ""}/${partner.src}`;
      item.append(img);
      list.append(item);
    }
  });
};

const bindArticleFilter = () => {
  const control = document.querySelector("[data-filter-control]");
  const list = document.querySelector("#article-list");
  if (!control || !list) return;

  const select = control.querySelector("select");
  const cards = list.querySelectorAll("[data-article-type]");
  const empty = document.querySelector("[data-filter-empty]");
  const filter = () => {
    let hasResults = false;
    for (const card of cards) {
      card.hidden = select.value !== "all" && card.dataset.articleType !== select.value;
      if (!card.hidden) hasResults = true;
    }
    empty.hidden = hasResults || cards.length === 0;
  };

  select.addEventListener("change", filter);
  filter();
  control.hidden = false;
};

apply(currentLang());
restoreDraft();
bindForms();
bindPartner();
bindArticleFilter();

document.querySelectorAll("[data-lang]").forEach((btn) => {
  btn.addEventListener("click", () => apply(btn.dataset.lang));
});

