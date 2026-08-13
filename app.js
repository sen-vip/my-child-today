// ============================================================
// 우리아이 오늘 v1.0.7 Preserve Parent View Context
// 자녀 전환·수정 후 선택 날짜와 탭 유지
// ============================================================

const API_CONFIG = {
  baseUrl: "https://school-life-calendar-proxy.onrender.com"
};

const SHARE_NOTICE_KEY = "myChildToday.shareNoticeSeen.v1";
let pendingShareMode = null;

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const PUBLIC_HOLIDAY_NAME_PATTERN = /^(?:신정|설날(?:\s*연휴)?|삼일절|3[·.]1절|어린이날|부처님오신날|석가탄신일|현충일|제헌절|광복절|추석(?:\s*연휴)?|개천절|한글날|성탄절|크리스마스|노동절|근로자의\s*날)(?:\s*\([^)]*\))?$/;
const PUBLIC_HOLIDAY_TEXT_PATTERN = /(?:대체공휴일|임시공휴일|공휴일|관공서의\s*공휴일)/;

function renderLoadingText(label) {
  return `<span class="loading-text">${escapeHtml(label)}</span><span class="loading-dots" aria-hidden="true"><span>.</span><span>.</span><span>.</span></span>`;
}

const OFFICE_OPTIONS = [
  { code: "", name: "전체", shortName: "전체" },
  { code: "B10", name: "서울특별시교육청", shortName: "서울" },
  { code: "C10", name: "부산광역시교육청", shortName: "부산" },
  { code: "D10", name: "대구광역시교육청", shortName: "대구" },
  { code: "E10", name: "인천광역시교육청", shortName: "인천" },
  { code: "F10", name: "광주광역시교육청", shortName: "광주" },
  { code: "G10", name: "대전광역시교육청", shortName: "대전" },
  { code: "H10", name: "울산광역시교육청", shortName: "울산" },
  { code: "I10", name: "세종특별자치시교육청", shortName: "세종" },
  { code: "J10", name: "경기도교육청", shortName: "경기" },
  { code: "K10", name: "강원특별자치도교육청", shortName: "강원" },
  { code: "M10", name: "충청북도교육청", shortName: "충북" },
  { code: "N10", name: "충청남도교육청", shortName: "충남" },
  { code: "P10", name: "전북특별자치도교육청", shortName: "전북" },
  { code: "Q10", name: "전라남도교육청", shortName: "전남" },
  { code: "R10", name: "경상북도교육청", shortName: "경북" },
  { code: "S10", name: "경상남도교육청", shortName: "경남" },
  { code: "T10", name: "제주특별자치도교육청", shortName: "제주" }
];


const state = {
  profileState: ProfileStore.loadState(),
  profileEditorMode: "closed",
  editingProfileId: null,
  profileEditorReturnState: null,
  draftSchool: null,
  sharedView: null,
  contextVersion: 0,
  selectedSchool: null,
  currentDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  selectedDate: formatDateKey(new Date()),
  activeTab: "calendar",
  schedules: [],
  meals: [],
  mealsByDate: {},
  scheduleStatus: "idle",
  scheduleMessage: "",
  mealStatus: "idle",
  mealMessage: "",
  meal: null,
  todaySchedules: [],
  todayMeal: null,
  tomorrowSchedules: [],
  tomorrowMeal: null,
  tomorrowStatus: "idle",
  tomorrowMessage: "",
  timetable: [],
  timetableStatus: "idle",
  timetableMessage: "",
  timetableNotice: "",
  timetableDayLabel: "",
  schools: [],
  classSwitcherOpen: false,
  timetableAutoTimer: null,
  sharedHomepageUrl: "",
  schoolInfoExpanded: localStorage.getItem("myChildToday.schoolInfoExpanded") === "true",
  schoolInfoLookupAttempts: new Set()
};

const els = {
  topSchoolName: document.querySelector("#topSchoolName"),
  childProfileList: document.querySelector("#childProfileList"),
  addProfileBtn: document.querySelector("#addProfileBtn"),
  profileLimitHint: document.querySelector("#profileLimitHint"),
  sharedViewBanner: document.querySelector("#sharedViewBanner"),
  exitSharedViewBtn: document.querySelector("#exitSharedViewBtn"),
  nicknameInput: document.querySelector("#nicknameInput"),
  draftSchoolPreview: document.querySelector("#draftSchoolPreview"),
  saveProfileBtn: document.querySelector("#saveProfileBtn"),
  deleteProfileBtn: document.querySelector("#deleteProfileBtn"),
  cancelProfileEditBtn: document.querySelector("#cancelProfileEditBtn"),
  cancelProfileEditBtnBottom: document.querySelector("#cancelProfileEditBtnBottom"),
  editProfileBtn: document.querySelector("#editProfileBtn"),
  selectedKicker: document.querySelector("#selectedKicker"),
  officeCode: document.querySelector("#officeCode"),
  schoolKeyword: document.querySelector("#schoolKeyword"),
  schoolSearchForm: document.querySelector("#schoolSearchForm"),
  schoolResults: document.querySelector("#schoolResults"),
  schoolSearchSection: document.querySelector("#search"),
  searchTitle: document.querySelector("#searchTitle"),
  resetBtn: document.querySelector("#resetBtn"),
  helpBtn: document.querySelector("#helpBtn"),
  helpModal: document.querySelector("#helpModal"),
  shareNoticeModal: document.querySelector("#shareNoticeModal"),
  shareNoticeCancelBtn: document.querySelector("#shareNoticeCancelBtn"),
  shareNoticeConfirmBtn: document.querySelector("#shareNoticeConfirmBtn"),
  selectedSchoolName: document.querySelector("#selectedSchoolName"),
  selectedSchoolMeta: document.querySelector("#selectedSchoolMeta"),
  schoolInfoCard: document.querySelector("#schoolInfoCard"),
  schoolInfoTitle: document.querySelector("#schoolInfoTitle"),
  schoolInfoCompact: document.querySelector("#schoolInfoCompact"),
  schoolInfoToggleBtn: document.querySelector("#schoolInfoToggleBtn"),
  schoolInfoDetails: document.querySelector("#schoolInfoDetails"),
  schoolPhoneRow: document.querySelector("#schoolPhoneRow"),
  schoolPhoneText: document.querySelector("#schoolPhoneText"),
  callSchoolBtn: document.querySelector("#callSchoolBtn"),
  copyPhoneBtn: document.querySelector("#copyPhoneBtn"),
  schoolAddressRow: document.querySelector("#schoolAddressRow"),
  schoolAddressText: document.querySelector("#schoolAddressText"),
  copyAddressBtn: document.querySelector("#copyAddressBtn"),
  schoolHomepageBtn: document.querySelector("#schoolHomepageBtn"),
  refreshSchoolInfoBtn: document.querySelector("#refreshSchoolInfoBtn"),
  schoolInfoNote: document.querySelector("#schoolInfoNote"),
  refreshSchoolInfoText: document.querySelector("#refreshSchoolInfoText"),
  tomorrowPreviewCard: document.querySelector("#tomorrowPreviewCard"),
  tomorrowPreviewTitle: document.querySelector("#tomorrowPreviewTitle"),
  tomorrowMealSummary: document.querySelector("#tomorrowMealSummary"),
  tomorrowScheduleSummary: document.querySelector("#tomorrowScheduleSummary"),
  tomorrowDetailBtn: document.querySelector("#tomorrowDetailBtn"),
  todaySummaryCard: document.querySelector("#todaySummaryCard"),
  todaySummaryTitle: document.querySelector("#todaySummaryTitle"),
  todaySummaryDate: document.querySelector("#todaySummaryDate"),
  copyTodayBtn: document.querySelector("#copyTodayBtn"),
  shareSchoolBtn: document.querySelector("#shareSchoolBtn"),
  selectedCopyDate: document.querySelector("#selectedCopyDate"),
  copySelectedBtn: document.querySelector("#copySelectedBtn"),
  shareSelectedBtn: document.querySelector("#shareSelectedBtn"),
  copyToast: document.querySelector("#copyToast"),
  todayScheduleSummary: document.querySelector("#todayScheduleSummary"),
  todayMealSummary: document.querySelector("#todayMealSummary"),
  todayTimetableSummary: document.querySelector("#todayTimetableSummary"),
  monthTitle: document.querySelector("#monthTitle"),
  calendar: document.querySelector("#calendar"),
  prevMonth: document.querySelector("#prevMonth"),
  nextMonth: document.querySelector("#nextMonth"),
  todayBtn: document.querySelector("#todayBtn"),
  scheduleDetail: document.querySelector("#scheduleDetail"),
  mealDetail: document.querySelector("#mealDetail"),
  timetableDetail: document.querySelector("#timetableDetail"),
  gradeInput: document.querySelector("#gradeInput"),
  classInput: document.querySelector("#classInput"),
  reloadTimetableBtn: document.querySelector("#reloadTimetableBtn"),
  dataLoadingBar: document.querySelector("#dataLoadingBar"),
  dataLoadingTitle: document.querySelector("#dataLoadingTitle"),
  dataLoadingDetail: document.querySelector("#dataLoadingDetail"),
  viewTabs: document.querySelectorAll("[data-view]"),
  viewSections: document.querySelectorAll("[data-root-view]")
};

let dataLoadingSequence = 0;
let dataLoadingShowTimer = null;
let dataLoadingSlowTimer = null;
let dataLoadingHideTimer = null;

function startDataLoading(
  title = "학교생활 정보를 불러오는 중이에요",
  detail = "급식 · 학사일정 · 시간표를 확인하고 있어요."
) {
  const token = ++dataLoadingSequence;
  window.clearTimeout(dataLoadingShowTimer);
  window.clearTimeout(dataLoadingSlowTimer);
  window.clearTimeout(dataLoadingHideTimer);

  if (!els.dataLoadingBar) return token;
  els.dataLoadingTitle.textContent = title;
  els.dataLoadingDetail.textContent = detail;

  const show = () => {
    if (token !== dataLoadingSequence || !els.dataLoadingBar) return;
    els.dataLoadingBar.hidden = false;
    requestAnimationFrame(() => els.dataLoadingBar?.classList.add("is-visible"));
  };

  if (!els.dataLoadingBar.hidden) {
    els.dataLoadingBar.classList.add("is-visible");
  } else {
    dataLoadingShowTimer = window.setTimeout(show, 350);
  }

  dataLoadingSlowTimer = window.setTimeout(() => {
    if (token !== dataLoadingSequence || !els.dataLoadingBar) return;
    show();
    els.dataLoadingTitle.textContent = "정보를 확인하고 있어요";
    els.dataLoadingDetail.textContent = "처음 연결할 때는 조금 더 걸릴 수 있어요.";
  }, 4000);

  return token;
}

function updateDataLoading(token, title, detail) {
  if (token !== dataLoadingSequence || !els.dataLoadingBar) return;
  if (title) els.dataLoadingTitle.textContent = title;
  if (detail) els.dataLoadingDetail.textContent = detail;
}

function finishDataLoading(token) {
  if (token !== dataLoadingSequence) return;
  window.clearTimeout(dataLoadingShowTimer);
  window.clearTimeout(dataLoadingSlowTimer);
  if (!els.dataLoadingBar || els.dataLoadingBar.hidden) return;
  els.dataLoadingBar.classList.remove("is-visible");
  dataLoadingHideTimer = window.setTimeout(() => {
    if (token === dataLoadingSequence && els.dataLoadingBar) els.dataLoadingBar.hidden = true;
  }, 180);
}

function init() {
  renderOfficeOptions();
  bindEvents();

  const sharedState = getSharedStateFromUrl();
  applyInitialCalendarState(sharedState);

  if (sharedState.school) {
    activateSharedView(sharedState);
    state.activeTab = "calendar";
    renderAll();
    loadMonthData().then(() => {
      renderAll();
      requestAnimationFrame(() => scrollToCalendarArea(false));
    });
    void enrichSharedSchoolInfo().then(() => {
      renderSelectedSchool();
      renderSchoolInfo();
    }).catch(() => {});
    return;
  }

  const activeProfile = getActiveProfile();
  if (activeProfile) {
    applyProfileToRuntime(activeProfile);
    state.activeTab = "calendar";
    renderAll();
    loadMonthData().then(() => {
      renderAll();
      requestAnimationFrame(() => scrollToCalendarArea(false));
    });
    void enrichProfileSchoolInfo(activeProfile.id).then(() => {
      renderSelectedSchool();
      renderSchoolInfo();
    }).catch(() => {});
  } else {
    state.activeTab = "settings";
    openProfileEditor("add", null, false);
    renderAll();
  }
}

