(() => {
  'use strict';

  const APP_CONFIG = window.YUSSAM_SUMMER_CONFIG || {};
  const STORAGE_KEY = 'yussam_summer_2026_selection_v1';
  const PLACEHOLDER_SCRIPT_URL = 'PASTE_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE';
  // 폐강된 특강 ID. 원격 설정(구글시트)에 남아 있어도 화면·신청서에서 완전히 제외합니다.
  const REMOVED_COURSE_IDS = ['sun-jaehyun'];
  const isRemovedCourse = course => REMOVED_COURSE_IDS.includes(String(course && course.id));

  const DEFAULT_COURSES = [
    {
      id: 'park-chaeyoung', sort: 1, active: true, teacher: '박채영T',
      title: '고1 첫 시험 미리 보기', target: '중3(예비고1)',
      schedule: '8/5 13:00–14:30 · 8/12 13:00–14:30', price: '무료', status: '신청가능',
      accent: '#8b341f', posterUrl: 'assets/posters/park-chaeyoung.webp',
      sourceFormUrl: 'https://forms.gle/YrHtaTyxc9ZoznDGA',
      description: '하남·미강·풍산·미사고 기출을 분석하며 고1 시험을 미리 경험하는 고등 맛보기 특강입니다.',
      sessionMode: 'multi',
      sessions: [
        { key: 'r1', label: '1회차', when: '8월 5일(수) 오후 1:00~2:30', content: '어법 시험 분석' },
        { key: 'r2', label: '2회차', when: '8월 12일(수) 오후 1:00~2:30', content: '독해 시험 분석' }
      ],
      options: [],
      detail: {
        title: '박채영T 고등 맛보기 특강',
        note: '1회차와 2회차는 상이한 내용으로, 두 회차 모두 참여 권장',
        scheduleLines: ['1회차 : 8월 5일(수) 오후 1:00~2:30', '2회차 : 8월 12일(수) 오후 1:00~2:30'],
        contentLines: ['1회차 : 어법 시험 분석', '2회차 : 독해 시험 분석'],
        target: '하남고·미강고·풍산고·미사고 진학 예정인 중3 (비재원생도 가능)',
        location: '목동유쌤영어학원 (세부 장소 추후 공지)',
        teacherName: '박채영 선생님'
      }
    },
    {
      id: 'kim-jiyeon', sort: 2, active: true, teacher: '김지연T',
      title: '모의고사 어법, 안 틀리는 비법!', target: '중2~중3',
      schedule: '8/7 14:00–15:30 또는 20:00–21:30', price: '무료', status: '신청가능',
      accent: '#6d481c', posterUrl: 'assets/posters/kim-jiyeon.webp',
      sourceFormUrl: 'https://forms.gle/ZpM8BF1fLcrHm6GX6',
      description: '개념은 알지만 문제에서 흔들리는 학생을 위해 고등 모의고사 어법의 출제 원리와 풀이 기준을 정리합니다.',
      sessionMode: 'choose-one',
      sessions: [],
      options: ['8월 7일(금) 오후반 2:00~3:30', '8월 7일(금) 저녁반 8:00~9:30'],
      detail: {
        title: '김지연T 고등 어법 특강',
        note: '오후반, 저녁반은 동일한 내용으로, 한 타임만 선택',
        scheduleLines: ['8월 7일(금) 오후반 2:00~3:30', '8월 7일(금) 저녁반 8:00~9:30'],
        contentLines: [
          '매번 헷갈리는 어법 유형 집중 훈련',
          '자주 출제되는 어법 포인트 정리',
          '고등 모의고사 기출 유형 연습문제 풀이',
          '오답이 많은 문항의 핵심 근거 분석'
        ],
        target: '중2, 중3 (비재원생도 가능)',
        location: '목동유쌤영어학원 (세부 장소 추후 공지)',
        teacherName: '김지연 선생님'
      }
    },
    {
      id: 'lee-seoyoung', sort: 4, active: true, teacher: '이서영T',
      title: '품사가 보이면 문장이 보인다', target: '초6~중2 기초',
      schedule: '8/5 20:00–21:30', price: '무료', status: '신청가능',
      accent: '#06625f', posterUrl: 'assets/posters/lee-seoyoung.webp',
      sourceFormUrl: 'https://forms.gle/aSSAyu2JmADHRJx56',
      description: '모든 문법의 출발점인 품사를 정확히 구분하고 문장 안에서 기능을 읽어 내는 생기초 문법 특강입니다.',
      sessionMode: 'single',
      sessions: [],
      options: [],
      detail: {
        title: '이서영T 쌩기초 문법 특강',
        note: '',
        scheduleLines: ['8월 5일(수) 오후 8:00~9:30'],
        contentLines: [
          '8품사 개념과 문장 구성 성분(주어·동사·목적어·보어) 개념 잡기',
          '배운 개념을 적용해 문장의 구조를 직접 분석하기',
          '쉬운 문장부터 어려운 문장까지, 단계별 구조 파악 연습'
        ],
        target: '초6~중2 기초 학생 (비재원생도 가능)',
        location: '목동유쌤영어학원 (세부 장소 추후 공지)',
        teacherName: '이서영 선생님'
      }
    },
    {
      id: 'hong-kyungji', sort: 5, active: true, teacher: '홍경지T',
      title: '처음 보는 단어도 한 번에 읽기', target: '중1~중3',
      schedule: '7/24 18:00–19:30 · 8/7 18:00–19:30', price: '무료', status: '신청가능',
      accent: '#5a205d', posterUrl: 'assets/posters/hong-kyungji.webp',
      sourceFormUrl: 'https://forms.gle/ePSG5yBjnFo3xAZAA',
      description: '단어를 무작정 외우는 대신 철자와 구조를 읽어 처음 보는 어휘도 스스로 해독하는 힘을 기릅니다.',
      sessionMode: 'multi',
      sessions: [
        { key: 'r1', label: '1회차', when: '7월 24일(금) 오후 6:00~7:30', content: '발음 기호 정복 + 접두사·어근·접미사 맛보기' },
        { key: 'r2', label: '2회차', when: '8월 7일(월) 오후 6:00~7:30', content: '발음 기호 복습 + 필수 어근 학습 + 단어 해부공식 연습' }
      ],
      options: [],
      detail: {
        title: '홍경지T 중등 어휘 특강',
        note: '1회차와 2회차는 이어지는 내용으로, 두 회차 모두 참여 권장',
        scheduleLines: ['1회차 : 7월 24일(금) 오후 6:00~7:30', '2회차 : 8월 7일(월) 오후 6:00~7:30'],
        contentLines: [
          '1회차 : 발음 기호 정복 + 접두사·어근·접미사 맛보기',
          '2회차 : 발음 기호 복습 + 필수 어근 학습 + 단어 해부공식 연습'
        ],
        target: '중1, 중2, 중3 (비재원생도 가능)',
        location: '목동유쌤영어학원 (세부 장소 추후 공지)',
        teacherName: '홍경지 선생님'
      }
    },
    {
      id: 'bae-seunghee', sort: 6, active: true, teacher: '배승희T',
      title: '중등, 문법을 먼저 잡다', target: '초6',
      schedule: '8/4 13:30–15:00 · 8/6 13:30–15:00', price: '무료', status: '신청가능',
      accent: '#8b1d4b', posterUrl: 'assets/posters/bae-seunghee.webp',
      sourceFormUrl: 'https://forms.gle/v9EDdoBHyJQ6vm7bA',
      description: '심화·상위 과정에 필요한 핵심 문법 두 영역을 먼저 완성해 중등 영어의 기반을 단단히 잡습니다.',
      sessionMode: 'multi',
      sessions: [
        { key: 'r1', label: '1회차', when: '8월 4일(화) 오후 1:30~3:00', content: '관계대명사 원리, 해석 방법, 실제 예문 연습' },
        { key: 'r2', label: '2회차', when: '8월 6일(목) 오후 1:30~3:00', content: '완료시제 개념, 비교, 구분 연습' }
      ],
      options: [],
      detail: {
        title: '배승희T 중등 핵심 어휘 특강',
        note: '1회차와 2회차는 상이한 내용으로, 두 회차 모두 참여 권장',
        scheduleLines: ['1회차 : 8월 4일(화) 오후 1:30~3:00', '2회차 : 8월 6일(목) 오후 1:30~3:00'],
        contentLines: [
          '1회차 : 관계대명사 원리, 해석 방법, 실제 예문 연습',
          '2회차 : 완료시제 개념, 비교, 구분 연습'
        ],
        target: '초6 (비재원생도 가능)',
        location: '목동유쌤영어학원 (세부 장소 추후 공지)',
        teacherName: '배승희 선생님'
      }
    },
    {
      id: 'lee-seunghee', sort: 7, active: true, teacher: '이승희T',
      title: '해석이 빨라지는 주어 & 동사 찾기', target: '중1~중2 하위권',
      schedule: '7/22 17:00–18:30', price: '무료', status: '신청가능',
      accent: '#0a5478', posterUrl: 'assets/posters/lee-seunghee.webp',
      sourceFormUrl: 'https://forms.gle/pXHrSNVktU5fA4Zn7',
      description: '수식어가 길어질 때 해석이 흐려지는 학생을 위해 문장의 중심인 주어와 동사를 빠르게 찾는 법을 익힙니다.',
      sessionMode: 'single',
      sessions: [],
      options: [],
      detail: {
        title: '이승희T 주어 동사 찾기 특강',
        note: '',
        scheduleLines: ['7월 22일(수) 오후 5:00~6:30'],
        contentLines: [
          '문장의 2대 핵심 요소 이해',
          '길어지는 주어 정복',
          '주어-동사 수 일치 연습',
          '문장 끊어 읽기 적용'
        ],
        target: '중1, 중2 기본 학생 (비재원생도 가능)',
        location: '목동유쌤영어학원 (세부 장소 추후 공지)',
        teacherName: '이승희 선생님'
      }
    }
  ];

  const state = {
    courses: DEFAULT_COURSES.filter(course => !isRemovedCourse(course)).map(course => ({ ...course })),
    selected: new Map(),
    filter: 'all',
    currentStep: 1,
    posterCourseId: null,
    submitting: false,
    lastFocusedElement: null,
    submissionComplete: false,
    pendingRequestId: '',
    pendingReceipt: ''
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const els = {
    courseGrid: $('#course-grid'),
    emptyState: $('#empty-state'),
    courseCount: $('#visible-course-count'),
    selectionBar: $('#selection-bar'),
    selectionCount: $('#selection-count'),
    selectionTitle: $('#selection-title'),
    selectionNames: $('#selection-names'),
    selectionApply: $('#selection-apply'),
    posterModal: $('#poster-modal'),
    posterTitle: $('#poster-modal-title'),
    posterImage: $('#poster-modal-image'),
    posterDetail: $('#poster-detail'),
    posterSource: $('#poster-source-link'),
    posterSelect: $('#poster-select-button'),
    applyModal: $('#apply-modal'),
    applicationForm: $('#application-form'),
    selectedCourseList: $('#selected-course-list'),
    progressFill: $('#progress-fill'),
    prevStep: $('#prev-step'),
    nextStep: $('#next-step'),
    submitButton: $('#submit-application'),
    formFooter: $('#form-footer'),
    successStep: $('#success-step'),
    receiptNumber: $('#receipt-number'),
    toast: $('#toast'),
    memo: $('#memo'),
    memoCount: $('#memo-count')
  };

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function normalizeBoolean(value, fallback = true) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    const text = String(value ?? '').trim().toLowerCase();
    if (['false', '0', '아니오', 'n', 'off', '미사용'].includes(text)) return false;
    if (['true', '1', '예', 'y', 'on', '사용'].includes(text)) return true;
    return fallback;
  }

  function isCourseOpen(course) {
    const status = String(course.status || '').trim();
    return course.active !== false && !['마감', '신청마감', '종료', '비활성'].includes(status);
  }

  function getCourse(id) {
    return state.courses.find(course => course.id === id) || null;
  }

  function normalizeRemoteCourse(remote, index) {
    const fallback = DEFAULT_COURSES.find(item => item.id === remote.id) || DEFAULT_COURSES[index] || {};
    const optionValue = remote.options ?? remote.optionList ?? remote.detailOptions ?? [];
    const remoteOptions = Array.isArray(optionValue)
      ? optionValue.filter(Boolean).map(String)
      : String(optionValue || '').split('|').map(item => item.trim()).filter(Boolean);

    // 상세 안내(일시·내용·대상·장소·강사)와 회차 선택 방식은 기본값에서 유지합니다.
    const sessions = Array.isArray(fallback.sessions) ? fallback.sessions.map(item => ({ ...item })) : [];
    const sessionMode = fallback.sessionMode || (remoteOptions.length ? 'choose-one' : 'single');
    const options = remoteOptions.length ? remoteOptions : (Array.isArray(fallback.options) ? fallback.options.slice() : []);
    const detail = fallback.detail ? { ...fallback.detail } : null;

    return {
      id: String(remote.id || fallback.id || `course-${index + 1}`),
      sort: Number(remote.sort || fallback.sort || index + 1),
      active: normalizeBoolean(remote.active, true),
      teacher: String(remote.teacher || fallback.teacher || '담당 선생님'),
      title: String(remote.title || fallback.title || '2026 여름방학 특강'),
      target: String(remote.target || fallback.target || '상세 안내 참고'),
      schedule: String(remote.schedule || fallback.schedule || '상세 안내 참고'),
      price: String(remote.price || fallback.price || '무료'),
      capacity: remote.capacity === '' || remote.capacity == null ? '' : Number(remote.capacity),
      status: String(remote.status || fallback.status || '신청가능'),
      accent: String(remote.accent || fallback.accent || '#b9934f'),
      posterUrl: String(remote.posterUrl || fallback.posterUrl || ''),
      sourceFormUrl: String(remote.sourceFormUrl || fallback.sourceFormUrl || ''),
      description: String(remote.description || fallback.description || ''),
      sessionMode,
      sessions,
      options,
      detail
    };
  }

  function renderCourses() {
    const visible = state.courses
      .filter(course => course.active !== false)
      .filter(course => {
        if (state.filter === 'selected') return state.selected.has(course.id);
        if (state.filter === 'available') return isCourseOpen(course);
        return true;
      })
      .sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));

    els.courseCount.textContent = String(visible.length);
    els.emptyState.hidden = visible.length > 0;
    els.courseGrid.innerHTML = visible.map(course => {
      const selected = state.selected.has(course.id);
      const open = isCourseOpen(course);
      const statusLabel = selected ? '선택됨' : (course.status || (open ? '신청가능' : '마감'));
      const statusClass = selected ? 'is-selected' : (open ? 'is-open' : '');
      return `
        <article class="course-card ${selected ? 'is-selected' : ''} ${open ? '' : 'is-closed'}" style="--course-accent:${escapeHtml(course.accent)}" data-course-id="${escapeHtml(course.id)}">
          <span class="card-status ${statusClass}">${escapeHtml(statusLabel)}</span>
          <button class="course-poster-button" type="button" data-poster-id="${escapeHtml(course.id)}" aria-label="${escapeHtml(course.teacher)} 포스터 크게 보기">
            <img src="${escapeHtml(course.posterUrl)}" alt="${escapeHtml(course.teacher)} 2026 여름방학 특강 포스터" loading="lazy" />
            <span class="poster-overlay">＋ 크게 보기</span>
          </button>
          <div class="course-body">
            <div class="course-meta"><span class="teacher-label">${escapeHtml(course.teacher)}</span><span>2026 SUMMER</span></div>
            <h3>${escapeHtml(course.title)}</h3>
            <p class="course-summary">${escapeHtml(course.description)}</p>
            <dl class="course-facts">
              <div><dt>대상</dt><dd>${escapeHtml(course.target)}</dd></div>
              <div><dt>일정</dt><dd>${escapeHtml(course.schedule)}</dd></div>
              <div><dt>수강료</dt><dd>${escapeHtml(course.price)}</dd></div>
            </dl>
            <div class="course-actions">
              <button class="card-button detail" type="button" data-poster-id="${escapeHtml(course.id)}">상세 보기</button>
              <button class="card-button select" type="button" data-select-id="${escapeHtml(course.id)}" ${open ? '' : 'disabled'}>${selected ? '선택 취소' : '이 특강 선택'}</button>
            </div>
          </div>
        </article>`;
    }).join('');

    $$('.course-poster-button img', els.courseGrid).forEach(img => {
      img.addEventListener('error', () => {
        const card = img.closest('[data-course-id]');
        const id = card?.dataset.courseId;
        const fallback = DEFAULT_COURSES.find(item => item.id === id)?.posterUrl;
        if (fallback && img.src !== new URL(fallback, location.href).href) img.src = fallback;
      }, { once: true });
    });
  }

  function updateSelectionUI() {
    const selectedCourses = Array.from(state.selected.keys()).map(getCourse).filter(Boolean);
    const count = selectedCourses.length;
    els.selectionCount.textContent = String(count);
    els.selectionApply.disabled = count === 0;
    els.selectionBar.classList.toggle('is-visible', count > 0);
    els.selectionTitle.textContent = count ? `${count}개 특강을 선택했습니다` : '특강을 선택해 주세요';
    els.selectionNames.textContent = count
      ? selectedCourses.map(course => course.teacher).join(' · ')
      : '여러 특강을 한 번에 신청할 수 있습니다.';
    renderCourses();
    saveSelection();
  }

  function toggleSelection(id, force) {
    const course = getCourse(id);
    if (!course || !isCourseOpen(course)) return;
    const shouldSelect = typeof force === 'boolean' ? force : !state.selected.has(id);
    state.pendingRequestId = '';
    state.pendingReceipt = '';
    if (shouldSelect) {
      if (!state.selected.has(id)) state.selected.set(id, { detail: '', sessions: [] });
      showToast(`${course.teacher} 특강을 신청 목록에 담았습니다.`);
    } else {
      state.selected.delete(id);
      showToast(`${course.teacher} 특강 선택을 취소했습니다.`);
    }
    updateSelectionUI();
    if (!els.posterModal.hidden && state.posterCourseId === id) updatePosterSelectButton();
  }

  function saveSelection() {
    try {
      const payload = {
        savedAt: Date.now(),
        items: Array.from(state.selected.entries()).map(([id, value]) => ({ id, detail: value.detail || '', sessions: Array.isArray(value.sessions) ? value.sessions : [] }))
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (_) { /* storage unavailable */ }
  }

  function restoreSelection() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (!saved || Date.now() - Number(saved.savedAt || 0) > 24 * 60 * 60 * 1000) return;
      (saved.items || []).forEach(item => {
        if (getCourse(item.id)) state.selected.set(item.id, { detail: String(item.detail || ''), sessions: Array.isArray(item.sessions) ? item.sessions.map(String) : [] });
      });
    } catch (_) { /* ignore malformed storage */ }
  }

  function openPoster(id) {
    const course = getCourse(id);
    if (!course) return;
    state.lastFocusedElement = document.activeElement;
    state.posterCourseId = id;
    els.posterTitle.textContent = `${course.teacher} 특강 포스터`;
    els.posterImage.src = course.posterUrl;
    els.posterImage.alt = `${course.teacher} 2026 여름방학 특강 포스터`;
    renderPosterDetail(course);
    els.posterSource.href = course.sourceFormUrl || '#';
    els.posterSource.hidden = true;
    updatePosterSelectButton();
    openModal(els.posterModal);
    setTimeout(() => $('[data-close-poster]', els.posterModal)?.focus(), 40);
  }

  function renderPosterDetail(course) {
    if (!els.posterDetail) return;
    const detail = course.detail;
    if (!detail) { els.posterDetail.innerHTML = ''; els.posterDetail.hidden = true; return; }
    els.posterDetail.hidden = false;

    const listBlock = (lines) => Array.isArray(lines) && lines.length
      ? `<ul class="poster-detail-lines">${lines.map(line => `<li>${escapeHtml(line)}</li>`).join('')}</ul>`
      : '';
    const rows = [];
    rows.push(`<div class="poster-detail-row"><dt>일시</dt><dd>${listBlock(detail.scheduleLines)}</dd></div>`);
    const contentValue = `${detail.note ? `<p class="poster-detail-note">${escapeHtml(detail.note)}</p>` : ''}${listBlock(detail.contentLines)}`;
    rows.push(`<div class="poster-detail-row"><dt>내용</dt><dd>${contentValue}</dd></div>`);
    if (detail.target) rows.push(`<div class="poster-detail-row"><dt>대상</dt><dd>${escapeHtml(detail.target)}</dd></div>`);
    if (detail.location) rows.push(`<div class="poster-detail-row"><dt>장소</dt><dd>${escapeHtml(detail.location)}</dd></div>`);
    if (detail.teacherName) rows.push(`<div class="poster-detail-row"><dt>강사</dt><dd>${escapeHtml(detail.teacherName)}</dd></div>`);

    els.posterDetail.innerHTML = `
      <div class="poster-detail-head">
        <span>${escapeHtml(course.teacher)}</span>
        <strong>${escapeHtml(detail.title || course.title)}</strong>
      </div>
      <dl class="poster-detail-list">${rows.join('')}</dl>`;
  }

  function updatePosterSelectButton() {
    const course = getCourse(state.posterCourseId);
    if (!course) return;
    const selected = state.selected.has(course.id);
    els.posterSelect.disabled = !isCourseOpen(course);
    els.posterSelect.textContent = selected ? '선택 취소하기' : '이 특강 선택하기';
  }

  function closePoster() {
    closeModal(els.posterModal);
    state.posterCourseId = null;
    state.lastFocusedElement?.focus?.();
  }

  function openModal(modal) {
    modal.hidden = false;
    document.body.classList.add('modal-open');
  }

  function closeModal(modal) {
    modal.hidden = true;
    if (els.posterModal.hidden && els.applyModal.hidden) document.body.classList.remove('modal-open');
  }

  function openApply() {
    if (state.selected.size === 0) {
      showToast('먼저 신청할 특강을 한 개 이상 선택해 주세요.', true);
      document.querySelector('#courses')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    state.lastFocusedElement = document.activeElement;
    state.submissionComplete = false;
    els.applicationForm.hidden = false;
    els.successStep.hidden = true;
    els.formFooter.hidden = false;
    $$('.progress-wrap', els.applyModal).forEach(el => { el.hidden = false; });
    renderSelectedCourseList();
    goToStep(1);
    openModal(els.applyModal);
    setTimeout(() => $('[data-close-apply]', els.applyModal)?.focus(), 40);
  }

  function closeApply() {
    if (state.submitting) return;
    closeModal(els.applyModal);
    state.lastFocusedElement?.focus?.();
    if (state.submissionComplete) resetAfterSuccess();
  }

  function renderSelectionControl(course, stored) {
    if (course.sessionMode === 'multi' && course.sessions?.length) {
      const chosen = Array.isArray(stored.sessions) ? stored.sessions : [];
      const items = course.sessions.map(session => `
        <label class="session-option">
          <input type="checkbox" data-session-check="${escapeHtml(course.id)}" value="${escapeHtml(session.key)}" ${chosen.includes(session.key) ? 'checked' : ''} />
          <span><b>${escapeHtml(session.label)} · ${escapeHtml(session.when)}</b><small>${escapeHtml(session.content)}</small></span>
        </label>`).join('');
      return `<div class="selected-course-detail">
          <div class="session-select" role="group" aria-label="${escapeHtml(course.teacher)} 참여 회차 선택">
            <p class="session-select-label">참여할 회차 선택 <em>두 회차 모두 참여 권장 · 복수 선택 가능</em></p>
            ${items}
          </div>
        </div>`;
    }
    if (course.sessionMode === 'choose-one' && course.options?.length) {
      return `<div class="selected-course-detail"><label>참여 시간 선택 <em>동일 내용 · 한 타임만 선택</em><span><select data-course-detail="${escapeHtml(course.id)}" aria-label="${escapeHtml(course.teacher)} 참여 시간 선택" required>
            <option value="">참여 시간을 선택해 주세요</option>
            ${course.options.map(option => `<option value="${escapeHtml(option)}" ${stored.detail === option ? 'selected' : ''}>${escapeHtml(option)}</option>`).join('')}
          </select></span></label></div>`;
    }
    return '';
  }

  function renderSelectedCourseList() {
    const courses = Array.from(state.selected.keys()).map(getCourse).filter(Boolean);
    els.selectedCourseList.innerHTML = courses.map(course => {
      const stored = state.selected.get(course.id) || { detail: '', sessions: [] };
      const optionalControl = renderSelectionControl(course, stored);
      return `
        <article class="selected-course-item" style="--item-accent:${escapeHtml(course.accent)}">
          <div class="selected-course-head">
            <span class="selected-course-avatar">${escapeHtml(course.teacher.replace('T',''))}</span>
            <div><strong>${escapeHtml(course.teacher)}</strong><small>${escapeHtml(course.title)}</small></div>
            <button class="remove-course" type="button" data-remove-course="${escapeHtml(course.id)}" aria-label="${escapeHtml(course.teacher)} 선택 취소">×</button>
          </div>
          <dl class="selected-course-facts">
            <div><dt>대상</dt><dd>${escapeHtml(course.target)}</dd></div>
            <div><dt>일정</dt><dd>${escapeHtml(course.schedule)}</dd></div>
            <div><dt>수강료</dt><dd>${escapeHtml(course.price)}</dd></div>
          </dl>
          ${optionalControl}
        </article>`;
    }).join('');
  }

  function buildMultiDetailString(course, keys) {
    return (course.sessions || [])
      .filter(session => keys.includes(session.key))
      .map(session => `${session.label}(${session.when})`)
      .join(', ');
  }

  function persistCourseDetailsFromForm() {
    Array.from(state.selected.keys()).forEach(id => {
      const course = getCourse(id);
      if (!course) return;
      if (course.sessionMode === 'multi') {
        const checks = $$(`[data-session-check="${id}"]`, els.selectedCourseList);
        if (!checks.length) return;
        const keys = checks.filter(check => check.checked).map(check => check.value);
        state.selected.set(id, { detail: buildMultiDetailString(course, keys), sessions: keys });
      } else if (course.sessionMode === 'choose-one') {
        const control = $(`[data-course-detail="${id}"]`, els.selectedCourseList);
        if (!control) return;
        state.selected.set(id, { detail: control.value.trim(), sessions: [] });
      }
    });
    saveSelection();
  }

  function goToStep(step) {
    state.currentStep = Math.max(1, Math.min(4, step));
    $$('[data-form-step]', els.applyModal).forEach(section => {
      section.classList.toggle('is-active', Number(section.dataset.formStep) === state.currentStep);
      if (section.classList.contains('is-active')) section.scrollTop = 0;
    });
    $$('[data-progress-step]', els.applyModal).forEach(item => {
      const n = Number(item.dataset.progressStep);
      item.classList.toggle('is-active', n === state.currentStep);
      item.classList.toggle('is-done', n < state.currentStep);
    });
    els.progressFill.style.width = `${((state.currentStep - 1) / 3) * 100}%`;
    els.prevStep.hidden = state.currentStep === 1;
    els.nextStep.hidden = state.currentStep === 4;
    els.submitButton.hidden = state.currentStep !== 4;
    if (state.currentStep === 4) buildReview();
  }

  function clearInvalidStates(root = els.applyModal) {
    $$('.field.is-invalid', root).forEach(field => field.classList.remove('is-invalid'));
  }

  function markInvalid(input) {
    input?.closest('.field')?.classList.add('is-invalid');
  }

  function validateStep(step) {
    clearInvalidStates();
    if (step === 1) {
      persistCourseDetailsFromForm();
      const error = $('#course-error');
      if (state.selected.size === 0) {
        error.textContent = '신청할 특강을 한 개 이상 선택해 주세요.';
        return false;
      }
      const missingOption = Array.from(state.selected.keys()).map(getCourse).find(course => {
        if (!course) return false;
        if (course.sessionMode === 'multi') return !(state.selected.get(course.id)?.sessions || []).length;
        if (course.sessionMode === 'choose-one') return !String(state.selected.get(course.id)?.detail || '').trim();
        return false;
      });
      if (missingOption) {
        const isMulti = missingOption.sessionMode === 'multi';
        error.textContent = isMulti
          ? `${missingOption.teacher} 특강의 참여 회차를 한 개 이상 선택해 주세요.`
          : `${missingOption.teacher} 특강의 참여 시간을 선택해 주세요.`;
        const control = isMulti
          ? $(`[data-session-check="${missingOption.id}"]`, els.selectedCourseList)
          : $(`[data-course-detail="${missingOption.id}"]`, els.selectedCourseList);
        control?.focus();
        return false;
      }
      error.textContent = '';
      return true;
    }

    if (step === 2) {
      const error = $('#student-error');
      const name = $('#student-name');
      const school = $('#school');
      const grade = $('#grade');
      const enrollment = $('input[name="enrollmentStatus"]:checked');
      const invalid = [];
      if (!name.value.trim()) { markInvalid(name); invalid.push('학생 이름'); }
      if (!school.value.trim()) { markInvalid(school); invalid.push('학교'); }
      if (!grade.value) { markInvalid(grade); invalid.push('학년'); }
      if (!enrollment) invalid.push('재원생 여부');
      const studentPhone = normalizePhone($('#student-phone').value);
      if (studentPhone && !isValidPhone(studentPhone)) { markInvalid($('#student-phone')); invalid.push('학생 연락처 형식'); }
      error.textContent = invalid.length ? `${invalid.join(', ')} 항목을 확인해 주세요.` : '';
      if (invalid.length) (name.value.trim() ? (school.value.trim() ? grade : school) : name).focus();
      return invalid.length === 0;
    }

    if (step === 3) {
      const error = $('#guardian-error');
      const guardianName = $('#guardian-name');
      const guardianPhone = $('#guardian-phone');
      const consent = $('#privacy-consent');
      const invalid = [];
      if (!guardianName.value.trim()) { markInvalid(guardianName); invalid.push('보호자 성함'); }
      if (!isValidPhone(normalizePhone(guardianPhone.value))) { markInvalid(guardianPhone); invalid.push('보호자 연락처'); }
      if (!consent.checked) invalid.push('개인정보 동의');
      error.textContent = invalid.length ? `${invalid.join(', ')} 항목을 확인해 주세요.` : '';
      if (invalid.length) (guardianName.value.trim() ? guardianPhone : guardianName).focus();
      return invalid.length === 0;
    }

    if (step === 4) {
      const error = $('#review-error');
      const confirmed = $('#final-confirm').checked;
      error.textContent = confirmed ? '' : '신청 내용 확인 항목에 체크해 주세요.';
      return confirmed;
    }
    return true;
  }

  function ensureSubmissionIdentity() {
    if (!state.pendingRequestId) state.pendingRequestId = createRequestId();
    if (!state.pendingReceipt) state.pendingReceipt = createReceiptNumber(state.pendingRequestId);
    return { requestId: state.pendingRequestId, receipt: state.pendingReceipt };
  }

  function collectPayload() {
    persistCourseDetailsFromForm();
    const identity = ensureSubmissionIdentity();
    const selectedCourses = Array.from(state.selected.entries()).map(([id, value]) => {
      const course = getCourse(id);
      return {
        id,
        teacher: course?.teacher || id,
        title: course?.title || '',
        schedule: course?.schedule || '',
        detail: String(value.detail || '').trim(),
        sourceFormUrl: course?.sourceFormUrl || ''
      };
    });
    return {
      requestId: identity.requestId,
      receipt: identity.receipt,
      campaign: APP_CONFIG.campaign || '2026_중등부_여름무료특강_통합신청',
      submittedAtClient: new Date().toISOString(),
      studentName: $('#student-name').value.trim(),
      school: $('#school').value.trim(),
      grade: $('#grade').value,
      enrollmentStatus: $('input[name="enrollmentStatus"]:checked')?.value || '',
      studentPhone: formatPhone($('#student-phone').value),
      guardianName: $('#guardian-name').value.trim(),
      guardianPhone: formatPhone($('#guardian-phone').value),
      courses: selectedCourses,
      memo: $('#memo').value.trim(),
      privacyConsent: $('#privacy-consent').checked,
      website: $('#website-field').value,
      pageUrl: location.href,
      userAgent: navigator.userAgent.slice(0, 500)
    };
  }

  function buildReview() {
    const payload = collectPayload();
    const courseHtml = payload.courses.map(course => `<div class="review-course"><span><b>${escapeHtml(course.teacher)} · ${escapeHtml(course.title)}</b><small>${escapeHtml(course.schedule)}${course.detail ? ` · 선택: ${escapeHtml(course.detail)}` : ''}</small></span></div>`).join('');
    $('#review-card').innerHTML = `
      <section class="review-section"><h3>SELECTED CLASSES</h3>${courseHtml}</section>
      <section class="review-section"><h3>STUDENT</h3><dl>
        <div class="review-row"><dt>학생</dt><dd>${escapeHtml(payload.studentName)}</dd></div>
        <div class="review-row"><dt>학교·학년</dt><dd>${escapeHtml(payload.school)} · ${escapeHtml(payload.grade)}</dd></div>
        <div class="review-row"><dt>재원 여부</dt><dd>${escapeHtml(payload.enrollmentStatus)}</dd></div>
        <div class="review-row"><dt>학생 연락처</dt><dd>${escapeHtml(payload.studentPhone || '미입력')}</dd></div>
      </dl></section>
      <section class="review-section"><h3>GUARDIAN</h3><dl>
        <div class="review-row"><dt>보호자</dt><dd>${escapeHtml(payload.guardianName)}</dd></div>
        <div class="review-row"><dt>연락처</dt><dd>${escapeHtml(payload.guardianPhone)}</dd></div>
        <div class="review-row"><dt>참고사항</dt><dd>${escapeHtml(payload.memo || '없음')}</dd></div>
      </dl></section>`;
  }

  function createRequestId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  }

  function createReceiptNumber(requestId) {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const token = requestId.replace(/[^a-zA-Z0-9]/g, '').slice(-7).toUpperCase().padStart(7, '0');
    return `SUM-${yy}${mm}-${token}`;
  }

  function normalizePhone(value) {
    return String(value || '').replace(/\D/g, '');
  }

  function isValidPhone(digits) {
    return /^(01[016789]\d{7,8}|0\d{8,10})$/.test(digits);
  }

  function formatPhone(value) {
    const digits = normalizePhone(value).slice(0, 11);
    if (digits.startsWith('02')) {
      if (digits.length <= 5) return digits;
      if (digits.length <= 9) return `${digits.slice(0,2)}-${digits.slice(2,5)}-${digits.slice(5)}`;
      return `${digits.slice(0,2)}-${digits.slice(2,6)}-${digits.slice(6)}`;
    }
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0,3)}-${digits.slice(3)}`;
    if (digits.length <= 10) return `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6)}`;
    return `${digits.slice(0,3)}-${digits.slice(3,7)}-${digits.slice(7)}`;
  }

  async function submitApplication(event) {
    event.preventDefault();
    if (state.submitting || !validateStep(4)) return;
    let firstInvalidStep = null;
    for (const step of [1, 2, 3]) {
      if (!validateStep(step)) { firstInvalidStep = step; break; }
    }
    if (firstInvalidStep) {
      goToStep(firstInvalidStep);
      return;
    }
    const endpoint = String(APP_CONFIG.googleScriptUrl || '').trim();
    if (!endpoint || endpoint === PLACEHOLDER_SCRIPT_URL || !/^https:\/\/script\.google\.com\//.test(endpoint)) {
      showToast('구글시트 연동 URL이 아직 설정되지 않았습니다. config.js를 먼저 설정해 주세요.', true, 5200);
      $('#review-error').textContent = '관리자 설정이 완료되지 않아 제출할 수 없습니다. 학원으로 문의해 주세요.';
      return;
    }

    const payload = collectPayload();
    state.submitting = true;
    els.submitButton.disabled = true;
    els.submitButton.classList.add('is-loading');
    $('#review-error').textContent = '';

    try {
      const result = await postToGoogleScript(endpoint, payload);
      if (result && result.success === false) throw new Error(result.message || '신청 접수 중 오류가 발생했습니다.');
      showSuccess(result?.receipt || payload.receipt);
    } catch (error) {
      console.error(error);
      $('#review-error').textContent = error?.message || '신청을 저장하지 못했습니다. 잠시 후 다시 시도하거나 학원으로 문의해 주세요.';
      showToast('신청서 전송에 실패했습니다. 입력 내용은 유지됩니다.', true, 4800);
    } finally {
      state.submitting = false;
      els.submitButton.disabled = false;
      els.submitButton.classList.remove('is-loading');
    }
  }

  async function postToGoogleScript(endpoint, payload) {
    const body = JSON.stringify(payload);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      // Apps Script 응답은 보안상 googleusercontent.com으로 리디렉션됩니다.
      // CORS 영향을 받지 않도록 저장 요청은 no-cors로 보내고, 별도의 JSONP 상태 조회로 실제 저장을 확인합니다.
      await fetch(endpoint, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body,
        redirect: 'follow',
        cache: 'no-store',
        signal: controller.signal
      });
    } catch (error) {
      if (error?.name === 'AbortError') throw new Error('전송 시간이 초과되었습니다. 인터넷 연결을 확인해 주세요.');
      throw new Error('신청서를 전송하지 못했습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.');
    } finally {
      clearTimeout(timeout);
    }

    return pollSubmissionStatus(endpoint, payload.requestId, payload.receipt);
  }

  async function pollSubmissionStatus(endpoint, requestId, fallbackReceipt) {
    const delays = [250, 450, 700, 900, 1200, 1500, 1800, 2200];
    let lastError = null;
    for (const delay of delays) {
      await new Promise(resolve => setTimeout(resolve, delay));
      try {
        const result = await jsonpRequest(endpoint, { action: 'status', requestId, _: Date.now() }, 6500);
        if (result?.state === 'complete') return { ...result, receipt: result.receipt || fallbackReceipt };
        if (result?.state === 'error' || result?.success === false) {
          throw new Error(result?.message || '신청 내용을 저장하지 못했습니다.');
        }
      } catch (error) {
        lastError = error;
        if (error?.message && !/상태 확인|시간이 초과|불러오지/.test(error.message)) throw error;
      }
    }
    throw lastError || new Error('접수 결과를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }

  function jsonpRequest(endpoint, params = {}, timeoutMs = 6500) {
    return new Promise((resolve, reject) => {
      const callback = `__yussamJsonp${Date.now()}${Math.random().toString(36).slice(2, 9)}`;
      const script = document.createElement('script');
      let settled = false;
      const cleanup = () => {
        if (script.parentNode) script.parentNode.removeChild(script);
        try { delete window[callback]; } catch (_) { window[callback] = undefined; }
      };
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error('서버 상태 확인 시간이 초과되었습니다.'));
      }, timeoutMs);

      window[callback] = data => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        cleanup();
        resolve(data);
      };
      script.onerror = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        cleanup();
        reject(new Error('서버 정보를 불러오지 못했습니다.'));
      };

      const url = new URL(endpoint);
      Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)));
      url.searchParams.set('callback', callback);
      script.src = url.toString();
      script.async = true;
      document.head.appendChild(script);
    });
  }

  function showSuccess(receipt) {
    state.submissionComplete = true;
    els.receiptNumber.textContent = receipt;
    els.applicationForm.querySelectorAll('.form-step').forEach(step => step.classList.remove('is-active'));
    els.successStep.hidden = false;
    els.formFooter.hidden = true;
    $('.progress-wrap', els.applyModal).hidden = true;
    els.successStep.scrollTop = 0;
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) { /* ignore */ }
  }

  function resetAfterSuccess() {
    state.selected.clear();
    state.currentStep = 1;
    state.submissionComplete = false;
    state.pendingRequestId = '';
    state.pendingReceipt = '';
    els.applicationForm.reset();
    $('#memo-count').textContent = '0';
    $('#final-confirm').checked = false;
    els.successStep.hidden = true;
    els.formFooter.hidden = false;
    $('.progress-wrap', els.applyModal).hidden = false;
    updateSelectionUI();
  }

  function showToast(message, isError = false, duration = 2600) {
    clearTimeout(showToast.timer);
    els.toast.textContent = message;
    els.toast.classList.toggle('is-error', isError);
    els.toast.classList.add('is-visible');
    showToast.timer = setTimeout(() => els.toast.classList.remove('is-visible'), duration);
  }

  async function loadRemoteConfig() {
    const endpoint = String(APP_CONFIG.googleScriptUrl || '').trim();
    if (!endpoint || endpoint === PLACEHOLDER_SCRIPT_URL || !/^https:\/\/script\.google\.com\//.test(endpoint)) return;
    try {
      const data = await jsonpRequest(endpoint, { action: 'config', _: Date.now() }, 7500);
      if (!Array.isArray(data?.courses) || !data.courses.length) return;
      const previous = new Map(state.selected);
      state.courses = data.courses.map(normalizeRemoteCourse).filter(course => !isRemovedCourse(course)).sort((a,b) => a.sort - b.sort);
      state.selected.clear();
      previous.forEach((value, id) => { if (getCourse(id) && isCourseOpen(getCourse(id))) state.selected.set(id, value); });
      updateSelectionUI();
    } catch (error) {
      console.info('특강 설정은 기본값으로 표시합니다.', error?.message || error);
    }
  }

  function bindEvents() {
    document.addEventListener('click', event => {
      const posterButton = event.target.closest('[data-poster-id]');
      if (posterButton) { openPoster(posterButton.dataset.posterId); return; }
      const selectButton = event.target.closest('[data-select-id]');
      if (selectButton) { toggleSelection(selectButton.dataset.selectId); return; }
      const filterButton = event.target.closest('[data-filter]');
      if (filterButton) {
        state.filter = filterButton.dataset.filter;
        $$('.filter-chip').forEach(button => button.classList.toggle('is-active', button === filterButton));
        renderCourses();
        return;
      }
      const removeButton = event.target.closest('[data-remove-course]');
      if (removeButton) {
        persistCourseDetailsFromForm();
        state.pendingRequestId = '';
        state.pendingReceipt = '';
        state.selected.delete(removeButton.dataset.removeCourse);
        renderSelectedCourseList();
        updateSelectionUI();
        if (state.selected.size === 0) closeApply();
        return;
      }
      const openApplyButton = event.target.closest('[data-open-apply]');
      if (openApplyButton) { openApply(); return; }
      if (event.target.closest('[data-close-poster]')) { closePoster(); return; }
      if (event.target.closest('[data-close-apply]')) {
        const scrollCourses = Boolean(event.target.closest('[data-scroll-courses]'));
        closeApply();
        if (scrollCourses) setTimeout(() => document.querySelector('#courses')?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
    });

    els.posterSelect.addEventListener('click', () => {
      if (!state.posterCourseId) return;
      toggleSelection(state.posterCourseId);
    });

    els.selectedCourseList.addEventListener('change', event => {
      if (!event.target.matches('[data-session-check], [data-course-detail]')) return;
      state.pendingRequestId = '';
      state.pendingReceipt = '';
      persistCourseDetailsFromForm();
      const error = $('#course-error');
      if (error) error.textContent = '';
    });

    els.prevStep.addEventListener('click', () => goToStep(state.currentStep - 1));
    els.nextStep.addEventListener('click', () => {
      if (!validateStep(state.currentStep)) return;
      goToStep(state.currentStep + 1);
    });
    els.applicationForm.addEventListener('submit', submitApplication);
    $('#success-close').addEventListener('click', closeApply);

    ['#student-phone', '#guardian-phone'].forEach(selector => {
      $(selector).addEventListener('input', event => { event.target.value = formatPhone(event.target.value); });
    });
    els.memo.addEventListener('input', () => { els.memoCount.textContent = String(els.memo.value.length); });

    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      if (!els.posterModal.hidden) closePoster();
      else if (!els.applyModal.hidden) closeApply();
    });
  }

  function init() {
    restoreSelection();
    renderCourses();
    updateSelectionUI();
    bindEvents();
    loadRemoteConfig();
  }

  init();
})();
