const { app, BrowserWindow, Tray, nativeImage } = require("electron");
const path = require("path");
const { uIOhook } = require("uiohook-napi");
const run = require("run-applescript");

let tray = null;
let window = null;


const createWindow = () => {
  window = new BrowserWindow({
    width: 250,
    height: 300,
    show: false, // 처음엔 숨김
    frame: false, // 테두리 없음
    resizable: false,
    transparent: true, // 위젯 느낌
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  window.loadFile("index.html");
  window.on("blur", () => {
    window.hide(); // 포커스 벗어나면 자동 닫기
  });
}

const createTray = () => {
  const iconPath = path.join(__dirname, "Icon.png"); // 최소 16~32px 짜리
  tray = new Tray(iconPath);

  tray.setToolTip("Switch Desktop");
  tray.on("click", toggleWindow);
}

function toggleWindow() {
  const windowBounds = window.getBounds();
  const trayBounds = tray.getBounds();

  // 메뉴바 아래에 표시되는 위치 계산
  const x = Math.round(trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2);
  const y = Math.round(trayBounds.y + trayBounds.height);

  window.setPosition(x, y, false);

  if (window.isVisible()) {
    window.hide();
  } else {
    window.show();
    window.focus();
  }
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

    // 첫 번째 버튼
    if (pressedButtons.size === 0) {
      pressedButtons.add(btn);
      firstPressTime = now;
      return;
    }

    // 두 번째 버튼
    if (now - firstPressTime <= WINDOW) {
      pressedButtons.add(btn);

      if (pressedButtons.has(1) && pressedButtons.has(5)) {
        console.log("Right");
        await moveDesktopRight();
        return;
      }

      if (pressedButtons.has(1) && pressedButtons.has(4)) {
        console.log("Left");
        await moveDesktopLeft();
        return;
      }
    }

    // 이후 상태 초기화
    pressedButtons.clear();
  });

  uIOhook.start();
}

app.whenReady().then(() => {
  createWindow();
  createTray();
  MouseClickListener();
});
