// ============================================================
// 우리아이 오늘 v0.4.1 - 자녀 프로필·자동 학교정보 로컬 저장 모듈
// 오늘학교의 localStorage 키와 완전히 분리되어 동작합니다.
// ============================================================

(function attachProfileStore(global) {
  "use strict";

  const STORAGE_KEY = "myChildToday.profileState.v1";
  const VERSION = 1;
  const MAX_PROFILES = 5;

  function emptyState() {
    return {
      version: VERSION,
      activeProfileId: null,
      profiles: []
    };
  }

  function createId() {
    if (global.crypto?.randomUUID) return global.crypto.randomUUID();
    return `profile-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function safeString(value, fallback = "") {
    return String(value ?? fallback).trim();
  }

  function normalizeNumber(value, min, max, fallback = "1") {
    const number = Number(value);
    if (!Number.isInteger(number) || number < min || number > max) return fallback;
    return String(number);
  }

  function normalizeExternalUrl(value, options = {}) {
    const { allowEmpty = true, throwOnInvalid = true } = options;
    let text = safeString(value);
    if (!text) {
      if (allowEmpty) return "";
      if (throwOnInvalid) throw new Error("웹사이트 주소를 입력해 주세요.");
      return "";
    }

    if (!/^[a-z][a-z\d+.-]*:\/\//i.test(text)) {
      text = `https://${text}`;
    }

    try {
      const url = new URL(text);
      if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error("웹사이트 주소만 등록할 수 있어요.");
      }
      return url.href;
    } catch (error) {
      if (throwOnInvalid) {
        throw new Error("올바른 웹사이트 주소를 입력해 주세요.");
      }
      return "";
    }
  }

  function normalizeStoredUrl(value) {
    return normalizeExternalUrl(value, { allowEmpty: true, throwOnInvalid: false });
  }

  function normalizeSchool(school = {}) {
    return {
      schoolName: safeString(school.schoolName || school.SCHUL_NM),
      region: safeString(school.region || school.ATPT_OFCDC_SC_NM),
      officeCode: safeString(school.officeCode || school.ATPT_OFCDC_SC_CODE),
      schoolCode: safeString(school.schoolCode || school.SD_SCHUL_CODE),
      schoolType: safeString(school.schoolType || school.SCHUL_KND_SC_NM, "학교"),
      address: safeString(school.address || school.ORG_RDNMA || school.ORG_RDNDA),
      phoneNumber: safeString(school.phoneNumber || school.ORG_TELNO),
      homepageUrl: normalizeStoredUrl(school.homepageUrl || school.HMPG_ADRES)
    };
  }

  function isValidSchool(school = {}) {
    return Boolean(school.schoolName && school.officeCode && school.schoolCode);
  }

  function normalizeProfile(profile = {}, index = 0) {
    const school = normalizeSchool(profile.school || {});
    if (!profile.id || !isValidSchool(school)) return null;

    const now = new Date().toISOString();
    return {
      id: safeString(profile.id),
      nickname: safeString(profile.nickname, defaultNickname(index)),
      school: {
        schoolName: school.schoolName,
        region: school.region,
        officeCode: school.officeCode,
        schoolCode: school.schoolCode,
        schoolType: school.schoolType,
        address: school.address,
        phoneNumber: school.phoneNumber,
        homepageUrl: school.homepageUrl
      },
      grade: normalizeNumber(profile.grade, 1, 6),
      className: normalizeNumber(profile.className, 1, 30),
      semester: ["1", "2"].includes(String(profile.semester)) ? String(profile.semester) : "1",
      links: {
        homepageUrl: normalizeStoredUrl(profile.links?.homepageUrl || school.homepageUrl),
        noticeUrl: normalizeStoredUrl(profile.links?.noticeUrl)
      },
      createdAt: safeString(profile.createdAt, now),
      updatedAt: safeString(profile.updatedAt, now)
    };
  }

  function normalizeState(raw = {}) {
    const profiles = Array.isArray(raw.profiles)
      ? raw.profiles.slice(0, MAX_PROFILES).map(normalizeProfile).filter(Boolean)
      : [];

    const activeProfileId = profiles.some((profile) => profile.id === raw.activeProfileId)
      ? raw.activeProfileId
      : profiles[0]?.id || null;

    return {
      version: VERSION,
      activeProfileId,
      profiles
    };
  }

  function loadState() {
    try {
      const raw = JSON.parse(global.localStorage.getItem(STORAGE_KEY) || "null");
      return raw ? normalizeState(raw) : emptyState();
    } catch (error) {
      return emptyState();
    }
  }

  function saveState(nextState) {
    const normalized = normalizeState(nextState);
    global.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  }

  function defaultNickname(index) {
    const names = ["첫째", "둘째", "셋째", "넷째", "다섯째"];
    return names[index] || `자녀 ${index + 1}`;
  }

  function suggestNickname(state = loadState()) {
    return defaultNickname(state.profiles.length);
  }

  function buildProfile(input = {}, existingProfile = null, index = 0) {
    const now = new Date().toISOString();
    const school = normalizeSchool(input.school || existingProfile?.school || {});
    if (!isValidSchool(school)) throw new Error("학교를 선택해 주세요.");

    const inputLinks = input.links || {};
    const homepageSource = Object.prototype.hasOwnProperty.call(inputLinks, "homepageUrl")
      ? inputLinks.homepageUrl
      : school.homepageUrl || existingProfile?.links?.homepageUrl;
    const noticeSource = Object.prototype.hasOwnProperty.call(inputLinks, "noticeUrl")
      ? inputLinks.noticeUrl
      : existingProfile?.links?.noticeUrl;

    return {
      id: existingProfile?.id || createId(),
      nickname: safeString(input.nickname, existingProfile?.nickname || defaultNickname(index)),
      school: {
        schoolName: school.schoolName,
        region: school.region,
        officeCode: school.officeCode,
        schoolCode: school.schoolCode,
        schoolType: school.schoolType,
        address: school.address,
        phoneNumber: school.phoneNumber,
        homepageUrl: school.homepageUrl
      },
      grade: normalizeNumber(input.grade, 1, 6),
      className: normalizeNumber(input.className, 1, 30),
      semester: ["1", "2"].includes(String(input.semester)) ? String(input.semester) : "1",
      links: {
        homepageUrl: normalizeStoredUrl(homepageSource),
        noticeUrl: normalizeStoredUrl(noticeSource)
      },
      createdAt: existingProfile?.createdAt || now,
      updatedAt: now
    };
  }

  function addProfile(input) {
    const state = loadState();
    if (state.profiles.length >= MAX_PROFILES) {
      throw new Error(`자녀는 최대 ${MAX_PROFILES}명까지 등록할 수 있어요.`);
    }

    const profile = buildProfile(input, null, state.profiles.length);
    state.profiles.push(profile);
    state.activeProfileId = profile.id;
    return saveState(state);
  }

  function updateProfile(profileId, input) {
    const state = loadState();
    const index = state.profiles.findIndex((profile) => profile.id === profileId);
    if (index < 0) throw new Error("수정할 자녀 정보를 찾지 못했어요.");

    state.profiles[index] = buildProfile(input, state.profiles[index], index);
    state.activeProfileId = state.profiles[index].id;
    return saveState(state);
  }

  function updateProfileLinks(profileId, links = {}) {
    const state = loadState();
    const index = state.profiles.findIndex((profile) => profile.id === profileId);
    if (index < 0) throw new Error("수정할 자녀 정보를 찾지 못했어요.");

    const profile = state.profiles[index];
    const nextLinks = { ...profile.links };

    if (Object.prototype.hasOwnProperty.call(links, "homepageUrl")) {
      nextLinks.homepageUrl = normalizeExternalUrl(links.homepageUrl, { allowEmpty: true });
    }
    if (Object.prototype.hasOwnProperty.call(links, "noticeUrl")) {
      nextLinks.noticeUrl = normalizeExternalUrl(links.noticeUrl, { allowEmpty: true });
    }

    state.profiles[index] = {
      ...profile,
      links: nextLinks,
      updatedAt: new Date().toISOString()
    };
    return saveState(state);
  }

  function updateProfileSchoolInfo(profileId, schoolInfo = {}) {
    const state = loadState();
    const index = state.profiles.findIndex((profile) => profile.id === profileId);
    if (index < 0) throw new Error("수정할 자녀 정보를 찾지 못했어요.");

    const profile = state.profiles[index];
    const normalized = normalizeSchool({ ...profile.school, ...schoolInfo });
    const homepageUrl = normalizeStoredUrl(schoolInfo.homepageUrl || normalized.homepageUrl || profile.links?.homepageUrl);

    state.profiles[index] = {
      ...profile,
      school: {
        ...profile.school,
        address: normalized.address || profile.school.address || "",
        phoneNumber: normalized.phoneNumber || profile.school.phoneNumber || "",
        homepageUrl
      },
      links: {
        ...profile.links,
        homepageUrl
      },
      updatedAt: new Date().toISOString()
    };
    return saveState(state);
  }

  function deleteProfile(profileId) {
    const state = loadState();
    const index = state.profiles.findIndex((profile) => profile.id === profileId);
    if (index < 0) return state;

    state.profiles.splice(index, 1);
    if (state.activeProfileId === profileId) {
      state.activeProfileId = state.profiles[index]?.id || state.profiles[index - 1]?.id || null;
    }
    return saveState(state);
  }

  function setActiveProfile(profileId) {
    const state = loadState();
    if (!state.profiles.some((profile) => profile.id === profileId)) return state;
    state.activeProfileId = profileId;
    return saveState(state);
  }

  function getActiveProfile(state = loadState()) {
    return state.profiles.find((profile) => profile.id === state.activeProfileId) || null;
  }

  function clearAll() {
    global.localStorage.removeItem(STORAGE_KEY);
    return emptyState();
  }

  global.ProfileStore = Object.freeze({
    STORAGE_KEY,
    VERSION,
    MAX_PROFILES,
    loadState,
    saveState,
    addProfile,
    updateProfile,
    updateProfileLinks,
    updateProfileSchoolInfo,
    deleteProfile,
    setActiveProfile,
    getActiveProfile,
    suggestNickname,
    clearAll,
    normalizeSchool,
    normalizeExternalUrl,
    isValidSchool
  });
})(window);