function setSelectedDateToToday() {
  const today = new Date();
  state.currentDate = new Date(today.getFullYear(), today.getMonth(), 1);
  state.selectedDate = formatDateKey(today);
}

function scrollToViewSection(target, smooth = true) {
  if (!target) return;

  // 고정 헤더와 보기 탭이 콘텐츠 제목을 덮지 않도록 실제 높이를 합산합니다.
  const headerHeight = document.querySelector(".app-header")?.offsetHeight || 74;
  const breathingRoom = 18;
  const targetTop = target.getBoundingClientRect().top + window.scrollY
    - headerHeight - breathingRoom;

  window.scrollTo({
    top: Math.max(targetTop, 0),
    behavior: smooth ? "smooth" : "auto"
  });
}

function scrollToTodaySummary(smooth = true) {
  const target = els.todaySummaryCard || document.querySelector("#todaySummaryCard") || document.querySelector("#calendarArea");
  scrollToViewSection(target, smooth);
}

function scrollToCalendarArea(smooth = true) {
  const target = document.querySelector("#calendarArea") || document.querySelector("#todaySummaryCard");
  scrollToViewSection(target, smooth);
}

function captureViewState() {
  return {
    activeTab: ["calendar", "today", "settings"].includes(state.activeTab) ? state.activeTab : "calendar",
    selectedDate: state.selectedDate,
    currentDate: new Date(state.currentDate)
  };
}

function restoreViewState(viewState, { activeTab } = {}) {
  if (!viewState) return;
  if (viewState.selectedDate) state.selectedDate = viewState.selectedDate;
  if (viewState.currentDate instanceof Date && !Number.isNaN(viewState.currentDate.getTime())) {
    state.currentDate = new Date(viewState.currentDate);
  }
  const nextTab = activeTab || viewState.activeTab;
  state.activeTab = ["calendar", "today", "settings"].includes(nextTab) ? nextTab : "calendar";
}

function scrollToActiveView(smooth = true) {
  const targetMap = {
    calendar: document.querySelector("#calendarArea"),
    today: els.todaySummaryCard,
    settings: document.querySelector("#search:not([hidden])") || document.querySelector("#profiles")
  };
  requestAnimationFrame(() => scrollToViewSection(targetMap[state.activeTab], smooth));
}

function renderOfficeOptions() {
  els.officeCode.innerHTML = OFFICE_OPTIONS.map((office) => `<option value="${office.code}">${office.name}</option>`).join("");
}

