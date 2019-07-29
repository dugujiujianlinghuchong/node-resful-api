const express = require("express");
const router = express.Router();
const passport = require("passport");
const mongoose = require("mongoose");
const Profile = require("../../models/Profiles");
const User = require("../../models/User");
// 引入验证方法
const validateProfileInput = require("../../validation/profile");
const validateExperienceInput = require("../../validation/experience");


/* 
* $route  POST api/profile
* @desc   获取当前登录用户的个人信息
* @access public
*/
router.get("/", passport.authenticate("jwt", { session: false }), (req, res) => {
  const errors = {};

  Profile.findOne({ user: req.user.id })
    .populate("user", ["name", "email", "avator"]) // 关联到user表
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
* $route  POST api/profile/handle/:handle
* @desc   通过handle获取个人信息
* @access public
*/
router.get("/handle/:handle", (req, res) => {
  const errors = {};
  Profile.findOne({ handle: req.params.handle })
    .populate("user", ["name", "email", "avator"])
    .then(profile => {
      if (!profile) {
        errors.noprofile = "未找到该用户的信息！";
        return res.status(404).json(errors);
      }

      res.json(profile)
    })
    .catch(err => res.status(404).json(err))
})


/* 
* $route  POST api/profile/user/:user_id
* @desc   通过id获取个人信息
* @access public
*/
router.get("/user/:user_id", (req, res) => {
  const errors = {};

  Profile.findOne({ user: req.params.user_id })
    .populate("user", ["name", "email", "avator"])
    .then(profile => {
      if (!profile) {
        errors.noprofile = "未找到该用户的信息！";
        return res.status(404).json(errors);
      }

      res.json(profile)
    })
    .catch(err => res.status(404).json(err))
})


/* 
* $route  POST api/profile/all
* @desc   获取所有用户信息
* @access public
*/
router.get("/all", (req, res) => {
  const errors = {};

  Profile.find()
    .populate("user", ["name", "email", "avator"])
    .then(profile => {
      if (!profile) {
        errors.noprofile = "没有任何用户的信息！";
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
  const profileFields = {};
  profileFields.user = req.user.id;

  // 注册验证
  const { errors, isValid } = validateProfileInput(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }
  
  // 字符串类型赋值
  ["handle", "company", "website", "location", "status", "bio", "githubusername"].forEach(fieldName => {
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


/* 
* $route  POST api/profile/experience
* @desc   添加个人经历
* @access Private
*/
router.post("/experience", passport.authenticate("jwt", { session: false }), (req, res) => {
  // 字段验证
  // const { errors, isValid } = validateExperienceInput(req.body);
  // if (!isValid) {
  //   return res.status(400).json(errors);
  // }
  
  Profile.findOne({ user: req.user.id })
    .then(profile => {
      if (profile) {
        const newExp = {};
        ["title", "company", "location", "from", "to", "description"].forEach(fieldName => {
          newExp[fieldName] = req.body[fieldName];
        })

        profile.experience.unshift(newExp);

        profile.save().then(savedProfile => {
          res.json(savedProfile);
        })
      }
    })
})


/* 
* $route  POST api/profile/education
* @desc   添加个人学历
* @access Private
*/
router.post("/education", passport.authenticate("jwt", { session: false }), (req, res) => {
  Profile.findOne({ user: req.user.id })
    .then(profile => {
      if (profile) {
        const newEdu = {};
        ["school", "degree", "fieldofstudy", "from", "to", "description"].forEach(fieldName => {
          newEdu[fieldName] = req.body[fieldName];
        })

        profile.education.unshift(newEdu);

        profile.save().then(savedProfile => {
          res.json(savedProfile);
        })
      }
    })
})


/* 
* $route  DELETE api/profile/experience/:exp_id
* @desc   删除个人经历
* @access Private
*/
router.delete("/experience/:exp_id", passport.authenticate("jwt", { session: false }), (req, res) => {
  Profile.findOne({ user: req.user.id })
    .then(profile => {
      const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);

      profile.experience.splice(removeIndex, 1);
      profile.save().then(updatedProfile => res.json(updatedProfile));
    })
    .catch(err => res.status(404).json(err));
})


/* 
* $route  DELETE api/profile/education/:edu_id
* @desc   删除个人学历
* @access Private
*/
router.delete("/education/:edu_id", passport.authenticate("jwt", { session: false }), (req, res) => {
  Profile.findOne({ user: req.user.id })
    .then(profile => {
      const removeIndex = profile.education.map(item => item._id).indexOf(req.params.edu_id);

      profile.education.splice(removeIndex, 1);
      profile.save().then(updatedProfile => res.json(updatedProfile));
    })
    .catch(err => res.status(404).json(err));
})


/* 
* $route  DELETE api/delperson
* @desc   删除整个用户
* @access Private
*/
router.delete("/delperson", passport.authenticate("jwt", { session: false }), (req, res) => {
  Profile.findOneAndRemove({ user: req.user.id })
    .then(_ => {
      User.findOneAndRemove({ _id: req.user.id })
        .then(_ => res.json({ success: true }));
    })
})

module.exports = router;