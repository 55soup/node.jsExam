const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
const port = 8081; //서버포트
const MongoClient = require("mongodb").MongoClient; //mogoDB사용
app.set("view engine", "ejs"); //ejs nodejs가 렌더링 할 수 있도록 하는 코드

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
  db.collection("counter").findOne(
    { name: "게시물갯수" },
    function (error, result) {
      console.log(result.totalPost);
      let 총게시물갯수 = 결과.totalPost;
      db.collection("post").insertOne(
        { _id: 총게시물갯수 + 1, 제목: 요청.body.title, 날짜: 요청.body.date },
        function (error, result) {
          console.log("저장완료");
        }
      );
    }
  );
});

app.get("/list", (request, response) => {
  // DB에서 data를 꺼낸 후
  db.collection("post")
    .find()
    .toArray(function (error, result) {
      console.log(result);
      response.render("list.ejs", { posts: result });
    });

  //HTML렌더링
  // DB에 저장된 post라는 collection안에 모든 데이터를 꺼내기
});
