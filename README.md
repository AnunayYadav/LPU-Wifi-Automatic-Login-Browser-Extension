# 🚀 LPU Wi-Fi Captive Portal Auto-Login

[![Download Extension](https://img.shields.io/badge/⬇️_Download-Extension%20(.zip)-2ea44f?style=for-the-badge&logo=googlechrome&logoColor=white)](https://github.com/AnunayYadav/LPU-Wifi-Automatic-Login-Browser-Extension/releases/latest/download/LPU-Wifi-Auto-Login-Extension.zip)
[![Latest Release](https://img.shields.io/github/v/release/AnunayYadav/LPU-Wifi-Automatic-Login-Browser-Extension?label=Latest%20Release&color=0969da&style=for-the-badge)](https://github.com/AnunayYadav/LPU-Wifi-Automatic-Login-Browser-Extension/releases/latest)

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
LPU-Wifi-Automatic-Login-Browser-Extension/
├── manifest.json      # Extension configuration & host permissions (Manifest V3)
├── popup.html         # Apple-inspired popup interface
├── popup.css          # True Neutral Obsidian / Titanium styling
├── popup.js           # Multi-account & settings controller
├── background.js      # Silent HTTP POST engine & dynamic toolbar icon
├── content.js         # In-page auto-fill & fast dismissal
├── fonts/             # Inter typography
├── icons/             # Dynamic state icons (online, offline, connecting)
├── .gitignore         # Shields local configs from git
└── README.md          # Project documentation
```

---

## 🌐 Quick Installation Guide (Brave, Chrome & Edge)

### Method 1: Direct Download (Recommended)
1. **Download the Extension**: Click [**`LPU-Wifi-Auto-Login-Extension.zip`**](https://github.com/AnunayYadav/LPU-Wifi-Automatic-Login-Browser-Extension/releases/latest/download/LPU-Wifi-Auto-Login-Extension.zip) (or grab the latest package from [Releases](https://github.com/AnunayYadav/LPU-Wifi-Automatic-Login-Browser-Extension/releases/latest)).
2. **Extract the ZIP**: Unzip / extract the downloaded file to a folder on your computer.
3. **Open Extensions Page**: In your browser, navigate to:
   - **Brave**: `brave://extensions`
   - **Chrome**: `chrome://extensions`
   - **Edge**: `edge://extensions`
4. **Enable Developer Mode**: Turn on the toggle switch in the top-right corner.
5. **Load Unpacked**: Click the **Load unpacked** button in the top-left and select the extracted folder.
6. **Save Credentials**: Click the extension icon in your browser toolbar, enter your **Registration Number** & **Password**, and click **Save Profile**.
7. **Done!** Whenever your laptop connects to LPU Wi-Fi, the extension will log you in automatically in the background.

---

### Method 2: For Developers (Git Clone)
```bash
git clone https://github.com/AnunayYadav/LPU-Wifi-Automatic-Login-Browser-Extension.git
```
Then load the cloned repository directory via **Load unpacked** in `chrome://extensions`.

---

## 🛡️ Privacy & Security

- **Local Storage Only**: Your credentials are stored exclusively in your browser's private local extension storage (`chrome.storage.local`).
- **Zero Tracking**: No external servers, telemetry, or analytics. Communication occurs strictly between your browser and LPU's local campus gateway.
- **Open Source**: Complete transparency with zero obfuscation.
