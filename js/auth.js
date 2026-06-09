/* ─── Msgway OTP Auth ─── */
const MSGWAY_API_KEY   = '5e5760967c376020baaaae667f94378f';
const MSGWAY_PATTERN   = '22199';
const AUTH_SESSION_KEY = 'pc_auth';
const SESSION_TTL      = 7 * 24 * 60 * 60 * 1000; // 7 days

let _pendingPhone = null;
let _resendTimer  = null;

/* ─── Session helpers ─── */
function authIsLoggedIn() {
  try {
    const s = JSON.parse(localStorage.getItem(AUTH_SESSION_KEY) || 'null');
    return !!(s && s.expires > Date.now());
  } catch { return false; }
}

function authGetPhone() {
  try {
    const s = JSON.parse(localStorage.getItem(AUTH_SESSION_KEY) || 'null');
    return s ? s.phone : null;
  } catch { return null; }
}

function authLogout() {
  localStorage.removeItem(AUTH_SESSION_KEY);
  location.reload();
}

function _saveSession(phone) {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const token = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({
    phone,
    token,
    expires: Date.now() + SESSION_TTL
  }));
}

/* ─── Phone normalizer ─── */
function _toIntlPhone(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('98') && digits.length === 12) return '+' + digits;
  if (digits.startsWith('9') && digits.length === 10)  return '+98' + digits;
  if (digits.startsWith('09') && digits.length === 11) return '+98' + digits.slice(1);
  return null;
}

/* ─── Msgway: send OTP ─── */
async function authSendOtp(phone) {
  const intl = _toIntlPhone(phone);
  if (!intl) throw new Error('شماره موبایل معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹)');

  const res = await fetch('https://api.msgway.com/otp/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apiKey': MSGWAY_API_KEY
    },
    body: JSON.stringify({
      mobile:      intl,
      patternCode: MSGWAY_PATTERN
    })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || (data.status && data.status !== 200)) {
    throw new Error(data.message || data.error || `خطا در ارسال پیامک (${res.status})`);
  }

  _pendingPhone = intl;
  return intl;
}

/* ─── Msgway: verify OTP (server-side) ─── */
async function authVerifyOtp(code) {
  if (!_pendingPhone) throw new Error('ابتدا کد را دریافت کنید');

  const res = await fetch('https://api.msgway.com/otp/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apiKey': MSGWAY_API_KEY
    },
    body: JSON.stringify({
      OTP:    code.trim(),
      mobile: _pendingPhone
    })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || (data.status && data.status !== 200)) {
    throw new Error(data.message || data.error || 'کد وارد شده اشتباه است');
  }

  _saveSession(_pendingPhone);
  _pendingPhone = null;
  return true;
}

