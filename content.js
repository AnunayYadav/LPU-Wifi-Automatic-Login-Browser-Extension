/**
 * LPU Wi-Fi Captive Portal Auto-Login Content Script
 * Injected automatically on LPU 24Online captive portal pages.
 * Supports active profile selection, exact LPU selectors (#agreepolicy, #loginbtn),
 * dynamic countdowns, and subtle Apple-aesthetic status pill.
 */

(function () {
  'use strict';

  // Badge UI injected into the page (Apple minimal glass design)
  function createBadge() {
    let badge = document.getElementById('lpu-autologin-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'lpu-autologin-badge';
      Object.assign(badge.style, {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: '2147483647',
        padding: '8px 16px',
        borderRadius: '9999px',
        color: '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
        fontSize: '12.5px',
        fontWeight: '500',
        letterSpacing: '-0.2px',
        backgroundColor: 'rgba(18, 18, 18, 0.88)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        backdropFilter: 'blur(20px)',
        webkitBackdropFilter: 'blur(20px)',
        cursor: 'default',
        userSelect: 'none'
      });
      (document.body || document.documentElement).appendChild(badge);
    }
    return badge;
  }

  function updateBadge(text, dotColor = '#34c759') {
    const badge = createBadge();
    badge.innerHTML = `<span style="width:6px;height:6px;border-radius:50%;background-color:${dotColor};box-shadow:0 0 6px ${dotColor};display:inline-block"></span><span>${text}</span>`;
  }

  function detectLpuLocation() {
    const h = window.location.hostname || '';
    if (h.includes('10.10.')) return 'LPU Hostels / Blocks';
    if (h.includes('172.20.') || h.includes('172.16.') || h.includes('172.18.')) return 'LPU Blocks 25–38';
    return 'LPU Campus';
  }

  function isAlreadyLoggedIn() {
    if (!document.body) return false;
    const bodyText = (document.body.innerText || document.body.textContent || '').toLowerCase();
    if (
      bodyText.includes('successfully logged in') ||
      bodyText.includes('you are successfully logged in') ||
      bodyText.includes('click here to check your usage') ||
      bodyText.includes('minimize this login window') ||
      bodyText.includes('logged in successfully')
    ) {
      return true;
    }
    const logoutEl = document.querySelector("input[value*='Logout' i], button[name*='logout' i], a[href*='logout' i]");
    if (logoutEl) return true;

    const allButtons = document.querySelectorAll('button, input[type="button"], input[type="submit"]');
    for (const b of allButtons) {
      if ((b.value && b.value.toLowerCase().includes('logout')) ||
          (b.textContent && b.textContent.toLowerCase().includes('logout'))) {
        return true;
      }
    }
    return false;
  }

  function handleAutoLogin(settings) {
    const {
      username = '',
      password = '',
      autoLogin = true,
      autoClose = false,
      autoCloseDelay = 1,
      accountLabel = ''
    } = settings;

    const loc = detectLpuLocation();

    function handleSuccess() {
      const labelText = accountLabel ? ` (${accountLabel})` : '';
      if (autoClose) {
        const delaySec = parseInt(autoCloseDelay, 10);
        if (isNaN(delaySec) || delaySec <= 1) {
          updateBadge(`${loc} • Connected • Closing...`, '#34c759');
          setTimeout(() => {
            chrome.runtime.sendMessage({ action: 'close_current_tab' });
          }, 350);
        } else {
          let remaining = delaySec;
          updateBadge(`${loc} • Closing in ${remaining}s`, '#34c759');
          const interval = setInterval(() => {
            remaining--;
            if (remaining > 0) {
              updateBadge(`${loc} • Closing in ${remaining}s`, '#34c759');
            } else {
              clearInterval(interval);
              chrome.runtime.sendMessage({ action: 'close_current_tab' });
            }
          }, 1000);
        }
      } else {
        updateBadge(`${loc} • Connected & Online`, '#34c759');
      }
    }

    // 1. If already logged in, show online status / handle dismiss immediately
    if (isAlreadyLoggedIn()) {
      handleSuccess();
      return;
    }

    if (!autoLogin) {
      updateBadge('Auto-login paused', '#8e8e93');
      return;
    }

    let attempts = 0;
    const maxAttempts = 24; // try for up to 6 seconds

    const loginInterval = setInterval(() => {
      attempts++;

      // Check if logged in status appeared while polling
      if (isAlreadyLoggedIn()) {
        clearInterval(loginInterval);
        handleSuccess();
        return;
      }

      const usernameInput = document.querySelector("input[name='username']") || document.getElementById('username');
      const passwordInput = document.querySelector("input[name='password']") || document.getElementById('password');
      const agreePolicy = document.querySelector("#agreepolicy") ||
                          document.querySelector("input[name='chkcond']") ||
                          document.getElementById('chkcond');
      const savePass = document.querySelector("input[name='saveinfo']") ||
                       document.querySelector("input[type='checkbox'][name*='save']");
      const loginBtn = document.querySelector("#loginbtn") ||
                       document.querySelector("input[type='submit'][value*='Login' i]") ||
                       document.querySelector("input.buttonstyle[value*='Login' i]");

      // We are only on the login form if usernameInput is present
      if (!usernameInput) {
        if (attempts >= maxAttempts) {
          clearInterval(loginInterval);
        }
        return;
      }

      // Found the portal login inputs! Stop polling.
      clearInterval(loginInterval);

      // Verify extension has credentials configured
      if (!username || !password) {
        updateBadge('Please enter credentials in extension popup', '#ff453a');
        return;
      }

      updateBadge('Authenticating...', '#ff9f0a');

      // 1. Fill Username
      usernameInput.value = username;
      usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
      usernameInput.dispatchEvent(new Event('change', { bubbles: true }));

      // 2. Fill Password
      if (passwordInput) {
        passwordInput.value = password;
        passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
        passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // 3. Agree to Policy (#agreepolicy)
      if (agreePolicy) {
        if (agreePolicy.tagName === 'INPUT') {
          if (!agreePolicy.checked) {
            agreePolicy.click();
          }
        } else {
          agreePolicy.click();
        }
      }

      // Ensure backend form property is set
      if (document.forms[0] && document.forms[0].chkcond) {
        document.forms[0].chkcond.checked = true;
      }

      // 4. Save password checkbox if present
      if (savePass && !savePass.checked) {
        savePass.click();
      }

      // 5. Submit using #loginbtn
      setTimeout(() => {
        // Re-verify terms is checked
        if (agreePolicy && agreePolicy.tagName === 'INPUT' && !agreePolicy.checked) {
          agreePolicy.click();
        }

        updateBadge('Connecting to campus network...', '#34c759');
        if (loginBtn) {
          loginBtn.click();
        } else if (document.forms[0]) {
          document.forms[0].submit();
        }
      }, 300);

    }, 250);
  }

  // Load user settings with dual storage engine (Brave & Chrome compatible)
  function loadContentSettings(callback) {
    const keys = ['accounts', 'activeAccountId', 'username', 'password', 'autoLogin', 'autoClose', 'autoCloseDelay'];

    function mergeAndResolve(localData, syncData) {
      const local = localData || {};
      const sync = syncData || {};

      let accounts = [];
      if (Array.isArray(local.accounts) && local.accounts.length > 0) {
        accounts = local.accounts;
      } else if (Array.isArray(sync.accounts) && sync.accounts.length > 0) {
        accounts = sync.accounts;
      }

      const activeAccountId = local.activeAccountId || sync.activeAccountId || (accounts[0] ? accounts[0].id : null);
      let username = local.username || sync.username || '';
      let password = local.password || sync.password || '';
      let accountLabel = '';

      if (accounts.length > 0) {
        const active = accounts.find(a => a.id === activeAccountId) || accounts[0];
        if (active) {
          username = active.username || username;
          password = active.password || password;
          accountLabel = active.label || '';
        }
      }

      const autoLogin = local.autoLogin !== undefined ? local.autoLogin : (sync.autoLogin !== undefined ? sync.autoLogin : true);
      const autoClose = local.autoClose !== undefined ? local.autoClose : (sync.autoClose !== undefined ? sync.autoClose : false);
      const autoCloseDelay = local.autoCloseDelay !== undefined ? (parseInt(local.autoCloseDelay, 10) || 1) : (parseInt(sync.autoCloseDelay, 10) || 1);

      return {
        username,
        password,
        accountLabel,
        autoLogin,
        autoClose,
        autoCloseDelay
      };
    }

    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(keys, (localData) => {
        if (chrome && chrome.storage && chrome.storage.sync) {
          chrome.storage.sync.get(keys, (syncData) => {
            callback(mergeAndResolve(localData, syncData));
          });
        } else {
          callback(mergeAndResolve(localData, {}));
        }
      });
    } else if (chrome && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.get(keys, (syncData) => callback(mergeAndResolve({}, syncData)));
    } else {
      callback(mergeAndResolve({}, {}));
    }
  }

  loadContentSettings((settings) => {

    let executed = false;
    function executeLogin() {
      if (executed) return;
      if (document.body) {
        executed = true;
        handleAutoLogin(settings);
      }
    }

    if (document.body) {
      executeLogin();
    } else {
      const observer = new MutationObserver(() => {
        if (document.body) {
          observer.disconnect();
          executeLogin();
        }
      });
      if (document.documentElement) {
        observer.observe(document.documentElement, { childList: true });
      }
      document.addEventListener('DOMContentLoaded', executeLogin);
    }
  });
})();
