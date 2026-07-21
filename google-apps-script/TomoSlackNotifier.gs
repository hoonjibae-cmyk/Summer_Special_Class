/**
 * 토모 일정 → 슬랙 자동 알림 (Google Apps Script)
 *
 * 기능 요약
 * - 구글 캘린더 iCal(.ics) 비공개 주소를 매일 읽어옵니다.
 * - 제목이 '토모-xxx' 형식인 일정이 "오늘" 잡혀 있으면
 * - 매일 오전 10시경 지정한 슬랙 채널로 [토모 관리 유의 사항] 문구를 보냅니다.
 * - 오늘 토모 일정이 없으면 아무 메시지도 보내지 않습니다.
 *
 * ─────────────────────────────────────────────────────────────
 * 설치 순서 (최초 1회)
 * 1) 이 파일을 Apps Script 프로젝트에 추가합니다.
 *    (기존 Code.gs와 같은 프로젝트에 넣으면 됩니다. 파일이 자동으로 합쳐집니다.)
 * 2) 아래 setupTomoNotifier() 안의 config 값을 채운 뒤 setupTomoNotifier 를 1회 실행합니다.
 *    - 실행하면 값이 Script Properties(비공개 저장소)에 저장되고,
 *      매일 오전 10시 트리거가 자동 설치됩니다.
 *    - 저장 후에는 코드에 적어둔 값을 지워도 동작합니다. (저장소에 커밋하지 마세요.)
 * 3) testTomoDailyReminder 를 실행해 슬랙으로 실제 발송되는지 확인합니다.
 *
 * 슬랙 연결 방식 (둘 중 하나)
 * - (권장) Incoming Webhook: 슬랙 앱에서 특정 채널용 Webhook URL을 발급받아 slackWebhookUrl에 입력.
 *   채널은 Webhook 생성 시 고정됩니다.
 * - Bot Token: chat:write 권한이 있는 봇 토큰(xoxb-...)을 slackBotToken에,
 *   보낼 채널(#채널명 또는 채널ID)을 slackChannel에 입력. (봇을 채널에 초대해야 합니다.)
 * ─────────────────────────────────────────────────────────────
 */

const TOMO = Object.freeze({
  TIMEZONE: 'Asia/Seoul',
  TRIGGER_HANDLER: 'sendTomoDailyReminder',
  TRIGGER_HOUR: 10, // 오전 10시 (해당 시간대 09:xx~10:xx 사이 실행)
  PROP_ICAL_URL: 'TOMO_ICAL_URL',
  PROP_SLACK_WEBHOOK: 'TOMO_SLACK_WEBHOOK_URL',
  PROP_SLACK_BOT_TOKEN: 'TOMO_SLACK_BOT_TOKEN',
  PROP_SLACK_CHANNEL: 'TOMO_SLACK_CHANNEL',
  RRULE_MAX_SCAN_DAYS: 15000, // 반복 일정 전개 시 스캔 상한(약 41년)
});

/** 슬랙으로 보낼 본문 문구. */
const TOMO_MESSAGE = [
  '[토모 관리 유의 사항]',
  '아래 예시에 해당하는 경우, 이 글에 댓글 달아서 보고하세요.',
  '',
  '• 토모 시작 후 듣기를 5분이 지나서 튼 경우',
  '• 스피커 연결이 안 되어서 딜레이 된 경우',
  '• 중간에 학생이 퇴실한 경우',
  '• 시작 시간 이후에 학생이 입실한 경우',
  '• 한 번호로 찍고 자는 학생 등등..'
].join('\n');

const TOMO_WEEKDAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

/* ============================================================
 * 1. 설정 & 트리거 (관리자가 직접 실행하는 함수)
 * ============================================================ */

/**
 * 최초 1회 실행: iCal 주소와 슬랙 정보를 저장하고, 매일 오전 10시 트리거를 설치합니다.
 * 아래 config에 값을 채운 뒤 이 함수를 실행하세요. 실행 후 값은 지워도 됩니다.
 */
