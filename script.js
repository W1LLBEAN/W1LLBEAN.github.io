const state = { data: null };
const pageName = document.body.dataset.page;

function byId(id) {
  return document.getElementById(id);
}

function getValue(path, source = state.data) {
  return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : ""), source);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function bindText() {
  document.querySelectorAll("[data-bind]").forEach((node) => {
    node.textContent = getValue(node.dataset.bind);
  });
}

function renderTagList(targetId, items, className = "tag") {
  const target = byId(targetId);
  if (!target || !items) return;
  target.innerHTML = items.map((item) => `<span class="${className}">${escapeHtml(item)}</span>`).join("");
}

function renderMetrics() {
  const target = byId("metrics");
  if (!target) return;
  target.innerHTML = state.data.profile.metrics
    .map(
      (metric) => `
        <article class="metric">
          <strong>${escapeHtml(metric.value)}</strong>
          ${metric.title ? `<h3>${escapeHtml(metric.title)}</h3>` : ""}
          <span>${escapeHtml(metric.label)}</span>
        </article>
      `
    )
    .join("");
}

function renderHeroStory() {
  const target = byId("hero-story");
  if (!target) return;
  const paragraphs = state.data.profile.title
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replaceAll("\n", " ").trim())
    .filter(Boolean);
  target.innerHTML = paragraphs
    .map((paragraph, index) => `<p${index === 0 ? ' class="hero-story-lead"' : ""}>${escapeHtml(paragraph)}</p>`)
    .join("");
}

function renderTools() {
  const target = byId("tool-shelf");
  if (!target || !state.data.profile.tools) return;
  const captureOffsets = [
    [-180, -240],
    [40, -260],
    [210, -210],
    [-240, -120],
    [170, -180],
    [260, -70],
    [-260, -40],
    [120, -250],
    [240, -150],
    [-130, -230],
    [80, -280]
  ];
  target.innerHTML = state.data.profile.tools
    .map(
      (tool, index) => {
        const [captureX, captureY] = captureOffsets[index % captureOffsets.length];
        return `
        <article
          class="tool-item tool-item-${index + 1}"
          aria-label="${escapeHtml(tool.name)}"
          title="${escapeHtml(tool.name)}"
          style="--orbit-delay: -${(index * 3.15).toFixed(2)}s; --capture-delay: ${180 + index * 75}ms; --capture-x: ${captureX}px; --capture-y: ${captureY}px;"
        >
          <div class="tool-icon-entry">
            <div class="tool-icon-wrap">
              <img src="${escapeHtml(tool.image)}" alt="" />
            </div>
          </div>
        </article>
      `;
      }
    )
    .join("");
}

function renderHomePreview() {
  const target = byId("home-work-preview");
  if (!target) return;
  target.innerHTML = state.data.work.timeline
    .slice(0, 3)
    .map(
      (item) => `
        <article class="preview-card">
          <p class="eyebrow">${escapeHtml(item.period)}</p>
          <h3>${escapeHtml(item.project)}</h3>
          <p>${escapeHtml(item.details)}</p>
          <div class="badge-list">${item.badges.slice(0, 4).map((badge) => `<span class="badge">${escapeHtml(badge)}</span>`).join("")}</div>
        </article>
      `
    )
    .join("");
}

function getProjectTone(project) {
  if (/current|npi|newhome/i.test(project)) return "blue";
  if (/apple\s?tv/i.test(project)) return "violet";
  if (/macbook/i.test(project)) return "teal";
  if (/imac|xdr|display/i.test(project)) return "indigo";
  return "slate";
}

