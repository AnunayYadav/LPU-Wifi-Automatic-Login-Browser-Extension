# 🚀 LPU Wi-Fi Captive Portal Auto-Login

A fast, silent auto-login browser extension for **Lovely Professional University (LPU)** campus Wi-Fi networks (`LPU Hostels`, `LPU Hostels-5G`, `LPU Wireless`, Blocks 25–38).

Built as a **Manifest V3 Extension** for **Brave**, **Google Chrome**, and **Microsoft Edge**.

---

## ✨ Features

- **100% Silent Background Login**: Authenticates directly via HTTP POST in the service worker — **zero tabs or popups opened**.
- **Dynamic Toolbar Status**: Live toolbar icon indicates network state:
  - 🟢 **Green**: Connected & authenticated with active internet.
  - 🔴 **Red**: Captive portal blocked / offline.
  - 🔄 **Blue (Spinning)**: Authenticating with LPU gateway.
  - ⚪ **Gray**: Auto-login paused.
- **Apple-Inspired Popup UI**: True Neutral Obsidian / Titanium styling with glassmorphic cards and micro-animations.
- **Multi-Account Profiles**: Save multiple registration numbers (e.g., your ID, roommate's ID) and switch instantly with 1 click.
- **Auto-Failover / Gateway Retries**: Seamlessly cycles through all known campus gateway IP endpoints (`internet.lpu.in`, `10.10.0.1`, `172.20.0.66`, etc.) with exponential backoff.
- **Fallback Content Script**: If you ever land on `internet.lpu.in`, it auto-fills credentials and submits in under 0.05 seconds.

---

## 📁 Repository Structure

```text
LPU-WiFi-AutoLogin/
├── browser-extension/     # Chrome, Brave & Edge Extension (Manifest V3)
│   ├── manifest.json      # Extension configuration & host permissions
│   ├── popup.html         # Modern popup interface
│   ├── popup.css          # True Neutral Obsidian / Titanium styling
│   ├── popup.js           # Multi-account & settings controller
│   ├── background.js      # Silent HTTP POST engine & dynamic toolbar icon
│   ├── content.js         # In-page auto-fill & fast dismissal
│   ├── fonts/             # Inter typography
│   └── icons/             # Dynamic state icons (online, offline, connecting)
│
├── .gitignore             # Shields local configs from git
└── README.md              # Project documentation
```

---

## 🌐 Installation Guide (Brave, Chrome & Edge)

1. Open your browser and navigate to:
   - **Brave**: `brave://extensions`
   - **Chrome**: `chrome://extensions`
   - **Edge**: `edge://extensions`
2. Enable the **Developer mode** toggle in the top-right corner.
3. Click the **Load unpacked** button.
4. Select the **`browser-extension`** folder inside this repository.
5. Click the extension icon in your browser toolbar, enter your **Registration Number** and **Password**, and click **Save**.
6. **Done!** Whenever your laptop connects to LPU Wi-Fi, the extension will log you in automatically in the background.

---

## 🛡️ Privacy & Security

- **Local Storage Only**: Your credentials are stored exclusively in your browser's private local extension storage (`chrome.storage.local`).
- **Zero Tracking**: No external servers, telemetry, or analytics. Communication occurs strictly between your browser and LPU's local campus gateway.
- **Open Source**: Complete transparency with zero obfuscation.