function setupTomoNotifier() {
  // ▼▼▼ 여기에 값을 입력한 뒤 이 함수를 실행하세요. (저장소에 커밋하지 마세요) ▼▼▼
  const config = {
    icalUrl: '',          // 구글 캘린더 iCal 비공개 주소(.ics)
    slackWebhookUrl: '',  // (권장) 슬랙 Incoming Webhook URL — 채널 고정
    slackBotToken: '',    // 또는 슬랙 Bot Token(xoxb-...) 사용 시
    slackChannel: '',     // Bot Token 사용 시 보낼 채널(#채널명 또는 채널ID)
  };
  // ▲▲▲

  const props = PropertiesService.getScriptProperties();
  if (config.icalUrl) props.setProperty(TOMO.PROP_ICAL_URL, String(config.icalUrl).trim());
  if (config.slackWebhookUrl) props.setProperty(TOMO.PROP_SLACK_WEBHOOK, String(config.slackWebhookUrl).trim());
  if (config.slackBotToken) props.setProperty(TOMO.PROP_SLACK_BOT_TOKEN, String(config.slackBotToken).trim());
  if (config.slackChannel) props.setProperty(TOMO.PROP_SLACK_CHANNEL, String(config.slackChannel).trim());

  const missing = [];
  if (!props.getProperty(TOMO.PROP_ICAL_URL)) missing.push('iCal 주소(icalUrl)');
  const hasWebhook = !!props.getProperty(TOMO.PROP_SLACK_WEBHOOK);
  const hasBot = !!props.getProperty(TOMO.PROP_SLACK_BOT_TOKEN) && !!props.getProperty(TOMO.PROP_SLACK_CHANNEL);
  if (!hasWebhook && !hasBot) missing.push('슬랙 Webhook URL 또는 (Bot Token + 채널)');
  if (missing.length) {
    throw new Error('설정이 필요합니다: ' + missing.join(', ') + '. config 값을 채운 뒤 다시 실행하세요.');
  }

  installTomoTrigger_();
  console.log('토모 알림 설정 완료. 매일 오전 ' + TOMO.TRIGGER_HOUR + '시경 오늘의 토모 일정을 확인해 슬랙으로 알립니다.');
}

/** 매일 오전 10시 트리거를 (재)설치합니다. */
function installTomoTrigger_() {
  removeTomoTriggers_();
  ScriptApp.newTrigger(TOMO.TRIGGER_HANDLER)
    .timeBased()
    .atHour(TOMO.TRIGGER_HOUR)
    .everyDays(1)
    .inTimezone(TOMO.TIMEZONE)
    .create();
}

