/**
 * 목동유쌤영어학원 2026 여름특강 통합 신청서
 * Google Apps Script Web App backend
 *
 * 설치 순서
 * 1) 새 Google Sheet → 확장 프로그램 → Apps Script
 * 2) 이 파일 전체를 Code.gs에 붙여넣기
 * 3) setupSpreadsheet 실행 및 권한 승인
 * 4) 배포 → 새 배포 → 웹 앱 (실행: 나 / 액세스: 모든 사용자)
 * 5) 배포 URL을 웹 프로젝트의 config.js에 입력
 */

const APP = Object.freeze({
  TIMEZONE: 'Asia/Seoul',
  SHEET_APPLICATIONS: '신청내역',
  SHEET_ROSTER: '특강별명단',
  SHEET_COURSES: '특강설정',
  SHEET_SETTINGS: '환경설정',
  PROP_SPREADSHEET_ID: 'SUMMER_APPLICATION_SPREADSHEET_ID',
  DEFAULT_STATUS: '신규접수',
  CAMPAIGN: '2026_중등부_여름무료특강_통합신청',
  MAX_BODY_LENGTH: 100000,
  MAX_COURSES_PER_APPLICATION: 7,
  DUPLICATE_LOOKBACK_ROWS: 3000,
});

const APPLICATION_HEADERS = Object.freeze([
  '접수번호', '접수일시', '처리상태',
  '학생명', '학교', '학년', '재원생여부', '학생연락처',
  '보호자성함', '보호자연락처',
  '선택특강ID', '선택특강', '특강일정및세부선택', '선택특강수',
  '상담메모', '개인정보동의', '캠페인',
  '요청ID', '클라이언트제출시각', '페이지URL', 'UserAgent'
]);

const ROSTER_HEADERS = Object.freeze([
  '접수번호', '접수일시', '특강별상태',
  '특강ID', '교사명', '특강명', '일정', '세부선택',
  '학생명', '학교', '학년', '재원생여부', '학생연락처',
  '보호자성함', '보호자연락처', '상담메모',
  '캠페인', '요청ID'
]);

const COURSE_HEADERS = Object.freeze([
  '순서', '사용여부', '특강ID', '교사명', '카드제목',
  '대상', '일정', '수강료', '정원', '상태', '강조색',
  '포스터URL', '기존구글폼URL', '소개문구', '세부선택지(|구분)'
]);

const SETTINGS_HEADERS = Object.freeze(['설정항목', '설정값', '설명']);

const DEFAULT_COURSES = Object.freeze([
  [1, '사용', 'park-chaeyoung', '박채영T', '고1 첫 시험 미리 보기', '중3(예비고1)', '8/5 13:00–14:30 · 8/12 13:00–14:30', '무료', '', '신청가능', '#8b341f', 'assets/posters/park-chaeyoung.webp', 'https://forms.gle/YrHtaTyxc9ZoznDGA', '하남·미강·풍산·미사고 기출을 분석하며 고1 시험을 미리 경험하는 고등 맛보기 특강입니다.', ''],
  [2, '사용', 'kim-jiyeon', '김지연T', '모의고사 어법, 안 틀리는 비법!', '중2~중3', '8/7 14:00–15:30 또는 20:00–21:30', '무료', '', '신청가능', '#6d481c', 'assets/posters/kim-jiyeon.webp', 'https://forms.gle/ZpM8BF1fLcrHm6GX6', '개념은 알지만 문제에서 흔들리는 학생을 위해 고등 모의고사 어법의 출제 원리와 풀이 기준을 정리합니다.', '8/7 14:00–15:30|8/7 20:00–21:30'],
  [3, '사용', 'sun-jaehyun', '선재현T', '끊어 읽으면 해석이 된다', '중2', '8/3 20:00–21:30 · 8/10 20:00–21:30', '무료', '', '신청가능', '#3b3aa3', 'assets/posters/sun-jaehyun.webp', 'https://forms.gle/xk5WHGXeRJHN1HDA8', '문장이 길어질수록 막히는 학생을 위해 문장 구조를 끊어 보고 정확히 해석하는 힘을 기릅니다.', ''],
  [4, '사용', 'lee-seoyoung', '이서영T', '품사가 보이면 문장이 보인다', '초6~중2 기초', '8/5 20:00–21:30', '무료', '', '신청가능', '#06625f', 'assets/posters/lee-seoyoung.webp', 'https://forms.gle/aSSAyu2JmADHRJx56', '모든 문법의 출발점인 품사를 정확히 구분하고 문장 안에서 기능을 읽어 내는 생기초 문법 특강입니다.', ''],
  [5, '사용', 'hong-kyungji', '홍경지T', '처음 보는 단어도 한 번에 읽기', '중1~중3', '7/24 18:00–19:30 · 8/7 18:00–19:30', '무료', '', '신청가능', '#5a205d', 'assets/posters/hong-kyungji.webp', 'https://forms.gle/ePSG5yBjnFo3xAZAA', '단어를 무작정 외우는 대신 철자와 구조를 읽어 처음 보는 어휘도 스스로 해독하는 힘을 기릅니다.', ''],
  [6, '사용', 'bae-seunghee', '배승희T', '중등, 문법을 먼저 잡다', '초6', '8/4 13:30–15:00 · 8/6 13:30–15:00', '무료', '', '신청가능', '#8b1d4b', 'assets/posters/bae-seunghee.webp', 'https://forms.gle/v9EDdoBHyJQ6vm7bA', '심화·상위 과정에 필요한 핵심 문법 두 영역을 먼저 완성해 중등 영어의 기반을 단단히 잡습니다.', ''],
  [7, '사용', 'lee-seunghee', '이승희T', '해석이 빨라지는 주어 & 동사 찾기', '중1~중2 하위권', '7/22 17:00–18:30', '무료', '', '신청가능', '#0a5478', 'assets/posters/lee-seunghee.webp', 'https://forms.gle/pXHrSNVktU5fA4Zn7', '수식어가 길어질 때 해석이 흐려지는 학생을 위해 문장의 중심인 주어와 동사를 빠르게 찾는 법을 익힙니다.', '']
]);