function bindEvents() {
  els.schoolSearchForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await handleSchoolSearch();
  });

  document.querySelectorAll(".quick-row button").forEach((button) => {
    button.addEventListener("click", async () => {
      if (button.dataset.office !== undefined) els.officeCode.value = button.dataset.office;
      if (button.dataset.keyword) els.schoolKeyword.value = button.dataset.keyword;
      await handleSchoolSearch(button.textContent.trim());
    });
  });

  document.querySelector('.outline-link[href="#profiles"]')?.addEventListener("click", (event) => {
    event.preventDefault();
    state.activeTab = "settings";
    renderView();
    const target = document.querySelector("#search:not([hidden])") || document.querySelector("#profiles");
    requestAnimationFrame(() => scrollToViewSection(target, true));
  });

  els.childProfileList?.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-profile-id]");
    if (!button) return;
    await selectProfile(button.dataset.profileId);
  });

  els.addProfileBtn?.addEventListener("click", () => openProfileEditor("add"));
  els.editProfileBtn?.addEventListener("click", () => {
    const profile = getActiveProfile();
    if (profile) openProfileEditor("edit", profile.id);
  });
  els.saveProfileBtn?.addEventListener("click", saveProfileFromEditor);
  els.cancelProfileEditBtn?.addEventListener("click", () => closeProfileEditor());
  els.cancelProfileEditBtnBottom?.addEventListener("click", () => closeProfileEditor());
  els.deleteProfileBtn?.addEventListener("click", deleteEditingProfile);
  els.exitSharedViewBtn?.addEventListener("click", exitSharedView);
  els.schoolInfoToggleBtn?.addEventListener("click", toggleSchoolInfo);
  els.schoolHomepageBtn?.addEventListener("click", () => {
    openExternalUrl(getCurrentSchoolInfo().homepageUrl, "학교 홈페이지 주소를 찾지 못했어요.");
  });
  els.copyAddressBtn?.addEventListener("click", async () => {
    const address = getCurrentSchoolInfo().address;
    if (!address) return showCopyToast("학교 주소를 찾지 못했어요.", true);
    await copyText(address, "학교 주소를 복사했어요.");
  });
  els.copyPhoneBtn?.addEventListener("click", async () => {
    const phoneNumber = getCurrentSchoolInfo().phoneNumber;
    if (!phoneNumber) return showCopyToast("대표전화 정보를 찾지 못했어요.", true);
    await copyText(phoneNumber, "학교 대표전화를 복사했어요.");
  });
  els.refreshSchoolInfoBtn?.addEventListener("click", refreshCurrentSchoolInfo);
  els.tomorrowDetailBtn?.addEventListener("click", showTomorrowDetails);

  els.resetBtn.addEventListener("click", () => {
    if (!state.profileState.profiles.length) return;
    const confirmed = window.confirm("등록한 모든 자녀 정보를 이 브라우저에서 삭제할까요?\n이 작업은 되돌릴 수 없습니다.");
    if (!confirmed) return;

    state.profileState = ProfileStore.clearAll();
    state.sharedView = null;
    clearShareQuery();
    clearRuntimeData();
    openProfileEditor("add");
    renderAll();
    showCopyToast("우리아이 오늘에 저장된 자녀 정보를 모두 삭제했어요.");
  });

  els.prevMonth.addEventListener("click", async () => {
    state.currentDate = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth() - 1, 1);
    await loadMonthData();
    renderAll();
  });

  els.nextMonth.addEventListener("click", async () => {
    state.currentDate = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth() + 1, 1);
    await loadMonthData();
    renderAll();
  });

  els.todayBtn.addEventListener("click", async () => {
    setSelectedDateToToday();
    await loadMonthData();
    state.activeTab = "calendar";
    renderAll();
    scrollToCalendarArea(true);
  });

  els.calendar.addEventListener("click", async (event) => {
    const cell = event.target.closest("[data-date]");
    if (!cell) return;
    state.selectedDate = cell.dataset.date;
    await loadDayData();
    renderAll();
    document.querySelector("#detailArea")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  els.viewTabs.forEach((button) => {
    button.addEventListener("click", async () => {
      state.activeTab = button.dataset.view;
      if (state.activeTab === "today" && state.selectedSchool) {
        setSelectedDateToToday();
        await loadMonthData();
        renderAll();
      } else {
        renderView();
      }
      const targetMap = {
        calendar: document.querySelector("#calendarArea"),
        today: els.todaySummaryCard,
        settings: document.querySelector("#search:not([hidden])") || document.querySelector("#profiles")
      };
      requestAnimationFrame(() => scrollToViewSection(targetMap[state.activeTab], true));
    });
  });

  if (els.timetableDetail) {
    els.timetableDetail.addEventListener("click", handleTimetableDetailClick);
  }

  if (els.reloadTimetableBtn) {
    els.reloadTimetableBtn.addEventListener("click", async () => {
      await loadTimetable(state.contextVersion, { forceRefresh: true });
      renderAll();
      showCopyToast("선택 날짜 시간표를 새로고침했어요.");
    });
  }

  if (els.copyTodayBtn) {
    els.copyTodayBtn.addEventListener("click", async () => {
      await copyText(buildTodayCopyText(), "오늘 내용을 복사했어요. 메신저에 바로 붙여넣을 수 있어요.");
    });
  }

  if (els.copySelectedBtn) {
    els.copySelectedBtn.addEventListener("click", async () => {
      await copyText(buildSelectedDateCopyText(), "선택 날짜 내용을 복사했어요. 메신저에 바로 붙여넣을 수 있어요.");
    });
  }

  if (els.shareSchoolBtn) {
    els.shareSchoolBtn.addEventListener("click", () => requestShare("month"));
  }

  if (els.shareSelectedBtn) {
    els.shareSelectedBtn.addEventListener("click", () => requestShare("date"));
  }

  els.helpBtn?.addEventListener("click", () => openAppModal(els.helpModal));
  document.querySelectorAll("[data-modal-close]").forEach((button) => {
    button.addEventListener("click", () => closeAppModal(document.querySelector(`#${button.dataset.modalClose}`)));
  });
  els.shareNoticeCancelBtn?.addEventListener("click", () => {
    pendingShareMode = null;
    closeAppModal(els.shareNoticeModal);
  });
  els.shareNoticeConfirmBtn?.addEventListener("click", async () => {
    const mode = pendingShareMode || "month";
    pendingShareMode = null;
    localStorage.setItem(SHARE_NOTICE_KEY, "true");
    closeAppModal(els.shareNoticeModal);
    await shareCalendarLink(mode);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const openModal = document.querySelector(".app-modal:not([hidden])");
    if (openModal) closeAppModal(openModal);
  });
}

function getActiveProfile() {
  return ProfileStore.getActiveProfile(state.profileState);
}

function getCurrentClassSettings() {
  if (state.sharedView) {
    return {
      grade: state.sharedView.grade || "1",
      className: state.sharedView.className || "1"
    };
  }

  const profile = getActiveProfile();
  return {
    grade: profile?.grade || "1",
    className: profile?.className || "1"
  };
}

function applyProfileToRuntime(profile) {
  if (!profile) return;
  state.contextVersion += 1;
  state.sharedView = null;
  state.sharedHomepageUrl = "";
  state.selectedSchool = normalizeSchool({
    ...profile.school,
    homepageUrl: profile.school?.homepageUrl || profile.links?.homepageUrl || ""
  });
  els.gradeInput.value = profile.grade || "1";
  els.classInput.value = profile.className || "1";
  clearRuntimeData(false);
}

function activateSharedView(sharedState) {
  state.contextVersion += 1;
  state.sharedView = {
    grade: sharedState.grade || "1",
    className: sharedState.className || "1"
  };
  state.selectedSchool = normalizeSchool(sharedState.school);
  state.sharedHomepageUrl = state.selectedSchool.homepageUrl || "";
  els.gradeInput.value = state.sharedView.grade;
  els.classInput.value = state.sharedView.className;
  clearRuntimeData(false);
}

function exitSharedView() {
  clearShareQuery();
  state.sharedView = null;
  state.sharedHomepageUrl = "";
  const profile = getActiveProfile();
  if (profile) {
    applyProfileToRuntime(profile);
    setSelectedDateToToday();
    loadMonthData().then(() => renderAll());
  } else {
    clearRuntimeData();
    openProfileEditor("add");
    renderAll();
  }
}

function clearRuntimeData(clearSchool = true) {
  state.contextVersion += 1;
  if (clearSchool) state.selectedSchool = null;
  state.schedules = [];
  state.meals = [];
  state.mealsByDate = {};
  state.scheduleStatus = "idle";
  state.scheduleMessage = "";
  state.mealStatus = "idle";
  state.mealMessage = "";
  state.meal = null;
  state.todaySchedules = [];
  state.todayMeal = null;
  state.tomorrowSchedules = [];
  state.tomorrowMeal = null;
  state.tomorrowStatus = "idle";
  state.tomorrowMessage = "";
  state.timetable = [];
  state.timetableStatus = "idle";
  state.timetableMessage = "";
  state.timetableNotice = "";
  state.timetableDayLabel = "";
  state.schools = [];
  state.classSwitcherOpen = false;
  if (clearSchool) state.sharedHomepageUrl = "";
  window.clearTimeout(state.timetableAutoTimer);
}

async function selectProfile(profileId) {
  const profile = state.profileState.profiles.find((item) => item.id === profileId);
  if (!profile) return;

  const viewState = captureViewState();
  state.profileState = ProfileStore.setActiveProfile(profileId);
  clearShareQuery();
  closeProfileEditor(false, false);
  applyProfileToRuntime(profile);
  restoreViewState(viewState);
  renderAll();
  await Promise.allSettled([loadMonthData(), enrichProfileSchoolInfo(profile.id)]);
  renderAll();
  scrollToActiveView(true);
}

function openProfileEditor(mode, profileId = null, shouldScroll = true) {
  if (mode === "add" && state.profileState.profiles.length >= ProfileStore.MAX_PROFILES) {
    showCopyToast(`자녀는 최대 ${ProfileStore.MAX_PROFILES}명까지 등록할 수 있어요.`, true);
    return;
  }

  const profile = mode === "edit"
    ? state.profileState.profiles.find((item) => item.id === profileId)
    : null;
  if (mode === "edit" && !profile) return;

  state.profileEditorReturnState = captureViewState();
  state.activeTab = "settings";
  state.profileEditorMode = mode;
  state.editingProfileId = profile?.id || null;
  state.draftSchool = profile
    ? normalizeSchool({ ...profile.school, homepageUrl: profile.school?.homepageUrl || profile.links?.homepageUrl || "" })
    : null;
  els.nicknameInput.value = profile?.nickname || ProfileStore.suggestNickname(state.profileState);
  els.gradeInput.value = profile?.grade || "1";
  els.classInput.value = profile?.className || "1";
  els.officeCode.value = profile?.school?.officeCode || "";
  els.schoolKeyword.value = "";
  els.schoolResults.innerHTML = "";
  renderProfileEditor();
  if (shouldScroll) {
    requestAnimationFrame(() => {
      const target = document.querySelector("#search");
      if (!target) return;
      const headerHeight = document.querySelector(".app-header")?.offsetHeight || 64;
      const targetTop = target.getBoundingClientRect().top + window.scrollY - headerHeight - 14;
      window.scrollTo({ top: Math.max(targetTop, 0), behavior: "smooth" });
    });
  }
}

function closeProfileEditor(render = true, restoreView = true) {
  if (!state.profileState.profiles.length && !state.sharedView) {
    state.profileEditorMode = "add";
    renderProfileEditor();
    return;
  }
  const returnState = state.profileEditorReturnState;
  state.profileEditorMode = "closed";
  state.editingProfileId = null;
  state.profileEditorReturnState = null;
  state.draftSchool = null;
  els.schoolResults.innerHTML = "";
  if (restoreView) restoreViewState(returnState);
  if (render) renderAll();
}

function renderProfileEditor() {
  const isOpen = state.profileEditorMode !== "closed";
  els.schoolSearchSection.hidden = !isOpen;
  if (els.resetBtn) els.resetBtn.hidden = !state.profileState.profiles.length;
  if (!isOpen) return;

  const isEdit = state.profileEditorMode === "edit";
  const isFirst = !state.profileState.profiles.length;
  els.searchTitle.textContent = isEdit ? "자녀 정보 수정" : isFirst ? "첫 자녀 등록" : "자녀 추가";
  els.saveProfileBtn.textContent = isEdit ? "수정 완료" : "등록 완료";
  els.deleteProfileBtn.hidden = !isEdit;
  els.cancelProfileEditBtn.hidden = isFirst && !state.sharedView;
  els.cancelProfileEditBtnBottom.hidden = isFirst && !state.sharedView;
  renderDraftSchoolPreview();
}

function renderDraftSchoolPreview() {
  if (!state.draftSchool) {
    els.draftSchoolPreview.hidden = true;
    els.draftSchoolPreview.innerHTML = "";
    return;
  }

  els.draftSchoolPreview.hidden = false;
  els.draftSchoolPreview.innerHTML = `
    <span class="setting-label">선택한 학교</span>
    <strong>${escapeHtml(state.draftSchool.schoolName)}</strong>
    <p>${escapeHtml(state.draftSchool.region || "")} · ${escapeHtml(state.draftSchool.schoolType || "학교")}</p>
    <p>대표전화·주소·홈페이지는 등록 후 나이스에서 자동으로 연결됩니다.</p>
  `;
}

async function saveProfileFromEditor() {
  const nickname = els.nicknameInput.value.trim() || ProfileStore.suggestNickname(state.profileState);
  const grade = normalizeNumberParam(els.gradeInput.value, 1, 6);
  const className = normalizeNumberParam(els.classInput.value, 1, 30);

  if (!state.draftSchool) {
    showCopyToast("학교를 검색한 뒤 ‘이 학교 선택’을 눌러 주세요.", true);
    return;
  }
  if (!grade || !className) {
    showCopyToast("학년과 반을 올바르게 입력해 주세요.", true);
    return;
  }

  try {
    const wasEditing = state.profileEditorMode === "edit";
    const wasFirstRegistration = !wasEditing && state.profileState.profiles.length === 0;
    const returnState = state.profileEditorReturnState || captureViewState();
    const existingProfile = wasEditing
      ? state.profileState.profiles.find((item) => item.id === state.editingProfileId)
      : null;
    const schoolChanged = Boolean(existingProfile && existingProfile.school.schoolCode !== state.draftSchool.schoolCode);
    const payload = {
      nickname,
      school: state.draftSchool,
      grade,
      className,
      links: {
        homepageUrl: state.draftSchool.homepageUrl || (!schoolChanged ? existingProfile?.links?.homepageUrl || "" : ""),
        noticeUrl: schoolChanged ? "" : existingProfile?.links?.noticeUrl || ""
      }
    };
    state.profileState = wasEditing
      ? ProfileStore.updateProfile(state.editingProfileId, payload)
      : ProfileStore.addProfile(payload);

    const profile = getActiveProfile();
    clearShareQuery();
    state.profileEditorMode = "closed";
    state.editingProfileId = null;
    state.profileEditorReturnState = null;
    state.draftSchool = null;
    applyProfileToRuntime(profile);
    if (wasFirstRegistration) {
      setSelectedDateToToday();
      state.activeTab = "calendar";
    } else if (wasEditing) {
      restoreViewState(returnState);
    } else {
      restoreViewState(returnState, { activeTab: "calendar" });
    }
    renderAll();
    await Promise.allSettled([loadMonthData(), enrichProfileSchoolInfo(profile.id)]);
    renderAll();
    showCopyToast(wasEditing ? "자녀 정보를 수정했어요." : "자녀를 등록했어요.");
    scrollToActiveView(true);
  } catch (error) {
    showCopyToast(error.message || "자녀 정보를 저장하지 못했어요.", true);
  }
}

async function deleteEditingProfile() {
  const profile = state.profileState.profiles.find((item) => item.id === state.editingProfileId);
  if (!profile) return;
  const confirmed = window.confirm(`‘${profile.nickname}’ 정보를 삭제할까요?\n이 기기에 저장된 설정만 삭제됩니다.`);
  if (!confirmed) return;

  state.profileState = ProfileStore.deleteProfile(profile.id);
  state.profileEditorMode = "closed";
  state.editingProfileId = null;
  state.draftSchool = null;
  const nextProfile = getActiveProfile();
  if (nextProfile) {
    applyProfileToRuntime(nextProfile);
    setSelectedDateToToday();
    await Promise.allSettled([loadMonthData(), enrichProfileSchoolInfo(nextProfile.id)]);
  } else {
    clearRuntimeData();
    openProfileEditor("add");
  }
  renderAll();
  showCopyToast(`‘${profile.nickname}’ 정보를 삭제했어요.`);
}

async function handleSchoolSearch(fallbackKeyword = "") {
  const keyword = els.schoolKeyword.value.trim() || fallbackKeyword;
  if (!keyword) {
    els.schoolResults.innerHTML = `<div class="empty result-empty">학교명을 입력하거나 아래 빠른 선택 버튼을 눌러주세요.</div>`;
    return;
  }
  els.schoolResults.innerHTML = `<div class="loading">${renderLoadingText("학교를 검색하고 있어요")}</div>`;
  try {
    const schools = await fetchSchools(keyword, els.officeCode.value);
    state.schools = schools;
    renderSchoolResults(schools);
  } catch (error) {
    state.schools = [];
    renderSchoolResults([], "학교 검색 결과를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
  }
}

const cacheMeta = { schedules: false, meals: false, meal: false, timetable: false };

function getNeisContext(school = state.selectedSchool, settings = getCurrentClassSettings()) {
  return {
    schoolCode: school?.schoolCode || "",
    officeCode: school?.officeCode || "",
    schoolName: school?.schoolName || "",
    grade: settings?.grade || "1",
    className: settings?.className || "1"
  };
}

async function fetchSchools(keyword, officeCode) {
  const params = new URLSearchParams({ keyword, officeCode });
  const response = await fetch(`${API_CONFIG.baseUrl}/api/schools?${params.toString()}`);
  if (!response.ok) throw new Error("학교 검색 실패");
  const data = await response.json();
  return data.schools || [];
}

async function fetchSchedules(
  school = state.selectedSchool,
  currentDate = state.currentDate,
  { forceRefresh = false } = {}
) {
  if (!school) return [];
  const context = getNeisContext(school);
  const monthKey = `${currentDate.getFullYear()}-${pad(currentDate.getMonth() + 1)}`;
  const cacheKey = NeisCache.keys.schedule(context.schoolCode, monthKey);
  const result = await NeisCache.getOrFetch(cacheKey, async () => {
    const params = new URLSearchParams({
      officeCode: context.officeCode,
      schoolCode: context.schoolCode,
      year: String(currentDate.getFullYear()),
      month: String(currentDate.getMonth() + 1)
    });
    const response = await fetch(`${API_CONFIG.baseUrl}/api/schedules?${params.toString()}`);
    if (!response.ok) throw new Error("학사일정 조회 실패");
    const data = await response.json();
    return (data.schedules || []).map(normalizeSchedule);
  }, { forceRefresh });
  cacheMeta.schedules = result.stale;
  return Array.isArray(result.data) ? result.data : [];
}

async function fetchMeals(
  school = state.selectedSchool,
  currentDate = state.currentDate,
  { forceRefresh = false } = {}
) {
  if (!school) return [];
  const context = getNeisContext(school);
  const monthKey = `${currentDate.getFullYear()}-${pad(currentDate.getMonth() + 1)}`;
  const cacheKey = NeisCache.keys.mealMonth(context.schoolCode, monthKey);
  const result = await NeisCache.getOrFetch(cacheKey, async () => {
    const params = new URLSearchParams({
      officeCode: context.officeCode,
      schoolCode: context.schoolCode,
      year: String(currentDate.getFullYear()),
      month: String(currentDate.getMonth() + 1)
    });
    const response = await fetch(`${API_CONFIG.baseUrl}/api/meals?${params.toString()}`);
    if (!response.ok) throw new Error("급식 조회 실패");
    const data = await response.json();
    if (Array.isArray(data.meals)) return data.meals.map(normalizeMeal);
    return data.meal ? [normalizeMeal(data.meal)] : [];
  }, { forceRefresh });

  const meals = Array.isArray(result.data) ? result.data : [];
  if (!result.stale) NeisCache.seedMealMonth(context.schoolCode, monthKey, meals);
  cacheMeta.meals = result.stale;
  return meals;
}

async function fetchMeal(
  school = state.selectedSchool,
  dateKey = state.selectedDate,
  { forceRefresh = false } = {}
) {
  if (!school || !dateKey) return null;
  const context = getNeisContext(school);
  const cacheKey = NeisCache.keys.meal(context.schoolCode, dateKey);
  const result = await NeisCache.getOrFetch(cacheKey, async () => {
    const params = new URLSearchParams({
      officeCode: context.officeCode,
      schoolCode: context.schoolCode,
      date: compactDate(dateKey)
    });
    const response = await fetch(`${API_CONFIG.baseUrl}/api/meals?${params.toString()}`);
    if (!response.ok) throw new Error("급식 조회 실패");
    const data = await response.json();
    return data.meal ? normalizeMeal(data.meal) : null;
  }, { forceRefresh });
  cacheMeta.meal = result.stale;
  return result.data ?? null;
}

async function fetchTimetable(
  school = state.selectedSchool,
  dateKey = state.selectedDate,
  settings = getCurrentClassSettings(),
  { forceRefresh = false } = {}
) {
  if (!school || !dateKey) return [];
  const apiName = getTimetableApiName(school);
  if (!apiName) throw new Error("지원하지 않는 학교급");

  const context = getNeisContext(school, settings);
  const cacheKey = NeisCache.keys.timetable(
    context.schoolCode,
    context.grade,
    context.className,
    "auto",
    dateKey
  );

  const result = await NeisCache.getOrFetch(cacheKey, async () => {
    const requests = getSemesterCandidates(dateKey).map(async (semester) => {
      const params = new URLSearchParams({
        officeCode: context.officeCode,
        schoolCode: context.schoolCode,
        schoolType: school.schoolType || school.schoolName || "",
        year: String(getAcademicYear(dateKey)),
        semester,
        grade: context.grade,
        className: context.className,
        classNm: context.className,
        date: compactDate(dateKey)
      });
      const response = await fetch(`${API_CONFIG.baseUrl}/api/timetable?${params.toString()}`);
      if (!response.ok) throw new Error("시간표 조회 실패");
      const data = await response.json();
      const rawItems = (data.timetable || [])
        .map(normalizeTimetable)
        .sort((a, b) => Number(a.period) - Number(b.period));
      return {
        rawItems,
        items: rawItems.filter((item) => !isNonInstructionTimetableItem(item))
      };
    });

    const settled = await Promise.allSettled(requests);
    const successful = settled
      .filter((entry) => entry.status === "fulfilled")
      .map((entry) => entry.value);
    if (!successful.length) throw new Error("시간표 조회 실패");

    const selected = successful.find((entry) => entry.items.length)
      || successful.find((entry) => entry.rawItems.length)
      || successful[0];
    return {
      items: selected.items,
      dayLabel: getNonInstructionTimetableLabel(selected.rawItems)
    };
  }, { forceRefresh });

  cacheMeta.timetable = result.stale;
  return normalizeTimetableCacheEntry(result.data);
}

function getTimetableApiName(school) {
  const schoolType = `${school?.schoolType || ""} ${school?.schoolName || ""}`;
  if (/초등/.test(schoolType)) return "elsTimetable";
  if (/중학|중학교/.test(schoolType)) return "misTimetable";
  if (/고등|고등학교/.test(schoolType)) return "hisTimetable";
  return "";
}

async function loadMonthData() {
  if (!state.selectedSchool) return;

  const loadingToken = startDataLoading();
  const contextVersion = state.contextVersion;
  const school = { ...state.selectedSchool };
  const currentDate = new Date(state.currentDate);
  const monthPrefix = `${currentDate.getFullYear()}-${pad(currentDate.getMonth() + 1)}`;

  state.schedules = [];
  state.meals = [];
  state.mealsByDate = {};
  state.meal = null;
  state.scheduleStatus = "loading";
  state.scheduleMessage = "학사일정을 불러오는 중입니다.";
  state.mealStatus = "loading";
  state.mealMessage = "급식정보를 불러오는 중입니다.";
  state.tomorrowStatus = "loading";
  state.tomorrowMessage = "내일 정보를 불러오는 중입니다.";
  renderCalendar();
  renderScheduleDetail();
  renderMealDetail();
  renderTodaySummary();
  renderTomorrowPreview();

  const scheduleTask = (async () => {
    try {
      const schedules = await fetchSchedules(school, currentDate);
      if (!isCurrentContext(contextVersion, school, monthPrefix)) return;
      state.schedules = schedules;
      state.scheduleStatus = cacheMeta.schedules ? "stale" : "success";
      state.scheduleMessage = cacheMeta.schedules
        ? "최신 조회에 실패해 이전에 저장된 학사일정을 보여드려요."
        : state.schedules.length ? "" : "이 달에 등록된 학사일정이 없어요.";
    } catch (error) {
      if (!isCurrentContext(contextVersion, school, monthPrefix)) return;
      state.schedules = [];
      state.scheduleStatus = "error";
      state.scheduleMessage = "학사일정 정보를 불러오지 못했어요. 잠시 후 다시 확인해 주세요.";
    } finally {
      if (isCurrentContext(contextVersion, school, monthPrefix)) {
        updateTodaySnapshot();
        renderCalendar();
        renderScheduleDetail();
        renderTodaySummary();
      }
    }
  })();

  const mealTask = (async () => {
    try {
      const meals = await fetchMeals(school, currentDate);
      if (!isCurrentContext(contextVersion, school, monthPrefix)) return;
      state.meals = meals;
      state.mealsByDate = Object.fromEntries(state.meals.map((meal) => [meal.date, meal]));
      state.mealStatus = cacheMeta.meals ? "stale" : "success";
      state.mealMessage = cacheMeta.meals
        ? "최신 조회에 실패해 이전에 저장된 급식정보를 보여드려요."
        : state.meals.length ? "" : "이 달에 등록된 급식 정보가 없어요.";
    } catch (error) {
      if (!isCurrentContext(contextVersion, school, monthPrefix)) return;
      state.meals = [];
      state.mealsByDate = {};
      state.mealStatus = "error";
      state.mealMessage = "급식 정보를 불러오지 못했어요. 잠시 후 다시 확인해 주세요.";
    } finally {
      if (isCurrentContext(contextVersion, school, monthPrefix)) {
        state.meal = state.mealsByDate[state.selectedDate] || null;
        updateTodaySnapshot();
        renderCalendar();
        renderMealDetail();
        renderTodaySummary();
      }
    }
  })();

  await Promise.allSettled([scheduleTask, mealTask]);
  if (!isCurrentContext(contextVersion, school, monthPrefix)) {
    finishDataLoading(loadingToken);
    return;
  }

  state.meal = state.mealsByDate[state.selectedDate] || null;
  state.classSwitcherOpen = false;
  restoreTimetableFromCache();
  updateTodaySnapshot();
  updateDataLoading(loadingToken, "거의 다 불러왔어요", "오늘 시간표를 확인하고 있어요.");

  // 내일 정보는 첫 화면 표시를 막지 않고 뒤에서 갱신합니다.
  void loadTomorrowPreview(contextVersion, school).finally(() => {
    if (isCurrentContext(contextVersion, school)) renderTomorrowPreview();
  });

  await loadTimetable(contextVersion);
  if (isCurrentContext(contextVersion, school, monthPrefix)) {
    renderTimetableDetail();
    renderTodaySummary();
  }
  finishDataLoading(loadingToken);
}
function isCurrentContext(contextVersion, school, monthPrefix = "") {
  if (contextVersion !== state.contextVersion) return false;
  if (!state.selectedSchool || state.selectedSchool.schoolCode !== school.schoolCode) return false;
  if (monthPrefix) {
    const currentMonthPrefix = `${state.currentDate.getFullYear()}-${pad(state.currentDate.getMonth() + 1)}`;
    if (monthPrefix !== currentMonthPrefix) return false;
  }
  return true;
}

async function loadDayData(existingContextVersion = state.contextVersion) {
  state.meal = state.mealsByDate[state.selectedDate] || null;
  state.classSwitcherOpen = false;
  restoreTimetableFromCache();
  if (state.selectedSchool) await loadTimetable(existingContextVersion);
}

async function loadMeal() {
  if (!state.selectedSchool) return;
  const contextVersion = state.contextVersion;
  const school = { ...state.selectedSchool };
  const dateKey = state.selectedDate;
  try {
    const meal = await fetchMeal(school, dateKey);
    if (contextVersion === state.contextVersion && dateKey === state.selectedDate) state.meal = meal;
  } catch (error) {
    if (contextVersion === state.contextVersion && dateKey === state.selectedDate) {
      state.meal = null;
      state.mealStatus = "error";
      state.mealMessage = "급식 정보를 불러오지 못했어요. 잠시 후 다시 확인해 주세요.";
    }
  }
}

async function loadTimetable(existingContextVersion = state.contextVersion, { forceRefresh = false } = {}) {
  if (!state.selectedSchool) {
    state.timetableStatus = "idle";
    state.timetableMessage = "자녀를 먼저 등록해 주세요.";
    state.timetable = [];
    return;
  }

  const school = { ...state.selectedSchool };
  const dateKey = state.selectedDate;
  const settings = { ...getCurrentClassSettings() };
  const contextVersion = existingContextVersion;
  const apiName = getTimetableApiName(school);
  if (!apiName) {
    state.timetableStatus = "unsupported";
    state.timetableMessage = "현재 이 학교급의 시간표 조회는 아직 지원하지 않습니다.";
    state.timetable = [];
    return;
  }

  state.timetableStatus = "loading";
  state.timetableMessage = "시간표를 불러오는 중입니다.";
  state.timetableNotice = "";
  renderTimetableDetail();

  try {
    const timetableResult = await fetchTimetable(school, dateKey, settings, { forceRefresh });
    if (!isCurrentTimetableContext(contextVersion, school, dateKey, settings)) return;

    state.timetable = timetableResult.items;
    state.timetableDayLabel = timetableResult.dayLabel;
    state.timetableStatus = "success";
    state.timetableMessage = state.timetable.length
      ? ""
      : getTimetableEmptyMessage(dateKey, state.timetableDayLabel);

    state.timetableNotice = cacheMeta.timetable
      ? "최신 조회에 실패해 이전에 저장된 시간표를 보여드려요."
      : "";
    if (dateKey === formatDateKey(new Date())) updateTodaySnapshot();
    renderSelectedSchool();
    renderCalendar();
    renderTodaySummary();
  } catch (error) {
    if (!isCurrentTimetableContext(contextVersion, school, dateKey, settings)) return;
    state.timetable = [];
    state.timetableDayLabel = "";
    state.timetableStatus = "error";
    state.timetableMessage = "시간표 정보를 불러오지 못했어요. 잠시 후 다시 확인해 주세요.";
  }
}

function isCurrentTimetableContext(contextVersion, school, dateKey, settings) {
  if (contextVersion !== state.contextVersion) return false;
  if (!state.selectedSchool || state.selectedSchool.schoolCode !== school.schoolCode) return false;
  if (state.selectedDate !== dateKey) return false;
  const current = getCurrentClassSettings();
  return current.grade === settings.grade
    && current.className === settings.className;
}

function renderAll() {
  renderProfiles();
  renderProfileEditor();
  renderSharedViewBanner();
  renderSelectedSchool();
  renderMonthTitle();
  renderCalendar();
  renderTodaySummary();
  renderTomorrowPreview();
  renderSchoolInfo();
  renderDetails();
  renderView();
}

function renderProfiles() {
  const profiles = state.profileState.profiles;
  const activeId = state.sharedView ? null : state.profileState.activeProfileId;

  if (!profiles.length) {
    els.childProfileList.innerHTML = `<div class="profile-empty">등록된 자녀가 없어요. 첫 자녀를 등록해 주세요.</div>`;
  } else {
    els.childProfileList.innerHTML = profiles.map((profile) => {
      const isActive = profile.id === activeId;
      return `
        <button type="button" class="child-profile-chip ${isActive ? "active" : ""}"
          data-profile-id="${escapeHtml(profile.id)}" aria-pressed="${String(isActive)}">
          <strong>${escapeHtml(profile.nickname)}</strong>
          <span>${escapeHtml(getCompactSchoolName(profile.school.schoolName))} · ${escapeHtml(profile.grade)}-${escapeHtml(profile.className)}</span>
        </button>
      `;
    }).join("");
  }

  const atLimit = profiles.length >= ProfileStore.MAX_PROFILES;
  els.addProfileBtn.disabled = atLimit;
  els.addProfileBtn.textContent = atLimit ? "최대 5명 등록" : "＋ 자녀 추가";
  els.profileLimitHint.textContent = atLimit
    ? "자녀 5명이 모두 등록되어 있어요. 기존 자녀를 삭제한 뒤 추가할 수 있어요."
    : `자녀는 최대 ${ProfileStore.MAX_PROFILES}명까지 이 기기에만 저장할 수 있어요.`;
}

function renderSharedViewBanner() {
  els.sharedViewBanner.hidden = !state.sharedView;
}

function renderSelectedSchool() {
  const hasSchool = Boolean(state.selectedSchool);
  const profile = getActiveProfile();
  const settings = getCurrentClassSettings();
  document.body.classList.toggle("has-selected-school", hasSchool);

  if (!hasSchool) {
    els.topSchoolName.textContent = "우리아이 오늘";
    els.selectedKicker.textContent = "현재 선택한 자녀";
    els.selectedSchoolName.textContent = "첫 자녀를 등록해 주세요.";
    els.selectedSchoolMeta.textContent = "학교와 학년·반을 등록하면 아이의 학교생활을 한곳에서 확인할 수 있어요.";
    els.editProfileBtn.hidden = true;
    els.reloadTimetableBtn.hidden = true;
    els.shareSchoolBtn.hidden = true;
    return;
  }

  if (state.sharedView) {
    els.topSchoolName.textContent = `공유 · ${getCompactSchoolName(state.selectedSchool.schoolName)}`;
    els.selectedKicker.textContent = "공유받은 학교";
    els.selectedSchoolName.textContent = state.selectedSchool.schoolName;
    els.selectedSchoolMeta.textContent = `${settings.grade}학년 ${settings.className}반 · 임시 보기`;
    els.editProfileBtn.hidden = true;
  } else {
    els.topSchoolName.textContent = `${profile?.nickname || "우리 아이"} · ${getCompactSchoolName(state.selectedSchool.schoolName)}`;
    els.selectedKicker.textContent = "현재 선택한 자녀";
    els.selectedSchoolName.textContent = profile?.nickname || "우리 아이";
    els.selectedSchoolMeta.textContent = `${state.selectedSchool.schoolName} · ${settings.grade}학년 ${settings.className}반`;
    els.editProfileBtn.hidden = !profile;
  }

  els.reloadTimetableBtn.hidden = false;
  els.reloadTimetableBtn.disabled = state.timetableStatus === "loading";
  els.reloadTimetableBtn.textContent = state.timetableStatus === "loading" ? "시간표 불러오는 중" : "시간표 새로고침";
  els.shareSchoolBtn.hidden = false;
}

function getCurrentSchoolInfo() {
  const profile = state.sharedView ? null : getActiveProfile();
  const school = state.selectedSchool || {};
  return {
    schoolName: school.schoolName || profile?.school?.schoolName || "",
    region: school.region || profile?.school?.region || "",
    schoolType: school.schoolType || profile?.school?.schoolType || "학교",
    address: school.address || profile?.school?.address || "",
    phoneNumber: school.phoneNumber || profile?.school?.phoneNumber || "",
    homepageUrl: state.sharedView
      ? state.sharedHomepageUrl || school.homepageUrl || ""
      : profile?.school?.homepageUrl || profile?.links?.homepageUrl || school.homepageUrl || ""
  };
}

function renderSchoolInfo() {
  if (!els.schoolInfoCard) return;
  const hasSchool = Boolean(state.selectedSchool);
  els.schoolInfoCard.hidden = !hasSchool || state.activeTab !== "today";
  if (!hasSchool) return;

  const info = getCurrentSchoolInfo();
  els.schoolInfoTitle.textContent = info.schoolName || "선택한 학교";
  const compactBits = [info.phoneNumber, info.region, info.schoolType].filter(Boolean);
  els.schoolInfoCompact.textContent = compactBits.join(" · ") || "학교 기본정보를 확인하고 있어요.";

  els.schoolInfoToggleBtn.setAttribute("aria-expanded", String(state.schoolInfoExpanded));
  const toggleLabel = state.schoolInfoExpanded ? "학교정보 접기" : "학교정보 펼치기";
  els.schoolInfoToggleBtn.setAttribute("aria-label", toggleLabel);
  els.schoolInfoToggleBtn.setAttribute("title", toggleLabel);
  els.schoolInfoToggleBtn.classList.toggle("expanded", state.schoolInfoExpanded);
  els.schoolInfoDetails.hidden = !state.schoolInfoExpanded;

  els.schoolPhoneText.textContent = info.phoneNumber || "대표전화 정보를 불러오지 못했어요.";
  els.schoolPhoneRow.classList.toggle("missing", !info.phoneNumber);
  els.callSchoolBtn.hidden = !info.phoneNumber;
  els.copyPhoneBtn.hidden = !info.phoneNumber;
  els.callSchoolBtn.href = info.phoneNumber ? `tel:${normalizePhoneForTel(info.phoneNumber)}` : "#";

  els.schoolAddressText.textContent = info.address || "주소 정보를 불러오지 못했어요.";
  els.schoolAddressRow.classList.toggle("missing", !info.address);
  els.copyAddressBtn.hidden = !info.address;

  els.schoolHomepageBtn.hidden = !info.homepageUrl;
  els.schoolInfoNote.textContent = info.homepageUrl || info.phoneNumber || info.address
    ? "나이스 학교기본정보 기준"
    : "학교정보를 찾지 못했어요.";
}

function toggleSchoolInfo() {
  state.schoolInfoExpanded = !state.schoolInfoExpanded;
  localStorage.setItem("myChildToday.schoolInfoExpanded", String(state.schoolInfoExpanded));
  renderSchoolInfo();
}

function normalizePhoneForTel(value = "") {
  return String(value).replace(/[^\d+]/g, "");
}

async function refreshCurrentSchoolInfo() {
  if (!state.selectedSchool) return;
  const profile = getActiveProfile();
  if (profile && !state.sharedView) state.schoolInfoLookupAttempts.delete(profile.id);
  els.refreshSchoolInfoBtn.disabled = true;
  if (els.refreshSchoolInfoText) els.refreshSchoolInfoText.textContent = "확인 중…";
  try {
    const updated = state.sharedView
      ? await enrichSharedSchoolInfo(true)
      : profile ? await enrichProfileSchoolInfo(profile.id, true) : false;
    renderAll();
    showCopyToast(updated ? "학교정보를 다시 확인했어요." : "학교정보를 찾지 못했어요. 잠시 후 다시 시도해 주세요.", !updated);
  } finally {
    els.refreshSchoolInfoBtn.disabled = false;
    if (els.refreshSchoolInfoText) els.refreshSchoolInfoText.textContent = "정보 다시 확인";
  }
}

function openExternalUrl(value, emptyMessage = "등록된 주소가 없어요.") {
  try {
    const url = ProfileStore.normalizeExternalUrl(value, { allowEmpty: false });
    window.open(url, "_blank", "noopener,noreferrer");
  } catch (error) {
    showCopyToast(value ? error.message : emptyMessage, true);
  }
}

async function enrichProfileSchoolInfo(profileId, force = false) {
  const profile = state.profileState.profiles.find((item) => item.id === profileId);
  if (!profile) return false;
  const hasCoreInfo = Boolean(profile.school?.phoneNumber && profile.school?.address && (profile.school?.homepageUrl || profile.links?.homepageUrl));
  if (!force && hasCoreInfo) return true;
  if (!force && state.schoolInfoLookupAttempts.has(profileId)) return false;
  state.schoolInfoLookupAttempts.add(profileId);

  try {
    const schools = await fetchSchools(profile.school.schoolName, profile.school.officeCode);
    const matched = schools.map(normalizeSchool).find((school) => school.schoolCode === profile.school.schoolCode);
    if (!matched) return false;

    state.profileState = ProfileStore.updateProfileSchoolInfo(profile.id, matched);
    if (!state.sharedView && state.profileState.activeProfileId === profile.id && state.selectedSchool) {
      state.selectedSchool = normalizeSchool({ ...state.selectedSchool, ...matched });
    }
    renderSchoolInfo();
    return true;
  } catch (error) {
    // 자동 보완 실패는 급식·시간표 이용을 막지 않습니다.
    return false;
  }
}

async function enrichSharedSchoolInfo(force = false) {
  if (!state.sharedView || !state.selectedSchool) return false;
  const hasCoreInfo = Boolean(state.selectedSchool.phoneNumber && state.selectedSchool.address && state.sharedHomepageUrl);
  if (!force && hasCoreInfo) return true;
  try {
    const schools = await fetchSchools(state.selectedSchool.schoolName, state.selectedSchool.officeCode);
    const matched = schools.map(normalizeSchool).find((school) => school.schoolCode === state.selectedSchool.schoolCode);
    if (!state.sharedView || !matched) return false;
    state.sharedHomepageUrl = matched.homepageUrl || "";
    state.selectedSchool = normalizeSchool({ ...state.selectedSchool, ...matched });
    renderSchoolInfo();
    return true;
  } catch (error) {
    // 공유 화면에서도 나머지 정보는 그대로 제공합니다.
    return false;
  }
}

function getCompactSchoolName(schoolName = "") {
  return String(schoolName)
    .replace(/초등학교$/, "초")
    .replace(/중학교$/, "중")
    .replace(/고등학교$/, "고");
}

function renderMonthTitle() {
  els.monthTitle.textContent = `${state.currentDate.getFullYear()}년 ${state.currentDate.getMonth() + 1}월`;
}

function renderCalendar() {
  const year = state.currentDate.getFullYear();
  const month = state.currentDate.getMonth();
  const firstDate = new Date(year, month, 1);
  const start = new Date(year, month, 1 - firstDate.getDay());
  const todayKey = formatDateKey(new Date());
  const selectedKey = state.selectedDate;

  let html = `<div class="week-row">${WEEKDAYS.map((day) => `<div class="weekday">${day}</div>`).join("")}</div><div class="calendar-grid">`;
  for (let i = 0; i < 42; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const key = formatDateKey(date);
    const isCurrentMonth = date.getMonth() === month;
    const daySchedules = state.schedules.filter((item) => item.date === key);
    const dayMeal = state.mealsByDate[key];
    const holidaySchedule = getPublicHolidaySchedule(daySchedules);
    const classes = [
      "day-cell",
      !isCurrentMonth ? "muted" : "",
      date.getDay() === 0 ? "sunday" : "",
      date.getDay() === 6 ? "saturday" : "",
      isCurrentMonth && holidaySchedule ? "holiday" : "",
      key === todayKey ? "today" : "",
      key === selectedKey ? "selected" : ""
    ].filter(Boolean).join(" ");
    const holidayLabel = holidaySchedule ? `, 공휴일 ${holidaySchedule.title}` : "";

    html += `<button type="button" class="${classes}" data-date="${key}" aria-label="${key}${escapeHtml(holidayLabel)}">
      <span class="day-number">${date.getDate()}</span>
      <span class="day-markers">${isCurrentMonth ? renderDayMarkers(daySchedules, dayMeal, key) : ""}</span>
      <span class="mobile-day-info">${isCurrentMonth ? renderMobileDayInfo(daySchedules, dayMeal, key) : ""}</span>
    </button>`;
  }
  html += `</div>`;
  if (state.selectedSchool) {
    const messages = [
      state.scheduleMessage ? { text: state.scheduleMessage, status: state.scheduleStatus } : null,
      state.mealMessage ? { text: state.mealMessage, status: state.mealStatus } : null
    ].filter(Boolean);
    messages.forEach((message) => {
      html += `<div class="calendar-status ${message.status}">${escapeHtml(message.text)}</div>`;
    });
  }
  els.calendar.innerHTML = html;
}


function updateTodaySnapshot() {
  const todayKey = formatDateKey(new Date());
  const todayMonthPrefix = todayKey.slice(0, 7);
  const currentMonthPrefix = `${state.currentDate.getFullYear()}-${pad(state.currentDate.getMonth() + 1)}`;
  if (todayMonthPrefix !== currentMonthPrefix) return;

  state.todaySchedules = state.schedules.filter((item) => item.date === todayKey);
  state.todayMeal = state.mealsByDate[todayKey] || null;
}

async function loadTomorrowPreview(contextVersion = state.contextVersion, school = state.selectedSchool) {
  if (!school) return;
  const tomorrow = addDays(new Date(), 1);
  const tomorrowKey = formatDateKey(tomorrow);
  const currentMonthPrefix = `${state.currentDate.getFullYear()}-${pad(state.currentDate.getMonth() + 1)}`;
  const tomorrowMonthPrefix = tomorrowKey.slice(0, 7);

  try {
    if (tomorrowMonthPrefix === currentMonthPrefix) {
      state.tomorrowSchedules = state.schedules.filter((item) => item.date === tomorrowKey);
      state.tomorrowMeal = state.mealsByDate[tomorrowKey] || null;
    } else {
      const nextMonthDate = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), 1);
      const [schedules, meals] = await Promise.all([
        fetchSchedules(school, nextMonthDate),
        fetchMeals(school, nextMonthDate)
      ]);
      if (!isCurrentContext(contextVersion, school)) return;
      state.tomorrowSchedules = schedules.filter((item) => item.date === tomorrowKey);
      state.tomorrowMeal = meals.find((item) => item.date === tomorrowKey) || null;
    }
    state.tomorrowStatus = "success";
    state.tomorrowMessage = "";
  } catch (error) {
    if (!isCurrentContext(contextVersion, school)) return;
    state.tomorrowSchedules = [];
    state.tomorrowMeal = null;
    state.tomorrowStatus = "error";
    state.tomorrowMessage = "내일 정보를 불러오지 못했어요. 잠시 후 다시 확인해 주세요.";
  }
}