/** 이 알림용 트리거를 모두 제거합니다. */
function removeTomoTriggers_() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === TOMO.TRIGGER_HANDLER) {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

/** 알림을 완전히 끄고 싶을 때 실행: 트리거만 제거합니다.(저장된 값은 유지) */
function disableTomoNotifier() {
  removeTomoTriggers_();
  console.log('토모 알림 트리거를 제거했습니다. 다시 켜려면 setupTomoNotifier(또는 installTomoTrigger_)를 실행하세요.');
}

/** 현재 저장된 설정을 확인합니다.(민감정보는 일부만 표시) */
function showTomoStatus() {
  const props = PropertiesService.getScriptProperties();
  const mask = function (v) {
    if (!v) return '(없음)';
    return v.length <= 12 ? '****' : v.slice(0, 8) + '…' + v.slice(-4);
  };
  const triggerCount = ScriptApp.getProjectTriggers().filter(function (t) {
    return t.getHandlerFunction() === TOMO.TRIGGER_HANDLER;
  }).length;
  console.log([
    'iCal 주소: ' + mask(props.getProperty(TOMO.PROP_ICAL_URL)),
    'Slack Webhook: ' + mask(props.getProperty(TOMO.PROP_SLACK_WEBHOOK)),
    'Slack Bot Token: ' + mask(props.getProperty(TOMO.PROP_SLACK_BOT_TOKEN)),
    'Slack Channel: ' + (props.getProperty(TOMO.PROP_SLACK_CHANNEL) || '(없음)'),
    '설치된 트리거 수: ' + triggerCount,
  ].join('\n'));
}

/* ============================================================
 * 2. 실행 (트리거 & 테스트)
 * ============================================================ */

/** 트리거가 매일 호출하는 함수: 오늘 토모 일정이 있으면 슬랙 알림을 보냅니다. */
function sendTomoDailyReminder() {
  const today = new Date();
  const sessions = getTomoSessionsForDate_(today);
  if (!sessions.length) {
    console.log(formatDateLabel_(today) + ': 오늘 토모 일정이 없어 슬랙 알림을 보내지 않았습니다.');
    return;
  }
  postTomoReminderToSlack_(sessions, today);
  console.log(formatDateLabel_(today) + ': 토모 ' + sessions.length + '건 감지 → 슬랙 알림 발송 완료.');
}

/** 테스트: 오늘 토모 일정이 있으면 실제로 슬랙에 발송합니다. */
function testTomoDailyReminder() {
  sendTomoDailyReminder();
}

/** 확인용: 오늘 감지되는 토모 일정을 로그로만 출력합니다.(슬랙 발송 안 함) */
function previewTomoToday() {
  const today = new Date();
  const sessions = getTomoSessionsForDate_(today);
  console.log(formatDateLabel_(today) + ' 토모 일정 ' + sessions.length + '건: ' + JSON.stringify(sessions, null, 2));
}

/* ============================================================
 * 3. iCal 읽기 & '오늘' 토모 일정 판별
 * ============================================================ */

/**
 * 주어진 날짜(기준: Asia/Seoul)에 열리는 '토모-xxx' 일정 목록을 반환합니다.
 * @return {Array<{title:string, timeLabel:string, allDay:boolean}>}
 */
function getTomoSessionsForDate_(date) {
  const targetKey = Utilities.formatDate(date, TOMO.TIMEZONE, 'yyyyMMdd');
  const events = parseVevents_(fetchIcalText_());

  // RECURRENCE-ID로 수정된 개별 인스턴스가 있으면, 원본 반복 일정에서 해당 날짜를 제외합니다.
  const overrides = {};
  events.forEach(function (ev) {
    if (ev.recurrenceId && ev.uid) {
      const info = icalStartInfo_(ev.recurrenceId);
      if (info) (overrides[ev.uid] = overrides[ev.uid] || []).push(info.key);
    }
  });

  const sessions = [];
  const seen = {};
  events.forEach(function (ev) {
    if (!ev.dtstart || !isTomoTitle_(ev.summary)) return;
    const startInfo = icalStartInfo_(ev.dtstart);
    if (!startInfo) return;

    const exKeys = [];
    (ev.exdates || []).forEach(function (ex) {
      extractDateKeys_(ex).forEach(function (k) { exKeys.push(k); });
    });
    if (ev.rrule && ev.uid && overrides[ev.uid]) {
      overrides[ev.uid].forEach(function (k) { exKeys.push(k); });
    }

    if (!recurrenceOccursOnDate_(startInfo.key, ev.rrule, exKeys, targetKey)) return;

    const label = startInfo.allDay ? '' : startInfo.timeLabel;
    const dedupeKey = ev.summary + '|' + label;
    if (seen[dedupeKey]) return;
    seen[dedupeKey] = true;
    sessions.push({ title: ev.summary, timeLabel: label, allDay: startInfo.allDay });
  });

  sessions.sort(function (a, b) { return String(a.timeLabel).localeCompare(String(b.timeLabel)); });
  return sessions;
}

/** iCal(.ics) 원문을 가져옵니다. */
function fetchIcalText_() {
  const url = PropertiesService.getScriptProperties().getProperty(TOMO.PROP_ICAL_URL);
  if (!url) throw new Error('iCal 주소가 설정되지 않았습니다. setupTomoNotifier를 먼저 실행하세요.');
  const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true });
  const code = res.getResponseCode();
  if (code < 200 || code >= 300) {
    throw new Error('iCal 주소 응답 오류: HTTP ' + code + ' (주소가 올바른지 확인하세요)');
  }
  return res.getContentText('UTF-8');
}