/** 최초 1회 실행: 현재 스프레드시트를 신청서 DB로 초기화합니다. */
function setupSpreadsheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('Google Sheet에서 확장 프로그램 → Apps Script로 연 뒤 실행해 주세요.');
  }

  PropertiesService.getScriptProperties().setProperty(APP.PROP_SPREADSHEET_ID, spreadsheet.getId());
  spreadsheet.setSpreadsheetTimeZone(APP.TIMEZONE);

  const applicationSheet = ensureSheet_(spreadsheet, APP.SHEET_APPLICATIONS, APPLICATION_HEADERS);
  const rosterSheet = ensureSheet_(spreadsheet, APP.SHEET_ROSTER, ROSTER_HEADERS);
  const courseSheet = ensureSheet_(spreadsheet, APP.SHEET_COURSES, COURSE_HEADERS);
  const settingsSheet = ensureSheet_(spreadsheet, APP.SHEET_SETTINGS, SETTINGS_HEADERS);

  seedCourses_(courseSheet);
  seedSettings_(settingsSheet);
  formatApplicationSheet_(applicationSheet);
  formatRosterSheet_(rosterSheet);
  formatCourseSheet_(courseSheet);
  formatSettingsSheet_(settingsSheet);

  spreadsheet.setActiveSheet(applicationSheet);
  SpreadsheetApp.flush();

  SpreadsheetApp.getUi().alert(
    '초기 설정 완료',
    '신청내역 · 특강별명단 · 특강설정 · 환경설정 시트가 준비되었습니다.\n이제 배포 → 새 배포 → 웹 앱으로 배포해 주세요.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/** 브라우저에서 특강 카드 설정·접수 상태·연결 상태를 확인합니다. */
function doGet(e) {
  try {
    const action = cleanText_(e && e.parameter && e.parameter.action, 40).toLowerCase();
    if (action === 'config') {
      return dataResponse_({
        success: true,
        campaign: APP.CAMPAIGN,
        generatedAt: new Date().toISOString(),
        courses: getPublicCourseConfig_()
      }, e);
    }

    if (action === 'status') {
      const requestId = cleanText_(e && e.parameter && e.parameter.requestId, 100);
      if (!requestId) return dataResponse_({ success: false, message: '요청 식별값이 없습니다.' }, e);

      const cached = getCachedSubmissionStatus_(requestId);
      if (cached) return dataResponse_(cached, e);

      // 캐시가 만료되었거나 지연된 경우 시트에서 한 번 더 확인합니다.
      const spreadsheet = openDatabase_();
      const sheet = getRequiredSheet_(spreadsheet, APP.SHEET_APPLICATIONS);
      const receipt = findReceiptByRequestId_(sheet, requestId);
      if (receipt) return dataResponse_({ success: true, state: 'complete', receipt: receipt }, e);
      return dataResponse_({ success: true, state: 'pending' }, e);
    }

    return dataResponse_({
      success: true,
      service: '목동유쌤영어학원 여름특강 통합 신청서',
      status: 'ready',
      now: Utilities.formatDate(new Date(), APP.TIMEZONE, 'yyyy-MM-dd HH:mm:ss')
    }, e);
  } catch (error) {
    console.error(error);
    return dataResponse_({ success: false, message: safeErrorMessage_(error) }, e);
  }
}

/** 웹페이지 신청서를 Google Sheet에 저장합니다. */
function doPost(e) {
  const lock = LockService.getScriptLock();
  let requestIdForStatus = '';
  try {
    lock.waitLock(12000);

    const rawBody = e && e.postData && e.postData.contents ? String(e.postData.contents) : '';
    if (!rawBody || rawBody.length > APP.MAX_BODY_LENGTH) {
      return jsonResponse_({ success: false, message: '신청 데이터가 비어 있거나 허용 범위를 초과했습니다.' });
    }

    let payload;
    try {
      payload = JSON.parse(rawBody);
      requestIdForStatus = cleanText_(payload && payload.requestId, 100);
    } catch (_) {
      return jsonResponse_({ success: false, message: '신청 데이터 형식을 확인해 주세요.' });
    }

    // 화면에 보이지 않는 봇 방지 필드입니다. 값이 있으면 저장하지 않습니다.
    if (cleanText_(payload.website, 200)) {
      const botResponse = { success: true, state: 'complete', receipt: cleanText_(payload.receipt, 60) || '접수완료' };
      cacheSubmissionStatus_(requestIdForStatus, botResponse);
      return jsonResponse_(botResponse);
    }

    const normalized = normalizeAndValidateApplication_(payload);
    requestIdForStatus = normalized.requestId;
    const spreadsheet = openDatabase_();
    const applicationSheet = getRequiredSheet_(spreadsheet, APP.SHEET_APPLICATIONS);
    const rosterSheet = getRequiredSheet_(spreadsheet, APP.SHEET_ROSTER);

    const duplicateReceipt = findReceiptByRequestId_(applicationSheet, normalized.requestId);
    if (duplicateReceipt) {
      const duplicateResponse = { success: true, state: 'complete', duplicate: true, receipt: duplicateReceipt };
      cacheSubmissionStatus_(requestIdForStatus, duplicateResponse);
      return jsonResponse_(duplicateResponse);
    }

    const coursesById = getCoursesById_(spreadsheet);
    validateSelectedCourses_(normalized.courses, coursesById);
    normalized.courses = hydrateSelectedCourses_(normalized.courses, coursesById);
    validateCapacities_(applicationSheet, normalized.courses, coursesById);

    const now = new Date();
    const receipt = normalized.receipt || createServerReceipt_(now);
    const row = buildApplicationRow_(normalized, receipt, now);
    applicationSheet.appendRow(row);
    const rowNumber = applicationSheet.getLastRow();
    applicationSheet.getRange(rowNumber, 2).setNumberFormat('yyyy-mm-dd hh:mm:ss');
    applicationSheet.getRange(rowNumber, 3).setDataValidation(statusValidation_());
    appendRosterRows_(rosterSheet, normalized, receipt, now);
    SpreadsheetApp.flush();

    notifyByEmail_(spreadsheet, normalized, receipt, now);

    const successResponse = {
      success: true,
      state: 'complete',
      receipt: receipt,
      receivedAt: Utilities.formatDate(now, APP.TIMEZONE, 'yyyy-MM-dd HH:mm:ss')
    };
    cacheSubmissionStatus_(requestIdForStatus, successResponse);
    return jsonResponse_(successResponse);
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    const errorResponse = { success: false, state: 'error', message: safeErrorMessage_(error) };
    cacheSubmissionStatus_(requestIdForStatus, errorResponse);
    return jsonResponse_(errorResponse);
  } finally {
    try { lock.releaseLock(); } catch (_) { /* lock was not acquired */ }
  }
}

function normalizeAndValidateApplication_(payload) {
  const courses = Array.isArray(payload.courses) ? payload.courses.slice(0, APP.MAX_COURSES_PER_APPLICATION) : [];
  const normalized = {
    requestId: cleanText_(payload.requestId, 100),
    receipt: cleanText_(payload.receipt, 60),
    campaign: cleanText_(payload.campaign, 100) || APP.CAMPAIGN,
    submittedAtClient: cleanText_(payload.submittedAtClient, 80),
    studentName: cleanText_(payload.studentName, 40),
    school: cleanText_(payload.school, 80),
    grade: cleanText_(payload.grade, 30),
    enrollmentStatus: cleanText_(payload.enrollmentStatus, 30),
    studentPhone: normalizePhone_(payload.studentPhone),
    guardianName: cleanText_(payload.guardianName, 40),
    guardianPhone: normalizePhone_(payload.guardianPhone),
    memo: cleanText_(payload.memo, 1000),
    privacyConsent: payload.privacyConsent === true || String(payload.privacyConsent).toLowerCase() === 'true',
    pageUrl: cleanText_(payload.pageUrl, 500),
    userAgent: cleanText_(payload.userAgent, 500),
    courses: courses.map(function(course) {
      return {
        id: cleanText_(course && course.id, 80),
        teacher: cleanText_(course && course.teacher, 60),
        title: cleanText_(course && course.title, 160),
        schedule: cleanText_(course && course.schedule, 180),
        detail: cleanText_(course && course.detail, 180),
        sourceFormUrl: cleanText_(course && course.sourceFormUrl, 500)
      };
    }).filter(function(course) { return course.id; })
  };

  if (!normalized.requestId) throw new Error('요청 식별값이 없습니다. 페이지를 새로고침한 뒤 다시 신청해 주세요.');
  if (!normalized.studentName) throw new Error('학생 이름을 입력해 주세요.');
  if (!normalized.school) throw new Error('학교를 입력해 주세요.');
  if (!normalized.grade) throw new Error('학년을 선택해 주세요.');
  if (!normalized.enrollmentStatus) throw new Error('학생 구분을 선택해 주세요.');
  if (!normalized.guardianName) throw new Error('보호자 성함을 입력해 주세요.');
  if (!isValidPhone_(normalized.guardianPhone)) throw new Error('보호자 연락처를 정확히 입력해 주세요.');
  if (normalized.studentPhone && !isValidPhone_(normalized.studentPhone)) throw new Error('학생 연락처 형식을 확인해 주세요.');
  if (!normalized.privacyConsent) throw new Error('개인정보 수집·이용 동의가 필요합니다.');
  if (normalized.courses.length < 1) throw new Error('신청할 특강을 한 개 이상 선택해 주세요.');

  const unique = {};
  normalized.courses = normalized.courses.filter(function(course) {
    if (unique[course.id]) return false;
    unique[course.id] = true;
    return true;
  });
  return normalized;
}

function buildApplicationRow_(data, receipt, now) {
  const selectedIds = data.courses.map(function(course) { return course.id; }).join(' | ');
  const selectedNames = data.courses.map(function(course) {
    return [course.teacher, course.title && course.title !== course.teacher ? course.title : ''].filter(Boolean).join(' · ');
  }).join(' | ');
  const details = data.courses.map(function(course) {
    const base = course.teacher + ' · ' + course.title + ' / ' + course.schedule;
    return base + (course.detail ? ' / 선택: ' + course.detail : '');
  }).join(' | ');

  return [
    receipt,
    now,
    APP.DEFAULT_STATUS,
    safeCell_(data.studentName),
    safeCell_(data.school),
    safeCell_(data.grade),
    safeCell_(data.enrollmentStatus),
    safeCell_(formatPhone_(data.studentPhone)),
    safeCell_(data.guardianName),
    safeCell_(formatPhone_(data.guardianPhone)),
    safeCell_(selectedIds),
    safeCell_(selectedNames),
    safeCell_(details),
    data.courses.length,
    safeCell_(data.memo),
    data.privacyConsent ? '동의' : '미동의',
    safeCell_(data.campaign),
    safeCell_(data.requestId),
    safeCell_(data.submittedAtClient),
    safeCell_(data.pageUrl),
    safeCell_(data.userAgent)
  ];
}

/** 통합 신청 1건을 특강별로 한 행씩 펼쳐 운영 명단에 기록합니다. */
function appendRosterRows_(sheet, data, receipt, now) {
  if (!data.courses || !data.courses.length) return;
  const rows = data.courses.map(function(course) {
    return [
      receipt,
      now,
      APP.DEFAULT_STATUS,
      safeCell_(course.id),
      safeCell_(course.teacher),
      safeCell_(course.title),
      safeCell_(course.schedule),
      safeCell_(course.detail),
      safeCell_(data.studentName),
      safeCell_(data.school),
      safeCell_(data.grade),
      safeCell_(data.enrollmentStatus),
      safeCell_(formatPhone_(data.studentPhone)),
      safeCell_(data.guardianName),
      safeCell_(formatPhone_(data.guardianPhone)),
      safeCell_(data.memo),
      safeCell_(data.campaign),
      safeCell_(data.requestId)
    ];
  });

  const startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, rows.length, ROSTER_HEADERS.length).setValues(rows);
  sheet.getRange(startRow, 2, rows.length, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
  sheet.getRange(startRow, 3, rows.length, 1).setDataValidation(statusValidation_());
}


function getPublicCourseConfig_() {
  const spreadsheet = openDatabase_();
  const sheet = getRequiredSheet_(spreadsheet, APP.SHEET_COURSES);
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return [];

  const indexes = headerIndexMap_(values[0]);
  return values.slice(1).filter(function(row) {
    return cleanText_(row[indexes['특강ID']], 80);
  }).map(function(row) {
    const activeText = cleanText_(row[indexes['사용여부']], 20).toLowerCase();
    const capacityText = cleanText_(row[indexes['정원']], 20);
    return {
      sort: Number(row[indexes['순서']]) || 999,
      active: !['미사용', '아니오', 'false', '0', 'off'].includes(activeText),
      id: cleanText_(row[indexes['특강ID']], 80),
      teacher: cleanText_(row[indexes['교사명']], 60),
      title: cleanText_(row[indexes['카드제목']], 160),
      target: cleanText_(row[indexes['대상']], 160),
      schedule: cleanText_(row[indexes['일정']], 160),
      price: cleanText_(row[indexes['수강료']], 100),
      capacity: capacityText ? Number(capacityText) || '' : '',
      status: cleanText_(row[indexes['상태']], 30) || '신청가능',
      accent: cleanText_(row[indexes['강조색']], 30),
      posterUrl: cleanText_(row[indexes['포스터URL']], 500),
      sourceFormUrl: cleanText_(row[indexes['기존구글폼URL']], 500),
      description: cleanText_(row[indexes['소개문구']], 500),
      options: cleanText_(row[indexes['세부선택지(|구분)']], 1000)
        .split('|').map(function(item) { return item.trim(); }).filter(Boolean)
    };
  }).sort(function(a, b) { return a.sort - b.sort; });
}

function getCoursesById_(spreadsheet) {
  const sheet = getRequiredSheet_(spreadsheet, APP.SHEET_COURSES);
  const values = sheet.getDataRange().getDisplayValues();
  const map = {};
  if (values.length < 2) return map;
  const indexes = headerIndexMap_(values[0]);

  values.slice(1).forEach(function(row) {
    const id = cleanText_(row[indexes['특강ID']], 80);
    if (!id) return;
    const activeText = cleanText_(row[indexes['사용여부']], 20).toLowerCase();
    map[id] = {
      id: id,
      teacher: cleanText_(row[indexes['교사명']], 60),
      title: cleanText_(row[indexes['카드제목']], 160),
      schedule: cleanText_(row[indexes['일정']], 180),
      active: !['미사용', '아니오', 'false', '0', 'off'].includes(activeText),
      status: cleanText_(row[indexes['상태']], 30) || '신청가능',
      capacity: Number(cleanText_(row[indexes['정원']], 20)) || 0
    };
  });
  return map;
}

function validateSelectedCourses_(selectedCourses, coursesById) {
  const closedStatuses = ['마감', '신청마감', '종료', '비활성'];
  selectedCourses.forEach(function(selected) {
    const current = coursesById[selected.id];
    if (!current) throw new Error('현재 신청 목록에서 확인되지 않는 특강이 포함되어 있습니다. 페이지를 새로고침해 주세요.');
    if (!current.active || closedStatuses.includes(current.status)) {
      throw new Error(current.teacher + ' 특강은 현재 신청이 마감되었습니다.');
    }
  });
}

function hydrateSelectedCourses_(selectedCourses, coursesById) {
  return selectedCourses.map(function(selected) {
    const current = coursesById[selected.id];
    return {
      id: selected.id,
      teacher: current.teacher,
      title: current.title,
      schedule: current.schedule,
      detail: selected.detail,
      sourceFormUrl: selected.sourceFormUrl
    };
  });
}

function validateCapacities_(applicationSheet, selectedCourses, coursesById) {
  const capacityCourses = selectedCourses.filter(function(selected) {
    return coursesById[selected.id] && coursesById[selected.id].capacity > 0;
  });
  if (!capacityCourses.length || applicationSheet.getLastRow() < 2) return;

  const header = applicationSheet.getRange(1, 1, 1, applicationSheet.getLastColumn()).getDisplayValues()[0];
  const indexes = headerIndexMap_(header);
  const idColumn = indexes['선택특강ID'] + 1;
  const statusColumn = indexes['처리상태'] + 1;
  const rowCount = applicationSheet.getLastRow() - 1;
  const ids = applicationSheet.getRange(2, idColumn, rowCount, 1).getDisplayValues();
  const statuses = applicationSheet.getRange(2, statusColumn, rowCount, 1).getDisplayValues();
  const excluded = ['취소', '등록취소', '중복', '삭제'];

  capacityCourses.forEach(function(selected) {
    let count = 0;
    for (let i = 0; i < ids.length; i += 1) {
      if (excluded.includes(cleanText_(statuses[i][0], 30))) continue;
      const registered = String(ids[i][0] || '').split('|').map(function(item) { return item.trim(); });
      if (registered.includes(selected.id)) count += 1;
    }
    const course = coursesById[selected.id];
    if (count >= course.capacity) {
      throw new Error(course.teacher + ' 특강은 정원이 마감되었습니다. 학원으로 문의해 주세요.');
    }
  });
}

function findReceiptByRequestId_(sheet, requestId) {
  if (!requestId || sheet.getLastRow() < 2) return '';
  const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  const indexes = headerIndexMap_(header);
  const requestColumn = indexes['요청ID'] + 1;
  const receiptColumn = indexes['접수번호'] + 1;
  const lastRow = sheet.getLastRow();
  const startRow = Math.max(2, lastRow - APP.DUPLICATE_LOOKBACK_ROWS + 1);
  const rowCount = lastRow - startRow + 1;
  const requests = sheet.getRange(startRow, requestColumn, rowCount, 1).getDisplayValues();
  const receipts = sheet.getRange(startRow, receiptColumn, rowCount, 1).getDisplayValues();
  for (let i = requests.length - 1; i >= 0; i -= 1) {
    if (String(requests[i][0] || '') === requestId) return String(receipts[i][0] || '');
  }
  return '';
}

function notifyByEmail_(spreadsheet, data, receipt, now) {
  try {
    const settings = getSettings_(spreadsheet);
    const recipient = cleanText_(settings['알림 이메일'], 200);
    if (!recipient || recipient.indexOf('@') < 1) return;

    const courseLines = data.courses.map(function(course) {
      return '- ' + course.teacher + ' · ' + course.title + ' / ' + course.schedule + (course.detail ? ' / 선택: ' + course.detail : '');
    }).join('\n');
    const subject = '[여름특강 신규신청] ' + data.studentName + ' · ' + data.courses.length + '개 특강';
    const body = [
      '접수번호: ' + receipt,
      '접수시각: ' + Utilities.formatDate(now, APP.TIMEZONE, 'yyyy-MM-dd HH:mm:ss'),
      '',
      '학생: ' + data.studentName + ' / ' + data.school + ' / ' + data.grade,
      '학생구분: ' + data.enrollmentStatus,
      '보호자: ' + data.guardianName + ' / ' + formatPhone_(data.guardianPhone),
      '',
      '[선택 특강]',
      courseLines,
      '',
      '[상담 메모]',
      data.memo || '없음'
    ].join('\n');
    MailApp.sendEmail(recipient, subject, body);
  } catch (error) {
    console.warn('이메일 알림은 생략되었습니다: ' + safeErrorMessage_(error));
  }
}

function getSettings_(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(APP.SHEET_SETTINGS);
  const map = {};
  if (!sheet || sheet.getLastRow() < 2) return map;
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getDisplayValues();
  values.forEach(function(row) {
    const key = cleanText_(row[0], 100);
    if (key) map[key] = cleanText_(row[1], 500);
  });
  return map;
}

/** 특강설정 시트를 첨부 포스터 기준 기본값으로 다시 채웁니다. 기존 수정값은 삭제되므로 필요한 경우에만 실행하세요. */
function resetCourseSettingsToDefaults() {
  const spreadsheet = openDatabase_();
  const sheet = getRequiredSheet_(spreadsheet, APP.SHEET_COURSES);
  if (sheet.getLastRow() > 1) sheet.getRange(2, 1, sheet.getLastRow() - 1, COURSE_HEADERS.length).clearContent();
  sheet.getRange(2, 1, DEFAULT_COURSES.length, COURSE_HEADERS.length).setValues(DEFAULT_COURSES);
  formatCourseSheet_(sheet);
  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert('특강 기본값 복원 완료', '7개 무료특강 정보가 첨부 포스터 기준으로 다시 입력되었습니다.', SpreadsheetApp.getUi().ButtonSet.OK);
}

function seedCourses_(sheet) {
  if (sheet.getLastRow() > 1) return;
  sheet.getRange(2, 1, DEFAULT_COURSES.length, COURSE_HEADERS.length).setValues(DEFAULT_COURSES);
}

function seedSettings_(sheet) {
  if (sheet.getLastRow() > 1) return;
  const rows = [
    ['캠페인명', APP.CAMPAIGN, '신청내역에 함께 저장되는 구분값'],
    ['대표전화', '031-794-3306', '웹페이지 하단 문의 전화'],
    ['알림 이메일', '', '입력 시 신규 신청 이메일 알림 발송(선택)'],
    ['운영메모', '특강설정 시트에서 대상·일정·정원·마감상태를 수정하세요.', '관리자 참고용']
  ];
  sheet.getRange(2, 1, rows.length, SETTINGS_HEADERS.length).setValues(rows);
}

function ensureSheet_(spreadsheet, name, headers) {
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);
  if (sheet.getMaxColumns() < headers.length) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), headers.length - sheet.getMaxColumns());
  }
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  return sheet;
}

