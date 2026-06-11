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
    .slice(0, 3)
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
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  target.innerHTML = paragraphs
    .map((paragraph, index) => {
      const lines = paragraph.split("\n").map((line) => escapeHtml(line.trim()));
      return `<p${index === 0 ? ' class="hero-story-lead"' : ""}>${lines.join("<br />")}</p>`;
    })
    .join("");
}

function renderCareerStory() {
  const target = byId("career-story");
  if (!target) return;
  target.innerHTML = state.data.career.story.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
}

function renderCapabilityBand() {
  const target = byId("capability-band");
  if (!target) return;
  target.innerHTML = state.data.profile.capabilityBand
    .map((capability) => `<span>${escapeHtml(capability)}</span>`)
    .join("");
}

function renderHomePreview() {
  const target = byId("home-work-preview");
  if (!target) return;
  target.innerHTML = state.data.work.timeline
    .slice(0, 3)
    .map(
      (item, index) => `
        <article class="preview-card preview-card-${index + 1}">
          <div class="preview-symbol" aria-hidden="true">
            <strong>${escapeHtml(item.visualMark)}</strong>
            <span>${escapeHtml(item.visualCaption)}</span>
          </div>
          <p class="eyebrow">${escapeHtml(item.period)}</p>
          <h3>${escapeHtml(item.project)}</h3>
          <p>${escapeHtml(item.details)}</p>
          <div class="badge-list">${item.badges.slice(0, 4).map((badge) => `<span class="badge">${escapeHtml(badge)}</span>`).join("")}</div>
        </article>
      `
    )
    .join("");
}

const monthIndexes = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11
};

function parsePeriodPoint(value, isEnd = false) {
  if (!value) return isEnd ? 999999 : -999999;
  if (/present|recent|current/i.test(value)) {
    const now = new Date();
    return now.getFullYear() * 12 + now.getMonth();
  }
  const normalized = value.trim().replace(".", "");
  const monthYear = normalized.match(/^([A-Za-z]{3,})\s+(\d{4})$/);
  if (monthYear) {
    const month = monthIndexes[monthYear[1].slice(0, 3).toLowerCase()] ?? 0;
    return Number(monthYear[2]) * 12 + month;
  }
  const slashYear = normalized.match(/^(\d{4})\/(\d{1,2})$/);
  if (slashYear) return Number(slashYear[1]) * 12 + Number(slashYear[2]) - 1;
  return isEnd ? 999999 : -999999;
}

function parsePeriodRange(period) {
  const [start, end] = period.split(/\s*-\s*/);
  return {
    start: parsePeriodPoint(start),
    end: parsePeriodPoint(end, true)
  };
}

function buildTimelineGroups(items) {
  const groups = [];
  items.forEach((item, index) => {
    const range = parsePeriodRange(item.period);
    const [startLabel, endLabel] = item.period.split(/\s*-\s*/);
    const durationMonths = Math.max(1, range.end - range.start + 1);
    const timelineItem = {
      item,
      range,
      startLabel,
      endLabel,
      durationMonths,
      tone: (index % 5) + 1
    };
    const group = groups.find((candidate) => range.start <= candidate.range.end && range.end >= candidate.range.start);
    if (group) {
      group.items.push(timelineItem);
      group.range.start = Math.min(group.range.start, range.start);
      group.range.end = Math.max(group.range.end, range.end);
    } else {
      groups.push({ range: { ...range }, items: [timelineItem] });
    }
  });
  groups.forEach((group) => {
    const lanes = [];
    group.durationMonths = Math.max(1, group.range.end - group.range.start + 1);
    const cardStride = group.items.length > 1 ? 320 : 240;
    group.visualHeight = Math.max(group.durationMonths * 12, group.items.length * cardStride);
    const monthScale = group.visualHeight / group.durationMonths;
    group.items.forEach((timelineItem) => {
      let lane = lanes.findIndex((intervals) =>
        intervals.every((interval) => timelineItem.range.end <= interval.start || timelineItem.range.start >= interval.end)
      );
      if (lane === -1) {
        lane = lanes.length;
        lanes.push([]);
      }
      lanes[lane].push(timelineItem.range);
      timelineItem.lane = lane;
      timelineItem.topMonths = group.range.end - timelineItem.range.end;
      timelineItem.segmentTop = timelineItem.topMonths * monthScale;
      timelineItem.segmentHeight = timelineItem.durationMonths * monthScale;
    });
    group.laneCount = lanes.length;
  });
  return groups;
}