/** 제목이 '토모-xxx' 형식인지 확인합니다.(하이픈 변형·앞뒤 공백 허용) */
function isTomoTitle_(summary) {
  return /^\s*토모\s*[-–—]/.test(String(summary || ''));
}

/* ============================================================
 * 4. iCal 파서
 * ============================================================ */

/** 접힌 줄(line folding)을 펴서 VEVENT 배열로 파싱합니다. */
function parseVevents_(text) {
  const lines = unfoldIcal_(text).split('\n');
  const events = [];
  let cur = null;
  lines.forEach(function (line) {
    if (line === 'BEGIN:VEVENT') { cur = {}; return; }
    if (line === 'END:VEVENT') { if (cur) events.push(cur); cur = null; return; }
    if (!cur) return;

    const idx = line.indexOf(':');
    if (idx < 0) return;
    const rawName = line.slice(0, idx);
    const value = line.slice(idx + 1);
    const parts = rawName.split(';');
    const key = parts[0].toUpperCase();
    const params = {};
    parts.slice(1).forEach(function (p) {
      const eq = p.indexOf('=');
      if (eq > 0) params[p.slice(0, eq).toUpperCase()] = p.slice(eq + 1);
    });

    if (key === 'DTSTART') cur.dtstart = { value: value, params: params };
    else if (key === 'RRULE') cur.rrule = value;
    else if (key === 'SUMMARY') cur.summary = unescapeIcalText_(value);
    else if (key === 'UID') cur.uid = value;
    else if (key === 'EXDATE') (cur.exdates = cur.exdates || []).push({ value: value, params: params });
    else if (key === 'RECURRENCE-ID') cur.recurrenceId = { value: value, params: params };
  });
  return events;
}

/** RFC5545 줄 접힘 해제: CRLF/CR 정규화 후, 줄바꿈+공백/탭 이어붙임. */
function unfoldIcal_(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n[ \t]/g, '');
}

/** iCal TEXT 이스케이프 해제. */
function unescapeIcalText_(value) {
  return String(value || '')
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim();
}

/**
 * DTSTART(또는 RECURRENCE-ID) 값을 Asia/Seoul 기준 날짜/시간 정보로 변환합니다.
 * @return {{key:string, allDay:boolean, timeLabel:string}|null} key='yyyyMMdd'
 */
function icalStartInfo_(field) {
  const value = String(field.value || '').trim();
  const isDateOnly = (field.params && field.params.VALUE === 'DATE') || /^\d{8}$/.test(value);
  const m = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2}))?(Z)?$/);
  if (!m) return null;

  const y = +m[1], mo = +m[2], d = +m[3];
  const hh = +(m[4] || 0), mi = +(m[5] || 0), ss = +(m[6] || 0);
  const isUtc = m[7] === 'Z';

  if (isDateOnly) {
    // 종일 일정: 적힌 날짜를 그대로 사용
    return { key: pad4_(y) + pad2_(mo) + pad2_(d), allDay: true, timeLabel: '' };
  }

  // 시간 일정: UTC(Z)면 정확히 변환, 그 외(TZID/floating)는 한국시간(UTC+9, 서머타임 없음) 기준으로 처리
  let dateObj;
  if (isUtc) {
    dateObj = new Date(Date.UTC(y, mo - 1, d, hh, mi, ss));
  } else {
    dateObj = new Date(Date.UTC(y, mo - 1, d, hh, mi, ss) - 9 * 3600 * 1000);
  }
  return {
    key: Utilities.formatDate(dateObj, TOMO.TIMEZONE, 'yyyyMMdd'),
    allDay: false,
    timeLabel: Utilities.formatDate(dateObj, TOMO.TIMEZONE, 'HH:mm'),
  };
}

