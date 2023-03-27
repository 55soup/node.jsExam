const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
const port = 8081;

app.get("/pet", function (요청, 응답) {
  응답.send("펫용품 사시오");
});

app.get("/beauty", function (요청, 응답) {
  응답.send("뷰티용품 쇼핑 페이지임");
});

app.get("/", function (요청, 응답) {
  응답.sendFile(__dirname + "/index.html");
});

app.get("/write", (요청, 응답) => {
  응답.sendFile(__dirname + "/write.html");
});
