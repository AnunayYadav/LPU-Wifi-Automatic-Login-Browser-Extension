<div align="center">

# ⚡ LPU Wi-Fi Auto-Login

**Silent, zero-click background authentication for Lovely Professional University campus Wi-Fi.**

[![Download Latest Release](https://img.shields.io/badge/⬇️_Download-Extension%20(.zip)-2ea44f?style=for-the-badge&logo=googlechrome&logoColor=white)](https://github.com/AnunayYadav/LPU-Wifi-Automatic-Login-Browser-Extension/releases/latest/download/LPU-Wifi-Auto-Login-Extension.zip)
[![Release](https://img.shields.io/github/v/release/AnunayYadav/LPU-Wifi-Automatic-Login-Browser-Extension?label=Latest&color=0969da&style=for-the-badge)](https://github.com/AnunayYadav/LPU-Wifi-Automatic-Login-Browser-Extension/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-black?style=for-the-badge)](LICENSE)

*Works on **Brave**, **Google Chrome**, and **Microsoft Edge** (Manifest V3).*

</div>

---

Tired of re-entering your registration number on `internet.lpu.in` every time your laptop wakes up from sleep or disconnects? 

This lightweight browser extension logs you in **silently in the background** without opening intrusive captive portal tabs. Connect to campus Wi-Fi, open your browser, and you're already online.

---

### ✨ Features

* **🔇 100% Silent Background Login**  
  Authenticates directly via background HTTP requests. No redirect popups or captive portal tabs interrupting what you're doing.

* **⚡ All-Campus Auto-Detect**  
  Works out of the box across all LPU Wi-Fi networks:
  * **Hostels**: BH1–BH8, GH1–GH6 (and 5G variants)
  * **Academic Zones**: Blocks 25 through 38
  * **Common Areas**: Central Library, UniMall, and outdoor LPU Wireless

* **🔄 Session Keep-Alive & Auto-Reconnect**  
  Monitors connection status in the background. If the session expires or drops, it re-authenticates automatically with backoff retries.

* **👥 Multi-Account Profiles**  
  Save multiple registration numbers (e.g. personal, roommate, lab account) and switch active credentials with a single tap.

* **🎨 Apple-Inspired Dark Popup**  
  Minimalist, distraction-free interface with smooth motion, haptic feedback, and live toolbar connection indicators:
  * 🟢 **Green**: Connected & authenticated
  * 🔄 **Spinning**: Authenticating with campus gateway
  * 🔴 **Red**: Portal unreachable / offline
  * ⚪ **Gray**: Auto-login paused

* **🔒 Privacy-First Design**  
  Your password stays yours. Credentials are saved locally on your device in your browser's private storage (`chrome.storage.local`). Zero analytics, zero tracking, zero external servers.

---

### 📦 Quick Install (30 Seconds)

1. **Download**: Click [**`LPU-Wifi-Auto-Login-Extension.zip`**](https://github.com/AnunayYadav/LPU-Wifi-Automatic-Login-Browser-Extension/releases/latest/download/LPU-Wifi-Auto-Login-Extension.zip) (or download from the [Releases](https://github.com/AnunayYadav/LPU-Wifi-Automatic-Login-Browser-Extension/releases/latest) page).
2. **Extract**: Right-click the `.zip` file and extract it to a folder on your computer.
3. **Open Extensions**:
   * **Brave**: `brave://extensions`
   * **Chrome**: `chrome://extensions`
   * **Edge**: `edge://extensions`
4. **Enable Developer Mode**: Turn on the switch in the top-right corner.
5. **Load Unpacked**: Click **Load unpacked** (top-left) and select the extracted folder.
6. **Save Credentials**: Click the extension icon in your toolbar, enter your Registration Number & Password, and click **Save Profile**.

*That's it! Whenever your laptop connects to LPU Wi-Fi, you will be logged in automatically.*

---

### ❓ FAQ

<details>
<summary><b>Is my password secure?</b></summary>
<br>
Yes. Credentials are saved exclusively in your browser's internal local storage (<code>chrome.storage.local</code>). They never leave your device and are sent only to LPU's local gateway endpoints during authentication.
</details>

<details>
<summary><b>How does it work without opening tabs?</b></summary>
<br>
The extension runs a Manifest V3 background service worker that sends the login payload directly to LPU's authentication gateway (<code>internet.lpu.in</code> / <code>10.10.0.1</code>) via HTTP POST.
</details>

<details>
<summary><b>How do I update to a newer version?</b></summary>
<br>
Download the newest zip, replace the files in your existing folder, and click the <b>Reload (🔄)</b> button on your browser's extensions page.
</details>

---

### 💻 For Developers

```bash
# Clone the repository
git clone https://github.com/AnunayYadav/LPU-Wifi-Automatic-Login-Browser-Extension.git

# Package extension into zip
powershell -ExecutionPolicy Bypass -File .\build-package.ps1
```

Contributions, bug reports, and suggestions are welcome! Feel free to open an [issue](https://github.com/AnunayYadav/LPU-Wifi-Automatic-Login-Browser-Extension/issues) or submit a pull request.

---

### 📄 License

Distributed under the [MIT License](LICENSE). Made for the LPU student community.
