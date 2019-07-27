const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const passport = require("passport");
const port = process.env.PORT || 5000;
// 数据库地址
const db = require("./config/keys").mongoURI;
// 引入users.js
const users = require("./routes/api/users");

// 使用body-parser中间件
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// passport初始化
app.use(passport.initialize());
require("./config/passport")(passport);

// 连接到数据库
mongoose.connect(db)
  .then(_ => {
    console.log("数据库已连接");
  })
  .catch(_ => {
    console.log("连接失败");
  })

// 垃圾
// app.get("/test", (req, res) => {
//   res.send("hello world");
// })

// 使用routes
app.use("/api/users", users);

app.listen(port, _ => {
  console.log(`Server is running on port ${port}`);
})