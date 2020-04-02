chrome.runtime.onMessage.addListener(function (request, sender) {
  if (request.action === "getSource") {
    message.innerText = request.source;
    const re = /^(.+?)\//;
    const username = re
      .exec(message.innerText.split("https://assets.leetcode.com/users/")[1])[1]
      .trim();
  }
});

function onWindowLoad() {
  chrome.tabs.query(
    {
      active: true,
      lastFocusedWindow: true,
    },
    function (tabs) {
      var currentUrl = tabs[0].url;
      if (currentUrl.startsWith("https://leetcode.com/")) {
        document.getElementsByClassName("other")[0].style.display = "none";
        if (currentUrl.startsWith("https://leetcode.com/problems/")) {
          document.getElementsByClassName("home")[0].style.display = "none";
          function modifyDOM() {
            return document.body.innerHTML;
          }
          chrome.tabs.executeScript(
            {
              code: "(" + modifyDOM + ")();",
            },
            (results) => {
              results = results.toString();
              var problemNumber = determineProblemNumber(results);
              var problemDescription = determineProblemDescription(results);
              var problemLevel = determineProblemLevel(results);
              var problemUsername = determineProblemUsername(results);
            }
          );
          var date = new Date().addDays(180);
        } else {
          document.getElementsByClassName("problems")[0].style.display = "none";
          var message = document.querySelector("#message");
          chrome.tabs.executeScript(
            null,
            {
              file: "getPagesSource.js",
            },
            function () {
              if (chrome.runtime.lastError) {
                message.innerText =
                  "There was an error injecting script : \n" +
                  chrome.runtime.lastError.message;
              }
            }
          );
        }
      } else {
        document.getElementsByClassName("home")[0].style.display = "none";
        document.getElementsByClassName("problems")[0].style.display = "none";
        dbstuff();
      }
    }
  );
}

Date.prototype.addDays = function (days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

function determineProblemLevel(results) {
  var problemLevel = "";
  if (results.includes("css-dcmtd5")) {
    problemLevel = "Medium";
  } else if (results.includes("css-14oi08n")) {
    problemLevel = "Easy";
  } else {
    problemLevel = "Hard";
  }
  return problemLevel;
}

function determineProblemUsername(results){
  const re2 = /^(.+?)\//;
  return re2.exec(results.split('class="user-link__2Czf" href="/')[1])[1];
}

function determineProblemDescription(results)
{
  const re = /^(.+?)<\//;
  return re.exec(
      results.split(
          '<div data-cy="question-title" class="css-v3d350">'
      )[1]
  )[1].split(".")[1].trim();
}

function determineProblemNumber(results)
{
  const re = /^(.+?)<\//;
  return re.exec(
      results.split(
          '<div data-cy="question-title" class="css-v3d350">'
      )[1]
  )[1].split(".")[0].trim();
}

function dbstuff()
{
  alasql("CREATE TABLE IF NOT EXISTS cities (city string, population number)");
  alasql("INSERT INTO cities VALUES ('Rome',2863223), ('Paris',2249975), ('Berlin',3517424),  ('Madrid',3041579)");
  alasql("INSERT INTO cities VALUES ('Rome',2863223), ('Paris',2249975), ('Berlin',3517424),  ('Madrid',3041579)");
  console.log(alasql("Select * from cities"));

}
window.onload = onWindowLoad;