/** EXDATE 등 콤마로 구분된 여러 날짜 값에서 'yyyyMMdd' 키 목록을 추출합니다. */
function extractDateKeys_(field) {
  const keys = [];
  String(field.value || '').split(',').forEach(function (v) {
    const info = icalStartInfo_({ value: v.trim(), params: field.params });
    if (info) keys.push(info.key);
  });
  return keys;
}

/* ============================================================
 * 5. 반복 규칙(RRULE) 판별 — 특정 날짜에 발생하는지
 * ============================================================ */

/**
 * startKey 시작(반복 규칙 rrule 적용, exdateKeys 제외)일 때 targetKey에 발생하는지 판정합니다.
 * 모든 키는 'yyyyMMdd'(Asia/Seoul 기준).
 */
function recurrenceOccursOnDate_(startKey, rrule, exdateKeys, targetKey) {
  if (targetKey < startKey) return false;
  if (exdateKeys.indexOf(targetKey) >= 0) return false;
  if (!rrule) return targetKey === startKey;

  const rule = parseRrule_(rrule);
  if (!rule.freq) return targetKey === startKey;

  const start = keyToUtc_(startKey);
  const maxCount = rule.count || Infinity;
  const until = rule.until || '';

  let count = 0;
  let cursor = start;
  for (let i = 0; i < TOMO.RRULE_MAX_SCAN_DAYS; i++) {
    const key = utcToKey_(cursor);
    if (until && key > until) return false;
    if (key > targetKey) return false;
    if (isOccurrenceDay_(cursor, start, rule)) {
      count++;
      if (count > maxCount) return false;
      if (key === targetKey) return exdateKeys.indexOf(key) < 0;
    }
    cursor = new Date(cursor.getTime() + 86400000);
  }
  return false;
}

/** RRULE 문자열을 파싱합니다. */
function parseRrule_(rrule) {
  const out = { freq: '', interval: 1, count: 0, until: '', byday: [], bymonthday: [] };
  String(rrule).split(';').forEach(function (pair) {
    const eq = pair.indexOf('=');
    if (eq < 0) return;
    const k = pair.slice(0, eq).toUpperCase();
    const v = pair.slice(eq + 1);
    if (k === 'FREQ') out.freq = v.toUpperCase();
    else if (k === 'INTERVAL') out.interval = Math.max(1, parseInt(v, 10) || 1);
    else if (k === 'COUNT') out.count = parseInt(v, 10) || 0;
    else if (k === 'UNTIL') { const mm = v.match(/^(\d{4})(\d{2})(\d{2})/); if (mm) out.until = mm[1] + mm[2] + mm[3]; }
    else if (k === 'BYDAY') out.byday = v.toUpperCase().split(',').map(function (x) { return x.replace(/^[+-]?\d+/, ''); }).filter(Boolean);
    else if (k === 'BYMONTHDAY') out.bymonthday = v.split(',').map(function (x) { return parseInt(x, 10); }).filter(function (n) { return !isNaN(n); });
  });
  return out;
}

/** cursor 날짜가 start 기준 반복 규칙의 발생일인지 확인합니다. */
function isOccurrenceDay_(cursor, start, rule) {
  if (cursor.getTime() < start.getTime()) return false;
  switch (rule.freq) {
    case 'DAILY':
      return daysBetween_(start, cursor) % rule.interval === 0;
    case 'WEEKLY': {
      const days = rule.byday.length ? rule.byday : [TOMO_WEEKDAY_CODES[start.getUTCDay()]];
      if (days.indexOf(TOMO_WEEKDAY_CODES[cursor.getUTCDay()]) < 0) return false;
      const weekDiff = Math.round(daysBetween_(mondayStart_(start), mondayStart_(cursor)) / 7);
      return weekDiff % rule.interval === 0;
    }
    case 'MONTHLY': {
      const days = rule.bymonthday.length ? rule.bymonthday : [start.getUTCDate()];
      if (days.indexOf(cursor.getUTCDate()) < 0) return false;
      const md = (cursor.getUTCFullYear() - start.getUTCFullYear()) * 12 + (cursor.getUTCMonth() - start.getUTCMonth());
      return md >= 0 && md % rule.interval === 0;
    }
    case 'YEARLY': {
      if (cursor.getUTCMonth() !== start.getUTCMonth() || cursor.getUTCDate() !== start.getUTCDate()) return false;
      const yd = cursor.getUTCFullYear() - start.getUTCFullYear();
      return yd >= 0 && yd % rule.interval === 0;
    }
    default:
      return daysBetween_(start, cursor) === 0;
  }
}

