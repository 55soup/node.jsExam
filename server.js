const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
const port = 8081;
const MongoClient = require("mongodb").MongoClient;

let db;
MongoClient.connect(
  "mongodb+srv://admin:qwer1234@cluster0.u0flyy5.mongodb.net/todoapp?retryWrites=true&w=majority",
  function (에러, client) {
    if (에러) return console.log(에러);
    db = client.db("todoapp");

    // db.collection("post").insertOne(
    //   { 이름: "John", _id: 100 },
    //   function (error, result) {
    //     console.log("저장완료");
    //   }
    // );

    app.listen(port, function () {
      console.log("listening on 8081");
    });
  }
);

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

// 어떤 사람이 /add 경로로 POST 요청을 하면... ??를 해주세요
app.post("/add", function (요청, 응답) {
  응답.send("전송완료");
  console.log(요청.body.date);
  console.log(요청.body.title);
  MongoClient.connect(
    "mongodb+srv://admin:qwer1234@cluster0.u0flyy5.mongodb.net/todoapp?retryWrites=true&w=majority",
    function (에러, client) {
      if (에러) return console.log(에러);
      db = client.db("todoapp");
      db.collection("post").insertOne(
        { 제목: 요청.body.title, 날짜: 요청.body.date },
        function (error, result) {
          console.log("저장완료");
        }
      );
    }
  );
});
