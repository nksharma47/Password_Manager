const mysql=require('mysql');
const express=require('express');

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

let sql='create table users(uname varchar(20),email varchar(50) PRIMARY KEY,password longtext,register_date date)';
db.query(sql,(err,data)=>{
  if(err) throw err;
  else  
    console.log("users Table Created");
});

sql='create table password_details(password_category varchar(25),username varchar(30),password longtext,date date,email varchar(30))';
db.query(sql,(err,data)=>{
  if(err) throw err;
  else  
    console.log("password_details Table created");
});

module.exports.db=db;