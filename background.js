//extension init
//should probably move this to content script instead once we have other sites to control

/**
 * there is still an issue... we use tags to id page cus script is loaded once and tab.url is only valid on initial page load.
 * even using dom tags here does not work cus, yt does not remove old pages content even after navigation.
 **/
const domTags = {
  searchPageGlob: "ytd-two-column-search-results-renderer",
  subPageShorts: "ytd-item-section-renderer",
  homePageShorts: "ytd-rich-section-renderer",
  tv: {
    adBox: "charting-ad",
    closeAdBtn: "closeButton",
  },
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
  if (isYoutubeRules(tab)) {
    chrome.scripting.executeScript({
      target: { tabId },
      func: (domTags) => {
        const removeShorts = () => {
          let searchPageTag = document.getElementsByTagName(domTags.searchPageGlob)
          let isOnSearchPage = searchPageTag.length > 0
          if (isOnSearchPage) return console.log("Esc. Allowing shorts on search results")
          let shortSections = [document.getElementsByTagName(domTags.subPageShorts), document.getElementsByTagName(domTags.homePageShorts)]
          shortSections.forEach((elList) => {
            Array.from(elList).map((el) => {
              if (el.innerText.includes("Shorts")) {
                el.remove()
                console.log("removed shorts node from youtube")
              }
            })
          })
        }
        //run once for initial page load, run on every page scroll
        setTimeout(removeShorts, 500)
        document.addEventListener("scroll", removeShorts)
      },
      args: [domTags],
    })
  }

  if (isTradingViewRules(tab)) {
    chrome.scripting.executeScript({
      target: { tabId },
      func: (domTags) => {
        function removeAd() {
          console.log("checking for TV ads")
          const adBox = document.getElementById(domTags.tv.adBox)
          const closeBtn = adBox?.getElementsByTagName("button")
          if (!closeBtn) return console.log("No dismissible ad found")
          Array.from(closeBtn).forEach((btn) => {
            if (btn && btn.classList.toString().includes(domTags.tv.closeAdBtn)) {
              btn.click()
              console.log("clicked close button on ad box")
            }
          })
        }
        setInterval(removeAd, 30000)
      },
      args: [domTags],
    })
  }
})