function renderTomorrowPreview() {
  if (!els.tomorrowPreviewCard) return;
  const tomorrow = addDays(new Date(), 1);
  const tomorrowKey = formatDateKey(tomorrow);
  els.tomorrowPreviewTitle.textContent = `내일 ${formatKoreanDate(tomorrowKey)}`;
  els.tomorrowDetailBtn.disabled = !state.selectedSchool;

  if (!state.selectedSchool) {
    els.tomorrowMealSummary.innerHTML = `<p class="empty">자녀를 등록하면 내일 급식이 표시됩니다.</p>`;
    els.tomorrowScheduleSummary.innerHTML = `<p class="empty">자녀를 등록하면 내일 학교일정이 표시됩니다.</p>`;
    return;
  }
  if (state.tomorrowStatus === "loading") {
    els.tomorrowMealSummary.innerHTML = `<p class="empty">${renderLoadingText("내일 급식을 확인하는 중입니다")}</p>`;
    els.tomorrowScheduleSummary.innerHTML = `<p class="empty">${renderLoadingText("내일 일정을 확인하는 중입니다")}</p>`;
    return;
  }

  const currentMonthPrefix = `${state.currentDate.getFullYear()}-${pad(state.currentDate.getMonth() + 1)}`;
  const usesCurrentMonthData = tomorrowKey.slice(0, 7) === currentMonthPrefix;
  const mealError = state.tomorrowStatus === "error" || (usesCurrentMonthData && state.mealStatus === "error");
  const scheduleError = state.tomorrowStatus === "error" || (usesCurrentMonthData && state.scheduleStatus === "error");

  if (mealError) {
    els.tomorrowMealSummary.innerHTML = `<p class="error-state">급식 정보를 불러오지 못했어요. 잠시 후 다시 확인해 주세요.</p>`;
  } else if (state.tomorrowMeal?.dishes?.length) {
    const dishes = state.tomorrowMeal.dishes.slice(0, 3).map(escapeHtml).join(" · ");
    const more = state.tomorrowMeal.dishes.length > 3 ? ` 외 ${state.tomorrowMeal.dishes.length - 3}종` : "";
    els.tomorrowMealSummary.innerHTML = `<p class="tomorrow-primary">${dishes}${more}</p>${state.tomorrowMeal.calorie ? `<span class="tomorrow-badge">${escapeHtml(state.tomorrowMeal.calorie)}</span>` : ""}`;
  } else {
    els.tomorrowMealSummary.innerHTML = `<p class="empty">등록된 급식 정보가 없어요.</p>`;
  }

  if (scheduleError) {
    els.tomorrowScheduleSummary.innerHTML = `<p class="error-state">학사일정 정보를 불러오지 못했어요. 잠시 후 다시 확인해 주세요.</p>`;
  } else if (state.tomorrowSchedules.length) {
    els.tomorrowScheduleSummary.innerHTML = `<ul>${state.tomorrowSchedules.slice(0, 3).map((item) => `<li>${escapeHtml(item.title)}</li>`).join("")}</ul>${state.tomorrowSchedules.length > 3 ? `<p class="today-more">외 ${state.tomorrowSchedules.length - 3}건</p>` : ""}`;
  } else {
    els.tomorrowScheduleSummary.innerHTML = `<p class="empty">등록된 학사일정이 없어요.</p>`;
  }
}

