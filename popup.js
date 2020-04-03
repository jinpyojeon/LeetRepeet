chrome.runtime.onMessage.addListener(function (request, sender) {
  if (request.action === "getSource") {
    message.innerText = request.source;
    const re = /^(.+?)\//;
    var username = re
      .exec(message.innerText.split("https://assets.leetcode.com/users/")[1])[1]
      .trim();
  }
  chrome.storage.local.set({ "currentUsername": username },function() {
  });
  console.log(username);
  chrome.storage.local.get(['currentUsername'], function (user) {
    console.log('Value currently is ' + user.key);
  });
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
        chrome.storage.local.get(['currentUsername'], function (user) {
          console.log('Value currently is ' + user.key);
          document.getElementsByClassName("other")[0].style.display = "none";
          if (currentUrl.startsWith("https://leetcode.com/problems/")) {
            document.getElementsByClassName("home")[0].style.display = "none";
            chrome.tabs.executeScript(
                {
                  code: "(" + modifyDOM + ")();",
                },
                (results) => {
                  results = results.toString();
                  var problemNumber = determineProblemNumber(results);
                  var problemDescription = determineProblemDescription(results);
                  var problemLevel = determineProblemLevel(results);
                  var date = new Date().addDays(180);
                  dbstuff(user, problemNumber, problemLevel, problemDescription, date);
                  console.log(alasql("SELECT * FROM Information"));
                }
            );
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
        });
      } else {
        document.getElementsByClassName("home")[0].style.display = "none";
        document.getElementsByClassName("problems")[0].style.display = "none";
      }
    }
  );
}

function modifyDOM() {
  return document.body.innerHTML;
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

function dbstuff(username, number, level, desc, date) {
  createTables();
  insertData(username, number, level, desc, date);
}
function createTables()
{
  alasql("CREATE TABLE IF NOT EXISTS Information (username STRING, problemno NUMBER, problemlevel STRING, problemdesc STRING, repeatdate DATE )");
}

function insertData(username, number, level, desc, date){
  var ifExists = alasql("SELECT COUNT(*) FROM Information WHERE username = ? && problemno = ?",[username, number]);
  if(ifExists > 0){
    updateRecord(username, number, level, desc, date);
  } else{
    insertNewRecord(username, number, level, desc, date);
  }
}

function insertNewRecord(username, number, level, desc, date)
{
  alasql("INSERT INTO Information (?, ?, ?, ?,?)",[username, number, level, desc, date]);

}

function updateRecord(username, number, level, desc, date){
  alasql("UPDATE Information SET repeatdate = ? WHERE username = ? && problemno = ?",[date,username]);
}
window.onload = onWindowLoad;
