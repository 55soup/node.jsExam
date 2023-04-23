const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
const port = 8081; //서버포트
const MongoClient = require("mongodb").MongoClient; //mogoDB사용
app.set("view engine", "ejs"); //ejs nodejs가 렌더링 할 수 있도록 하는 코드
app.use("/public", express.static("public"));
// method-override 패키지 사용
const methodOverride = require("method-override");
app.use(methodOverride("_method"));

let db;
MongoClient.connect(
  "mongodb+srv://admin:qwer1234@cluster0.u0flyy5.mongodb.net/todoapp?retryWrites=true&w=majority",
  function (error, client) {
    if (error) return console.log(error);
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

app.get("/pet", function (req, res) {
  res.send("펫용품 사시오");
});

app.get("/beauty", function (req, res) {
  res.send("뷰티용품 쇼핑 페이지임");
});

app.get("/", function (req, res) {
  res.render("index.ejs");
});

app.get("/write", (req, res) => {
  res.render("write.ejs");
});

// 어떤 사람이 /add 경로로 POST req을 하면... ??를 해주세요
app.post("/add", function (req, res) {
  res.send("전송완료");
  db.collection("counter").findOne(
    { name: "게시물갯수" },
    function (error, result) {
      // 총게시물갯수를 변수에 저장
      let 총게시물갯수 = result.totalPost;
      // DB.post에 새게시물을 기록함
      db.collection("post").insertOne(
        { _id: 총게시물갯수 + 1, 제목: req.body.title, 날짜: req.body.date },
        function (error, result) {
          console.log("저장완료");
          // counter라는 콜렉션에 있는 totalPost라는 항목도 1 증가시켜야함(수정)
          db.collection("counter").updateOne(
            { name: "게시물갯수" },
            { $inc: { totalPost: 1 } }, //inc: 1을 증가시킴.
            function (error, result) {
              console.log("삭제완료");
              res.status(200).send({ message: "성공했습니다" });
            }
          );
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

app.delete("/delete", function (req, res) {
  console.log(req.body);
  // {_id: '1'} -> {_id: 1}숫자로 변환
  req.body._id = parseInt(req.body._id);
  // res.body에 담겨온 게시물번호를 가진 글을 db에서 찾아 삭제해주세요
  db.collection("post").deleteOne(req.body, function (error, result) {
    console.log("삭제완료");
    res.status(200).send({ message: "성공했습니다" });
  });
});

app.get("/detail/:id", function (req, res) {
  db.collection("post").findOne(
    { _id: parseInt(req.params.id) },
    function (error, result) {
      console.log(result);
      res.render("detail.ejs", { data: result });
    }
  );
});

app.get("/edit/:id", function (req, res) {
  db.collection("post").findOne(
    { _id: parseInt(req.params.id) },
    function (error, result) {
      console.log(result);
      res.render("edit.ejs", { post: result });
    }
  );
});

app.put("/edit", function (req, res) {
  // 폼에 담긴 제목데이터, 날짜데이터를 가지고
  // db.collection 에 업데이트함
  db.collection("post").updateOne(
    { _id: parseInt(req.body.id) },
    { $set: { 제목: req.body.title, 날짜: req.body.date } },
    function (error, result) {
      console.log("수정완료");
      res.redirect("/list");
    }
  );
});

// 로그인 & 세션생성을 도와주는 라이브러리
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");

// app.use(미들웨어) 미들웨어: 요청 - 응답 중간에 뭔가 실행되는 코드
app.use(
  session({ secret: "비밀코드", resave: true, saveUninitialized: false })
);
app.use(passport.initialize());
app.use(passport.session());

app.get("/login", function (req, res) {
  res.render("login.ejs");
});

// passport: 로그인 기능 쉽게 구현가능
app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/fail",
  }),
  function (req, res) {
    res.redirect("/");
  }
);

// 로그인 기능 구현
passport.use(
  new LocalStrategy(
    {
      usernameField: "id", // 유저가 입력한 아이디/비번 항목이 뭔지 정의 (name)
      passwordField: "pw",
      session: true, // 로그인 후 세션을 저장할 것인지
      passReqToCallback: false, // id/pw외 다른 검증서
    },
    function (입력한아이디, 입력한비번, done) {
      //console.log(입력한아이디, 입력한비번);
      db.collection("login").findOne(
        { id: 입력한아이디 },
        function (error, result) {
          if (error) return done(error);

          if (!result)
            // DB에 아이디가 없다면
            // done(서버에러, 성공시 사용자 DB데이터, 에러메세지)
            return done(null, false, { message: "존재하지않는 아이디" });
          if (입력한비번 == result.pw) {
            // 성공!
            return done(null, result); // 성공시 세션으로 아이디를 보냄.
          } else {
            return done(null, false, { message: "비밀번호가 맞지 않습니다." });
          }
        }
      );
    }
  )
);

// 세션 저장 - 로그인 성공시 실행
passport.serializeUser(function (user, done) {
  done(null, user.id);
});
passport.deserializeUser(function (id, done) {
  // 세션데이터를 가진사람을 DB에서 찾음 - 마이페이지 접속시 실행
  done(null, {});
});
