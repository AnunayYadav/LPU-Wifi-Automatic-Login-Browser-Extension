/**
 * LPU Wi-Fi Auto-Login Background Service Worker
 * High-Speed Reactive Automation:
 * - Real captive portal detection (identifies redirects from 24Online gateway)
 * - Instant startup probe (runs in 200ms on browser launch)
 * - Reactive triggers on tab creation & window focus (0-100ms)
 * - Rapid adaptive keep-alive (polls every 3s when offline/captive, 10s when online)
 * - Alarm backup fallback (ensures background persistence)
 */

const DEFAULT_GATEWAY = 'http://internet.lpu.in/24online/webpages/client.jsp';
const LOGOUT_URL = 'http://internet.lpu.in/24online/webpages/logout.jsp';
const CONNECTIVITY_URL = 'http://connectivitycheck.gstatic.com/generate_204';

// Safe Dual Storage Reader (Brave & Chrome compatible)
function getBackgroundSettings(callback) {
  const keys = [
    'accounts',
    'activeAccountId',
    'username',
    'password',
    'autoLogin',
    'autoClose',
    'autoCloseDelay',
    'loginOnStartup',
    'keepAlive',
    'gatewayUrl'
  ];

  if (chrome && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(keys, (localData) => {
      if (chrome && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get(keys, (syncData) => {
          const merged = Object.assign({}, syncData || {}, localData || {});
          callback(merged);
        });
      } else {
        callback(localData || {});
      }
    });
  } else if (chrome && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get(keys, (syncData) => callback(syncData || {}));
  } else {
    callback({});
  }
}

// Check connectivity via Google 204 probe with captive portal redirect inspection
function checkInternetConnectivity(callback) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3200);

  fetch(CONNECTIVITY_URL + '?t=' + Date.now(), {
    cache: 'no-store',
    signal: controller.signal
  })
    .then((resp) => {
      clearTimeout(timeoutId);
      const finalUrl = (resp.url || '').toLowerCase();

      // Check if redirected to LPU 24Online portal
      const isCaptiveRedirect =
        resp.redirected ||
        finalUrl.includes('24online') ||
        finalUrl.includes('lpu.in') ||
        finalUrl.includes('10.10.') ||
        finalUrl.includes('172.');

      if (isCaptiveRedirect) {
        updateBadgeStatus(false);
        callback(false);
        return;
      }

      // HTTP 204 from gstatic means uninhibited, real internet access
      if (resp.status === 204) {
        updateBadgeStatus(true);
        callback(true);
      } else {
        updateBadgeStatus(false);
        callback(false);
      }
    })
    .catch(() => {
      clearTimeout(timeoutId);
      updateBadgeStatus(false);
      callback(false);
    });
}

// ============================================================================
// Dynamic Toolbar Icon & State Indicator System
// - Connected: Vibrant Orange + Clean Green Dot (#22c55e)
// - Disconnected: Vibrant Orange + Clean Red Dot (#ef4444)
// - Connecting: Vibrant Orange + Animated Rotating Loader Arc (#38bdf8)
// - Master OFF: Fully Grayscale Icon with no dot (#48484a)
// - Zero bulky ON/OFF badge text covering the icon
// ============================================================================
let connectingAnimInterval = null;
let currentFrame = 0;
let currentIndicatorState = null;

function setExtensionIndicator(state) {
  if (state !== 'connecting') {
    stopConnectingAnimation();
  }
  currentIndicatorState = state;

  // Clear any badge text so the icon is clean, beautiful and never obscured
  try {
    chrome.action.setBadgeText({ text: '' });
  } catch (e) {}

  if (state === 'disabled') {
    chrome.action.setIcon({
      path: {
        16: 'icons/icon_disabled_16.png',
        32: 'icons/icon_disabled_32.png',
        48: 'icons/icon_disabled_48.png'
      }
    });
    chrome.action.setTitle({ title: 'LPU Wi-Fi: Disabled (Turned Off)' });
    return;
  }

  if (state === 'online') {
    chrome.action.setIcon({
      path: {
        16: 'icons/icon_online_16.png',
        32: 'icons/icon_online_32.png',
        48: 'icons/icon_online_48.png'
      }
    });
    chrome.action.setTitle({ title: 'LPU Wi-Fi: Connected & Online' });
    return;
  }

  if (state === 'offline') {
    chrome.action.setIcon({
      path: {
        16: 'icons/icon_offline_16.png',
        32: 'icons/icon_offline_32.png',
        48: 'icons/icon_offline_48.png'
      }
    });
    chrome.action.setTitle({ title: 'LPU Wi-Fi: Disconnected (Captive Portal / Offline)' });
    return;
  }

  if (state === 'connecting') {
    startConnectingAnimation();
    chrome.action.setTitle({ title: 'LPU Wi-Fi: Authenticating in Background...' });
    return;
  }
}

