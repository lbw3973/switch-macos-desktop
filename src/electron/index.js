const { app, BrowserWindow, Tray, Menu } = require("electron");
const path = require("path");
const { uIOhook } = require("uiohook-napi");
const run = require("run-applescript");

let tray = null;
let window = null;


const createWindow = () => {
  window = new BrowserWindow({
    width: 0,
    height: 0,
    show: false, // 처음엔 숨김
    frame: false, // 테두리 없음
    resizable: false,
    transparent: true, // 위젯 느낌
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    vibrancy:"sidebar",
  });

  window.loadFile("index.html");
  window.on("blur", () => {
    window.hide(); // 포커스 벗어나면 자동 닫기
  });
}

const createTray = () => {
  const iconPath = path.join(__dirname, "../../Icon.png"); // 최소 16~32px 짜리
  tray = new Tray(iconPath);

  const trayMenu = Menu.buildFromTemplate([
    { label: "Quit", click: () => app.quit(), accelerator:"Cmd+Q" }
  ]);

  tray.setToolTip("Switch Desktop");
  tray.setContextMenu(trayMenu);
}

const moveDesktopRight = async () => {
  await run.runAppleScript(`
    tell application "System Events"
      key code 124 using control down
    end tell
  `);
};

const moveDesktopLeft = async () => {
  await run.runAppleScript(`
    tell application "System Events"
      key code 123 using control down
    end tell
  `);
};

const MouseClickListener = () => {
  let pressedButtons = new Set();
  let firstPressTime = 0;
  const WINDOW = 300; // 150ms 안에 눌리면 "동시"로 인정

  uIOhook.on('mousedown', async (e) => {
    const btn = e.button;
    const now = Date.now();

    if (pressedButtons.size > 0 && now - firstPressTime > WINDOW) {
      pressedButtons.clear();
    }

    if (pressedButtons.size === 0) {
      pressedButtons.add(btn);
      firstPressTime = now;
      return;
    }

    pressedButtons.add(btn);

    if (pressedButtons.has(1) && pressedButtons.has(5)) {
      await moveDesktopRight();
      pressedButtons.clear(); // 조건 충족 후 초기화
      return;
    }

    if (pressedButtons.has(1) && pressedButtons.has(4)) {
      await moveDesktopLeft();
      pressedButtons.clear(); // 조건 충족 후 초기화
      return;
    }
  });

  uIOhook.start();
}

app.whenReady().then(() => {
  app.dock.hide();
  createWindow();
  createTray();
  MouseClickListener();
});
