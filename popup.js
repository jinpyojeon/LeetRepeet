chrome.runtime.onMessage.addListener(function(request, sender) {
  if (request.action == "getSource") {
    message.innerText = request.source;
    let re = /^(.+?)\//;
    const username = re.exec(message.innerText.split('https://assets.leetcode.com/users/')[1])[1];
    chrome.storage.sync.set({ "username": username }, function(){
    });
  }
});

function onWindowLoad() {
  chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
  }, function(tabs) {
    var currentUrl= tabs[0].url;
    if(currentUrl.startsWith("https://leetcode.com/")) {
      document.getElementsByClassName("other")[0].style.display = "none";
      if (currentUrl.startsWith("https://leetcode.com/problems")) {

      }
      else {
        var message = document.querySelector('#message');
        chrome.tabs.executeScript(null, {
          file: "getPagesSource.js"
        }, function () {
          if (chrome.runtime.lastError) {
            message.innerText = 'There was an error injecting script : \n' + chrome.runtime.lastError.message;
          }
        });
      }
    }
    else {
      document.getElementsByClassName("leetcode")[0].style.display = "none";
    }
  });
}

window.onload = onWindowLoad;