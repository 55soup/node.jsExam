const express = require("express");
const app = express();
require("dotenv").config();
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
const port = process.env.PORT; // 환경변수에서 서버포트 가져오기
const MongoClient = require("mongodb").MongoClient; //mogoDB사용
app.set("view engine", "ejs"); //ejs nodejs가 렌더링 할 수 있도록 하는 코드
app.use("/public", express.static("public"));
// method-override 패키지 사용
const methodOverride = require("method-override");
app.use(methodOverride("_method"));

let db;
var ObjectId = require('mongodb').ObjectID;

MongoClient.connect(process.env.DB_URL, function (error, client) {
  if (error) return console.log(error);
  db = client.db("todoapp");
  app.listen(port, function () {
    console.log("listening on 8081");
  });
});

app.get("/pet", function (req, res) {
  res.send("펫용품 사r시오");
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

app.get("/list", (req, res) => {
  // DB에서 data를 꺼낸 후
  db.collection("post")
    .find()
    .toArray(function (error, result) {
      console.log(result);
      res.render("list.ejs", { posts: result });
    });

  //HTML렌더링
  // DB에 저장된 post라는 collection안에 모든 데이터를 꺼내기
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

// 검색기능
/*
indexing하면 검색 후 탐색이 빨라짐.
이진탐색은 미리 정렬이 되어있어야함.
indexing: collection을 정렬해둔 사본
한국어 친화적x 띄어쓰기를 기준으로 검색함
- nGram
*/
app.get("/search", (req, res) => {
  let searchReq = [
    {
      $search: {
        index: "titleSearch",
        text: {
          query: req.query.value,
          path: "제목", // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
        },
      },
    },
    // 0: x가져옴 /  1: 가져옴 / score: 사용자가 검색한 단어와 얼마나 관련있는지 보여줌.
    { $project: { 제목: 1, _id: 0, score: { $meta: "searchScore" } } },
    // {$sort : {_id : 1}}, 정렬
    // {$limit : 10 } 제한
  ];
  db.collection("post")
    .aggregate(searchReq)
    .toArray((error, result) => {
      res.render("search.ejs", { search: result, input: req.query.value });
      console.log(result);
    });
});

// 로그인 & 세션생성을 도와주는 라이브러리
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");

// app.use(미들웨어) 미들웨어: 요청 - res 중간에 뭔가 실행되는 코드
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

app.get("/mypage", chkLogin, function (req, res) {
  console.log(req.user);
  res.render("mypage.ejs", { user: req.user });
});

function chkLogin(req, res, next) {
  // 마이페이지 접속 전 실행할 미들웨어
  if (req.user) {
    next();
  } else {
    res.send("로그인 하세요");
  }
}

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
            // done(서버error, 성공시 사용자 DB데이터, error메세지)
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
  // db에서 위에 있는 user.id로 유저를 찾은 뒤에 유저 정보를 result 안에 넣음.
  db.collection("login").findOne({ id: id }, function (err, result) {
    done(null, result);
  });
});

app.post("/register", function (req, res) {
  db.collection("login").insertOne(
    { id: req.body.id, pw: req.body.pw },
    function (error, result) {
      res.redirect("/");
    }
  );
});

// 어떤 사람이 /add 경로로 POST req을 하면... ??를 해주세요
// NoSQL은 작성자 정보를 같이 저장함.
app.post("/add", function (req, res) {
  db.collection("counter").findOne(
    { name: "게시물갯수" },
    function (error, result) {
      // 총게시물갯수를 변수에 저장
      let 총게시물갯수 = result.totalPost;
      let saveData = {
        _id: 총게시물갯수 + 1,
        제목: req.body.title,
        날짜: req.body.date,
        작성자: req.user._id, //passport아래로
      };
      // DB.post에 새게시물을 기록함
      db.collection("post").insertOne(saveData, function () {
        console.log("저장완료");
      });
      db.collection("counter").updateOne(
        // counter라는 콜렉션에 있는 totalPost라는 항목도 1 증가시켜야함(수정)
        { name: "게시물갯수" },
        { $inc: { totalPost: 1 } },
        function (error, result) {
          if (error) {
            return console.log(error);
          }
          res.send("전송완료");
        }
      );
    }
  );
});

app.delete("/delete", function (req, res) {
  console.log(req.body);
  // {_id: '1'} -> {_id: 1}숫자로 변환
  req.body._id = parseInt(req.body._id);
  let delData = { _id: req.body._id, 작성자: req.user._id };
  // res.body에 담겨온 게시물번호를 가진 글을 db에서 찾아 삭제해주세요
  db.collection("post").deleteOne(delData, function (error, result) {
    console.log(result);
    console.log("삭제완료");
    res.status(200).send({ message: "성공했습니다" });
  });
});

app.use("/shop", require("./routes/shop.js"));
app.use("/board/sub", require("./routes/board.js"));
// app.get("/shop/shirts", function (req, res) {
//   res.send("셔츠 파는 페이지 입니다.");
// });
// app.get("/shop/pants", function (req, res) {
//   res.send("바지 파는 페이지 입니다.");
// });

// 이미지 업로드
let multer = require('multer');
let storage = multer.diskStorage({
  destination : function(req, file, db){
    db(null, './public/image') // 이미지 업로드 경로
  },
  filename : function(req, file, cb){
    cb(null, file.originalname) // 이미지 파일이름 지정
  },
  filefilter : function(req, file, db){

  },
  // limits: // 파일사이즈 제한
});

let upload = multer({storage : storage});

app.get('/upload', function(req, res){
  res.render('upload.ejs')
});

// 이미지 하나: upload.single('input의 name')
// 이미지 여러개: upload.array('input의 name', 최대 받을 갯수)
app.post('/upload', upload.single('profile'), function(req, res){
  res.send("업로드-완료");
});

app.get('/image/:imageName', function(req, res){
  res.sendFile(__dirname + '/public/image/' + req.params.imageName)
});

app.get('/chat',chkLogin, function(req, res){
  db.collection('chatroom').find({ member : req.user._id }).toArray().then((result)=>{
    console.log(result);
    res.render('chat.ejs', {data : result})
  })
})

app.post('/create_chat', chkLogin, function(req, res){
    let saveData = {
      title: "채팅방1",
      // [채팅을 당한사람, 채팅을 건 사람]
      member : [ObjectId(req.body._id), req.user._id],
      date: new Date(),
    }
    db.collection("chatroom").insertOne(saveData)
    .then((result, error) => {
      console.log(result);
      if(error) console.log(error);
    });
})

// 채팅방 메세지 보내는 api
app.post('/message',chkLogin, function(req, res){

  let saveData = {
    parent : ObjectId(req.body.parent),
    content : req.body.content,
    userid : req.user._id,
    date : new Date(),
  };

  db.collection('message').insertOne(saveData).then(() => {
    console.log("메세지 DB저장 성공");
    res.send('메세지 DB저장 성공')
  })
});

app.get('/message/:parentid', chkLogin, function(req, res){
  res.writeHead(200, {
    "Connection": "keep-alive",
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
  });

  db.collection('message').find({ parent : ObjectId('64d4f1a8ad656f3ad8b84158') }).toArray()
  .then((result) => {
    console.log(req.params.parentid);
    res.write('event: test\n');
    res.write(`data: ${JSON.stringify(result)} \n\n`);
  })


});