function formatApplicationSheet_(sheet) {
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, APPLICATION_HEADERS.length)
    .setBackground('#10244A').setFontColor('#FFFFFF').setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  sheet.setRowHeight(1, 34);
  sheet.getRange('A:A').setNumberFormat('@');
  sheet.getRange('B:B').setNumberFormat('yyyy-mm-dd hh:mm:ss');
  sheet.getRange('C:C').setDataValidation(statusValidation_());
  sheet.getRange('H:J').setNumberFormat('@');
  sheet.setColumnWidth(1, 145);
  sheet.setColumnWidth(2, 150);
  sheet.setColumnWidth(3, 95);
  sheet.setColumnWidth(4, 95);
  sheet.setColumnWidth(5, 115);
  sheet.setColumnWidth(6, 75);
  sheet.setColumnWidth(7, 95);
  sheet.setColumnWidths(8, 3, 125);
  sheet.setColumnWidth(11, 210);
  sheet.setColumnWidth(12, 290);
  sheet.setColumnWidth(13, 330);
  sheet.setColumnWidth(15, 280);
  sheet.setColumnWidth(18, 260);
  sheet.getRange(1, 1, Math.max(sheet.getMaxRows(), 2), APPLICATION_HEADERS.length).setVerticalAlignment('middle');

  const statusRange = sheet.getRange(2, 3, Math.max(sheet.getMaxRows() - 1, 1), 1);
  const rules = [
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('신규접수').setBackground('#FFF2CC').setRanges([statusRange]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('상담완료').setBackground('#D9EAD3').setRanges([statusRange]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('등록완료').setBackground('#CFE2F3').setRanges([statusRange]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('취소').setBackground('#F4CCCC').setRanges([statusRange]).build()
  ];
  sheet.setConditionalFormatRules(rules);
  if (!sheet.getFilter()) sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 1), APPLICATION_HEADERS.length).createFilter();
}

