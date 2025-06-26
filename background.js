//extension init
//should probably move this to content script instead once we have other sites to control

/**
 * there is still an issue... we use tags to id page cus script is loaded once and tab.url is only valid on initial page load.
 * even using dom tags here does not work cus, yt does not remove old pages content even after navigation.
 **/
let domTags = {
  searchPageGlob: "ytd-two-column-search-results-renderer",
  subPageShorts: "ytd-item-section-renderer",
  homePageShorts: "ytd-rich-section-renderer",
}

let isYoutubeRules = (tab) => {
  let url = tab.url
  return url.includes("www.youtube.com/feed/subscriptions") || url == "https://www.youtube.com" //specifically looking for pages on youtube so we don't match search page
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
              if (el.innerText.includes("Shorts")) el.remove(), console.log("removed shorts node from youtube")
            })
          })
        }
        setTimeout(removeShorts, 500) //run once initially
        document.addEventListener("scroll", (_) => {
          removeShorts()
        })
      },
      args: [domTags],
    })
  }

  // if (url.includes("example-streaming.com")) {
  //   chrome.scripting.executeScript({
  //     target: { tabId },
  //     func: () => {
  //       document.querySelectorAll("video").forEach((v) => (v.muted = true))
  //     },
  //   })
  // }
})
