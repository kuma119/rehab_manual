(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const labels = {
    SUPER_ADMIN: "슈퍼 관리자",
    ADMIN: "센터 관리자",
    STAFF: "운동 지도자",
    CUSTOMER: "회원",
  };
  const icons = { SUPER_ADMIN: "⌘", ADMIN: "▦", STAFF: "◷", CUSTOMER: "♡" };
  const data = window.MANUAL_DATA || { scenarios: [] };
  const scenarios = Array.isArray(data.scenarios)
    ? data.scenarios.filter(
        (s) => s.id && Array.isArray(s.steps) && s.steps.length
      )
    : [];
  const state = {
    scenario: null,
    index: 0,
    role: "ALL",
    query: "",
    mode: "practice",
    playing: false,
    speed: 1,
    filming: false,
    filmSequence: null,
    aspect: "landscape",
    loading: false,
    imageFailed: false,
    completed: false,
    elapsed: 0,
    startedAt: 0,
    duration: 0,
    frame: 0,
    renderToken: 0,
    countdownTimer: 0,
    countdown: 0,
    controlsTimer: 0,
    scrollY: 0,
  };
  const escapeHTML = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[char])
    );
  const currentStep = () => state.scenario?.steps[state.index];
  const outsideFilm = () =>
    document.querySelectorAll(
      ".site-header,.player-heading,.preparation,.steps-panel,.playback-toolbar,.progress-track,.step-navigation,.playback-status"
    );
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const roleName = (role) => labels[role] || role || "앱 화면";
  const sequence = () =>
    state.filming && state.filmSequence
      ? state.filmSequence
      : (state.scenario?.steps || []).map((_, index) => index);
  const position = () => Math.max(0, sequence().indexOf(state.index));
  const isLast = () => position() === sequence().length - 1;
  function promoSequence() {
    return [
      ...new Set(
        (state.scenario?.promoStepIds || [])
          .map((id) => state.scenario.steps.findIndex((step) => step.id === id))
          .filter((index) => index >= 0)
      ),
    ];
  }
  function updateStepLabels() {
    $("story-number").textContent = `${
      state.filmSequence ? "HIGHLIGHT" : "STEP"
    } ${String(position() + 1).padStart(2, "0")}`;
    $("screen-step").textContent = `${position() + 1} / ${sequence().length}`;
    $("step-counter").textContent = `${position() + 1} / ${
      sequence().length
    }단계`;
    document.querySelector(".stage-brand span").textContent = state.filmSequence
      ? "· 핵심 장면 시연"
      : "· 함께 배우는 사용 안내";
  }
  function status(message) {
    $("playback-status").textContent = message;
  }
  function stopClock(keepElapsed = false) {
    if (state.frame) cancelAnimationFrame(state.frame);
    state.frame = 0;
    if (keepElapsed && state.startedAt)
      state.elapsed += (performance.now() - state.startedAt) * state.speed;
    if (!keepElapsed) state.elapsed = 0;
    state.startedAt = 0;
    $("stage").classList.remove("is-clicking");
  }
  function cancelCountdown() {
    if (state.countdownTimer) clearTimeout(state.countdownTimer);
    state.countdownTimer = 0;
    state.countdown = 0;
    $("countdown").hidden = true;
  }
  function updateControls() {
    const busy = state.loading || !!state.countdown;
    $("mode-practice").setAttribute(
      "aria-pressed",
      String(state.mode === "practice")
    );
    $("mode-auto").setAttribute("aria-pressed", String(state.mode === "auto"));
    $("play-toggle").textContent = state.playing
      ? "Ⅱ 일시정지"
      : state.completed
      ? "↺ 다시 시연"
      : state.elapsed
      ? "▶ 계속 재생"
      : "▶ 시연 재생";
    $("film-play").textContent = state.playing ? "일시정지" : "계속 재생";
    $("film-play").disabled = !!state.countdown;
    $("previous").disabled = !state.scenario || position() === 0;
    $("next").disabled = !state.scenario || busy;
    $("hotspot").disabled = busy;
    $("next").innerHTML =
      state.scenario && isLast()
        ? '마치기 <span aria-hidden="true">✓</span>'
        : '다음 <span aria-hidden="true">→</span>';
    $("demo-pointer").hidden =
      !currentStep()?.hotspot ||
      state.imageFailed ||
      state.loading ||
      (state.mode !== "auto" && !state.filming);
  }
  function pause(
    message = "잠시 멈췄어요. 계속 재생하거나 직접 다음으로 이동할 수 있어요."
  ) {
    stopClock(true);
    state.playing = false;
    cancelCountdown();
    updateControls();
    status(message);
  }
  function startClock() {
    stopClock(true);
    if (!state.playing || state.loading || state.countdown || !state.scenario)
      return;
    state.duration = Math.max(2500, Number(currentStep().duration) || 6500);
    if (isLast()) state.duration = Math.max(7500, state.duration);
    state.startedAt = performance.now();
    const tick = (now) => {
      if (!state.playing || state.loading || state.countdown) return;
      const progress = clamp(
        (state.elapsed + (now - state.startedAt) * state.speed) /
          state.duration,
        0,
        1
      );
      $("play-progress").style.width = `${progress * 100}%`;
      $("stage").classList.toggle(
        "is-clicking",
        progress > 0.65 && progress < 0.9
      );
      if (progress >= 1) {
        state.startedAt = 0;
        state.frame = 0;
        state.elapsed = 0;
        if (!isLast())
          showStep(sequence()[position() + 1], { keepPlaying: true });
        else complete();
      } else state.frame = requestAnimationFrame(tick);
    };
    state.frame = requestAnimationFrame(tick);
    status(`자동 시연 중 · ${position() + 1} / ${sequence().length}단계`);
  }
  function play() {
    if (!state.scenario || state.countdown) return;
    if (state.imageFailed) {
      status(
        "현재 화면을 다시 불러온 뒤 시연을 재생해 주세요. 다음 단계로 직접 이동할 수도 있어요."
      );
      return;
    }
    state.mode = "auto";
    state.playing = true;
    if (state.completed) {
      state.completed = false;
      showStep(sequence()[0], { keepPlaying: true });
    } else {
      updateControls();
      startClock();
    }
  }
  function togglePlay() {
    if (state.playing) pause();
    else play();
  }
  function complete() {
    stopClock();
    state.playing = false;
    state.completed = true;
    $("play-progress").style.width = "100%";
    $("completed-note").hidden = false;
    $("completed-outcome").textContent =
      state.scenario.outcome || "이 과정의 마지막 결과까지 확인했어요.";
    status(
      "안내를 모두 확인했어요. 처음부터 다시 보거나 전체 안내로 돌아갈 수 있어요."
    );
    updateControls();
  }
  function renderCatalog() {
    const filtered = scenarios.filter(
      (s) =>
        (state.role === "ALL" || (s.roles || []).includes(state.role)) &&
        `${s.title} ${s.summary} ${s.category} ${(s.roles || [])
          .map(roleName)
          .join(" ")}`
          .toLowerCase()
          .includes(state.query)
    );
    $("scenario-count").textContent = `${filtered.length}개의 안내`;
    $("scenario-grid").innerHTML = filtered
      .map(
        (s) =>
          `<a class="scenario-card" href="#${encodeURIComponent(
            s.id
          )}/step/1"><div class="card-top"><span class="card-icon" aria-hidden="true">${
            icons[s.roles?.[0]] || "✦"
          }</span>${
            s.featured
              ? '<span class="card-tag">먼저 해보세요</span>'
              : `<span class="card-tag">${escapeHTML(
                  s.category || "사용 안내"
                )}</span>`
          }</div><h3>${escapeHTML(
            s.title
          )}</h3><p class="card-summary">${escapeHTML(
            s.summary
          )}</p><div class="card-bottom"><span class="card-roles">${(
            s.roles || []
          )
            .map(roleName)
            .map(escapeHTML)
            .join(" → ")}</span><span class="card-time">${
            s.minutes
              ? `약 ${escapeHTML(s.minutes)}분`
              : `${s.steps.length}단계`
          }</span><span class="card-arrow" aria-hidden="true">↗</span></div></a>`
      )
      .join("");
    $("empty-search").hidden = filtered.length > 0;
    if (!scenarios.length)
      $("empty-search").textContent =
        "아직 안내 데이터를 불러오지 못했어요. data.js 파일이 같은 폴더에 있는지 확인해 주세요.";
  }
  function renderFilters() {
    $("role-filters").innerHTML = Object.entries({ ALL: "전체", ...labels })
      .map(
        ([key, name]) =>
          `<button class="filter-button" data-role="${key}" aria-pressed="${
            state.role === key
          }">${name}</button>`
      )
      .join("");
  }
  function setHash() {
    const next = `#${encodeURIComponent(state.scenario.id)}/step/${
      state.index + 1
    }`;
    if (location.hash !== next) history.replaceState(null, "", next);
  }
  function buildSteps() {
    $("step-list").innerHTML = state.scenario.steps
      .map(
        (step, index) =>
          `<li><button class="step-link" data-step="${index}"${
            index === state.index ? ' aria-current="step"' : ""
          }><span aria-hidden="true">${index + 1}</span><div>${escapeHTML(
            step.title
          )}</div></button></li>`
      )
      .join("");
    $("step-total").textContent = `${state.scenario.steps.length}단계`;
  }
  function setImage(step, token) {
    const image = $("step-image");
    state.loading = true;
    state.imageFailed = false;
    $("image-loading").hidden = false;
    $("image-missing").hidden = true;
    $("hotspot").hidden = true;
    $("demo-pointer").hidden = true;
    const ready = (failed) => {
      if (token !== state.renderToken) return;
      state.loading = false;
      state.imageFailed = failed;
      $("image-loading").hidden = true;
      $("image-missing").hidden = !failed;
      $("zoom-open").disabled = failed;
      $("screen-frame").style.setProperty(
        "--image-ratio",
        failed ? "430 / 900" : `${image.naturalWidth} / ${image.naturalHeight}`
      );
      if (!failed && step.hotspot) {
        const h = step.hotspot;
        $("hotspot").hidden = false;
        $("hotspot").style.cssText = `left:${clamp(h.x, 0, 1) * 100}%;top:${
          clamp(h.y, 0, 1) * 100
        }%;width:${clamp(h.w, 0, 1 - h.x) * 100}%;height:${
          clamp(h.h, 0, 1 - h.y) * 100
        }%;`;
        $("hotspot").setAttribute(
          "aria-label",
          `${h.label || step.title} · 다음 단계로 이동`
        );
        $("hotspot").querySelector(".hotspot-number").textContent =
          position() + 1;
        $("demo-pointer").style.left = `${(h.x + h.w * 0.65) * 100}%`;
        $("demo-pointer").style.top = `${(h.y + h.h * 0.65) * 100}%`;
      }
      if (failed) {
        state.playing = false;
        status(
          "화면을 불러오지 못해 재생을 멈췄어요. 다시 불러오거나 다음 단계로 이동할 수 있어요."
        );
      }
      updateControls();
      if (state.playing && !state.countdown) startClock();
    };
    image.onload = () => ready(false);
    image.onerror = () => ready(true);
    image.alt = step.alt || `${roleName(step.role)} 화면: ${step.title}`;
    if (step.image) {
      image.hidden = false;
      image.src = step.image;
      if (image.complete) queueMicrotask(() => ready(!image.naturalWidth));
    } else {
      image.hidden = true;
      image.removeAttribute("src");
      ready(true);
    }
  }
  function showStep(index, { keepPlaying = false, focus = false } = {}) {
    if (!state.scenario) return;
    stopClock();
    state.index = clamp(index, 0, state.scenario.steps.length - 1);
    state.completed = false;
    if (!keepPlaying) state.playing = false;
    const token = ++state.renderToken,
      step = currentStep();
    $("role-chip").textContent = `${roleName(step.role)} 화면`;
    $("role-chip").dataset.role = step.role;
    $("actor-name").textContent = [
      step.actor,
      step.centerName ?? data.centerName,
    ]
      .filter(Boolean)
      .join(" · ");
    updateStepLabels();
    $("step-title").textContent = step.title;
    $("step-caption").textContent = step.caption || "";
    $("step-result").textContent = step.result || "";
    $("step-result").hidden = !step.result;
    const previousStep =
      position() > 0 ? state.scenario.steps[sequence()[position() - 1]] : null;
    const transition =
      step.transition ||
      (state.filmSequence && previousStep && previousStep.role !== step.role
        ? `이제 ${roleName(step.role)}의 화면을 살펴봐요.`
        : "");
    $("transition-note").textContent = transition;
    $("transition-note").hidden = !transition;
    $("screen-hint").textContent = step.hotspot
      ? "초록색 표시를 누르면 다음으로 이동해요"
      : "화면을 확인한 뒤 ‘다음’을 눌러 주세요";
    $("play-progress").style.width = "0%";
    $("completed-note").hidden = true;
    document.querySelectorAll(".step-link").forEach((el, i) => {
      if (i === state.index) el.setAttribute("aria-current", "step");
      else el.removeAttribute("aria-current");
    });
    setHash();
    setImage(step, token);
    updateControls();
    if (!state.playing)
      status("표시된 위치를 누르거나 ‘다음’ 버튼으로 이동해 보세요.");
    if (focus && !state.filming) {
      $("step-title").focus({ preventScroll: true });
      if (window.matchMedia("(max-width: 580px)").matches)
        $("stage").scrollIntoView({ block: "start", behavior: "instant" });
    }
  }
  function openScenario(scenario, index = 0) {
    cancelCountdown();
    stopClock();
    state.playing = false;
    state.scenario = scenario;
    state.index = index;
    state.completed = false;
    $("home").hidden = true;
    $("player").hidden = false;
    $("header-home").hidden = false;
    $("scenario-title").textContent = scenario.title;
    $("scenario-category").textContent =
      scenario.category || "함께 따라 하는 안내";
    $("prerequisites").innerHTML = `<ul>${(
      scenario.prerequisites || ["안내 화면의 초록색 표시를 따라 눌러 주세요."]
    )
      .map((text) => `<li>${escapeHTML(text)}</li>`)
      .join("")}</ul>`;
    document.querySelector(".preparation").open = false;
    document.title = `${scenario.title} · 재활센터 사용 안내`;
    buildSteps();
    showStep(index);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function goHome() {
    if (state.filming) exitFilm();
    cancelCountdown();
    stopClock();
    state.playing = false;
    state.scenario = null;
    ++state.renderToken;
    $("home").hidden = false;
    $("player").hidden = true;
    $("header-home").hidden = true;
    document.title = "재활센터 · 함께 배우는 사용 안내";
    history.replaceState(null, "", `${location.pathname}${location.search}#`);
    window.scrollTo({ top: 0, behavior: "instant" });
    $("catalog-title").setAttribute("tabindex", "-1");
    $("catalog-title").focus({ preventScroll: true });
  }
  function readHash() {
    if (state.filming) exitFilm();
    const match = location.hash.match(/^#([^/]+)(?:\/step\/(\d+))?$/);
    if (!match) {
      if (state.scenario) goHome();
      return;
    }
    let id;
    try {
      id = decodeURIComponent(match[1]);
    } catch {
      return;
    }
    const scenario = scenarios.find((item) => item.id === id);
    if (!scenario) {
      goHome();
      return;
    }
    const index = clamp(
      (Number(match[2]) || 1) - 1,
      0,
      scenario.steps.length - 1
    );
    if (state.scenario?.id === id) showStep(index);
    else openScenario(scenario, index);
  }
  function next() {
    if (state.loading || state.countdown || !state.scenario) return;
    if (!isLast()) showStep(sequence()[position() + 1], { focus: true });
    else complete();
  }
  function previous() {
    if (position() > 0) showStep(sequence()[position() - 1], { focus: true });
  }
  function restart() {
    cancelCountdown();
    showStep(sequence()[0], { keepPlaying: state.playing });
  }
  function revealFilmControls() {
    if (!state.filming) return;
    $("stage-wrapper").classList.add("controls-visible");
    clearTimeout(state.controlsTimer);
    state.controlsTimer = setTimeout(
      () => $("stage-wrapper").classList.remove("controls-visible"),
      1900
    );
  }
  function enterFilm() {
    if (!state.scenario) return;
    state.aspect = document.querySelector('input[name="aspect"]:checked').value;
    const highlights = promoSequence();
    state.filmSequence =
      document.querySelector('input[name="film-length"]:checked').value ===
        "highlights" && highlights.length > 1
        ? highlights
        : null;
    $("film-dialog").close();
    pause("");
    state.scrollY = window.scrollY;
    state.filming = true;
    state.mode = "auto";
    $("stage").dataset.aspect = state.aspect;
    document.body.classList.add("filming");
    outsideFilm().forEach((element) => {
      element.inert = true;
    });
    $("stage-wrapper").setAttribute("role", "dialog");
    $("stage-wrapper").setAttribute("aria-modal", "true");
    $("stage-wrapper").setAttribute("aria-label", "영상 촬영 미리보기");
    $("film-controls").hidden = false;
    $("stage-wrapper").scrollIntoView({ block: "center", behavior: "instant" });
    showStep(sequence()[0]);
    state.countdown = 3;
    $("countdown").hidden = false;
    $("countdown-number").textContent = "3";
    updateControls();
    $("stage").setAttribute("tabindex", "-1");
    $("stage").focus({ preventScroll: true });
    const tick = () => {
      if (!state.filming || !state.countdown) return;
      state.countdown--;
      if (!state.countdown) {
        $("countdown").hidden = true;
        state.countdownTimer = 0;
        play();
      } else {
        $("countdown-number").textContent = state.countdown;
        state.countdownTimer = setTimeout(tick, 1000);
      }
    };
    state.countdownTimer = setTimeout(tick, 1000);
  }
  function exitFilm() {
    pause("촬영 모드를 끝냈어요. 같은 단계에서 안내를 계속 볼 수 있어요.");
    state.filming = false;
    state.filmSequence = null;
    document.body.classList.remove("filming");
    $("stage").dataset.aspect = "landscape";
    updateStepLabels();
    outsideFilm().forEach((element) => {
      element.inert = false;
    });
    $("stage-wrapper").removeAttribute("role");
    $("stage-wrapper").removeAttribute("aria-modal");
    $("stage-wrapper").removeAttribute("aria-label");
    $("stage").removeAttribute("tabindex");
    $("film-controls").hidden = true;
    clearTimeout(state.controlsTimer);
    $("stage-wrapper").classList.remove("controls-visible");
    window.scrollTo({ top: state.scrollY, behavior: "instant" });
    $("film-open").focus({ preventScroll: true });
    updateControls();
  }
  $("role-filters").addEventListener("click", (event) => {
    const button = event.target.closest("[data-role]");
    if (!button) return;
    state.role = button.dataset.role;
    renderFilters();
    renderCatalog();
    $("role-filters")
      .querySelector(`[data-role="${state.role}"]`)
      .focus({ preventScroll: true });
  });
  $("scenario-search").addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
    renderCatalog();
  });
  $("step-list").addEventListener("click", (event) => {
    const button = event.target.closest("[data-step]");
    if (button) showStep(Number(button.dataset.step), { focus: true });
  });
  $("header-home").addEventListener("click", goHome);
  $("back-home").addEventListener("click", goHome);
  $("next").addEventListener("click", next);
  $("hotspot").addEventListener("click", next);
  $("previous").addEventListener("click", previous);
  $("restart").addEventListener("click", restart);
  $("film-restart").addEventListener("click", () => {
    cancelCountdown();
    state.playing = true;
    showStep(sequence()[0], { keepPlaying: true });
  });
  $("mode-practice").addEventListener("click", () => {
    pause("내 속도로 따라 해보세요.");
    state.mode = "practice";
    updateControls();
  });
  $("mode-auto").addEventListener("click", () => {
    state.mode = "auto";
    updateControls();
    status("‘시연 재생’을 누르면 화면이 순서대로 넘어가요.");
  });
  $("play-toggle").addEventListener("click", togglePlay);
  $("film-play").addEventListener("click", togglePlay);
  $("speed").addEventListener("change", (event) => {
    stopClock(true);
    state.speed = Number(event.target.value);
    if (state.playing) startClock();
  });
  $("image-retry").addEventListener("click", () => showStep(state.index));
  $("film-open").addEventListener("click", () => {
    pause("");
    const available = promoSequence().length > 1;
    $("highlights-option").hidden = !available;
    $("film-length-full").checked = true;
    $("film-dialog").showModal();
  });
  $("film-settings-close").addEventListener("click", () =>
    $("film-dialog").close()
  );
  $("film-start").addEventListener("click", enterFilm);
  $("film-close").addEventListener("click", exitFilm);
  $("stage-wrapper").addEventListener("pointermove", revealFilmControls);
  $("zoom-open").addEventListener("click", () => {
    pause("화면을 크게 보고 있어요. 닫은 뒤 계속 진행할 수 있어요.");
    $("zoom-image").src = $("step-image").src;
    $("zoom-image").alt = $("step-image").alt;
    $("zoom-dialog").showModal();
  });
  $("zoom-close").addEventListener("click", () => $("zoom-dialog").close());
  for (const id of ["film-dialog", "zoom-dialog"]) {
    const dialog = $(id);
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom
      )
        dialog.close();
    });
  }
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.filming) {
      event.preventDefault();
      exitFilm();
      return;
    }
    if (
      !state.scenario ||
      document.querySelector("dialog[open]") ||
      /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)
    )
      return;
    if (state.filming && event.key === "Tab") {
      revealFilmControls();
      const focusable = [
        ...$("stage-wrapper").querySelectorAll("button:not([disabled])"),
      ].filter((element) => !element.hidden && element.getClientRects().length);
      const current = focusable.indexOf(document.activeElement);
      if (
        focusable.length &&
        (current < 0 ||
          (event.shiftKey && current === 0) ||
          (!event.shiftKey && current === focusable.length - 1))
      ) {
        event.preventDefault();
        focusable[event.shiftKey ? focusable.length - 1 : 0].focus();
      }
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      next();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      previous();
    } else if (
      event.code === "Space" &&
      !/^(BUTTON|A|SUMMARY)$/.test(event.target.tagName)
    ) {
      event.preventDefault();
      togglePlay();
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && (state.playing || state.countdown))
      pause(
        "다른 화면으로 이동해 시연을 멈췄어요. 준비되면 계속 재생해 주세요."
      );
  });
  window.addEventListener("hashchange", readHash);
  $("version-note").textContent = [
    data.updatedAt ? `화면 기준 ${data.updatedAt}` : "",
    data.version ? `v${data.version}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  renderFilters();
  renderCatalog();
  readHash();
})();