function formatRosterSheet_(sheet) {
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, ROSTER_HEADERS.length)
    .setBackground('#0B6170').setFontColor('#FFFFFF').setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  sheet.setRowHeight(1, 34);
  sheet.getRange('A:A').setNumberFormat('@');
  sheet.getRange('B:B').setNumberFormat('yyyy-mm-dd hh:mm:ss');
  sheet.getRange('C:C').setDataValidation(statusValidation_());
  sheet.getRange('M:O').setNumberFormat('@');
  sheet.setColumnWidth(1, 145);
  sheet.setColumnWidth(2, 150);
  sheet.setColumnWidth(3, 100);
  sheet.setColumnWidth(4, 145);
  sheet.setColumnWidth(5, 90);
  sheet.setColumnWidth(6, 220);
  sheet.setColumnWidth(7, 250);
  sheet.setColumnWidth(8, 180);
  sheet.setColumnWidth(9, 95);
  sheet.setColumnWidth(10, 120);
  sheet.setColumnWidth(11, 75);
  sheet.setColumnWidth(12, 95);
  sheet.setColumnWidths(13, 3, 125);
  sheet.setColumnWidth(16, 280);
  sheet.setColumnWidth(17, 210);
  sheet.setColumnWidth(18, 260);
  sheet.getRange(1, 1, Math.max(sheet.getMaxRows(), 2), ROSTER_HEADERS.length).setVerticalAlignment('middle');

  const statusRange = sheet.getRange(2, 3, Math.max(sheet.getMaxRows() - 1, 1), 1);
  const rules = [
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('신규접수').setBackground('#FFF2CC').setRanges([statusRange]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('상담완료').setBackground('#D9EAD3').setRanges([statusRange]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('등록완료').setBackground('#CFE2F3').setRanges([statusRange]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('취소').setBackground('#F4CCCC').setRanges([statusRange]).build()
  ];
  sheet.setConditionalFormatRules(rules);
  if (!sheet.getFilter()) sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 1), ROSTER_HEADERS.length).createFilter();
}

