const express = require("express");
const router = express.Router();
const passport = require("passport");
const mongoose = require("mongoose");
const Profile = require("../../models/Profiles");
const User = require("../../models/User");

/* 
* $route  POST api/profile/test
* @desc   测试
* @access Private
*/
router.get("/test", (req, res) => {
  res.json({ msg: "profile works" });
})

/* 
* $route  POST api/profile
* @desc   获取当前登录用户的个人信息
* @access Private
*/
router.get("/", passport.authenticate("jwt", { session: false }), (req, res) => {
  const errors = {};

  Profile.findOne({ user: req.user.id })
    .then(profile => {
      if (!profile) {
        errors.noprofile = "该用户的信息不存在！";
        return res.status(404).json(errors);
      }

      res.json(profile)
    })
    .catch(err => res.status(404).json(err))
})

/* 
* $route  POST api/profile
* @desc   创建和编辑个人信息接口
* @access Private
*/
router.post("/", passport.authenticate("jwt", { session: false }), (req, res) => {
  const errors = {};
  const profileFields = {};
  const stringFields = ["handle", "company", "website", "location", "status", "bio", "githubusername"];
  profileFields.user = req.user.id;

  // 字符串类型赋值
  stringFields.forEach(fieldName => {
    if (req.body[fieldName]) {
      profileFields[fieldName] = req.body[fieldName]
    }
  })

  // skills - 数组转换
  if (typeof req.body.skills !== "undefined") {
    profileFields.skills = req.body.skills.split(",");
  }

  // social - 对象转换
  profileFields.social = {};
  ["wechat", "QQ", "tengxunkt", "wangyikt"].forEach(fieldName => {
    if (req.body[fieldName]) {
      profileFields.social[fieldName] = req.body[fieldName]
    }
  })

  Profile.findOne({ user: req.user.id })
    .then(profile => {
      if (profile) {
        // 用户信息存在，执行更新方法
        Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, { new: true })
          .then(updatedProfile => res.json(updatedProfile));
      } else {
        // 用户信息不存在，执行创建方法
        Profile.findOne({ handle: profileFields.handle })
          .then(profile => {
            if (profile) {
              errors.handle = "该用户的handle个人信息已存在，请勿重复创建";
              res.status(400).json(errors);
            }

            new Profile(profileFields).save()
              .then(profile => res.json(profile));
          });
      }
    })
})

module.exports = router;