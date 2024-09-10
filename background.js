const website = "https://defender-portal.onrender.com";

const isOnKey = "isOn";

// Function to store session data
async function storeSessionData(key, value) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [key]: value }, function () {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

// Function to get session data
async function getSessionData(key) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([key], function (result) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result[key]);
      }
    });
  });
}

function Guard(tab) {
  if (!tab.url.startsWith(website)) {
    throw new Error("You are not allowed to access this website!");
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  storeSessionData(isOnKey, false);

  chrome.action.setBadgeText({
    text: "OFF",
  });

  console.log("Plugin installed!");
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  Guard(tab);

  if (changeInfo.status === "loading") {
    HangleState(tab);
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  Guard(tab);

  const prevState = await getSessionData(isOnKey);
  const newStateIsOn = !prevState;

  await storeSessionData(isOnKey, newStateIsOn);

  await HangleState(tab);
});

async function HangleState(tab) {
  const state = await getSessionData(isOnKey);

  await chrome.action.setBadgeText({
    tabId: tab.id,
    text: state ? "ON" : "OFF",
  });

  await RunScript(tab);
}

async function RunScript(tab) {
  const newStateIsOn = await getSessionData(isOnKey);

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: (newStateIsOn) => {
      const iframeId = "fullscreenIframe";
      let iframe = document.getElementById(iframeId);

      if (newStateIsOn) {
        if (!iframe) {
          iframe = document.createElement("iframe");
          iframe.id = iframeId;
          iframe.src = "//api.marts.ws/embed/movie/638";
          iframe.style.position = "fixed";
          iframe.style.top = "0";
          iframe.style.left = "0";
          iframe.style.width = "100%";
          iframe.style.height = "100%";
          iframe.style.border = "none";
          iframe.style.zIndex = "9999";
          document.body.appendChild(iframe);
        }
      } else {
        if (iframe) {
          iframe.remove();
        }
      }
    },
    args: [newStateIsOn],
  });
}
