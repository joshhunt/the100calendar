import "../img/icon-128.png";
import "../img/icon-34.png";

let windowId = 0;
const CONTEXT_MENU_ID = "100_example_context_menu";

function closeIfExist() {
  if (windowId > 0) {
    chrome.windows.remove(windowId);
    windowId = chrome.windows.WINDOW_ID_NONE;
  }
}

function popWindow(type) {
  closeIfExist();
  const options = {
    type: "popup",
    left: 100,
    top: 100,
    width: 800,
    height: 475
  };

  if (type === "open") {
    options.url = "popup.html";
    chrome.windows.create(options, win => {
      windowId = win.id;
    });
  }
}

chrome.contextMenus.create({
  id: CONTEXT_MENU_ID,
  title: "The 100.io Calendar",
  contexts: ["all"],
  documentUrlPatterns: ["https://www.the100.io/*"]
});

chrome.contextMenus.onClicked.addListener(event => {
  if (event.menuItemId === CONTEXT_MENU_ID) {
    popWindow("open");
  }
});