function formatCourseSheet_(sheet) {
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, COURSE_HEADERS.length)
    .setBackground('#B9934F').setFontColor('#FFFFFF').setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  sheet.setRowHeight(1, 34);
  sheet.setColumnWidth(1, 60);
  sheet.setColumnWidth(2, 80);
  sheet.setColumnWidth(3, 140);
  sheet.setColumnWidth(4, 90);
  sheet.setColumnWidth(5, 210);
  sheet.setColumnWidths(6, 4, 155);
  sheet.setColumnWidth(10, 100);
  sheet.setColumnWidth(11, 90);
  sheet.setColumnWidths(12, 2, 300);
  sheet.setColumnWidth(14, 360);
  sheet.setColumnWidth(15, 280);
  sheet.getRange('A:A').setNumberFormat('0');
  sheet.getRange('I:I').setNumberFormat('0');
  sheet.getRange(2, 2, Math.max(sheet.getMaxRows() - 1, 1), 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['사용', '미사용'], true).setAllowInvalid(false).build()
  );
  sheet.getRange(2, 10, Math.max(sheet.getMaxRows() - 1, 1), 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['신청가능', '마감임박', '대기접수', '마감'], true).setAllowInvalid(true).build()
  );
  if (!sheet.getFilter()) sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 1), COURSE_HEADERS.length).createFilter();
}

