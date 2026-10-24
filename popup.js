/**
 * LPU Wi-Fi Auto-Login Popup Controller (Apple Aesthetic & Feature-Rich)
 * - Multi-Account Profile Switcher & Manager
 * - Automation & Startup Preferences
 * - Live Network Diagnostics & Gateway Selector
 * - Dual Neutral Themes (Obsidian Dark / Snow Light)
 * - Bulletproof initialization (handles instant readyState)
 */

(function () {
  'use strict';

  // Safe Dual Storage Wrapper (Brave & Chrome compatible, parallelized with instant fallback)
  const Storage = {
    get: function (keys, callback) {
      if (!chrome || !chrome.storage) {
        if (callback) callback({});
        return;
      }

      let localData = null;
      let syncData = null;
      let localDone = false;
      let syncDone = false;
      let finished = false;

      function finish() {
        if (finished) return;
        if (localDone && syncDone) {
          finished = true;
          const merged = Object.assign({}, syncData || {}, localData || {});
          if (callback) callback(merged);
        }
      }

      if (chrome.storage.local) {
        chrome.storage.local.get(keys, (res) => {
          localData = res || {};
          localDone = true;
          finish();
        });
      } else {
        localDone = true;
      }

      if (chrome.storage.sync) {
        chrome.storage.sync.get(keys, (res) => {
          syncData = res || {};
          syncDone = true;
          finish();
        });
      } else {
        syncDone = true;
      }

      // Offline / high-latency protection: never stall popup UI for sync storage
      setTimeout(() => {
        if (!finished) {
          syncDone = true;
          if (localDone) {
            finished = true;
            const merged = Object.assign({}, syncData || {}, localData || {});
            if (callback) callback(merged);
          }
        }
      }, 80);
    },
    set: function (items, callback) {
      let executed = false;
      function done() {
        if (!executed && callback) {
          executed = true;
          callback();
        }
      }
      // Always write to local storage first (instant & reliable in Brave/Chrome)
      try {
        if (chrome && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set(items, done);
        }
      } catch (e) {}

      // Also mirror to sync storage
      try {
        if (chrome && chrome.storage && chrome.storage.sync) {
          chrome.storage.sync.set(items, done);
        }
      } catch (e) {}

      setTimeout(done, 50);
    }
  };

  function initPopup() {
    // Elements
    const htmlEl = document.documentElement;
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const sunIcon = document.getElementById('sunIcon');
    const moonIcon = document.getElementById('moonIcon');
    const wifiStatusIcon = document.getElementById('wifiStatusIcon');
    const headerPowerToggle = document.getElementById('headerPowerToggle');

    // Tabs
    const segmentBtns = document.querySelectorAll('.segment-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    // Accounts Tab Elements
    const accountsListView = document.getElementById('accountsListView');
    const accountEditView = document.getElementById('accountEditView');
    const backToAccountsBtn = document.getElementById('backToAccountsBtn');
    const deleteCurrentAccountBtn = document.getElementById('deleteCurrentAccountBtn');
    const accountsList = document.getElementById('accountsList');
    const showAddAccountBtn = document.getElementById('showAddAccountBtn');
    const formCardTitle = document.getElementById('formCardTitle');
    const accountForm = document.getElementById('accountForm');
    const editAccountId = document.getElementById('editAccountId');
    const accLabel = document.getElementById('accLabel');
    const accUsername = document.getElementById('accUsername');
    const accPassword = document.getElementById('accPassword');
    const toggleAccPassBtn = document.getElementById('toggleAccPassBtn');
    const openPortalPrimaryBtn = document.getElementById('openPortalPrimaryBtn');
    const manualSilentLoginBtn = document.getElementById('manualSilentLoginBtn');

    // Preferences Tab
    const prefAutoLogin = document.getElementById('prefAutoLogin');
    const prefLoginOnStartup = document.getElementById('prefLoginOnStartup');
    const prefKeepAlive = document.getElementById('prefKeepAlive');
    const prefAutoClose = document.getElementById('prefAutoClose');
    const closeDelayRow = document.getElementById('closeDelayRow');
    const delayPills = document.querySelectorAll('.pill-opt');

    // Network Tab
    const netState = document.getElementById('netState');
    const netLatency = document.getElementById('netLatency');
    const gatewayHostDisplay = document.getElementById('gatewayHostDisplay');
    const gatewaySelect = document.getElementById('gatewaySelect');
    const testPingBtn = document.getElementById('testPingBtn');
    const logoutSessionBtn = document.getElementById('logoutSessionBtn');

    // Toast
    const toast = document.getElementById('toast');

    // Initial state with safe defaults
    let state = {
      theme: 'dark',
      accounts: [],
      activeAccountId: null,
      autoLogin: true,
      loginOnStartup: true,
      keepAlive: true,
      autoClose: false,
      autoCloseDelay: 1,
      gatewayUrl: 'http://internet.lpu.in/24online/webpages/client.jsp'
    };

    // ==========================================================================
    // 1. Theme Management
    // ==========================================================================
    function applyTheme(theme) {
      state.theme = theme;
      if (htmlEl) htmlEl.setAttribute('data-theme', theme);
      if (theme === 'light') {
        if (sunIcon) sunIcon.classList.add('hidden');
        if (moonIcon) moonIcon.classList.remove('hidden');
      } else {
        if (sunIcon) sunIcon.classList.remove('hidden');
        if (moonIcon) moonIcon.classList.add('hidden');
      }
    }

    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
        applyTheme(nextTheme);
        Storage.set({ theme: nextTheme });
      });
    }

    // ==========================================================================
    // 2. Segmented Navigation (Tabs) with Directional Slide Transitions
    // ==========================================================================
    let currentTabIndex = 0;
    segmentBtns.forEach((btn, index) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (index === currentTabIndex) return;
        currentTabIndex = index;

        segmentBtns.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        tabPanes.forEach(p => {
          p.classList.remove('active');
        });

        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        const targetTabId = btn.getAttribute('data-tab');
        const targetPane = document.getElementById(targetTabId);
        if (targetPane) {
          targetPane.classList.add('active');
        }
      });
    });

    // ==========================================================================
    // 3. Accounts Rendering & Management
    // ==========================================================================
    function escapeHtml(val) {
      if (val === null || val === undefined) return '';
      const str = String(val);
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function renderAccounts() {
      if (!accountsList) return;
      accountsList.innerHTML = '';

      if (!state.accounts || state.accounts.length === 0) {
        accountsList.innerHTML = `
          <div style="text-align: center; padding: 14px 10px; background: var(--bg-card); border-radius: 9px; color: var(--text-secondary);">
            <div style="font-size: 11px; font-weight: 600; color: var(--text-primary); margin-bottom: 2px;">No Profiles Configured</div>
            <div style="font-size: 9.5px;">Add your registration ID &amp; password via + Add Account</div>
          </div>
        `;
        return;
      }

      let activeAccount = state.accounts.find(a => a.id === state.activeAccountId);
      if (!activeAccount && state.accounts.length > 0) {
        activeAccount = state.accounts[0];
        state.activeAccountId = activeAccount.id;
      }

      state.accounts.forEach(acc => {
        const isActive = acc.id === state.activeAccountId;
        const card = document.createElement('div');
        card.className = `account-card ${isActive ? 'active' : ''}`;
        card.setAttribute('data-id', acc.id);

        const rawLabel = String(acc.label || acc.username || 'LP');
        const initials = rawLabel.substring(0, 2).toUpperCase();

        card.innerHTML = `
          <div class="account-left">
            <div class="account-avatar">${escapeHtml(initials)}</div>
            <div class="account-info">
              <div class="account-label-row">
                <span class="account-label">${escapeHtml(acc.label || 'Account')}</span>
                ${isActive ? '<span class="badge-active">Active</span>' : ''}
              </div>
              <span class="account-user">${escapeHtml(acc.username || '')}</span>
            </div>
          </div>
          <div class="account-actions">
            <button type="button" class="acc-icon-btn edit-btn" title="Edit Profile" data-id="${acc.id}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </button>
            <button type="button" class="acc-icon-btn delete-btn delete" title="Delete Profile" data-id="${acc.id}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        `;

        // Click card to make active
        card.addEventListener('click', (e) => {
          if (e.target.closest('.account-actions')) return;
          setActiveAccount(acc.id);
        });

        // Edit Button (Switches to dedicated Edit Screen)
        const editBtn = card.querySelector('.edit-btn');
        if (editBtn) {
          editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showEditScreen(true, acc);
          });
        }

        // Delete Button
        const delBtn = card.querySelector('.delete-btn');
        if (delBtn) {
          delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteAccount(acc.id);
          });
        }

        accountsList.appendChild(card);
      });
    }

    function setActiveAccount(id) {
      if (state.activeAccountId === id) return;
      state.activeAccountId = id;
      const active = state.accounts.find(a => a.id === id);

      Storage.set({
        activeAccountId: id,
        username: active ? active.username : '',
        password: active ? active.password : ''
      }, () => {
        renderAccounts();
        showToast(`Switched to ${active ? active.label : 'Profile'}`);
      });
    }

    // Sub-view Screen Switching (Clean Apple In-Place Replacement with iOS Slide Transitions)
    function showEditScreen(isEdit, acc = null) {
      if (accountsListView) {
        accountsListView.classList.add('hidden');
        accountsListView.classList.remove('slide-in-left');
      }
      if (accountEditView) {
        accountEditView.classList.remove('hidden');
        accountEditView.classList.remove('slide-in-left');
        accountEditView.classList.add('slide-in-right');
      }

      if (isEdit && acc) {
        if (formCardTitle) formCardTitle.textContent = 'Edit Profile';
        if (editAccountId) editAccountId.value = acc.id;
        if (accLabel) accLabel.value = acc.label || '';
        if (accUsername) accUsername.value = acc.username || '';
        if (accPassword) accPassword.value = acc.password || '';

        // Always allow deleting existing account
        if (deleteCurrentAccountBtn) {
          deleteCurrentAccountBtn.classList.remove('hidden');
        }
      } else {
        if (formCardTitle) formCardTitle.textContent = 'Add Profile';
        if (editAccountId) editAccountId.value = '';
        if (accLabel) accLabel.value = '';
        if (accUsername) accUsername.value = '';
        if (accPassword) accPassword.value = '';
        if (deleteCurrentAccountBtn) deleteCurrentAccountBtn.classList.add('hidden');
      }

      setTimeout(() => {
        if (accLabel) accLabel.focus();
      }, 60);
    }

    function showListScreen() {
      if (accountEditView) {
        accountEditView.classList.add('hidden');
        accountEditView.classList.remove('slide-in-right');
      }
      if (accountsListView) {
        accountsListView.classList.remove('hidden');
        accountsListView.classList.remove('slide-in-right');
        accountsListView.classList.add('slide-in-left');
      }
      if (accountForm) accountForm.reset();
      renderAccounts();
    }

    if (backToAccountsBtn) backToAccountsBtn.addEventListener('click', showListScreen);
    if (showAddAccountBtn) showAddAccountBtn.addEventListener('click', () => showEditScreen(false));

    if (deleteCurrentAccountBtn) {
      deleteCurrentAccountBtn.addEventListener('click', () => {
        const idToDelete = editAccountId ? editAccountId.value : '';
        if (idToDelete) {
          deleteAccount(idToDelete);
          showListScreen();
        }
      });
    }

    if (toggleAccPassBtn && accPassword) {
      toggleAccPassBtn.addEventListener('click', () => {
        const isPass = accPassword.type === 'password';
        accPassword.type = isPass ? 'text' : 'password';
      });
    }

    if (accountForm) {
      accountForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = editAccountId ? editAccountId.value : '';
        const label = accLabel ? accLabel.value.trim() : 'Account';
        const username = accUsername ? accUsername.value.trim() : '';
        const password = accPassword ? accPassword.value : '';

        if (!username || !password) return;

        if (id) {
          const idx = state.accounts.findIndex(a => a.id === id);
          if (idx !== -1) {
            state.accounts[idx] = { id, label: label || 'Account', username, password };
            if (state.activeAccountId === id) {
              Storage.set({ username, password });
            }
          }
        } else {
          const newAcc = {
            id: 'acc_' + Date.now(),
            label: label || 'Account',
            username,
            password
          };
          state.accounts.push(newAcc);
          state.activeAccountId = newAcc.id;
          Storage.set({ username, password });
        }

        Storage.set({
          accounts: state.accounts,
          activeAccountId: state.activeAccountId
        }, () => {
          showListScreen();
          showToast('Profile Saved');
        });
      });
    }

    function deleteAccount(id) {
      state.accounts = state.accounts.filter(a => a.id !== id);
      if (state.accounts.length > 0) {
        if (state.activeAccountId === id) {
          state.activeAccountId = state.accounts[0].id;
          Storage.set({
            username: state.accounts[0].username,
            password: state.accounts[0].password
          });
        }
      } else {
        state.activeAccountId = null;
        Storage.set({
          username: '',
          password: ''
        });
      }
      Storage.set({
        accounts: state.accounts,
        activeAccountId: state.activeAccountId
      }, () => {
        renderAccounts();
        showToast('Profile Deleted');
      });
    }

    // ==========================================================================
    // 4. Preferences & Master Power Handlers
    // ==========================================================================
    function setMasterPower(enabled) {
      state.autoLogin = enabled;
      state.loginOnStartup = enabled;
      state.keepAlive = enabled;
      state.autoClose = enabled;

      if (headerPowerToggle) headerPowerToggle.checked = enabled;
      if (prefAutoLogin) prefAutoLogin.checked = enabled;
      if (prefLoginOnStartup) prefLoginOnStartup.checked = enabled;
      if (prefKeepAlive) prefKeepAlive.checked = enabled;
      if (prefAutoClose) prefAutoClose.checked = enabled;

      if (closeDelayRow) {
        if (enabled) closeDelayRow.classList.remove('hidden');
        else closeDelayRow.classList.add('hidden');
      }

      Storage.set({
        autoLogin: enabled,
        loginOnStartup: enabled,
        keepAlive: enabled,
        autoClose: enabled
      });

      if (chrome && chrome.action) {
        chrome.action.setBadgeText({ text: enabled ? 'ON' : 'OFF' });
        chrome.action.setBadgeBackgroundColor({ color: enabled ? '#34c759' : '#8e8e93' });
      }

      showToast(enabled ? 'Extension Enabled' : 'Extension Disabled');
    }

    if (headerPowerToggle) {
      headerPowerToggle.addEventListener('change', () => {
        setMasterPower(headerPowerToggle.checked);
      });
    }

    function syncMasterToggleFromPrefs() {
      const isAnyActive = state.autoLogin || state.loginOnStartup || state.keepAlive || state.autoClose;
      if (headerPowerToggle) headerPowerToggle.checked = isAnyActive;
      if (chrome && chrome.action) {
        chrome.action.setBadgeText({ text: isAnyActive ? 'ON' : 'OFF' });
        chrome.action.setBadgeBackgroundColor({ color: isAnyActive ? '#34c759' : '#8e8e93' });
      }
    }

    if (prefAutoLogin) {
      prefAutoLogin.addEventListener('change', () => {
        state.autoLogin = prefAutoLogin.checked;
        Storage.set({ autoLogin: state.autoLogin });
        syncMasterToggleFromPrefs();
        showToast('Saved');
      });
    }

    if (prefLoginOnStartup) {
      prefLoginOnStartup.addEventListener('change', () => {
        state.loginOnStartup = prefLoginOnStartup.checked;
        Storage.set({ loginOnStartup: state.loginOnStartup });
        syncMasterToggleFromPrefs();
        showToast('Saved');
      });
    }

    if (prefKeepAlive) {
      prefKeepAlive.addEventListener('change', () => {
        state.keepAlive = prefKeepAlive.checked;
        Storage.set({ keepAlive: state.keepAlive });
        syncMasterToggleFromPrefs();
        showToast('Saved');
      });
    }

    if (prefAutoClose) {
      prefAutoClose.addEventListener('change', () => {
        state.autoClose = prefAutoClose.checked;
        Storage.set({ autoClose: state.autoClose });
        if (closeDelayRow) {
          if (state.autoClose) closeDelayRow.classList.remove('hidden');
          else closeDelayRow.classList.add('hidden');
        }
        syncMasterToggleFromPrefs();
        showToast('Saved');
      });
    }

    delayPills.forEach(pill => {
      pill.addEventListener('click', () => {
        delayPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const delay = parseInt(pill.getAttribute('data-delay'), 10) || 1;
        state.autoCloseDelay = delay;
        Storage.set({ autoCloseDelay: delay });
        showToast(`Dismiss set to ${delay}s`);
      });
    });

    // ==========================================================================
    // 5. Network & Diagnostics
    // ==========================================================================
    function updateGatewayDisplay(url) {
      if (!gatewayHostDisplay) return;
      if (!url || url === 'auto') {
        gatewayHostDisplay.textContent = 'Auto (All Blocks & Hostels)';
        return;
      }
      try {
        const u = new URL(url);
        gatewayHostDisplay.textContent = u.hostname;
      } catch (e) {
        gatewayHostDisplay.textContent = String(url || 'internet.lpu.in');
      }
    }

    if (gatewaySelect) {
      gatewaySelect.addEventListener('change', () => {
        const newGateway = gatewaySelect.value;
        state.gatewayUrl = newGateway;
        Storage.set({ gatewayUrl: newGateway });
        updateGatewayDisplay(newGateway);
        showToast(newGateway === 'auto' ? 'Auto-Detect Enabled' : 'Gateway Updated');
      });
    }

    // ==========================================================================
    // Unified Status Sync between Background Service Worker & Popup
    // ==========================================================================
    function applyStatusToPopup(status) {
      if (status === 'connecting') {
        if (manualSilentLoginBtn) {
          manualSilentLoginBtn.classList.add('loading');
          manualSilentLoginBtn.title = 'Silent login connecting...';
        }
        if (wifiStatusIcon) {
          wifiStatusIcon.className = 'brand-icon checking';
          wifiStatusIcon.title = 'Authenticating in background...';
        }
        if (netState) {
          netState.textContent = 'Connecting...';
          netState.className = 'info-val';
        }
      } else if (status === 'online') {
        if (manualSilentLoginBtn) {
          manualSilentLoginBtn.classList.remove('loading');
          manualSilentLoginBtn.title = 'Fast Silent Login (One-Click Background Auth)';
        }
        if (wifiStatusIcon) {
          wifiStatusIcon.className = 'brand-icon online';
          wifiStatusIcon.title = 'Connected & Online • Click to recheck';
        }
        if (netState) {
          netState.textContent = 'Online';
          netState.className = 'info-val val-green';
        }
      } else if (status === 'offline') {
        if (manualSilentLoginBtn) {
          manualSilentLoginBtn.classList.remove('loading');
          manualSilentLoginBtn.title = 'Fast Silent Login (One-Click Background Auth)';
        }
        if (wifiStatusIcon) {
          wifiStatusIcon.className = 'brand-icon offline';
          wifiStatusIcon.title = 'Captive Portal / Disconnected • Click to recheck';
        }
        if (netState) {
          netState.textContent = 'Captive Portal / Offline';
          netState.className = 'info-val';
        }
      } else if (status === 'disabled') {
        if (manualSilentLoginBtn) manualSilentLoginBtn.classList.remove('loading');
        if (wifiStatusIcon) {
          wifiStatusIcon.className = 'brand-icon';
          wifiStatusIcon.title = 'Auto-Login Disabled';
        }
      }
    }

    // Sync live state from background worker
    if (chrome && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((msg) => {
        if (msg && msg.action === 'indicator_status_changed' && msg.state) {
          applyStatusToPopup(msg.state);
        }
      });
    }

    if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: 'get_indicator_status' }, (res) => {
        if (res && res.state) {
          applyStatusToPopup(res.state);
        }
      });
    }

    function checkConnection() {
      applyStatusToPopup('connecting');

      const startTime = performance.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      fetch('http://connectivitycheck.gstatic.com/generate_204?t=' + Date.now(), {
        cache: 'no-store',
        signal: controller.signal
      })
        .then((resp) => {
          clearTimeout(timeoutId);
          const finalUrl = (resp.url || '').toLowerCase();
          const isCaptive =
            resp.redirected ||
            finalUrl.includes('24online') ||
            finalUrl.includes('lpu.in') ||
            finalUrl.includes('10.10.') ||
            finalUrl.includes('172.') ||
            resp.status !== 204;

          if (isCaptive) {
            if (netLatency) netLatency.textContent = 'Captive';

            // If autoLogin is active, immediately trigger background login and keep animating
            if (state.autoLogin !== false) {
              applyStatusToPopup('connecting');
              if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
                chrome.runtime.sendMessage({ action: 'attempt_silent_login' }, (res) => {
                  if (res && res.success) {
                    applyStatusToPopup('online');
                  } else {
                    applyStatusToPopup('offline');
                  }
                });
              }
            } else {
              applyStatusToPopup('offline');
            }
            return;
          }

          const latency = Math.round(performance.now() - startTime);
          applyStatusToPopup('online');
          if (wifiStatusIcon) {
            wifiStatusIcon.title = `Connected & Online (${latency} ms) • Click to recheck`;
          }
          if (netLatency) netLatency.textContent = `${latency} ms`;
        })
        .catch(() => {
          clearTimeout(timeoutId);
          applyStatusToPopup('offline');
          if (netLatency) netLatency.textContent = 'Timeout';
        });
    }

    if (wifiStatusIcon) wifiStatusIcon.addEventListener('click', checkConnection);
    if (testPingBtn) testPingBtn.addEventListener('click', checkConnection);

    if (manualSilentLoginBtn) {
      manualSilentLoginBtn.addEventListener('click', () => {
        if (manualSilentLoginBtn.classList.contains('loading')) return;
        manualSilentLoginBtn.classList.add('loading');
        manualSilentLoginBtn.title = 'Silent login connecting...';
        if (wifiStatusIcon) {
          wifiStatusIcon.className = 'brand-icon checking';
          wifiStatusIcon.title = 'Silent login in progress...';
        }

        if (chrome && chrome.runtime) {
          chrome.runtime.sendMessage({ action: 'attempt_silent_login' }, (resp) => {
            manualSilentLoginBtn.classList.remove('loading');
            manualSilentLoginBtn.title = 'Fast Silent Login (One-Click Background Auth)';

            if (resp && resp.success) {
              showToast('Silent Login Successful!');
              if (wifiStatusIcon) {
                wifiStatusIcon.className = 'brand-icon online';
                wifiStatusIcon.title = 'Connected & Online';
              }
              if (netState) {
                netState.textContent = 'Online';
                netState.className = 'info-val online';
              }
            } else {
              showToast('Login unconfirmed - Retrying...');
              checkConnection();
            }
          });
        } else {
          manualSilentLoginBtn.classList.remove('loading');
        }
      });
    }

    if (openPortalPrimaryBtn) {
      openPortalPrimaryBtn.addEventListener('click', () => {
        const targetUrl = (!state.gatewayUrl || state.gatewayUrl === 'auto')
          ? 'http://internet.lpu.in/24online/webpages/client.jsp'
          : state.gatewayUrl;

        if (chrome && chrome.tabs) {
          chrome.tabs.create({ url: targetUrl, active: true });
        } else {
          window.open(targetUrl, '_blank');
        }
        window.close();
      });
    }

    if (logoutSessionBtn) {
      logoutSessionBtn.addEventListener('click', () => {
        if (chrome && chrome.runtime) {
          chrome.runtime.sendMessage({ action: 'logout_portal' }, () => {
            showToast('Logout Initiated');
            checkConnection();
          });
        }
      });
    }

    function showToast(msg) {
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.remove('hidden');
      setTimeout(() => {
        toast.classList.add('hidden');
      }, 1800);
    }

    // ==========================================================================
    // 6. Initial Render & Storage Sync
    // ==========================================================================
    // Render immediate default state so UI is never stuck on "Loading profile..."
    renderAccounts();

    // Fetch stored data
    Storage.get(null, (data) => {
      const initialTheme = (data && data.theme) || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
      applyTheme(initialTheme);

      if (data && Array.isArray(data.accounts) && data.accounts.length > 0) {
        state.accounts = data.accounts;
        state.activeAccountId = data.activeAccountId || data.accounts[0].id;
      } else if (data && data.username && data.password) {
        state.accounts = [
          {
            id: 'acc_primary',
            label: 'Primary Account',
            username: String(data.username),
            password: String(data.password)
          }
        ];
        state.activeAccountId = 'acc_primary';
      } else {
        state.accounts = [];
        state.activeAccountId = null;
      }

      if (data) {
        state.autoLogin = data.autoLogin !== undefined ? data.autoLogin : true;
        state.loginOnStartup = data.loginOnStartup !== undefined ? data.loginOnStartup : true;
        state.keepAlive = data.keepAlive !== undefined ? data.keepAlive : true;
        state.autoClose = data.autoClose !== undefined ? data.autoClose : false;
        state.autoCloseDelay = data.autoCloseDelay !== undefined ? (parseInt(data.autoCloseDelay, 10) || 1) : 1;
        state.gatewayUrl = data.gatewayUrl || 'http://internet.lpu.in/24online/webpages/client.jsp';
      }

      const isAnyActive = state.autoLogin || state.loginOnStartup || state.keepAlive || state.autoClose;
      if (headerPowerToggle) headerPowerToggle.checked = isAnyActive;
      if (prefAutoLogin) prefAutoLogin.checked = state.autoLogin;
      if (prefLoginOnStartup) prefLoginOnStartup.checked = state.loginOnStartup;
      if (prefKeepAlive) prefKeepAlive.checked = state.keepAlive;
      if (prefAutoClose) prefAutoClose.checked = state.autoClose;

      if (closeDelayRow) {
        if (state.autoClose) closeDelayRow.classList.remove('hidden');
        else closeDelayRow.classList.add('hidden');
      }

      delayPills.forEach(pill => {
        const delay = parseInt(pill.getAttribute('data-delay'), 10) || 1;
        if (delay === state.autoCloseDelay) pill.classList.add('active');
        else pill.classList.remove('active');
      });

      if (gatewaySelect) gatewaySelect.value = state.gatewayUrl;
      updateGatewayDisplay(state.gatewayUrl);

      // Re-render with loaded data
      renderAccounts();
      checkConnection();
    });
  }

  // Self-executing initialization:
  // Runs immediately if DOM is already ready, or listens for DOMContentLoaded if still loading.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPopup);
  } else {
    initPopup();
  }
})();