function startConnectingAnimation() {
  if (connectingAnimInterval) return;
  currentFrame = 0;
  chrome.action.setIcon({
    path: {
      16: `icons/icon_connecting_${currentFrame}_16.png`,
      32: `icons/icon_connecting_${currentFrame}_32.png`,
      48: `icons/icon_connecting_${currentFrame}_48.png`
    }
  });

  connectingAnimInterval = setInterval(() => {
    currentFrame = (currentFrame + 1) % 4;
    chrome.action.setIcon({
      path: {
        16: `icons/icon_connecting_${currentFrame}_16.png`,
        32: `icons/icon_connecting_${currentFrame}_32.png`,
        48: `icons/icon_connecting_${currentFrame}_48.png`
      }
    });
  }, 180);
}

function stopConnectingAnimation() {
  if (connectingAnimInterval) {
    clearInterval(connectingAnimInterval);
    connectingAnimInterval = null;
  }
}

// Update Extension Action indicator (backward-compatible wrapper)
function updateBadgeStatus(isOnline = null) {
  getBackgroundSettings((settings) => {
    if (settings.autoLogin === false) {
      setExtensionIndicator('disabled');
      return;
    }

    if (isOnline === null) {
      setExtensionIndicator('online');
      return;
    }

    if (isOnline) {
      setExtensionIndicator('online');
    } else {
      setExtensionIndicator('offline');
    }
  });
}

// Helper: Resolve active credentials from multi-account array or single keys
function resolveCredentials(settings) {
  let accounts = [];
  if (Array.isArray(settings.accounts) && settings.accounts.length > 0) {
    accounts = settings.accounts;
  }
  const activeAccountId = settings.activeAccountId || (accounts[0] ? accounts[0].id : null);
  let username = settings.username || '';
  let password = settings.password || '';

  if (accounts.length > 0) {
    const active = accounts.find(a => a.id === activeAccountId) || accounts[0];
    if (active) {
      username = active.username || username;
      password = active.password || password;
    }
  }

  return {
    username: (username || '').trim(),
    password: (password || '').trim()
  };
}

// 24Online Servlets for silent direct POST authentication
const LOGIN_ENDPOINTS = [
  'http://internet.lpu.in/24online/servlet/E24onlineHTTPClient',
  'http://10.10.0.1/24online/servlet/E24onlineHTTPClient',
  'http://172.20.0.66/24online/servlet/E24onlineHTTPClient',
  'http://172.16.0.1/24online/servlet/E24onlineHTTPClient',
  'http://172.18.0.1/24online/servlet/E24onlineHTTPClient',
  'https://internet.lpu.in/24online/servlet/E24onlineHTTPClient'
];