function renderTimelineCard({ item, tone }) {
  const productVisual = item.image
    ? `<div class="product-visual"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.imageAlt || item.project)}" loading="lazy" /></div>`
    : `
      <div class="product-visual product-visual-abstract" aria-hidden="true">
        <span class="abstract-node abstract-node-primary"></span>
        <span class="abstract-node abstract-node-secondary"></span>
        <span class="abstract-node abstract-node-tertiary"></span>
        <span class="abstract-path"></span>
        <strong>${escapeHtml(item.visualMark || item.type)}</strong>
      </div>
    `;
  return `
    <article class="timeline-card tone-period-${tone}">
      <div class="timeline-card-layout">
        <div class="timeline-body">
          <div class="timeline-heading">
            <p class="timeline-type">${escapeHtml(item.type)}</p>
            <h3>${escapeHtml(item.project)}</h3>
            <p class="timeline-company">${escapeHtml(item.company)}</p>
            <p class="timeline-period-inline">${escapeHtml(item.period)}</p>
          </div>
          <div class="timeline-meta">
            <div class="meta-box"><span>Role</span><strong>${escapeHtml(item.role)}</strong></div>
            <div class="meta-box"><span>Focus</span><strong>${escapeHtml(item.scope)}</strong></div>
          </div>
          <p class="details">${escapeHtml(item.details)}</p>
          <div class="badge-list">${item.badges.slice(0, 3).map((badge) => `<span class="badge">${escapeHtml(badge)}</span>`).join("")}</div>
        </div>
        ${productVisual}
      </div>
    </article>
  `;
}

function renderWorkTimeline() {
  const target = byId("work-timeline");
  if (!target) return;
  target.innerHTML = buildTimelineGroups(state.data.work.timeline)
    .map(
      (group) => `
        <section
          class="timeline-group"
          style="--group-height: ${Math.round(group.visualHeight)}px; --lane-count: ${group.laneCount};"
        >
          <div class="timeline-rail">
            ${group.items
              .map(
                ({ item, lane, startLabel, endLabel, segmentHeight, segmentTop, tone }) => `
                  <div
                    class="timeline-segment-wrap tone-period-${tone}"
                    style="--timeline-lane: ${lane}; --segment-top: ${Math.round(segmentTop)}px; --segment-height: ${Math.max(42, Math.round(segmentHeight))}px;"
                    aria-label="${escapeHtml(item.period)}"
                  >
                    <span class="timeline-segment-label">${escapeHtml(endLabel)} - ${escapeHtml(startLabel)}</span>
                    <span class="timeline-segment" aria-hidden="true"></span>
                    <span class="timeline-segment-connector" aria-hidden="true"></span>
                  </div>
                `
              )
              .join("")}
          </div>
          <div class="timeline-group-cards">
            ${group.items.map(renderTimelineCard).join("")}
          </div>
        </section>
      `
    )
    .join("");
  syncTimelineConnectors(target);
  if (!target.dataset.connectorResizeBound) {
    let resizeFrame;
    window.addEventListener("resize", () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => syncTimelineConnectors(target));
    });
    target.dataset.connectorResizeBound = "true";
  }
}

function syncTimelineConnectors(target) {
  if (window.matchMedia("(max-width: 720px)").matches) return;
  requestAnimationFrame(() => {
    target.querySelectorAll(".timeline-group").forEach((group) => {
      const rail = group.querySelector(".timeline-rail");
      const cards = [...group.querySelectorAll(".timeline-card")];
      const wraps = [...group.querySelectorAll(".timeline-segment-wrap")];
      const railRect = rail.getBoundingClientRect();

      wraps.forEach((wrap, index) => {
        const segment = wrap.querySelector(".timeline-segment");
        const connector = wrap.querySelector(".timeline-segment-connector");
        const segmentRect = segment.getBoundingClientRect();
        const cardRect = cards[index].getBoundingClientRect();
        const fromY = segmentRect.top + segmentRect.height / 2 - railRect.top;
        const toY = cardRect.top + 38 - railRect.top;
        const wrapTop = wrap.getBoundingClientRect().top - railRect.top;
        const connectorTop = Math.min(fromY, toY) - wrapTop;
        const connectorHeight = Math.max(2, Math.abs(toY - fromY));

        connector.style.top = `${connectorTop}px`;
        connector.style.height = `${connectorHeight}px`;
        connector.classList.toggle("connect-up", toY < fromY);
        connector.classList.toggle("connect-down", toY >= fromY);
      });
    });
  });
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

function safeVariant(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function safeImagePosition(value) {
  return /^(left|center|right|\d{1,3}%)( (top|center|bottom|\d{1,3}%))?$/.test(value || "")
    ? value
    : "center";
}

function renderVisualMedia(item) {
  const tones = [
    "art",
    "photo",
    "diy",
    "game",
    "motion",
    "friends",
    "landscape",
    "shanghai",
    "kunming",
    "hangzhou",
    "factory",
    "usa",
    "jiaxing"
  ];
  const tone = safeVariant(item.tone, tones, "photo");
  const image = item.image
    ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.imageAlt || item.name || item.city || "")}" loading="lazy" style="object-position: ${safeImagePosition(item.imagePosition)}" />`
    : "";
  return `<div class="visual-card-media tone-${tone}">${image}</div>`;
}