async function showTomorrowDetails() {
  if (!state.selectedSchool) return;
  const tomorrow = addDays(new Date(), 1);
  state.selectedDate = formatDateKey(tomorrow);
  const targetMonth = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), 1);
  const currentMonth = `${state.currentDate.getFullYear()}-${state.currentDate.getMonth()}`;
  const nextMonth = `${targetMonth.getFullYear()}-${targetMonth.getMonth()}`;
  if (currentMonth !== nextMonth) {
    state.currentDate = targetMonth;
    await loadMonthData();
  } else {
    await loadDayData();
  }
  state.activeTab = "calendar";
  renderAll();
  document.querySelector("#detailArea")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function buildSummaryTitle(label, emoji, badgeHtml = "") {
  return `<span class="title-emoji" aria-hidden="true">${emoji}</span><span>${label}</span>${badgeHtml}`;
}

function renderTodaySummary() {
  if (!els.todaySummaryCard) return;

  const todayKey = formatDateKey(new Date());
  els.todaySummaryDate.textContent = `오늘 ${formatKoreanDate(todayKey)}`;

  if (!state.selectedSchool) {
    els.todaySummaryTitle.textContent = "우리 아이 오늘";
    const todayMealTitle = document.querySelector("#todayMealTitle");
    if (todayMealTitle) todayMealTitle.innerHTML = buildSummaryTitle("급식", "🍱");
    const todayTimetableTitle = document.querySelector("#todayTimetableTitle");
    if (todayTimetableTitle) todayTimetableTitle.innerHTML = buildSummaryTitle("시간표", "🕘");
    els.todayScheduleSummary.innerHTML = `<p class="empty">자녀를 등록하면 오늘 학사일정이 표시됩니다.</p>`;
    els.todayMealSummary.innerHTML = `<p class="empty">자녀를 등록하면 오늘 급식정보가 표시됩니다.</p>`;
    els.todayTimetableSummary.innerHTML = `<p class="empty">자녀를 등록하면 학년·반 기준 오늘 시간표가 자동 적용됩니다.</p>`;
    return;
  }

  els.todaySummaryTitle.textContent = state.sharedView ? `${state.selectedSchool.schoolName} 오늘` : `${getActiveProfile()?.nickname || "우리 아이"} 오늘`;

  const todaySchedules = state.todaySchedules || [];
  if (state.scheduleStatus === "loading") {
    els.todayScheduleSummary.innerHTML = `<p class="empty">${renderLoadingText("학사일정을 불러오는 중입니다")}</p>`;
  } else if (state.scheduleStatus === "error") {
    els.todayScheduleSummary.innerHTML = `<p class="error-state">학사일정 정보를 불러오지 못했어요. 잠시 후 다시 확인해 주세요.</p>`;
  } else if (todaySchedules.length) {
    els.todayScheduleSummary.innerHTML = `<ul>${todaySchedules.slice(0, 4).map((item) => `<li>${escapeHtml(item.title)}</li>`).join("")}</ul>${todaySchedules.length > 4 ? `<p class="today-more">외 ${todaySchedules.length - 4}건</p>` : ""}`;
  } else {
    els.todayScheduleSummary.innerHTML = `<p class="empty">등록된 학사일정이 없어요.</p>`;
  }

  const todayMeal = state.todayMeal;
  const todayMealTitle = document.querySelector("#todayMealTitle");
  if (todayMealTitle) {
    const badge = todayMeal?.calorie
      ? ` <span class="title-badge meal-kcal">${escapeHtml(todayMeal.calorie)}</span>`
      : "";
    todayMealTitle.innerHTML = buildSummaryTitle("급식", "🍱", badge);
  }
  if (state.mealStatus === "loading") {
    els.todayMealSummary.innerHTML = `<p class="empty">${renderLoadingText("급식정보를 불러오는 중입니다")}</p>`;
  } else if (state.mealStatus === "error") {
    els.todayMealSummary.innerHTML = `<p class="error-state">급식 정보를 불러오지 못했어요. 잠시 후 다시 확인해 주세요.</p>`;
  } else if (todayMeal && todayMeal.dishes?.length) {
    els.todayMealSummary.innerHTML = `<ul>${todayMeal.dishes.map((dish) => `<li>${escapeHtml(dish)}</li>`).join("")}</ul>`;
  } else {
    els.todayMealSummary.innerHTML = `<p class="empty">등록된 급식 정보가 없어요.</p>`;
  }

  const settings = getCurrentClassSettings();
  const todayGrade = settings.grade;
  const todayClassName = settings.className;
  const todayTimetableTitle = document.querySelector("#todayTimetableTitle");
  if (todayTimetableTitle) {
    const badge = ` <span class="title-badge class-badge">${escapeHtml(todayGrade)}-${escapeHtml(todayClassName)}</span>`;
    todayTimetableTitle.innerHTML = buildSummaryTitle("시간표", "🕘", badge);
  }

  const todayTimetable = getTimetableCacheWithOptions(todayKey, todayGrade, todayClassName);
  if (todayTimetable.length) {
    els.todayTimetableSummary.innerHTML = `<ol class="today-timetable-list">${todayTimetable.slice(0, 7).map((item) => `<li><b>${escapeHtml(item.period)}교시</b> ${escapeHtml(item.subject || "-")}</li>`).join("")}</ol>${todayTimetable.length > 7 ? `<p class="today-more">외 ${todayTimetable.length - 7}교시</p>` : ""}`;
  } else if (state.selectedDate === todayKey && state.timetableStatus === "error") {
    els.todayTimetableSummary.innerHTML = `<p class="error-state">시간표 정보를 불러오지 못했어요. 잠시 후 다시 확인해 주세요.</p>`;
  } else if (state.selectedDate === todayKey && state.timetableMessage) {
    els.todayTimetableSummary.innerHTML = `<p class="empty">${escapeHtml(state.timetableMessage)}</p>`;
  } else {
    els.todayTimetableSummary.innerHTML = `<p class="empty">등록된 시간표가 없어요.</p>`;
  }
}