// Execute 100% silent background HTTP login (zero tabs opened, no user interruption)
async function attemptSilentBackgroundLogin(settings) {
  const { username, password } = resolveCredentials(settings);
  if (!username || !password) {
    console.log('[LPU Wi-Fi] Silent login skipped: Credentials not configured.');
    return false;
  }

  // Trigger loading animation on the toolbar icon
  setExtensionIndicator('connecting');

  const candidates = [username];
  if (!username.includes('@')) {
    candidates.push(`${username}@lpu.com`);
  }

  const endpoints = [...LOGIN_ENDPOINTS];
  if (settings.gatewayUrl && settings.gatewayUrl !== 'auto') {
    try {
      const u = new URL(settings.gatewayUrl);
      const customServlet = `${u.origin}/24online/servlet/E24onlineHTTPClient`;
      if (!endpoints.includes(customServlet)) {
        endpoints.unshift(customServlet);
      }
    } catch (e) {}
  }

  for (const candidate of candidates) {
    const params = new URLSearchParams();
    params.append('mode', '191');
    params.append('username', candidate);
    params.append('password', password);
    params.append('checkClose', '1');
    params.append('logintype', '2');
    params.append('chkcond', 'on');
    params.append('saveinfo', 'on');
    params.append('url', 'null');
    params.append('isAccessDenied', 'null');

    for (const endpoint of endpoints) {
      try {
        console.log(`[LPU Wi-Fi] Silent background POST to ${endpoint} (${candidate})...`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': 'http://internet.lpu.in/24online/webpages/client.jsp'
          },
          body: params.toString(),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const text = await resp.text();
        const lower = text.toLowerCase();

        if (
          lower.includes('successfully logged in') ||
          lower.includes('already logged in') ||
          lower.includes('you are successfully logged in') ||
          lower.includes('logged in successfully') ||
          lower.includes('click here to check your usage') ||
          lower.includes('minimize this login window')
        ) {
          console.log(`[LPU Wi-Fi] Silent background login SUCCESS on ${endpoint}!`);
          setExtensionIndicator('online');
          return true;
        }

        if (
          lower.includes('invalid username or password') ||
          lower.includes('could not log you on') ||
          lower.includes('maximum login limit reached')
        ) {
          console.warn(`[LPU Wi-Fi] Portal rejection: ${text.substring(0, 80)}`);
        }
      } catch (err) {
        // Continue to next endpoint if current one timed out or unreachable
      }
    }
  }

  // Quick connectivity verification check
  const isNowOnline = await new Promise((resolve) => checkInternetConnectivity(resolve));
  if (isNowOnline) {
    console.log('[LPU Wi-Fi] Verified online status after background authentication.');
    setExtensionIndicator('online');
    return true;
  }

  setExtensionIndicator('offline');
  return false;
}

// Helper: Open portal tab only if not already open (strictly background active: false by default)
let lastTabOpenTime = 0;
function openPortalIfNotOpen(portalUrl, makeActive = false) {
  // Prevent duplicate tab flooding (5s cooldown)
  if (Date.now() - lastTabOpenTime < 5000) {
    return;
  }

  const target = (!portalUrl || portalUrl === 'auto')
    ? DEFAULT_GATEWAY
    : portalUrl;

  chrome.tabs.query({}, (tabs) => {
    const existing = tabs.find(t => t.url && (
      t.url.includes('internet.lpu.in') ||
      t.url.includes('24online/webpages/client.jsp') ||
      t.url.includes('10.10.') ||
      t.url.includes('172.') ||
      t.url.includes('lpu.in/24online')
    ));

    lastTabOpenTime = Date.now();

    if (existing) {
      if (makeActive) {
        chrome.tabs.update(existing.id, { active: true });
      }
      chrome.tabs.reload(existing.id);
    } else {
      chrome.tabs.create({ url: target, active: makeActive });
    }
  });
}

// ============================================================================
// High-Speed Adaptive Connectivity Engine
// ============================================================================
let isProbing = false;
let isLoggingIn = false;
let adaptiveTimer = null;

function runAdaptiveProbe(triggerSource = 'timer') {
  if (isProbing || isLoggingIn) return;
  isProbing = true;

  getBackgroundSettings((settings) => {
    // If master switch or autoLogin is OFF, do not login
    if (settings.autoLogin === false) {
      isProbing = false;
      scheduleNextAdaptiveProbe(8000);
      return;
    }

    checkInternetConnectivity(async (isOnline) => {
      isProbing = false;
      if (!isOnline) {
        console.log(`[LPU Wi-Fi] [${triggerSource}] Offline/Captive detected. Running silent background login...`);
        isLoggingIn = true;

        let silentSuccess = false;
        try {
          silentSuccess = await attemptSilentBackgroundLogin(settings);
        } catch (e) {
          console.warn('[LPU Wi-Fi] Background login attempt error:', e);
        }
        isLoggingIn = false;

        if (silentSuccess) {
          console.log('[LPU Wi-Fi] Logged in completely in background. Zero tabs opened!');
          scheduleNextAdaptiveProbe(10000);
        } else {
          // Retry silently via background POST in 3s without opening any tab
          scheduleNextAdaptiveProbe(3000);
        }
      } else {
        setExtensionIndicator('online');
        // When online, relax polling to 10 seconds
        scheduleNextAdaptiveProbe(10000);
      }
    });
  });
}

