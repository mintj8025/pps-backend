const express = require('express')
const cors = require('cors')
const mysql = require('mysql2')
require('dotenv').config()
const app = express()
var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()
const bcrypt = require('bcrypt');
const saltRounds = 10;
const secret = 'fullstack-login'
require('dotenv').config()

var jwt = require('jsonwebtoken');
var token = jwt.sign({ foo: 'bar' }, 'shhhhh');

app.use(cors())

const connection = mysql.createConnection(process.env.DATABASE_URL)

app.post('/register', jsonParser , function (req, res, next) {
    bcrypt.hash(req.body.assessor_password, saltRounds, function(err, hash) {
    connection.execute(
        'INSERT INTO assessor (assessor_username , assessor_password , assessor_fname , assessor_lname) VALUES (?, ?, ?, ?)',
        [req.body.assessor_username , hash , req.body.assessor_fname , req.body.assessor_lname],
        function(err, results, fields) {
          if(err) {
            res.json({status: 'error', message: 'err'})
            return
          }
          res.json({status: 'ok'})
        }
        );
      });
    })

    app.post('/login', jsonParser , function (req, res, next) {
        connection.execute(
            'SELECT * FROM assessor WHERE assessor_username=?' ,
            [req.body.assessor_username],
            function(err, assessor, fields) {
              if(err) {res.json({status: 'error', message: 'err'}); return }
              if(assessor.length == 0) {res.json({status: 'error', message: 'no user found'}); return }
              bcrypt.compare(req.body.assessor_password, assessor[0].assessor_password, function(err, isLogin) {
                if(isLogin){
                  var token = jwt.sign({assessor_username: assessor[0].assessor_username , assessor_fname : assessor[0].assessor_fname , assessor_lname : assessor[0].assessor_lname }, secret, { expiresIn: '1h' });
                  res.json({status: 'ok', message: 'login success' , token})
                } else {
                  res.json({status: 'error', message: 'login failed'})
                }
              });
            }
          );
        })

    app.post('/authen', jsonParser , function (req, res, next) {
        try{
            const token = req.headers.authorization.split(' ')[1]
            var decoded = jwt.verify(token, secret);
            res.json({status: 'ok' , decoded})
        
        } catch(err) {
          res.json({status: 'error' , decoded ,message: err.message})
        }    
          })
  
          app.post('/register_patient', jsonParser , function (req, res, next) {
            connection.execute(
                'INSERT INTO patient (patient_fname , patient_lname , patient_HN , patient_status) VALUES (?,?,?,?)',
                [req.body.patient_fname , req.body.patient_lname , req.body.patient_HN , req.body.patient_status],
                function(err, results, fields) {
                  if(err) {
                    res.json({status: 'error', message: 'err'})
                    return
                  }else if(req.body.patient_HN.length < 8 || req.body.patient_HN.length > 8){
                    res.json({status: 'length error' , message: 'HN number must be at 8 int!'})
                    return
                  }else {
                  res.json({status: 'ok'})
                }}
                );
            })

app.listen(7000, function () {
    console.log('CORS-enabled web server listening on port 7000')
  })