function formatSettingsSheet_(sheet) {
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, SETTINGS_HEADERS.length)
    .setBackground('#E9E2D4').setFontColor('#10244A').setFontWeight('bold')
    .setHorizontalAlignment('center');
  sheet.setRowHeight(1, 34);
  sheet.setColumnWidth(1, 140);
  sheet.setColumnWidth(2, 280);
  sheet.setColumnWidth(3, 430);
}

function statusValidation_() {
  return SpreadsheetApp.newDataValidation()
    .requireValueInList(['신규접수', '상담중', '상담완료', '등록완료', '대기', '취소'], true)
    .setAllowInvalid(true)
    .build();
}

function openDatabase_() {
  const id = PropertiesService.getScriptProperties().getProperty(APP.PROP_SPREADSHEET_ID);
  if (!id) throw new Error('관리자가 아직 Google Sheet 초기 설정을 완료하지 않았습니다. setupSpreadsheet를 먼저 실행해 주세요.');
  return SpreadsheetApp.openById(id);
}

function getRequiredSheet_(spreadsheet, name) {
  const sheet = spreadsheet.getSheetByName(name);
  if (!sheet) throw new Error(name + ' 시트를 찾을 수 없습니다. setupSpreadsheet를 다시 실행해 주세요.');
  return sheet;
}

