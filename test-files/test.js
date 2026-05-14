var userName = "inconnu boy";
var apiKey = "secret-api-key-123";
var version = "1.0.0";

function greetUser(name) {
  var message = "Hello, " + name + "! Welcome to our app.";
  console.log(message);
  return message;
}

function calculateScore(base, multiplier) {
  var result = base * multiplier;
  var bonus = 100;
  var total = result + bonus;
  return total;
}

var config = {
  debug: false,
  endpoint: "https://api.example.com/v1",
  timeout: 5000,
  retries: 3
};

function fetchData(url, token) {
  var headers = {
    "Authorization": "Bearer " + token,
    "Content-Type": "application/json"
  };
  console.log("Fetching from: " + url);
  return headers;
}

var score = calculateScore(50, 3);
greetUser(userName);
fetchData(config.endpoint, apiKey);
