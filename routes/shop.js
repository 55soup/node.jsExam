let router = require("express").Router();

function chkLogin(req, res, next) {
  // 마이페이지 접속 전 실행할 미들웨어
  if (req.user) {
    next();
  } else {
    res.send("로그인 하세요");
  }
}
//모든 router에 chkLogin 미들웨어 적용
router.use(chkLogin);

router.get("/shirts", function (req, res) {
  res.send("셔츠 파는 페이지 입니다.");
});
router.get("/pants", function (req, res) {
  res.send("바지 파는 페이지 입니다.");
});

module.exports = router;
