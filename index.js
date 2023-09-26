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
const secret2 = 'fullstack-patientFound'
require('dotenv').config()

var jwt = require('jsonwebtoken');
var token = jwt.sign({ foo: 'bar' }, 'shhhhh');
var token2 = jwt.sign({ foo: 'bar' }, 'shhhhh');

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
                  var token = jwt.sign({assessor_username: assessor[0].assessor_username , assessor_fname : assessor[0].assessor_fname , assessor_lname : assessor[0].assessor_lname }, secret, { expiresIn: '4h' });
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
                'INSERT INTO patient (patient_fname , patient_lname , patient_HN , patient_status , patient_visit) VALUES (?,?,?,?,?)',
                [req.body.patient_fname , req.body.patient_lname , req.body.patient_HN , req.body.patient_status , req.body.patient_visit],
                function(err, results, fields) {
                  if(err) {
                    res.json({status: 'error', message: 'err'})
                    return
                  }else{
                  res.json({status: 'ok'})
                }}
                );
            })

            app.post('/patientFound', jsonParser , function (req, res, next) {
              connection.execute(
                  'SELECT * FROM patient WHERE patient_HN=?' ,
                  [req.body.patient_HN],
                  function(err, patient, fields) {
                    if(err) {res.json({status: 'error', message: 'err'}); return }
                    if(patient.length == 0) {res.json({status: 'error', message: 'no user found'}); return }
                    if(req.body.patient_HN == patient[0].patient_HN) {
                        var token2 = jwt.sign({patient_HN: patient[0].patient_HN ,patient_fname: patient[0].patient_fname , patient_lname : patient[0].patient_lname , patient_visit : patient[0].patient_visit , patient_status : patient[0].patient_status} , secret2 );
                        res.json({status: 'ok', message: 'Found!' , token2})
                      } else {
                        res.json({status: 'error', message: 'Not Found!'})
                      }
                    });
                  }
                );
        
                app.post('/patientAuthen', jsonParser , function (req, res, next) {
                  try{
                      const token2 = req.headers.authorization.split(' ')[1]
                      var decoded2 = jwt.verify(token2 , secret2);
                      res.json({status: 'ok' , decoded2})
                  
                  } catch(err) {
                    res.json({status: 'error' , decoded2 ,message: err.message})
                  }    
                    })

 
                    app.post('/assessment', jsonParser, function (req, res, next) {
                    var bpi = parseInt(req.body.activity) + parseInt(req.body.emotion) + parseInt(req.body.walk) + parseInt(req.body.work) + parseInt(req.body.relationship) + parseInt(req.body.sleep) + parseInt(req.body.happy);
                    var pps = bpi;

                    var currentDate = new Date();
                    var formattedDate = currentDate.toISOString().slice(0, 10);
                    var date_of_first = formattedDate;
                    var duration = 1; 

                    connection.execute(
                      'INSERT INTO assessment (date, patient_fname, patient_lname, patient_HN, patient_status, patient_visit, assessment_status, nrs, activity, emotion, walk, work, relationship, sleep, happy, satisfied, bpi, pps, ss, nv, sfi72, date_of_first, duration, assessor_fname, assessor_lname) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                      [
                        formattedDate,
                        req.body.patient_fname,
                        req.body.patient_lname,
                        req.body.patient_HN,
                        req.body.patient_status,
                        req.body.patient_visit,
                        req.body.assessment_status,
                        req.body.nrs,
                        req.body.activity,
                        req.body.emotion,
                        req.body.walk,
                        req.body.work,
                        req.body.relationship,
                        req.body.sleep,
                        req.body.happy,
                        req.body.satisfied,
                        bpi,
                        pps,
                        req.body.ss,
                        req.body.nv,
                        req.body.sfi72,
                        date_of_first, 
                        duration,
                        req.body.assessor_fname,
                        req.body.assessor_lname
                      ],
                      function(err, results, fields) {
                        if (err) {
                          res.json({ status: 'error', message: err.message });
                          console.log(err.message)
                          return;
                        } else {
                            if (bpi === 70) {
                            res.json({ status: 'pps100'});
                            }else if(bpi === 60){
                            res.json({ status: 'pps90'});
                            }
                        }
                      }
                    );                      
                  })

   
                  app.get('/history', jsonParser, function (req, res, next) {
                  connection.execute(
                      'SELECT date, patient_HN, patient_fname, patient_lname, patient_status, patient_visit, assessment_status, nrs, activity, emotion, walk, work, relationship, sleep, happy, satisfied, bpi, pps, ss, nv, sfi72, date_of_first, duration, assessor_fname, assessor_lname FROM assessment',
                      function(err, results, fields) {
                        if (err) {
                          res.json({status: 'error', message: 'err'}); 
                          return 
                        }else{
                          console.log({msg: results});
                          res.json({results: results});
                        }
                      }
                    );
                  });
                  
              

app.listen(7000, function () {
    console.log('CORS-enabled web server listening on port 7000')
  })