function renderDetails() {
  renderSelectedCopyStrip();
  renderScheduleDetail();
  renderMealDetail();
  renderTimetableDetail();
}

function renderSelectedCopyStrip() {
  if (!els.selectedCopyDate) return;
  els.selectedCopyDate.textContent = state.selectedDate ? formatKoreanDate(state.selectedDate) : "날짜를 선택해 주세요.";
}

function renderScheduleDetail() {
  if (!state.selectedSchool) {
    els.scheduleDetail.innerHTML = `<p class="empty">자녀를 먼저 등록해 주세요.</p>`;
    return;
  }
  if (state.scheduleStatus === "loading") {
    els.scheduleDetail.innerHTML = `<p class="empty">${renderLoadingText("학사일정을 불러오는 중입니다")}</p>`;
    return;
  }
  if (state.scheduleStatus === "error") {
    els.scheduleDetail.innerHTML = `<p class="error-state">학사일정 정보를 불러오지 못했어요. 잠시 후 다시 확인해 주세요.</p>`;
    return;
  }

  const items = state.schedules.filter((item) => item.date === state.selectedDate);
  const notice = state.scheduleMessage && state.scheduleStatus !== "success" ? `<p class="detail-notice">${escapeHtml(state.scheduleMessage)}</p>` : "";
  if (!items.length) {
    els.scheduleDetail.innerHTML = `${notice}<p class="empty">등록된 학사일정이 없어요.</p><p class="detail-empty-note">다른 날짜를 눌러 학사일정이 있는 날을 확인해 보세요.</p>`;
    return;
  }
  els.scheduleDetail.innerHTML = `${notice}<ul>${items.map((item) => `<li><b>${escapeHtml(item.title)}</b>${item.content ? ` <span class="empty">${escapeHtml(item.content)}</span>` : ""}</li>`).join("")}</ul>`;
}

function renderMealDetail() {
  if (!state.selectedSchool) {
    els.mealDetail.innerHTML = `<p class="empty">자녀를 먼저 등록해 주세요.</p>`;
    return;
  }
  if (state.mealStatus === "loading") {
    els.mealDetail.innerHTML = `<p class="empty">${renderLoadingText("급식정보를 불러오는 중입니다")}</p>`;
    return;
  }
  if (state.mealStatus === "error") {
    els.mealDetail.innerHTML = `<p class="error-state">급식 정보를 불러오지 못했어요. 잠시 후 다시 확인해 주세요.</p>`;
    return;
  }

  const notice = state.mealMessage && state.mealStatus !== "success" ? `<p class="detail-notice">${escapeHtml(state.mealMessage)}</p>` : "";
  if (!state.meal) {
    els.mealDetail.innerHTML = `${notice}<p class="empty">등록된 급식 정보가 없어요.</p><p class="detail-empty-note">방학·휴업일이거나 급식이 없는 날일 수 있어요.</p>`;
    return;
  }

  const dishes = state.meal.dishes || [];
  els.mealDetail.innerHTML = `
    ${notice}
    <div class="meal-summary">
      <span class="meal-name">${escapeHtml(state.meal.mealName || "급식")}</span>
      ${state.meal.calorie ? `<span class="meal-calorie">${escapeHtml(state.meal.calorie)}</span>` : ""}
    </div>
    ${dishes.length ? `<ul>${dishes.map((dish) => `<li>${escapeHtml(dish)}</li>`).join("")}</ul>` : `<p class="empty">표시할 메뉴가 없습니다.</p>`}
    ${state.meal.allergy ? `<details class="meal-allergy"><summary>알레르기 정보 보기</summary><p>${escapeHtml(state.meal.allergy)}</p></details>` : ""}
  `;
}

