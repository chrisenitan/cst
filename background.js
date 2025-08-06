//extension init
//should probably move this to content script instead once we have other sites to control

const log = {
  time: new Date().toISOString(),
  app: "",
}

/**
 * there is still an issue... we use tags to id page cus script is loaded once and tab.url is only valid on initial page load.
 * even using dom tags here does not work cus, yt does not remove old pages content even after navigation.
 **/
const sys = {
  searchPageGlob: "ytd-two-column-search-results-renderer",
  subPageShorts: "ytd-item-section-renderer",
  homePageShorts: "ytd-rich-section-renderer",
  tv: {
    adBox: "charting-ad",
    closeAdBtn: "closeButton",
    goProModal: '[data-dialog-name^="gopro"]',
  },
  log
}

function isYoutubeRules(tab) {
  const url = tab?.url || ""
  return ["https://www.youtube.com/feed/subscriptions", "https://www.youtube.com/"].includes(url) //specifically looking for pages on youtube so we don't match search page
}

function isTradingViewRules(tab) {
  const url = tab?.url || ""
  return url.includes("https://www.tradingview.com/chart/")
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, _) => {
  if (changeInfo.status !== "complete") return
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
  log.app = tab.title.split("/")[0].split(".")[0] //creates site related log data
  if (isYoutubeRules(tab)) {
    chrome.scripting.executeScript({
      target: { tabId },
      func: (sys) => {
        const removeShorts = () => {
          let searchPageTag = document.getElementsByTagName(sys.searchPageGlob)
          let isOnSearchPage = searchPageTag.length > 0
          if (isOnSearchPage) return console.log("Esc. Allowing shorts on search results", sys.log)
          let shortSections = [document.getElementsByTagName(sys.subPageShorts), document.getElementsByTagName(sys.homePageShorts)]
          shortSections.forEach((elList) => {
            Array.from(elList).map((el) => {
              if (el.innerText.includes("Shorts")) {
                el.remove()
                console.log("removed shorts node from youtube", sys.log)
              }
            })
          })
        }
        //run once for initial page load, run on every page scroll
        setTimeout(removeShorts, 500)
        document.addEventListener("scroll", removeShorts)
      },
      args: [sys],
    })
  }

  if (isTradingViewRules(tab)) {
    chrome.scripting.executeScript({
      target: { tabId },
      func: (sys) => {
        function removeAd() {
          console.log("checking for TV ads", sys.log)
          const adBox = document.getElementById(sys.tv.adBox)
          const goProModal = document.querySelectorAll(sys.tv.goProModal)
          const closeAdBtns = adBox?.getElementsByTagName("button")
          const closeModalButtons = goProModal[0]?.getElementsByTagName("button")
          const allButtons = Array.from(closeAdBtns || "").concat(Array.from(closeModalButtons || ""))
          if (allButtons.length <= 0) return console.log("No dismissible ads found", sys.log)

          Array.from(allButtons).forEach((btn) => {
            if (btn && btn.classList.toString().includes(sys.tv.closeAdBtn)) {
              btn.click()
              console.log("clicked close button on TV up sell", sys.log)
            }
          })
        }
        setInterval(removeAd, 30000)
      },
      args: [sys],
    })
  }
})
