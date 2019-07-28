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
// 引入profile.js
const profile = require("./routes/api/profile");

// 使用body-parser中间件
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// passport初始化
app.use(passport.initialize());
require("./config/passport")(passport);

// 使用中间件允许跨域
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
  next();
})

// 连接到数据库
mongoose.connect(db)
  .then(_ => {
    console.log("数据库已连接");
  })
  .catch(_ => {
    console.log("连接失败");
  })

// 使用routes
app.use("/api/users", users);
app.use("/api/profile", profile);

app.listen(port, _ => {
  console.log(`Server is running on port ${port}`);
})