function scheduleNextAdaptiveProbe(delayMs) {
  if (adaptiveTimer) clearTimeout(adaptiveTimer);
  adaptiveTimer = setTimeout(() => {
    runAdaptiveProbe('adaptive_loop');
  }, delayMs);
}

// ============================================================================
// Reactive Event Triggers (Instant 0-200ms response)
// ============================================================================

// 1. Browser Startup Event (Fires in 200ms)
chrome.runtime.onStartup.addListener(() => {
  console.log('[LPU Wi-Fi] Browser launched (onStartup). Checking immediately...');
  setTimeout(() => runAdaptiveProbe('browser_onStartup'), 200);
  setTimeout(() => runAdaptiveProbe('browser_onStartup_retry'), 1200);
});

// 2. Window Created (Fires in 150ms on new window / session restore)
chrome.windows.onCreated.addListener(() => {
  setTimeout(() => runAdaptiveProbe('window_created'), 150);
});

// 3. User opens a new tab (Instant reactive check)
chrome.tabs.onCreated.addListener(() => {
  // Check if network is offline whenever user initiates new browsing activity
  setTimeout(() => runAdaptiveProbe('tab_created'), 100);
});

// 4. Window focus changed (e.g. user Alt+Tabs into Brave)
chrome.windows.onFocusChanged.addListener((winId) => {
  if (winId !== chrome.windows.WINDOW_ID_NONE) {
    setTimeout(() => runAdaptiveProbe('window_focused'), 200);
  }
});

// ============================================================================
// Alarm Fallback Engine (Ensures service worker keep-alive persistence)
// ============================================================================
function setupKeepAliveAlarm() {
  chrome.alarms.get('lpu_wifi_keepalive', (alarm) => {
    if (!alarm || alarm.periodInMinutes > 1) {
      chrome.alarms.create('lpu_wifi_keepalive', { periodInMinutes: 1 });
    }
  });
}

setupKeepAliveAlarm();

chrome.runtime.onInstalled.addListener(() => {
  setupKeepAliveAlarm();
  updateBadgeStatus();
  runAdaptiveProbe('onInstalled');
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'lpu_wifi_keepalive') {
    runAdaptiveProbe('alarm_keepalive');
  }
});

// Start initial probe immediately when service worker spins up
runAdaptiveProbe('worker_init');

// ============================================================================
// Message Dispatcher
// ============================================================================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'close_current_tab' && sender.tab && sender.tab.id) {
    chrome.tabs.remove(sender.tab.id);
    sendResponse({ success: true });
    return true;
  }

  if (message.action === 'check_connectivity') {
    checkInternetConnectivity((isOnline) => {
      sendResponse({ isOnline });
    });
    return true;
  }

  if (message.action === 'open_portal') {
    getBackgroundSettings((res) => {
      const selected = (!res || !res.gatewayUrl || res.gatewayUrl === 'auto') ? DEFAULT_GATEWAY : res.gatewayUrl;
      openPortalIfNotOpen(selected, true);
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.action === 'logout_portal') {
    chrome.tabs.create({ url: LOGOUT_URL, active: true }, (tab) => {
      setTimeout(() => {
        try {
          chrome.tabs.remove(tab.id);
        } catch (e) {}
      }, 4000);
    });
    sendResponse({ success: true });
    return true;
  }

  if (message.action === 'attempt_silent_login') {
    getBackgroundSettings(async (settings) => {
      const ok = await attemptSilentBackgroundLogin(settings);
      sendResponse({ success: ok });
    });
    return true;
  }

  return true;
});

// ============================================================================
// Real-time Storage Observer (Immediate Grayscale / Colored Icon Switch)
// ============================================================================
if (chrome && chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.autoLogin) {
      if (changes.autoLogin.newValue === false) {
        setExtensionIndicator('disabled');
      } else {
        runAdaptiveProbe('master_toggle_on');
      }
    }
  });
}