function renderWorkTimeline() {
  const target = byId("work-timeline");
  if (!target) return;
  target.innerHTML = state.data.work.timeline
    .map(
      (item, index) => `
        <article class="timeline-entry tone-${getProjectTone(item.project)}">
          <div class="timeline-rail" aria-hidden="true">
            <span class="timeline-node">${String(index + 1).padStart(2, "0")}</span>
          </div>
          <div class="timeline-card">
            <div class="timeline-body">
              <div class="timeline-heading">
                <div>
                  <p class="timeline-type">${escapeHtml(item.type)}</p>
                  <h3>${escapeHtml(item.project)}</h3>
                  <p class="timeline-company">${escapeHtml(item.company)}</p>
                </div>
                ${
                  item.image
                    ? `<div class="product-visual"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.imageAlt || item.project)}" loading="lazy" /></div>`
                    : ""
                }
              </div>
              <div class="timeline-meta">
                <div class="meta-box"><span>Time</span><strong>${escapeHtml(item.period)}</strong></div>
                <div class="meta-box"><span>Role</span><strong>${escapeHtml(item.role)}</strong></div>
                <div class="meta-box"><span>Focus</span><strong>${escapeHtml(item.scope)}</strong></div>
              </div>
              <p class="details">${escapeHtml(item.details)}</p>
              <div class="timeline-highlight">
                <span>Key responsibility</span>
                <p>${escapeHtml(item.highlights[0])}</p>
              </div>
              <div class="badge-list">${item.badges.slice(0, 4).map((badge) => `<span class="badge">${escapeHtml(badge)}</span>`).join("")}</div>
            </div>
          </div>
        </article>
      `
    )
    .join("");
}

function renderResume() {
  const profile = byId("resume-profile");
  if (profile) {
    const paragraphs = Array.isArray(state.data.resume.profile)
      ? state.data.resume.profile
      : [state.data.resume.profile];
    profile.innerHTML = paragraphs.map((item) => `<p>${escapeHtml(item)}</p>`).join("");
  }

  const experience = byId("resume-experience");
  if (experience) {
    experience.innerHTML = state.data.resume.experience
      .map(
        (item) => `
          <section class="resume-experience-item">
            <div class="resume-experience-heading">
              <div>
                <h3>${escapeHtml(item.role)}</h3>
                <p><strong>${escapeHtml(item.company)}</strong></p>
              </div>
              <span>${escapeHtml(item.period)}</span>
            </div>
            ${
              item.products?.length
                ? `<h4>Products</h4><ul class="resume-product-list">${item.products.map((product) => `<li>${escapeHtml(product)}</li>`).join("")}</ul>`
                : ""
            }
            <h4>Responsibilities</h4>
            <ol>${(item.responsibilities || [item.summary]).map((responsibility) => `<li>${escapeHtml(responsibility)}</li>`).join("")}</ol>
          </section>
        `
      )
      .join("");
  }

  const delivery = byId("delivery-list");
  if (delivery) {
    delivery.innerHTML = state.data.resume.delivery.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  }

  const skills = byId("skill-columns");
  if (skills) {
    skills.innerHTML = state.data.resume.skills
      .map(
        (group) => `
          <section class="skill-group">
            <h4>${escapeHtml(group.name)}</h4>
            <ul>${group.items.map((skill) => `<li>${escapeHtml(skill)}</li>`).join("")}</ul>
          </section>
        `
      )
      .join("");
  }

  const additional = byId("additional-list");
  if (additional) {
    const items = Array.isArray(state.data.resume.additional)
      ? state.data.resume.additional
      : [state.data.resume.additional];
    additional.innerHTML = items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  }
}

function renderPlaces() {
  const target = byId("places-grid");
  if (!target) return;
  const places = state.data.places || state.data["working Footprint"] || [];
  target.innerHTML = places
    .map(
      (place) => `
        <article class="place-card">
          <h3>${escapeHtml(place.city)}</h3>
          <p>${escapeHtml(place.description)}</p>
        </article>
      `
    )
    .join("");
}

function renderLife() {
  const target = byId("life-grid");
  if (!target) return;
  target.innerHTML = state.data.life.items
    .map(
      (item) => `
        <article class="life-card">
          <h3>${escapeHtml(item.name)}</h3>
          <p>${escapeHtml(item.description)}</p>
        </article>
      `
    )
    .join("");
}

function renderContact() {
  const link = byId("email-link");
  if (!link) return;
  link.href = `mailto:${state.data.contact.email}`;
  link.textContent = `Email ${state.data.contact.email}`;
}

function setupNavigation() {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  document.querySelectorAll("[data-nav]").forEach((link) => {
    if (link.dataset.nav === pageName) link.classList.add("active");
    link.addEventListener("click", () => {
      header.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
  toggle.addEventListener("click", () => {
    const isOpen = header.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
}

async function loadData() {
  const response = await fetch("data/site.json");
  if (!response.ok) throw new Error("Unable to load data/site.json");
  state.data = await response.json();
}

async function init() {
  setupNavigation();
  await loadData();
  bindText();
  renderHeroStory();
  renderTagList("hero-tags", state.data.profile.tags);
  renderTagList("current-programs", state.data.work.currentPrograms, "program-tag");
  renderTagList("capabilities", state.data.work.capabilities, "capability");
  renderMetrics();
  renderTools();
  renderHomePreview();
  renderWorkTimeline();
  renderResume();
  renderPlaces();
  renderLife();
  renderContact();
}

init().catch((error) => {
  console.error(error);
});
