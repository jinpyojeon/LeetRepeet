chrome.runtime.onMessage.addListener(function (request, sender) {
  // eslint-disable-next-line eqeqeq
  if (request.action === 'getSource') {
    message.innerText = request.source;
    const re = /^(.+?)\//;
    const username = re.exec(
      message.innerText.split('https://assets.leetcode.com/users/')[1])[1];
    chrome.storage.sync.set({ username: username }, function () {})
  }
});

function onWindowLoad () {
  chrome.tabs.query(
    {
      active: true,
      lastFocusedWindow: true
    },
    function (tabs) {
      var currentUrl = tabs[0].url;
      if (currentUrl.startsWith('https://leetcode.com/')) {
        document.getElementsByClassName('other')[0].style.display = 'none';
        if (currentUrl.startsWith('https://leetcode.com/problems/')) {
          document.getElementsByClassName('leetcode')[0].style.display = 'none';
            console.log("Popup DOM fully loaded and parsed");

            function modifyDOM() {
              //You can play with your DOM here or check URL against your regex
              console.log('Tab script:');
              console.log(document.body);
              return document.body.innerHTML;
            }
            //We have permission to access the activeTab, so we can call chrome.tabs.executeScript:
            chrome.tabs.executeScript({
              code: '(' + modifyDOM + ')();' //argument here is a string but function.toString() returns function's code
            }, (results) => {
              //Here we have just the innerHTML and not DOM structure
              console.log('Popup script:');
              console.log(results[0]);
            });
        }
        else {
          document.getElementsByClassName('problemscreen')[0].style.display = 'none';
          var message = document.querySelector('#message');
          chrome.tabs.executeScript(
            null,
            {
              file: 'getPagesSource.js'
            },
            function () {
              if (chrome.runtime.lastError) {
                message.innerText =
                  'There was an error injecting script : \n' +
                  chrome.runtime.lastError.message
              }
            }
          )
        }
      } else {
        document.getElementsByClassName('leetcode')[0].style.display = 'none';
        document.getElementsByClassName('problemscreen')[0].style.display = 'none';
      }
    }
  )
}

window.onload = onWindowLoad
