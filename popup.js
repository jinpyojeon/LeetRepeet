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
          document.getElementsByClassName(
            "loginErrorWrapper"
          )[0].style.display = "none";
          chrome.tabs
            .executeScript(
              {
                code: "(" + modifyDOM + ")();",
              },
              (results) => {
                results = results.toString();
                var problemNumber = determineProblemNumber(results);
                var problemDescription = determineProblemDescription(results);
                var problemLevel = determineProblemLevel(results);
                var problemDate = new Date().addDays(-1);
                document.getElementsByClassName("problemHeader")[0].innerHTML =
                  '<img class="logo" src="images/48x48dark.png"/> <b>Time to <strong>REPEET</strong> 💪</b>';
                document.getElementsByClassName(
                  "problemDescription"
                )[0].innerHTML = getProblemDescription(
                  problemNumber,
                  problemDescription,
                  problemLevel
                );
                fetch("https://leetcode.com/api/problems/algorithms/").then(
                  function (response) {
                    if (response.status !== 200) {
                      console.log(
                        "Looks like there was a problem. Status Code: " +
                          response.status
                      );
                      return;
                    }
                    response.json().then(function (data) {
                      var problemUsername = data.user_name.toString();
                      dbstuff(
                        problemUsername,
                        problemNumber,
                        problemLevel,
                        problemDescription,
                        problemDate
                      );
                    });
                  }
                ).catch(function (err) {
                  console.log("Fetch Error :-S", err);
                });
              }
            )
        } else {
          document.getElementsByClassName("problems")[0].style.display = "none";
          chrome.runtime.onMessage.addListener(function (request, sender) {
            var username = "";
            if (request.action === "getSource") {
              message.innerText = request.source;
              const re = /^(.+?)\',/;
              try {
                username = re
                  .exec(message.innerText.split("userSlug:")[1])[1]
                  .replace("'", " ")
                  .trim()
                  .toString();
              } catch (err) {
                document.getElementsByClassName("extension")[0].style.display =
                  "none";
              }
            }
            if (username != "") {
              document.getElementsByClassName(
                "loginErrorWrapper"
              )[0].style.display = "none";
              generateHomeScreen(username);
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
        document.getElementsByClassName("loginErrorWrapper")[0].style.display =
          "none";
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
  console.log(alasql("SELECT * FROM Information"));
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
  var arrayToString = JSON.stringify(Object.assign({}, arr));
  var stringToJsonObject = JSON.parse(arrayToString);
  if (Object.keys(stringToJsonObject).length == 0) {
    document.getElementsByClassName("home-span")[0].innerHTML = "WELL DONE 👏🏻";
    document.getElementsByClassName(
      "problemscreen"
    )[0].innerHTML = getNoProblemMarkup();
  } else {
    var listItem = getProblemMarkup(stringToJsonObject);
    document.getElementsByClassName("problemscreen")[0].innerHTML = listItem;
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

function getProblemMarkup(jsonobj) {
  var txt = "<ul class='problemitems'>";
  var obj;
  for (obj in jsonobj) {
    if (jsonobj[obj].problemLevel == "Easy") {
      txt +=
        "<li class='list-item'>" +
        '<span class="label label-success round">Easy</span>' +
        '<a class="anchor-tag" target="_blank" href=https://leetcode.com/problems/' +
        jsonobj[obj].problemDescription.toLowerCase().replace(/ /g, "-") +
        ">" +
        jsonobj[obj].problemDescription +
        "</a>" +
        "<br" +
        "</li>";
    } else if (jsonobj[obj].problemLevel == "Medium") {
      txt +=
        "<li class='list-item'>" +
        '<span class="label label-warning round">Medium</span>' +
        '<a class="anchor-tag" target="_blank" href=https://leetcode.com/problems/' +
        jsonobj[obj].problemDescription.toLowerCase().replace(/ /g, "-") +
        ">" +
        jsonobj[obj].problemDescription +
        "</a>" +
        "<br" +
        "</li>";
    } else if (jsonobj[obj].problemLevel == "Hard") {
      txt +=
        "<li class='list-item'>" +
        '<span class="label label-danger round">Hard</span>' +
        '<a class="anchor-tag" target="_blank" href=https://leetcode.com/problems/' +
        jsonobj[obj].problemDescription.toLowerCase().replace(/ /g, "-") +
        ">" +
        jsonobj[obj].problemDescription +
        "</a>" +
        "<br" +
        "</li>";
    }
  }
  return txt;
}
function getNoProblemMarkup() {
  var txt =
    "<br> <div>No problems to revisit today.</div> <br> <div>Do some new ones or take a break 💛</div>";
  return txt;
}

function getProblemDescription(
  problemNumber,
  problemDescription,
  problemLevel
) {
  var txt;
  if (problemLevel == "Easy")
    return (
      '<div><span class="label label-success round">' +
      problemLevel +
      "</span>" +
      "<span>" +
      problemNumber +
      "</span></div>" +
      "</span>" +
      "<span>" +
      problemDescription +
      "</span>"
    );
  else if (problemLevel == "Medium")
    return (
      '<div><span class="label label-warning round">' +
      problemLevel +
      "</span>" +
      "<span>" +
      problemNumber +
      "</span></div>" +
      "</span>" +
      "<span>" +
      problemDescription +
      "</span>"
    );
  else
    return (
      '<div><span class="label label-danger round">' +
      problemLevel +
      "</span>" +
      "<span>" +
      problemNumber +
      "</span></div>" +
      "</span>" +
      "<span>" +
      problemDescription +
      "</span>"
    );
}
window.onload = onWindowLoad;
