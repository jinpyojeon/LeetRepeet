function onWindowLoad() {
  chrome.tabs.query(
    {
      active: true,
      lastFocusedWindow: true,
    },
    function (tabs) {
      var currentUrl = tabs[0].url;
      if (currentUrl.startsWith("https://leetcode.com/")) {
        changeIcon();
        createTables();
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
              var problemUsername = determineProblemUsername();
              var problemDate = new Date().addDays(-2);
              dbstuff(
                problemUsername,
                problemNumber,
                problemLevel,
                problemDescription,
                problemDate
              );
            }
          );
        } else {
          document.getElementsByClassName("problems")[0].style.display = "none";
          chrome.runtime.onMessage.addListener(function (request, sender) {
            var username;
            if (request.action === "getSource") {
              message.innerText = request.source;
              const re = /^(.+?)\//;
              username = re
                .exec(
                  message.innerText.split(
                    "https://assets.leetcode.com/users/"
                  )[1]
                )[1]
                .trim()
                .toString();
            }
            if (username != "") {
              generateHomeScreen(username);
            } else {
              console.log("Display screen asking to log in ");
            }
          });
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
        changeIcon2();
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

function determineProblemUsername(results) {
  var xhr = new XMLHttpRequest();

  xhr.open("GET", "https://leetcode.com/api/problems/algorithms/", false);
  xhr.send();

  var result = JSON.parse(xhr.responseText);
  return Object.values(result)[0].toString();
}

function determineProblemDescription(results) {
  const re = /^(.+?)<\//;
  return re
    .exec(
      results.split('<div data-cy="question-title" class="css-v3d350">')[1]
    )[1]
    .split(".")[1]
    .trim()
    .toString();
}

function determineProblemNumber(results) {
  const re = /^(.+?)<\//;
  return parseInt(
    re
      .exec(
        results.split('<div data-cy="question-title" class="css-v3d350">')[1]
      )[1]
      .split(".")[0]
      .trim()
  );
}

function dbstuff(
  problemUsername,
  problemNumber,
  problemLevel,
  problemDescription,
  problemDate
) {
  insertData(
    problemUsername,
    problemNumber,
    problemLevel,
    problemDescription,
    problemDate
  );
  console.log(alasql("SELECT * FROM Information"));
}

function createTables() {
  alasql("CREATE LOCALSTORAGE DATABASE IF NOT EXISTS main_db");
  alasql("ATTACH LOCALSTORAGE DATABASE main_db");
  alasql("USE main_db");
  alasql(
    "CREATE TABLE IF NOT EXISTS Information (problemUsername STRING, problemNumber NUMBER, problemLevel STRING, problemDescription STRING, problemDate DATE )"
  );
}

function insertData(
  problemUsername,
  problemNumber,
  problemLevel,
  problemDescription,
  problemDate
) {
  var ifExists = alasql(
    "SELECT VALUE COUNT(*) FROM Information WHERE problemUsername = ? AND problemNumber = ?",
    [problemUsername, problemNumber]
  );
  if (ifExists > 0) {
    updateRecord(
      problemUsername,
      problemNumber,
      problemLevel,
      problemDescription,
      problemDate
    );
  } else {
    insertNewRecord(
      problemUsername,
      problemNumber,
      problemLevel,
      problemDescription,
      problemDate
    );
  }
}

function insertNewRecord(
  problemUsername,
  problemNumber,
  problemLevel,
  problemDescription,
  problemDate
) {
  alasql("INSERT INTO Information VALUES(?, ?, ?, ?,?)", [
    problemUsername,
    problemNumber,
    problemLevel,
    problemDescription,
    problemDate,
  ]);
}

function updateRecord(
  problemUsername,
  problemNumber,
  problemLevel,
  problemDescription,
  problemDate
) {
  alasql(
    "UPDATE Information SET problemDate = ? WHERE problemUsername = ? AND problemNumber = ?",
    [problemDate, problemUsername, problemNumber]
  );
}

function changeIcon() {
  chrome.browserAction.setIcon({
    path: {
      "16": "images/16x16light.png",
      "32": "images/32x32light.png",
      "48": "images/48x48light.png",
      "128": "images/128x128light.png",
    },
  });
}

function changeIcon2() {
  chrome.browserAction.setIcon({
    path: {
      "16": "images/16x16dark.png",
      "32": "images/32x32dark.png",
      "48": "images/48x48dark.png",
      "128": "images/128x128dark.png",
    },
  });
}

function generateHomeScreen(username) {
  var currentDate = new Date().toISOString();
  var lowerLimit = new Date();
  lowerLimit.setHours(lowerLimit.getHours() - 12);
  lowerLimit = lowerLimit.toISOString();
  var upperLimit = new Date();
  upperLimit.setHours(upperLimit.getHours() + 30);
  upperLimit = upperLimit.toISOString();
  var arr = alasql(
    "SELECT * FROM Information WHERE problemDate > ? AND problemDate < ? AND problemUsername = ? LIMIT 5",
    [lowerLimit, upperLimit, username]
  );
  var arrayToString = JSON.stringify(Object.assign({}, arr)); // convert array to string
  var stringToJsonObject = JSON.parse(arrayToString); // convert string to json object
  if (Object.keys(stringToJsonObject).length == 0) {
    console.log(
      "Well Done! No questions to revisit today. Do some more or take a break!"
    );
  } else {
    var obj;
    for (obj in stringToJsonObject) {
      console.log(stringToJsonObject[obj].problemDescription);
    }
    document.getElementsByClassName(
      "problemscreen"
    )[0].innerHTML = getProblemMarkup();
  }
  rescheduleLower(lowerLimit);
}

function rescheduleLower(lowerLimit) {
  var newDate = new Date().addDays(1);
  alasql("UPDATE Information SET problemDate = ? WHERE problemDate < ?", [
    newDate,
    lowerLimit,
  ]);
  var update = alasql("SELECT * FROM Information");
}

function getProblemMarkup() {
  return `<ul id="menu">
    <li>Home</li>
    <li>Services</li>
    </ul>`;
}
window.onload = onWindowLoad;