function renderTimetableDetail() {
  if (!state.selectedSchool) {
    els.timetableDetail.innerHTML = `<p class="empty">자녀를 먼저 등록해 주세요.</p>`;
    return;
  }

  const settings = getCurrentClassSettings();
  const grade = settings.grade;
  const className = settings.className;
  const apiName = getTimetableApiName(state.selectedSchool);
  const notice = state.timetableNotice
    ? `<p class="detail-notice">${escapeHtml(state.timetableNotice)}</p>`
    : "";

  let body = "";
  if (!apiName) {
    body = `<p class="empty">현재 이 학교급의 시간표 조회는 아직 지원하지 않습니다.</p>`;
  } else if (state.timetableStatus === "loading") {
    body = `<p class="empty">${renderLoadingText("시간표를 불러오는 중입니다")}</p>`;
  } else if (state.timetableStatus === "success" && state.timetable.length) {
    body = `<ol class="timetable-list">${state.timetable.map((item) => `<li><b>${escapeHtml(item.period)}교시</b> ${escapeHtml(item.subject || "-")}</li>`).join("")}</ol>`;
  } else if (state.timetableMessage) {
    body = `<p class="empty">${escapeHtml(state.timetableMessage)}</p>`;
  } else {
    body = `<p class="empty">날짜를 누르거나 반을 바꾸면 선택 날짜 기준 시간표가 자동 적용돼요.</p>`;
  }

  const switcher = state.classSwitcherOpen
    ? `<div class="quick-class-editor" aria-label="시간표 조회 기준 변경">
        <label>학년 <input id="quickGradeInput" type="number" min="1" max="6" value="${escapeHtml(grade)}" /></label>
        <label>반 <input id="quickClassInput" type="number" min="1" max="30" value="${escapeHtml(className)}" /></label>
        <div class="quick-class-actions">
          <button type="button" class="quick-apply-btn" data-timetable-action="apply-class">적용</button>
          <button type="button" class="quick-cancel-btn" data-timetable-action="cancel-class">취소</button>
        </div>
      </div>`
    : "";

  els.timetableDetail.innerHTML = `
    <div class="timetable-detail-head">
      <strong>${escapeHtml(grade)}학년 ${escapeHtml(className)}반 기준</strong>
      <button type="button" class="quick-switch-btn" data-timetable-action="toggle-class">${state.classSwitcherOpen ? "닫기" : "반 바꾸기"}</button>
    </div>
    ${notice}
    <div class="timetable-ready">
      <span>조회 기준</span>
      <b>${escapeHtml(grade)}학년 ${escapeHtml(className)}반</b>
      <p>${apiName ? "선택한 날짜에 맞는 학기 시간표가 자동으로 적용됩니다." : "선택 학교의 학교급을 확인할 수 없습니다."}</p>
    </div>
    ${switcher}
    ${body}
  `;
}
function renderView() {
  els.viewTabs.forEach((button) => {
    const isActive = button.dataset.view === state.activeTab;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  els.viewSections.forEach((section) => {
    const type = section.dataset.rootView || "";
    section.classList.toggle("view-hidden", type && type !== state.activeTab);
  });

  document.body.dataset.activeView = state.activeTab;
}

function renderSchoolResults(schools, notice = "") {
  if (!schools.length) {
    els.schoolResults.innerHTML = `${notice ? `<div class="error">${escapeHtml(notice)}</div>` : ""}<div class="empty result-empty">검색 결과가 없습니다. 학교명을 조금 줄여서 다시 검색해 주세요.</div>`;
    return;
  }

  const normalizedSchools = schools.map(normalizeSchool).filter((school) => school.schoolName && school.schoolCode);
  state.schools = normalizedSchools;

  els.schoolResults.innerHTML = `
    ${notice ? `<div class="error">${escapeHtml(notice)}</div>` : ""}
    <div class="result-summary">검색 결과 ${normalizedSchools.length}개</div>
    ${normalizedSchools.map((school, index) => `
      <article class="school-card ${state.draftSchool?.schoolCode === school.schoolCode ? "selected-school-result" : ""}">
        <div>
          <h3>${escapeHtml(school.schoolName)}</h3>
          <p>${escapeHtml(school.region || "")} · ${escapeHtml(school.schoolType || "학교")}</p>
          <p>${escapeHtml(school.address || "주소 정보 없음")}</p>
          <p>${[school.phoneNumber ? "대표전화" : "", school.homepageUrl ? "홈페이지" : ""].filter(Boolean).join(" · ") || "기본정보 자동 확인"}</p>
        </div>
        <button type="button" data-school-index="${index}" aria-label="${escapeHtml(school.schoolName)} 선택">이 학교 선택</button>
      </article>
    `).join("")}
  `;

  els.schoolResults.querySelectorAll("[data-school-index]").forEach((button) => {
    button.addEventListener("click", () => {
      state.draftSchool = state.schools[Number(button.dataset.schoolIndex)];
      renderDraftSchoolPreview();
      renderSchoolResults(state.schools, notice);
      showCopyToast("학교를 선택했어요. 자녀 별칭과 학년·반을 확인한 뒤 등록 완료를 눌러 주세요.");
    });
  });
}

function renderDayMarkers(scheduleItems, meal, dateKey) {
  const markers = [];
  const scheduleMarker = renderScheduleMarkers(scheduleItems);
  if (scheduleMarker) markers.push(scheduleMarker);
  if (meal) markers.push(`<span class="marker meal">급식</span>`);
  if (hasTimetableCache(dateKey)) markers.push(`<span class="marker timetable">시간표</span>`);
  return markers.join("");
}

function renderMobileDayInfo(scheduleItems, meal, dateKey) {
  const usefulSchedules = (scheduleItems || []).filter((item) => {
    const title = String(item?.title || "").replace(/\s+/g, " ").trim();
    return title && !/^(토요휴업일|일요일)$/.test(title);
  });

  const holidaySchedule = getPublicHolidaySchedule(usefulSchedules);
  const mainSchedule = holidaySchedule || usefulSchedules[0] || null;
  const scheduleText = mainSchedule
    ? String(mainSchedule.title || "일정").replace(/\s+/g, " ").trim()
    : "";
  const extraCount = mainSchedule && usefulSchedules.length > 1 ? usefulSchedules.length - 1 : 0;
  const scheduleClass = holidaySchedule ? "holiday" : "schedule";
  const scheduleHtml = scheduleText
    ? `<span class="mobile-schedule-text ${scheduleClass}" title="${escapeHtml(scheduleText)}"><span class="mobile-schedule-label">${escapeHtml(scheduleText)}</span>${extraCount ? `<b>+${extraCount}</b>` : ""}</span>`
    : "";

  const dots = [
    meal ? `<span class="mobile-data-dot meal" title="급식 있음" aria-hidden="true"></span>` : "",
    hasTimetableCache(dateKey) ? `<span class="mobile-data-dot timetable" title="시간표 있음" aria-hidden="true"></span>` : ""
  ].filter(Boolean).join("");

  return `${scheduleHtml}${dots ? `<span class="mobile-data-dots" aria-hidden="true">${dots}</span>` : ""}`;
}

function renderScheduleMarkers(items) {
  if (!state.selectedSchool || !items.length) return "";

  const holidaySchedule = getPublicHolidaySchedule(items);
  const mainLabel = holidaySchedule ? holidaySchedule.title : getScheduleMarkerLabel(items);
  const extraCount = items.length > 1 ? ` +${items.length - 1}` : "";
  const markerClass = holidaySchedule ? "holiday" : "schedule";
  return `<span class="marker ${markerClass}">${escapeHtml(mainLabel)}${extraCount}</span>`;
}

function getPublicHolidaySchedule(items = []) {
  return items.find((item) => isPublicHolidaySchedule(item)) || null;
}

function isPublicHolidaySchedule(item = {}) {
  const title = String(item.title || "").replace(/\s+/g, " ").trim();
  const content = String(item.content || "").replace(/\s+/g, " ").trim();
  if (!title && !content) return false;
  if (PUBLIC_HOLIDAY_TEXT_PATTERN.test(`${title} ${content}`)) return true;
  return PUBLIC_HOLIDAY_NAME_PATTERN.test(title);
}

function getScheduleMarkerLabel(items) {
  const titles = items.map((item) => item.title).join(" ");
  if (/방학|개학|휴업|재량휴업|휴교/.test(titles)) return "방학/휴업";
  if (/시험|평가|고사|모의고사/.test(titles)) return "시험";
  if (/체험|행사|축제|운동회|공개수업|자치회/.test(titles)) return "행사";
  if (items.length > 1) return `일정 ${items.length}`;
  return `${items[0].title}`;
}

function queueTimetableAutoSync(delay = 450) {
  window.clearTimeout(state.timetableAutoTimer);
  if (!state.selectedSchool) return;
  state.timetableAutoTimer = window.setTimeout(async () => {
    await loadTimetable();
    renderAll();
  }, delay);
}

async function handleTimetableDetailClick(event) {
  const button = event.target.closest("[data-timetable-action]");
  if (!button) return;
  const action = button.dataset.timetableAction;

  if (action === "toggle-class") {
    state.classSwitcherOpen = !state.classSwitcherOpen;
    renderTimetableDetail();
    return;
  }

  if (action === "cancel-class") {
    state.classSwitcherOpen = false;
    renderTimetableDetail();
    return;
  }

  if (action === "apply-class") {
    const current = getCurrentClassSettings();
    const quickGrade = normalizeNumberParam(document.querySelector("#quickGradeInput")?.value || current.grade, 1, 6);
    const quickClass = normalizeNumberParam(document.querySelector("#quickClassInput")?.value || current.className, 1, 30);

    if (!quickGrade || !quickClass) {
      showCopyToast("학년과 반을 올바르게 입력해 주세요.", true);
      return;
    }

    if (state.sharedView) {
      state.sharedView = { grade: quickGrade, className: quickClass };
    } else {
      const profile = getActiveProfile();
      if (!profile) return;
      state.profileState = ProfileStore.updateProfile(profile.id, {
        ...profile,
        grade: quickGrade,
        className: quickClass
      });
    }

    els.gradeInput.value = quickGrade;
    els.classInput.value = quickClass;
    state.contextVersion += 1;
    state.classSwitcherOpen = false;
    restoreTimetableFromCache();
    await loadTimetable();
    renderAll();
    showCopyToast(`${quickGrade}학년 ${quickClass}반으로 저장했어요.`);
  }
}


async function copyText(text, successMessage) {
  if (!text || !state.selectedSchool) {
    showCopyToast("자녀를 먼저 등록해 주세요.", true);
    return;
  }

  try {
    await writeToClipboard(text);
    showCopyToast(successMessage || "복사했어요.");
  } catch (error) {
    showCopyToast("복사에 실패했어요. 다시 시도해 주세요.", true);
  }
}

async function writeToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

function openAppModal(modal) {
  if (!modal) return;
  modal.hidden = false;
  document.body.classList.add("modal-open");
  requestAnimationFrame(() => modal.querySelector(".app-modal-sheet")?.focus());
}

function closeAppModal(modal) {
  if (!modal) return;
  modal.hidden = true;
  if (!document.querySelector(".app-modal:not([hidden])")) document.body.classList.remove("modal-open");
}

async function requestShare(mode = "month") {
  if (localStorage.getItem(SHARE_NOTICE_KEY) === "true") {
    await shareCalendarLink(mode);
    return;
  }
  pendingShareMode = mode;
  openAppModal(els.shareNoticeModal);
}

async function shareCalendarLink(mode = "month") {
  if (!state.selectedSchool) {
    showCopyToast("자녀를 먼저 등록해 주세요.", true);
    return;
  }

  const url = buildShareUrl(mode);
  const shareData = {
    title: "우리아이 오늘",
    text: buildShareText(mode),
    url
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
  }

  try {
    await writeToClipboard(url);
    showCopyToast("공유 링크가 복사됐어요.");
  } catch (error) {
    showShareFallback(url);
  }
}

function buildShareUrl(mode = "month") {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";

  const params = url.searchParams;
  params.set("schoolCode", state.selectedSchool.schoolCode || "");
  params.set("officeCode", state.selectedSchool.officeCode || "");
  params.set("schoolName", state.selectedSchool.schoolName || "");
  if (state.selectedSchool.schoolType) params.set("schoolType", state.selectedSchool.schoolType);
  if (state.selectedSchool.region) params.set("region", state.selectedSchool.region);
  const settings = getCurrentClassSettings();
  params.set("grade", settings.grade);
  params.set("classNm", settings.className);

  if (mode === "date" && state.selectedDate) {
    params.set("date", state.selectedDate);
  } else {
    params.set("month", `${state.currentDate.getFullYear()}-${pad(state.currentDate.getMonth() + 1)}`);
  }

  return url.toString();
}

function buildShareText(mode = "month") {
  if (!state.selectedSchool) return "우리아이 오늘을 확인해 보세요.";
  const settings = getCurrentClassSettings();
  const classText = `${settings.grade}학년 ${settings.className}반`;
  if (mode === "date" && state.selectedDate) {
    return `${state.selectedSchool.schoolName} ${classText} ${formatKoreanDate(state.selectedDate)} 생활달력을 확인해 보세요.`;
  }
  return `${state.selectedSchool.schoolName} ${classText} 생활달력을 확인해 보세요.`;
}

function showShareFallback(url) {
  document.querySelector(".share-fallback-box")?.remove();
  const box = document.createElement("div");
  box.className = "share-fallback-box";
  box.innerHTML = `
    <p>링크를 직접 복사해 주세요.</p>
    <input type="text" readonly value="${escapeHtml(url)}" aria-label="공유 링크" />
    <button type="button">닫기</button>
  `;
  document.body.appendChild(box);
  const input = box.querySelector("input");
  input?.focus();
  input?.select();
  box.querySelector("button")?.addEventListener("click", () => box.remove());
  showCopyToast("링크를 직접 복사해 주세요.", true);
}

function showCopyToast(message, isError = false) {
  if (!els.copyToast) return;
  els.copyToast.textContent = message;
  els.copyToast.classList.toggle("error", isError);
  els.copyToast.classList.add("show");
  window.clearTimeout(showCopyToast.timer);
  showCopyToast.timer = window.setTimeout(() => {
    els.copyToast.classList.remove("show");
  }, 2400);
}

function buildTodayCopyText() {
  if (!state.selectedSchool) return "";
  const todayKey = formatDateKey(new Date());
  const settings = getCurrentClassSettings();
  const grade = settings.grade;
  const className = settings.className;
  const todaySchedules = state.todaySchedules || [];
  const todayMeal = state.todayMeal;
  const todayTimetable = getTimetableCacheWithOptions(todayKey, grade, className);

  return buildDayCopyText({
    dateKey: todayKey,
    schedules: todaySchedules,
    meal: todayMeal,
    timetable: todayTimetable,
    noTimetableText: "- 아직 불러온 시간표가 없습니다."
  });
}

function buildCurrentChildCopyHeading() {
  if (!state.selectedSchool) return "";

  const settings = getCurrentClassSettings();
  const profile = state.sharedView ? null : getActiveProfile();
  const nickname = plainText(profile?.nickname || "");
  const schoolName = plainText(state.selectedSchool.schoolName || "");
  const grade = plainText(settings.grade || "");
  const className = plainText(settings.className || "");
  const classParts = [
    schoolName,
    grade ? `${grade}학년` : "",
    className ? `${className}반` : ""
  ].filter(Boolean);
  const schoolAndClass = classParts.join(" ");

  return [nickname, schoolAndClass].filter(Boolean).join(" · ");
}

function buildSelectedDateCopyText() {
  if (!state.selectedSchool) return "";
  const selectedSchedules = state.schedules.filter((item) => item.date === state.selectedDate);
  const selectedMeal = state.mealsByDate[state.selectedDate] || state.meal || null;
  const selectedTimetable = getTimetableCache(state.selectedDate);

  return buildDayCopyText({
    dateKey: state.selectedDate,
    schedules: selectedSchedules,
    meal: selectedMeal,
    timetable: selectedTimetable,
    noTimetableText: "- 시간표를 불러온 기록이 없습니다."
  });
}

function buildDayCopyText({ dateKey, schedules, meal, timetable, noTimetableText }) {
  const childHeading = buildCurrentChildCopyHeading();
  const lines = [
    ...(childHeading ? [childHeading] : []),
    formatKoreanDate(dateKey),
    ""
  ];

  lines.push("📅 학사일정");
  if (schedules?.length) {
    schedules.forEach((item) => {
      lines.push(`- ${plainText(item.title)}${item.content ? `: ${plainText(item.content)}` : ""}`);
    });
  } else {
    lines.push("- 등록된 학사일정이 없습니다.");
  }

  lines.push("", "🍱 급식");
  if (meal?.dishes?.length) {
    meal.dishes.forEach((dish) => lines.push(`- ${plainText(dish)}`));
    if (meal.calorie) lines.push(`칼로리: ${normalizeCalorieText(meal.calorie)}`);
  } else {
    lines.push("- 급식정보가 없습니다.");
  }

  lines.push("", "🕘 시간표");
  if (timetable?.length) {
    timetable.forEach((item) => lines.push(`${plainText(item.period)}교시 ${plainText(item.subject || "-")}`));
  } else {
    lines.push(noTimetableText || "- 아직 불러온 시간표가 없습니다.");
  }

  return lines.join("\n");
}

function normalizeCalorieText(value = "") {
  return plainText(value).replace(/\bkcal\b/gi, "kcal");
}

function plainText(value = "") {
  if (value === null || value === undefined) return "";
  const div = document.createElement("div");
  div.innerHTML = String(value).replace(/<br\s*\/?\s*>/gi, "\n");
  return div.textContent.replace(/\s+/g, " ").trim();
}

function normalizeSchool(school = {}) {
  return {
    schoolName: school.schoolName || school.SCHUL_NM || "",
    region: school.region || school.ATPT_OFCDC_SC_NM || "",
    officeCode: school.officeCode || school.ATPT_OFCDC_SC_CODE || "",
    schoolCode: school.schoolCode || school.SD_SCHUL_CODE || "",
    schoolType: school.schoolType || school.SCHUL_KND_SC_NM || "학교",
    address: school.address || school.ORG_RDNMA || school.ORG_RDNDA || "",
    phoneNumber: school.phoneNumber || school.ORG_TELNO || "",
    homepageUrl: ProfileStore.normalizeExternalUrl(
      school.homepageUrl || school.HMPG_ADRES || "",
      { allowEmpty: true, throwOnInvalid: false }
    )
  };
}

function getSharedStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const rawSchool = {
    schoolName: params.get("schoolName") || "",
    officeCode: params.get("officeCode") || "",
    schoolCode: params.get("schoolCode") || "",
    schoolType: params.get("schoolType") || "학교",
    region: params.get("region") || ""
  };
  const school = rawSchool.schoolName && rawSchool.officeCode && rawSchool.schoolCode
    ? normalizeSchool(rawSchool)
    : null;

  return {
    school,
    grade: normalizeNumberParam(params.get("grade"), 1, 6),
    className: normalizeNumberParam(params.get("classNm") || params.get("className"), 1, 30),
    month: normalizeMonthParam(params.get("month")),
    date: normalizeDateParam(params.get("date"))
  };
}

function applyInitialCalendarState(sharedState = {}) {
  if (sharedState.date) {
    const date = new Date(`${sharedState.date}T00:00:00`);
    state.currentDate = new Date(date.getFullYear(), date.getMonth(), 1);
    state.selectedDate = sharedState.date;
    return;
  }

  if (sharedState.month) {
    const [year, month] = sharedState.month.split("-").map(Number);
    state.currentDate = new Date(year, month - 1, 1);
    state.selectedDate = `${sharedState.month}-01`;
    return;
  }

  setSelectedDateToToday();
}

function normalizeNumberParam(value, min, max) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) return "";
  return String(number);
}