function headerIndexMap_(headers) {
  const map = {};
  headers.forEach(function(header, index) { map[String(header).trim()] = index; });
  return map;
}

function dataResponse_(payload, e) {
  const callback = cleanText_(e && e.parameter && e.parameter.callback, 120);
  if (callback && /^[A-Za-z_$][0-9A-Za-z_$]{0,119}$/.test(callback)) {
    return ContentService.createTextOutput(callback + '(' + JSON.stringify(payload) + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return jsonResponse_(payload);
}

function cacheSubmissionStatus_(requestId, payload) {
  if (!requestId) return;
  try {
    CacheService.getScriptCache().put('submission:' + requestId, JSON.stringify(payload), 600);
  } catch (error) {
    console.warn('접수 상태 캐시는 생략되었습니다: ' + safeErrorMessage_(error));
  }
}

function getCachedSubmissionStatus_(requestId) {
  if (!requestId) return null;
  try {
    const value = CacheService.getScriptCache().get('submission:' + requestId);
    return value ? JSON.parse(value) : null;
  } catch (_) {
    return null;
  }
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function cleanText_(value, maxLength) {
  const text = value == null ? '' : String(value);
  return text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, maxLength || 1000);
}

function safeCell_(value) {
  const text = cleanText_(value, 5000);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function normalizePhone_(value) {
  return String(value == null ? '' : value).replace(/\D/g, '').slice(0, 11);
}

function isValidPhone_(digits) {
  return /^(01[016789]\d{7,8}|0\d{8,10})$/.test(String(digits || ''));
}

function formatPhone_(digits) {
  const value = normalizePhone_(digits);
  if (!value) return '';
  if (value.indexOf('02') === 0) {
    if (value.length === 9) return value.slice(0, 2) + '-' + value.slice(2, 5) + '-' + value.slice(5);
    if (value.length >= 10) return value.slice(0, 2) + '-' + value.slice(2, 6) + '-' + value.slice(6);
  }
  if (value.length === 10) return value.slice(0, 3) + '-' + value.slice(3, 6) + '-' + value.slice(6);
  if (value.length === 11) return value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7);
  return value;
}

function createServerReceipt_(date) {
  const stamp = Utilities.formatDate(date, APP.TIMEZONE, 'yyMMdd-HHmmss');
  const token = Utilities.getUuid().replace(/-/g, '').slice(0, 5).toUpperCase();
  return 'SUM-' + stamp + '-' + token;
}

function safeErrorMessage_(error) {
  const message = error && error.message ? String(error.message) : '신청 처리 중 오류가 발생했습니다.';
  if (/Exception:|Service invoked|권한|authorization/i.test(message)) {
    return '관리자 설정 또는 권한을 확인해 주세요.';
  }
  return cleanText_(message, 300) || '신청 처리 중 오류가 발생했습니다.';
}