function renderPageImage(targetId, source, alt = "", position = "center") {
  const target = byId(targetId);
  if (!target || !source) return;
  target.src = source;
  target.alt = alt;
  target.style.objectPosition = safeImagePosition(position);
  target.hidden = false;
}

function renderFootprintGallery() {
  const target = byId("footprint-photo-grid");
  if (!target) return;
  target.innerHTML = (state.data.placesPage?.gallery || [])
    .map(
      (photo) => `
        <figure class="footprint-photo shape-${safeVariant(photo.shape, ["feature", "wide", "standard", "tall"], "standard")}">
          <img
            src="${escapeHtml(photo.image)}"
            alt="${escapeHtml(photo.imageAlt || photo.title)}"
            loading="lazy"
            style="object-position: ${safeImagePosition(photo.imagePosition)}"
          />
          <figcaption>
            <span>${escapeHtml(photo.location)}</span>
            <strong>${escapeHtml(photo.title)}</strong>
          </figcaption>
        </figure>
      `
    )
    .join("");
}

function renderPlaces() {
  const target = byId("places-grid");
  if (!target) return;
  const places = state.data.places || state.data["working Footprint"] || [];
  target.innerHTML = places
    .map(
      (place) => `
        <article
          class="visual-card place-visual-card layout-${safeVariant(place.layout, ["large", "medium", "small", "wide"], "small")}"
          aria-label="${escapeHtml(`${place.city}. ${place.work} ${place.people} ${place.taste}`)}"
        >
          ${renderVisualMedia(place)}
          <div class="visual-card-copy">
            <span class="visual-card-tag">${escapeHtml(place.taste)}</span>
            <h2>${escapeHtml(place.city)}</h2>
            <p>${escapeHtml(place.summary || place.description)}</p>
          </div>
        </article>
      `
    )
    .join("");

  const route = byId("places-route");
  if (route) {
    route.innerHTML = places
      .map(
        (place) => `
          <div class="places-route-stop">
            <strong>${escapeHtml(place.city)}</strong>
            <span>${escapeHtml(place.work)}</span>
          </div>
        `
      )
      .join("");
  }
}

function renderLife() {
  const target = byId("life-grid");
  if (!target) return;
  target.innerHTML = state.data.life.items
    .map(
      (item) => `
        <article class="visual-card life-visual-card layout-${safeVariant(item.layout, ["large", "medium", "small", "wide"], "small")}">
          ${renderVisualMedia(item)}
          <div class="visual-card-copy">
            <span class="visual-card-tag">${escapeHtml(item.label)}</span>
            <h2>${escapeHtml(item.name)}</h2>
            <p>${escapeHtml(item.summary || item.description)}</p>
          </div>
        </article>
      `
    )
    .join("");

  const gallery = byId("life-gallery");
  if (gallery) {
    gallery.innerHTML = (state.data.life.gallery || [])
      .map(
        (item) => `
          <article class="visual-gallery-item">
            ${renderVisualMedia(item)}
            <strong>${escapeHtml(item.name)}</strong>
          </article>
        `
      )
      .join("");
  }
}

function renderContact() {
  const contacts = [
    {
      link: byId("china-email-link"),
      address: byId("china-email-address"),
      email: state.data.contact.email
    },
    {
      link: byId("global-email-link"),
      address: byId("global-email-address"),
      email: state.data.contact.globalEmail
    }
  ];

  contacts.forEach(({ link, address, email }) => {
    if (!link || !address || !email) return;
    const emailHref = `mailto:${email}`;
    link.href = emailHref;
    link.textContent = state.data.contact.emailAction || "Send Email";
    address.href = emailHref;
    address.textContent = email;
  });
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
  const response = await fetch("data/site.json", { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load data/site.json");
  state.data = await response.json();
}

async function init() {
  setupNavigation();
  await loadData();
  bindText();
  renderHeroStory();
  renderCareerStory();
  renderCapabilityBand();
  renderMetrics();
  renderHomePreview();
  renderWorkTimeline();
  renderResume();
  renderPlaces();
  renderFootprintGallery();
  renderLife();
  renderPageImage(
    "life-hero-image",
    state.data.life?.heroImage,
    "Life. Interest driven. Creation, motion, games, and the things I genuinely enjoy.",
    state.data.life?.heroImagePosition
  );
  renderPageImage(
    "places-hero-image",
    state.data.placesPage?.heroImage,
    "Shanghai skyline at night",
    state.data.placesPage?.heroImagePosition
  );
  renderContact();
}

init().catch((error) => {
  console.error(error);
});