/* ============================================================
 * 6. 슬랙 발송
 * ============================================================ */

/** 오늘의 토모 일정을 근거로 슬랙에 유의사항 문구를 발송합니다. */
function postTomoReminderToSlack_(sessions, date) {
  const props = PropertiesService.getScriptProperties();
  const dateLabel = Utilities.formatDate(date, TOMO.TIMEZONE, 'M월 d일 (E)');
  const titles = sessions.map(function (s) {
    return s.title + (s.allDay || !s.timeLabel ? '' : ' (' + s.timeLabel + ')');
  }).join(', ');

  const blocks = [
    { type: 'section', text: { type: 'mrkdwn', text: TOMO_MESSAGE } },
    { type: 'context', elements: [{ type: 'mrkdwn', text: '📅 ' + dateLabel + ' 오늘의 토모: ' + titles }] },
  ];

  const webhook = props.getProperty(TOMO.PROP_SLACK_WEBHOOK);
  const botToken = props.getProperty(TOMO.PROP_SLACK_BOT_TOKEN);
  const channel = props.getProperty(TOMO.PROP_SLACK_CHANNEL);

  if (webhook) {
    postSlackWebhook_(webhook, { text: TOMO_MESSAGE, blocks: blocks });
  } else if (botToken && channel) {
    postSlackApi_(botToken, channel, TOMO_MESSAGE, blocks);
  } else {
    throw new Error('슬랙 설정이 없습니다. setupTomoNotifier로 Webhook URL 또는 Bot Token/채널을 저장하세요.');
  }
}

/** Incoming Webhook으로 발송. */
function postSlackWebhook_(url, payload) {
  const res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json; charset=utf-8',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });
  const code = res.getResponseCode();
  if (code !== 200) {
    throw new Error('슬랙 Webhook 발송 오류: HTTP ' + code + ' ' + res.getContentText());
  }
}

/** Bot Token(chat.postMessage)으로 발송. */
function postSlackApi_(token, channel, text, blocks) {
  const res = UrlFetchApp.fetch('https://slack.com/api/chat.postMessage', {
    method: 'post',
    contentType: 'application/json; charset=utf-8',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify({ channel: channel, text: text, blocks: blocks }),
    muteHttpExceptions: true,
  });
  let data = {};
  try { data = JSON.parse(res.getContentText() || '{}'); } catch (_) { data = {}; }
  if (!data.ok) {
    throw new Error('슬랙 API 발송 오류: ' + (data.error || ('HTTP ' + res.getResponseCode())));
  }
}

/* ============================================================
 * 7. 날짜 유틸
 * ============================================================ */

function keyToUtc_(key) {
  return new Date(Date.UTC(+key.slice(0, 4), +key.slice(4, 6) - 1, +key.slice(6, 8)));
}

function utcToKey_(d) {
  return pad4_(d.getUTCFullYear()) + pad2_(d.getUTCMonth() + 1) + pad2_(d.getUTCDate());
}

function daysBetween_(a, b) {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function mondayStart_(d) {
  const mondayBased = (d.getUTCDay() + 6) % 7; // 월요일=0
  return new Date(d.getTime() - mondayBased * 86400000);
}

function formatDateLabel_(date) {
  return Utilities.formatDate(date, TOMO.TIMEZONE, 'yyyy-MM-dd');
}

function pad2_(n) { return (n < 10 ? '0' : '') + n; }
function pad4_(n) { let s = String(n); while (s.length < 4) s = '0' + s; return s; }
