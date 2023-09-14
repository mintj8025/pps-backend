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
                      var formattedDate = currentDate.toISOString().split('T')[0];
                      var date_of_first;
                    
                      if (req.body.patient_visit === 0 || req.body.patient_visit === '') {
                        // ถ้า patient_visit เป็น 0 หรือเป็นค่าว่าง
                        date_of_first = formattedDate; // ใช้ค่าวันที่ปัจจุบัน
                      } else {
                        // ถ้า patient_visit ไม่เป็น 0 หรือไม่ว่างเปล่า
                        date_of_first = req.body.date_of_first; // ใช้ค่า date_of_first จาก req.body
                      }
                      
                      // คำนวณ duration โดยเปรียบเทียบวันที่ date กับ date_of_first
                      var date1 = new Date(req.body.date);
                      var date2 = new Date(date_of_first);
                      var duration = Math.floor((date1 - date2) / (1000 * 60 * 60 * 24)); // หาจำนวนวัน
                    
                      connection.execute(
                        'INSERT INTO assessment (assessment_id, date, patient_fname, patient_lname, patient_HN, patient_status, patient_visit, assessment_status, nrs, activity, emotion, walk, work, relationship, sleep, happy, satisfied, bpi, pps, ss, nv, sfi72, date_of_first, duration, assessor_fname, assessor_lname) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        [
                          formattedDate, // ใช้ค่าวันที่ปัจจุบันที่จะบันทึก
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
                          date_of_first, // ใช้ค่า date_of_first ที่ถูกตรวจสอบแล้ว
                          duration, // ใช้ค่า duration ที่คำนวณได้
                          req.body.assessor_fname,
                          req.body.assessor_lname
                        ],
                        function(err, results, fields) {
                          if (err) {
                            res.json({ status: 'error', message: err.message });
                            console.log(err.message)
                            return;
                          } else {
                            res.json({ status: 'ok' });
                          }
                        }
                      );                      
                    })
                               
                    

                    app.post('/assessment_input', jsonParser , function (req, res, next) {
                      connection.execute(
                          'INSERT INTO assessment_input (patient_fname , patient_lname , patient_HN , patient_status , patient_visit , assessment_status , nrs , activity , emotion , walk , work , relationship , sleep , happy , satisfied , ss , nv , sfi72 , assessor_fname , assessor_lname) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                          [
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
                            req.body.ss,
                            req.body.nv,
                            req.body.sfi72,
                            req.body.assessor_fname,
                            req.body.assessor_lname
                          ],
                          function(err, results, fields) {
                            if(err) {
                              res.json({status: 'error', message: err.message})
                              return
                            }else{
                            res.json({status: 'ok'})
                          }}
                          );
                      })
 
                      app.post('/assessment_radio', jsonParser , function (req, res, next) {
                        connection.execute(
                            'INSERT INTO assessment_radio (nrs , activity , emotion , walk , work , relationship , sleep , happy , satisfied , ss , nv , sfi72) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                            [
                              req.body.nrs,
                              req.body.activity,
                              req.body.emotion,
                              req.body.walk,
                              req.body.work,
                              req.body.relationship,
                              req.body.sleep,
                              req.body.happy,
                              req.body.satisfied,
                              req.body.ss,
                              req.body.nv,
                              req.body.sfi72
                            ],
                            function(err, results, fields) {
                              if(err) {
                                res.json({status: 'error', message: err.message})
                                return
                              }else{
                              res.json({status: 'ok'})
                            }}
                            );
                        })
   
                      app.post('/assessment_withoutdate', jsonParser , function (req, res, next) {
                      var bpi = parseInt(req.body.activity) + parseInt(req.body.emotion) + parseInt(req.body.walk) + parseInt(req.body.work) + parseInt(req.body.relationship) + parseInt(req.body.sleep) + parseInt(req.body.happy);
                      var pps = bpi;
                      
                      connection.execute(
                          'INSERT INTO assessment_withoutdate (patient_fname , patient_lname , patient_HN , patient_status , patient_visit , assessment_status , nrs , activity , emotion , walk , work , relationship , sleep , happy , satisfied , bpi , pps , ss , nv , sfi72 , assessor_fname , assessor_lname) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                          [
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
                            req.body.assessor_fname,
                            req.body.assessor_lname
                          ],
                          function(err, results, fields) {
                            if (err) {
                              res.json({ status: 'error', message: err.message });
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


app.listen(7000, function () {
    console.log('CORS-enabled web server listening on port 7000')
  })