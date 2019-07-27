const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const bcrypt = require("bcrypt");
const gravatar = require("gravatar");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");
const passport = require("passport");

router.get("/test", (req, res) => {
  res.json({ mag: 'login works' });
})

/* 
* $route  POST api/users/register
* @desc   用户注册
* @access public
*/
router.post("/register", (req, res) => {
  // 查询数据库中是否已存在邮箱
  User.findOne({ email: req.body.email })
    .then(user => {
      if (user) {
        return res.status(400).json({ email: "此邮箱已被注册！" })
      } else {
        // 创建一个头像
        const avator = gravatar.url(req.body.email, { s: '200', r: 'pg', d: 'mm' })

        const newUser = new User({
          name: req.body.name,
          email: req.body.email,
          avator,
          password: req.body.password,
        })

        // 加密密码
        bcrypt.genSalt(10, (err, salt) => {
          if (err) throw err;
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser.save()
              .then(user => res.json(user))
              .catch(err => console.log(err))
          })
        })
      }
    })
})

/* 
* $route  POST api/users/login
* @desc   用户登录 返回token jwt passport
* @access public
*/
router.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // 查询数据库
  User.findOne({ email })
    .then(user => {
      if (!user) {
        return res.status(404).json({ email: "用户不存在！" });
      }

      // 匹配密码
      bcrypt.compare(password, user.password)
        .then(isMatch => {
          if (isMatch) {
            const rule = {
              id: user.id,
              name: user.name,
            }

            // 返回token
            jwt.sign(rule, keys.secretOrKey, { expiresIn: 3600 }, (err, token) => {
              if (err) throw err
              res.json({
                success: true,
                token: `Bearer ${token}`
              })
            })
            // res.json({msg: "登录成功！"});
          } else {
            return res.status(400).json({ password: "密码错误！" })
          }
        })
    })
})

/* 
* $route  POST api/users/current
* @desc   return current user
* @access Private
*/
router.get("/current", passport.authenticate("jwt", { session: false }), (req, res) => {
  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email
  });
})

module.exports = router