function normalizeMonthParam(value = "") {
  if (!/^\d{4}-\d{2}$/.test(value)) return "";
  const [year, month] = value.split("-").map(Number);
  if (year < 2000 || year > 2100 || month < 1 || month > 12) return "";
  return value;
}

function normalizeDateParam(value = "") {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  if (formatDateKey(date) !== value) return "";
  return value;
}

function clearShareQuery() {
  if (!window.history?.replaceState || !window.location.search) return;
  const cleanUrl = `${window.location.pathname}${window.location.hash || ""}`;
  window.history.replaceState({}, document.title, cleanUrl);
}

function normalizeMeal(meal = {}) {
  const rawDate = meal.date || meal.MLSV_YMD || "";
  const date = rawDate.includes("-") ? rawDate : `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
  const dishes = Array.isArray(meal.dishes)
    ? meal.dishes
    : cleanTextLines(meal.DDISH_NM || meal.menu || "");

  return {
    date,
    mealName: meal.mealName || meal.MMEAL_SC_NM || "급식",
    dishes,
    calorie: meal.calorie || meal.CAL_INFO || "",
    nutrition: meal.nutrition || meal.NTR_INFO || "",
    origin: meal.origin || meal.ORPLC_INFO || "",
    allergy: meal.allergy || "식단명 숫자는 알레르기 유발 식재료 번호입니다."
  };
}

function normalizeTimetable(item = {}) {
  return {
    period: item.period || item.PERIO || "",
    subject: item.subject || item.ITRT_CNTNT || item.CLSRM_NM || "-",
    date: item.date || item.ALL_TI_YMD || state.selectedDate
  };
}

function normalizeSchedule(item) {
  const date = item.date || item.AA_YMD || item.aaYmd || "";
  return {
    schoolCode: item.schoolCode || item.SD_SCHUL_CODE || "",
    date: date.includes("-") ? date : `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`,
    title: item.title || item.EVENT_NM || item.eventName || "학사일정",
    content: item.content || item.EVENT_CNTNT || item.eventContent || ""
  };
}

function getTimetableCacheKey(dateKey = state.selectedDate, settings = getCurrentClassSettings()) {
  return getTimetableCacheKeyWithOptions(
    dateKey,
    settings.grade,
    settings.className
  );
}

function getTimetableCacheKeyWithOptions(dateKey, grade, className) {
  if (!state.selectedSchool || !dateKey) return "";
  return NeisCache.keys.timetable(
    state.selectedSchool.schoolCode || "unknown",
    grade || "1",
    className || "1",
    "auto",
    dateKey
  );
}

function saveTimetableCache(dateKey, items, settings = getCurrentClassSettings()) {
  const key = getTimetableCacheKey(dateKey, settings);
  if (!key) return;
  NeisCache.set(key, {
    items: Array.isArray(items) ? items.filter((item) => !isNonInstructionTimetableItem(item)) : [],
    dayLabel: getNonInstructionTimetableLabel(items)
  });
}

function removeTimetableCache(dateKey, settings = getCurrentClassSettings()) {
  const key = getTimetableCacheKey(dateKey, settings);
  if (key) NeisCache.remove(key);
}

function getTimetableCache(dateKey = state.selectedDate) {
  const settings = getCurrentClassSettings();
  return getTimetableCacheWithOptions(dateKey, settings.grade, settings.className);
}

function getTimetableCacheWithOptions(dateKey, grade, className) {
  const key = getTimetableCacheKeyWithOptions(dateKey, grade, className);
  if (!key) return [];
  const cached = NeisCache.get(key);
  return cached.hit ? normalizeTimetableCacheEntry(cached.data).items : [];
}

function hasTimetableCache(dateKey) {
  return getTimetableCache(dateKey).length > 0;
}

function restoreTimetableFromCache() {
  const key = getTimetableCacheKey(state.selectedDate);
  const cachedEntry = key ? NeisCache.get(key) : { hit: false };
  const cached = cachedEntry.hit
    ? normalizeTimetableCacheEntry(cachedEntry.data)
    : { items: [], dayLabel: "" };
  state.timetable = cached.items;
  state.timetableDayLabel = cached.dayLabel;
  state.timetableStatus = cachedEntry.hit ? "success" : "idle";
  state.timetableMessage = cachedEntry.hit && !cached.items.length
    ? getTimetableEmptyMessage(state.selectedDate, cached.dayLabel)
    : "";
  state.timetableNotice = cached.items.length ? "저장된 시간표 조회 결과를 보여드려요." : "";
}

function getSemesterCandidates(dateKey = state.selectedDate) {
  const date = new Date(`${dateKey}T00:00:00`);
  const month = date.getMonth() + 1;
  const preferred = month >= 3 && month <= 7 ? "1" : "2";
  return preferred === "1" ? ["1", "2"] : ["2", "1"];
}

function getAcademicYear(dateKey = state.selectedDate) {
  const date = new Date(`${dateKey}T00:00:00`);
  const year = date.getFullYear();
  return date.getMonth() + 1 <= 2 ? year - 1 : year;
}

function isNonInstructionTimetableItem(item = {}) {
  const subject = String(item.subject || "").replace(/\s+/g, "").trim();
  return /(?:방학|휴업|휴교)/.test(subject);
}

function getNonInstructionTimetableLabel(items = []) {
  const item = (Array.isArray(items) ? items : []).find(isNonInstructionTimetableItem);
  return item ? String(item.subject || "").replace(/\s+/g, " ").trim() : "";
}

function normalizeTimetableCacheEntry(data) {
  const rawItems = Array.isArray(data)
    ? data
    : Array.isArray(data?.items) ? data.items : [];
  return {
    items: rawItems.filter((item) => !isNonInstructionTimetableItem(item)),
    dayLabel: String(data?.dayLabel || getNonInstructionTimetableLabel(rawItems)).trim()
  };
}

function getTimetableEmptyMessage(dateKey = state.selectedDate, fallbackLabel = "") {
  const closure = (state.schedules || []).find((item) => {
    if (item.date !== dateKey) return false;
    return /(?:방학|휴업|휴교)/.test(`${item.title || ""} ${item.content || ""}`);
  });
  if (closure) {
    const label = String(closure.title || "방학·휴업일").replace(/\s+/g, " ").trim();
    return `${label}이라 시간표가 없어요.`;
  }

  if (fallbackLabel) return `${fallbackLabel}이라 시간표가 없어요.`;

  const date = new Date(`${dateKey}T00:00:00`);
  if (date.getDay() === 0 || date.getDay() === 6) return "주말이라 시간표가 없어요.";
  return "등록된 시간표가 없어요.";
}

function cleanTextLines(value = "") {
  return String(value)
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .split(/\n|,/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function formatDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
function compactDate(dateKey) { return dateKey.replaceAll("-", ""); }
function pad(value) { return String(value).padStart(2, "0"); }
function formatKoreanDate(dateKey) {
  const date = new Date(`${dateKey}T00:00:00`);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${WEEKDAYS[date.getDay()]}요일`;
}
function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" }[char]));
}

init();