/* ─── Auth UI ─── */
function initAuthUI(onSuccess) {
  if (authIsLoggedIn()) {
    _injectUserChip();
    onSuccess();
    return;
  }

  const overlay = document.createElement('div');
  overlay.id = 'authOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.88);backdrop-filter:blur(8px)';
  overlay.innerHTML = `
    <div class="md-card p-6 mx-4 fade-in" style="width:100%;max-width:360px">

      <div class="text-center mb-6">
        <div class="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
             style="background:var(--md-primary-cont)">
          <svg class="w-7 h-7" style="color:var(--md-on-primary-cont)" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        </div>
        <h2 class="text-base font-semibold" style="color:var(--md-on-surface)">Product Content</h2>
        <p class="text-sm mt-1" style="color:var(--md-on-surface-var)">ورود با شماره موبایل</p>
      </div>

      <!-- Step 1: phone -->
      <div id="authStep1" class="flex flex-col gap-3">
        <div class="md-field" id="authPhoneWrap">
          <label>شماره موبایل</label>
          <input id="authPhoneInput" type="tel" dir="ltr" placeholder="09XXXXXXXXX"
            maxlength="11" style="padding:20px 16px 8px;letter-spacing:.04em"
            oninput="document.getElementById('authPhoneWrap').classList.toggle('has-value',this.value.length>0)">
        </div>
        <button id="authSendBtn" class="md-btn-filled md-state ripple-container w-full py-3 text-sm font-semibold">
          ارسال کد تأیید
        </button>
      </div>

      <!-- Step 2: OTP code -->
      <div id="authStep2" class="hidden flex-col gap-3">
        <p class="text-sm text-center mb-1" style="color:var(--md-on-surface-var)">
          کد تأیید به
          <span id="authPhoneDisplay" class="font-medium" dir="ltr" style="color:var(--md-on-surface)"></span>
          ارسال شد
        </p>
        <div class="md-field" id="authOtpWrap">
          <label>کد تأیید</label>
          <input id="authOtpInput" type="text" dir="ltr" placeholder="• • • •"
            maxlength="6" inputmode="numeric"
            style="padding:20px 16px 8px;letter-spacing:.3em;font-size:1.3rem;text-align:center"
            oninput="document.getElementById('authOtpWrap').classList.toggle('has-value',this.value.length>0)">
        </div>
        <button id="authVerifyBtn" class="md-btn-filled md-state ripple-container w-full py-3 text-sm font-semibold">
          تأیید و ورود
        </button>
        <div class="flex items-center justify-between">
          <button id="authBackBtn" style="background:none;border:none;cursor:pointer;font-size:.75rem;padding:4px 8px;border-radius:var(--md-shape-sm)" style="color:var(--md-primary)">
            ویرایش شماره
          </button>
          <button id="authResendBtn" disabled style="background:none;border:none;cursor:pointer;font-size:.75rem;padding:4px 8px;border-radius:var(--md-shape-sm);opacity:.5">
            ارسال مجدد (<span id="authCountdown">60</span>s)
          </button>
        </div>
      </div>

      <!-- Status line -->
      <p id="authStatus" class="hidden text-xs text-center mt-3" style="color:var(--md-error)"></p>
      <p id="authLoadingMsg" class="hidden text-xs text-center mt-3" style="color:var(--md-on-surface-var)"></p>
    </div>
  `;
  document.body.prepend(overlay);

  const step1      = document.getElementById('authStep1');
  const step2      = document.getElementById('authStep2');
  const phoneInput = document.getElementById('authPhoneInput');
  const otpInput   = document.getElementById('authOtpInput');
  const sendBtn    = document.getElementById('authSendBtn');
  const verifyBtn  = document.getElementById('authVerifyBtn');
  const backBtn    = document.getElementById('authBackBtn');
  const resendBtn  = document.getElementById('authResendBtn');
  const statusEl   = document.getElementById('authStatus');
  const loadingEl  = document.getElementById('authLoadingMsg');

  function showErr(msg)  { statusEl.textContent = msg; statusEl.classList.remove('hidden'); loadingEl.classList.add('hidden'); }
  function showLoad(msg) { loadingEl.textContent = msg; loadingEl.classList.remove('hidden'); statusEl.classList.add('hidden'); }
  function clearMsg()    { statusEl.classList.add('hidden'); loadingEl.classList.add('hidden'); }

  function startResendTimer() {
    let secs = 60;
    resendBtn.disabled = true;
    resendBtn.style.opacity = '.5';
    clearInterval(_resendTimer);
    _resendTimer = setInterval(() => {
      secs--;
      const cd = document.getElementById('authCountdown');
      if (cd) cd.textContent = secs;
      if (secs <= 0) {
        clearInterval(_resendTimer);
        resendBtn.disabled = false;
        resendBtn.style.opacity = '1';
        resendBtn.innerHTML = 'ارسال مجدد';
      }
    }, 1000);
  }

  async function doSend(phone) {
    sendBtn.disabled = true;
    showLoad('در حال ارسال کد...');
    try {
      const intl = await authSendOtp(phone);
      step1.classList.add('hidden'); step1.classList.remove('flex');
      step2.classList.remove('hidden'); step2.classList.add('flex');
      document.getElementById('authPhoneDisplay').textContent = intl;
      clearMsg();
      startResendTimer();
      setTimeout(() => otpInput.focus(), 100);
    } catch (e) {
      showErr(e.message);
    } finally {
      sendBtn.disabled = false;
    }
  }

  async function doVerify() {
    const code = otpInput.value.replace(/\D/g, '');
    if (!code) return;
    verifyBtn.disabled = true;
    showLoad('در حال تأیید...');
    try {
      await authVerifyOtp(code);
      clearInterval(_resendTimer);
      overlay.remove();
      _injectUserChip();
      onSuccess();
    } catch (e) {
      showErr(e.message);
      otpInput.value = '';
      otpInput.focus();
    } finally {
      verifyBtn.disabled = false;
    }
  }

  sendBtn.addEventListener('click', () => doSend(phoneInput.value.trim()));
  phoneInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSend(phoneInput.value.trim()); });

  verifyBtn.addEventListener('click', doVerify);
  otpInput.addEventListener('keydown', e => { if (e.key === 'Enter') doVerify(); });
  otpInput.addEventListener('input', () => {
    if (otpInput.value.replace(/\D/g,'').length >= 4) doVerify();
  });

  backBtn.addEventListener('click', () => {
    step2.classList.add('hidden'); step2.classList.remove('flex');
    step1.classList.remove('hidden'); step1.classList.add('flex');
    otpInput.value = '';
    clearMsg();
    clearInterval(_resendTimer);
  });

  resendBtn.addEventListener('click', () => {
    clearMsg();
    doSend(_pendingPhone ? _pendingPhone.replace('+98','0') : phoneInput.value.trim());
  });

  phoneInput.focus();
}

/* ─── Inject logged-in user info into settings panel ─── */
function _injectUserChip() {
  const phone = authGetPhone();
  if (!phone) return;
  const inner = document.querySelector('#settingsPanel .max-w-5xl');
  if (!inner) return;

  const chip = document.createElement('div');
  chip.className = 'flex items-center justify-between px-3 py-2 rounded-xl';
  chip.style.cssText = 'background:color-mix(in srgb,var(--md-primary) 8%,transparent)';
  chip.innerHTML = `
    <div class="flex items-center gap-2" style="color:var(--md-on-surface-var);font-size:.75rem">
      <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
      </svg>
      <span dir="ltr" style="color:var(--md-on-surface)">${phone}</span>
    </div>
    <button onclick="authLogout()"
      class="ripple-container md-state"
      style="font-size:.75rem;padding:4px 10px;border-radius:var(--md-shape-sm);border:none;cursor:pointer;background:color-mix(in srgb,var(--md-error) 15%,transparent);color:var(--md-error)">
      خروج
    </button>
  `;
  inner.prepend(chip);
}
