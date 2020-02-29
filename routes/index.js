var express = require('express');
var router = express.Router();
// var db = require('../modules/user');
var bcrypt = require('bcryptjs'); //For encrypting data that donot need to be decrypted
var crypto = require('crypto');   //for encrypting data that may need to be decrypted
const mysql=require('mysql');
var jwt=require('jsonwebtoken');
const { check, validationResult } = require('express-validator');


if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./scratch');
}

/* DataBase Connection */
const db=mysql.createConnection({
    host : 'localhost',
    user : 'root',
    password : 'Nikhil@47',
    database : 'project'
});

db.connect((err)=>{
    if(err)
        throw err;
    else    
        console.log("database Connected");
});

/*Middleware to check if user is logged In or not*/
function checkLoginUser(req,res,next){
  var userToken=localStorage.getItem('userToken');
  try{
    var decoded=jwt.verify(userToken, 'loginToken');
  }catch(err){
    res.redirect('/');
  }
  next();
}

/* Middleware to check existig user while Registering */
function checkEmail(req,res,next){
  var email=req.body.email;
  let sql='SELECT email from users where email=?';
  db.query(sql,[email],(err,data)=>{
     if(err) throw err;
     if(data!=""){
      //  console.log(data);
      return res.render('signup', { title: 'Password Management System', msg:'User Already Exist' });
    }
     next();
});
}

/* GET home page. */
router.get('/', function(req, res, next) {
  var loginUser=localStorage.getItem('loginUser');
  if(loginUser){
    res.redirect('/dashboard');
  }
  else{
    res.render('index', { title: 'Password Management System', msg : '' });
  }
});

/*Login Form using Local storage*/

router.post('/', function(req, res, next) {
  var email=req.body.email;
  var entered_password=req.body.password;

  let sql='SELECT email from users where email=?';
  db.query(sql,[email],(err,data)=>{
    if(err) throw err;
    else if(data==""){
      console.log(data);
      res.render('index',{ title : 'Password Management System', msg : 'User Not Found'});
    }
    else{
      let sql='SELECT password from users where email=?';
      db.query(sql,[email],(err,data)=>{
        if(err) throw err;
        var row;
        Object.keys(data).forEach(function(key) {
          row = data[key];
          // console.log(row.password)
        });

        if(bcrypt.compareSync(entered_password,row.password)){
          var getuserID = email;
          var token = jwt.sign({ userID: getuserID }, 'loginToken');
          localStorage.setItem('userToken', token);
          localStorage.setItem('loginEmail',email);
          res.redirect('/dashboard');
        }else{
          res.render('index',{ title : 'Password Management System', msg : 'Email or Password is Wrong.'});
        }
      });
    }
  });

});

/*DashBoard*/
router.get('/dashboard',checkLoginUser,function(req,res,next){
  var loginUser=localStorage.getItem('loginEmail');
  let sql='SELECT count(*) from password_details where email=?';
  db.query(sql,[loginUser],(err,data)=>{
    if(err) throw err;
    var row;
    Object.keys(data).forEach(function(key) {
      row = data[key];
      // console.log(row['count(*)']);
    res.render('dashboard', { title: 'Password Management System',loginUser:loginUser, msg:'',totalPassCat : row['count(*)']});
  });
});
  
});

router.get('/signup',function(req,res,next){
  // var loginUser=localStorage.getItem('loginUser');
  // if(loginUser){
  //   res.redirect('./dashboard');
  // }
  // else{
    res.render('signup', { title: 'Password Management System', msg : '' });
  // }
});

/*SIGNUP FORM */
router.post('/signup',checkEmail,function(req,res,next){
  var username=req.body.uname;
  var email=req.body.email;
  var password=req.body.password;
  var confpassword=req.body.confpassword;

  if(password != confpassword){
    res.render('signup', { title: 'Password Management System', msg:'Password Doesnot Match' });
  }
  else{
    password = bcrypt.hashSync(req.body.password,10);
    
    var today=new Date();
    var user = {uname : username, email:email, password:password, register_date:today};
    db.query('INSERT into users SET ?',user,(err,doc)=>{
      if(err) throw err;
      else
        res.render('signup', { title: 'Password Management System', msg:'user Registered Successfully' });
    });
  }
 
});

router.get('/view-all-password',checkLoginUser,function(req,res,next){
  var loginUser=localStorage.getItem('loginEmail');
  let sql='SELECT password_category,username, password from password_details where email=?';
  db.query(sql,[loginUser],(err,data)=>{
    if(err) throw err;
    var row=new Array();
        Object.keys(data).forEach(function(key) {
          
          //Decrypting Password.........................................................................................
          var mykey = crypto.createDecipher('aes-128-cbc', 'mypassword');
          data[key].password = mykey.update(data[key].password, 'hex', 'utf8')
          data[key].password += mykey.final('utf8');

          row.push(data[key]);
          // console.log(data[key].password);
        });
        
    res.render('password_category', { title: 'Password Management System', loginUser:loginUser,records:row});
  });
});

router.get('/passwordCategory/delete/:id',checkLoginUser,function(req,res,next){
  var loginUser=localStorage.getItem('loginEmail');
  var passcat_id=req.params.id;
  console.log(passcat_id);
  let sql='DELETE from password_details where password_category=? and email=?';
  db.query(sql,[passcat_id,loginUser],(err)=>{
    if(err) throw err;
    res.redirect('/view-all-password');
  });
});

router.get('/passwordCategory/edit/:id',checkLoginUser,function(req,res,next){
  var loginUser=localStorage.getItem('loginEmail');
  var passcat_id=req.params.id;
  console.log(passcat_id);
  let sql='DELETE from password_details where password_category=? and email=?';
  db.query(sql,[passcat_id,loginUser],(err)=>{
    if(err) throw err;
    res.redirect('/add-new-password');
  });
});

router.get('/add-new-password',checkLoginUser, function(req, res, next) {
  var loginUser=localStorage.getItem('loginEmail');
  res.render('add-new-password', { title: 'Password Management System', loginUser:loginUser,errors:'', success : ''});
});

router.post('/add-new-password',checkLoginUser,[check('passwordCategory', 'Enter Required Field').isLength({ min: 1 }),check('password', 'Enter Required Field').isLength({ min: 1 })], function(req, res, next) {
  var loginUser=localStorage.getItem('loginEmail');
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    console.log(errors.mapped());
    res.render('add-new-password', { title: 'Password Management System', loginUser:loginUser,errors :errors.mapped(), success : ''});
  }else{
    var passCatName = req.body.passwordCategory;
    var password = req.body.password;
    var username = req.body.username;
    // password = bcrypt.hashSync(rseq.body.password,20);
    var today=new Date();

    //Encrypting Password......................................................................................
    var mykey = crypto.createCipher('aes-128-cbc', 'mypassword');
    var password = mykey.update(password, 'utf8', 'hex');
    password += mykey.final('hex');
    console.log(password); 

    var passcat={password_category : passCatName, username : username, password : password, date : today,email : loginUser};
    db.query('INSERT into password_details SET ?',passcat,(err,doc)=>{
      if(err) throw err;
      else
      res.render('add-new-password', { title: 'Password Management System', loginUser:loginUser, errors:'', success : "Category Added Successfully"});
    });
  }
});

/*Log Out */
router.get('/logout', function(req, res, next) {
  localStorage.removeItem('userToken');
  localStorage.removeItem('loginEmail');
  res.redirect('/');
});

module.exports = router;
