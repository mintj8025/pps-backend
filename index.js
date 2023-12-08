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

    app.post('/login', jsonParser, function (req, res, next) {
      connection.execute(
          'SELECT * FROM assessor WHERE assessor_username=?',
          [req.body.assessor_username],
          function(err, assessor, fields) {
              if (err) {
                  res.json({ status: 'error', message: 'Database error' });
                  return;
              }
              if (assessor.length === 0) {
                  res.json({ status: 'error', message: 'No user found' });
                  return;
              }
              bcrypt.compare(req.body.assessor_password, assessor[0].assessor_password, function(err, isLogin) {
                  if (isLogin) {
                      var token = jwt.sign({
                          assessor_username: assessor[0].assessor_username,
                          assessor_fname: assessor[0].assessor_fname,
                          assessor_lname: assessor[0].assessor_lname
                      }, secret, { expiresIn: '4h' });
                      res.json({ status: 'ok', message: 'Login success', token });
                  } else {
                      res.json({ status: 'error', message: 'Login failed' });
                  }
              });
          }
      );
  });
  

    app.post('/authen', jsonParser , function (req, res, next) {
        try{
            const token = req.headers.authorization.split(' ')[1]
            var decoded = jwt.verify(token, secret);
            res.json({status: 'ok' , decoded})
        
        } catch(err) {
          res.json({status: 'error' , decoded ,message: err.message})
        }    
          })


    app.post('/register_patient', jsonParser, function (req, res, next) {
            const patientHN = req.body.patient_HN;
            // ตรวจสอบว่า patient_HN เป็นตัวเลข 8 ตัวเท่านั้น
            if (!/^[0-9]{8}$/.test(patientHN)) {
              return res.json({ status: 'error', message: 'HN ไม่ถูกต้อง' });
            }
          
            // ตรวจสอบว่าเลข HN ไม่ซ้ำ
            connection.execute(
              'SELECT COUNT(*) as count FROM patient WHERE patient_HN = ?',
              [patientHN],
              function (err, results, fields) {
                if (err) {
                  res.json({ status: 'error', message: 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล' });
                } else {
                  const count = results[0].count;
                  if (count > 0) {
                    res.json({ status: 'error', message: 'เลข HN นี้มีอยู่ในระบบแล้ว' });
                  } else {
                    // เลข HN ไม่ซ้ำ สามารถดำเนินการ INSERT ข้อมูลได้
                    const newPatientStatus = 'new'; // กำหนดค่า patient_status เป็น 'new'
                    const patientVisit = 0;
                    const patientDuration = 0;
                    connection.execute(
                      'INSERT INTO patient (patient_fname, patient_lname, patient_HN, patient_status, patient_visit, duration) VALUES (?,?,?,?,?,?)',
                      [req.body.patient_fname, req.body.patient_lname, patientHN, newPatientStatus, patientVisit, patientDuration],
                      function (err, results, fields) {
                        if (err) {
                          res.json({ status: 'error', message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
                        } else {
                          res.json({ status: 'ok' });
                        }
                      }
                    );
                  }
                }
              }
            );
          });

          app.post('/assessment', jsonParser, function (req, res, next) {
            var pps100 = 0;
            var pps90 = 0;
            var pps80 = 0;
            var pps70 = 0;
            var pps60 = 0;
            var pps50 = 0;
            var pps40 = 0;
            var pps30 = 0;
            var pps20 = 0;
            var pps10 = 0;
          
            var movement = req.body.movement;
            var activityAndDisease = req.body.activityAndDisease;
            var dailyRoutines = req.body.dailyRoutines;
            var eating = req.body.eating;
            var awareness = req.body.awareness;
          
          if (movement === "เคลื่อนไหวปกติ") {
              pps100++;
              pps90++;
              pps80++;
            } else if (movement === "ความสามารถในการเคลื่อนไหวลดลง") {
              pps70++;
              pps60++;
            } else if (movement === "นั่งหรือนอนเป็นส่วนใหญ่") {
              pps50++;
            } else if (movement === "นอนอยู่บนเตียงเป็นส่วนใหญ่") {
              pps40++;
            } else if (movement === "นอนอยู่บนเตียงตลอดเวลา") {
              pps30++;
              pps20++;
              pps10++;
            }
          
            if (activityAndDisease === "ทำกิจกรรมและทำงานได้ตามปกติและไม่มีอาการของโรค") {
              pps100++;
            } else if (activityAndDisease === "ทำกิจกรรมและทำงานได้ตามปกติและมีอาการของโรคบางอาการ") {
              pps90++;
            } else if (activityAndDisease === "ต้องออกแรงอย่างมากในการทำกิจกรรมตามปกติและมีอาการของโรคบางอาการ") {
              pps80++;
            } else if (activityAndDisease === "ไม่สามารถทำงานได้ตามปกติและมีอาการของโรคอย่างมาก") {
              pps70++;
            } else if (activityAndDisease === "ไม่สามารถทำงานอดิเรกหรืองานบ้านได้และมีอาการของโรคอย่างมาก") {
              pps60++;
            } else if (activityAndDisease === "ไม่สามารถทำงานได้เลยและมีการลุกลามของโรค") {
              pps50++;
            } else if (activityAndDisease === "ทำกิจกรรมได้น้อยมากและมีการลุกลามของโรค") {
              pps40++;
            } else if (activityAndDisease === "ไม่สามารถทำกิจกรรมใดๆและมีการลุกลามของโรค") {
              pps30++;
              pps20++;
              pps10++;
            } 

            if (dailyRoutines === "ทำได้เอง") {
              pps100++;
              pps90++;
              pps80++;
              pps70++;
            } else if (dailyRoutines === "ต้องการช่วยเหลือเป็นบางครั้ง/บางเรื่อง") {
              pps60++;
            } else if (dailyRoutines === "ต้องการความช่วยเหลือมากขึ้น") {
              pps50++;
            } else if (dailyRoutines === "ต้องการความช่วยเหลือเป็นส่วนใหญ่") {
              pps40++;
            } else if (dailyRoutines === "ต้องการความช่วยเหลือทั้งหมด") {
              pps30++;
              pps20++;
              pps10++;
            } 

            if (eating === "ปกติ") {
              pps100++;
              pps90++;
            } else if (eating === "ปกติ หรือ ลดลง") {
              pps80++;
              pps70++;
              pps60++;
              pps50++;
              pps40++;
              pps30++;
            } else if (eating === "จิบน้ำได้เล็กน้อย") {
              pps20++;
            } else if (eating === "รับประทานอาหารทางปากไม่ได้") {
              pps10++;
            }

            if (awareness === "รู้สึกตัวดี") {
              pps100++;
              pps90++;
              pps80++;
              pps70++;
            } else if (awareness === "รู้สึกตัวดี หรือ สับสน") {
              pps60++;
              pps50++;
            } else if (awareness === "รู้สึกตัวดี หรือ ง่วงซึม +/-สับสน") {
              pps40++;
              pps30++;
              pps20++;
            } else if (awareness === "ง่วงซึมหรือไม่รู้สึกตัว +/-สับสน") {
              pps10++;
            }


            var maxPps = Math.max(pps100, pps90, pps80, pps70, pps60, pps50, pps40, pps30, pps20, pps10);
            console.log("maxPps:", maxPps);

            var pps;
            if (maxPps === pps100) {
                pps = 100;
            } else if (maxPps === pps90) {
                pps = 90;
            } else if (maxPps === pps80) {
                pps = 80;
            } else if (maxPps === pps70) {
                pps = 70;
            } else if (maxPps === pps60) {
                pps = 60;
            } else if (maxPps === pps50) {
                pps = 50;
            } else if (maxPps === pps40) {
                pps = 40;
            } else if (maxPps === pps30) {
                pps = 30;
            } else if (maxPps === pps20) {
                pps = 20;
            } else if (maxPps === pps10) {
                pps = 10;
            }
          
            var bpi = parseInt(req.body.activity) + parseInt(req.body.emotion) + parseInt(req.body.walk) + parseInt(req.body.work) + parseInt(req.body.relationship) + parseInt(req.body.sleep) + parseInt(req.body.happy);          
            var currentDate = new Date();
            var formattedDate = currentDate.toISOString().slice(0, 10);
            var dateOfFirst = new Date(req.body.date_of_first); 
            console.log("req.body.date_of_first:", req.body.date_of_first);
            console.log("dateOfFirst:", dateOfFirst);
            var dateOfFirstResult = req.body.patient_visit === 0 ? formattedDate : dateOfFirst;

            // คำนวณ duration หรือจำนวนวันระหว่าง formattedDate กับ dateOfFirstResult
            var duration = calculateDuration(formattedDate, dateOfFirstResult);

            // ...

            function calculateDuration(endDate, startDate) {
              // แปลงวันที่เป็นวินาที
              var endDateInSeconds = new Date(endDate).getTime();
              var startDateInSeconds = new Date(startDate).getTime();

              // หาความแตกต่างระหว่างวันที่เป็นวินาที
              var timeDifferenceInSeconds = endDateInSeconds - startDateInSeconds;

              // แปลงวินาทีเป็นวัน
              var duration = timeDifferenceInSeconds / (1000 * 60 * 60 * 24);

              // ปัดเศษทิ้ง
              return Math.floor(duration);
            }
            
            var patientVisit = parseInt(req.body.patient_visit) + 1;

            const patientHN = req.body.patient_HN;

            var patientStatus = req.body.patient_status;
            if (patientVisit > 1 && patientStatus !== "old") {
                patientStatus = "old";
        
                connection.execute(
                    'UPDATE patient SET patient_status = ? WHERE patient_HN = ?',
                    [patientStatus, patientHN],
                    function (err, updateStatusResult, fields) {
                        if (err) {
                            console.error(err);
                            return res.json({ status: 'error', message: 'Failed to update patient status' });
                        }
                    }
                );
            }

            // Update patient_visit and date in the patient table
            connection.execute(
              'UPDATE patient SET patient_visit = ?, date = ?, date_of_first = ?, duration = ? WHERE patient_HN = ?',
              [patientVisit, formattedDate, dateOfFirstResult, duration, patientHN],
              function (err, updateResult, fields) {
                if (err) {
                  console.error(err);
                  return res.json({ status: 'error', message: 'Failed to update patient details' });
                }

          
            connection.execute(
              'INSERT INTO assessment (date, patient_HN, patient_fname, patient_lname, patient_status, patient_visit, nrs, activity, emotion, walk, work, relationship, sleep, happy, satisfied, bpi, movement, activityAndDisease, dailyRoutines, eating, awareness, pps, ss, nv, sfi72, date_of_first, duration, assessor_fname, assessor_lname, assessment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [
                formattedDate,
                req.body.patient_HN,
                req.body.patient_fname,
                req.body.patient_lname,
                patientStatus,
                patientVisit,
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
                req.body.movement,
                req.body.activityAndDisease,
                req.body.dailyRoutines,
                req.body.eating,
                req.body.awareness,
                pps,
                req.body.ss,
                req.body.nv,
                req.body.sfi72,
                dateOfFirstResult,
                duration,
                req.body.assessor_fname,
                req.body.assessor_lname,
                req.body.assessment_status
              ],
              function (err, results, fields) {
                if (err) {
                  res.json({ status: 'error', message: err.message });
                  console.log(err.message);
                  return;
                } else {
                  if (pps === 100) {
                      res.json({ status: 'pps100'});
                  }else if (pps === 90){
                      res.json({ status: 'pps90'});
                  }else if (pps === 80){
                      res.json({ status: 'pps80'});
                  }else if (pps === 70){
                      res.json({ status: 'pps70'});
                  }else if (pps === 60){
                      res.json({ status: 'pps60'});
                  }else if (pps === 50){
                      res.json({ status: 'pps50'});
                  }else if (pps === 40){
                      res.json({ status: 'pps40'});
                  }else if (pps === 30){
                      res.json({ status: 'pps30'});
                  }else if (pps === 20){
                      res.json({ status: 'pps20'});
                  }else if (pps === 10){
                      res.json({ status: 'pps10'});
                    }
                  }
                }
              );
            }
          );
        });


    app.post('/patientAuthen', jsonParser , function (req, res, next) {
      try{
          const token2 = req.headers.authorization.split(' ')[1]
          var decoded2 = jwt.verify(token2 , secret2);
          res.json({status: 'ok' , decoded2})
      
      } catch(err) {
        res.json({status: 'error' , decoded2 ,message: err.message})
      }    
        })

    

          
    app.post('/patientFound', jsonParser, function (req, res, next) {
      const filter = req.body.filter;
      const searchTerm = req.body.searchTerm;
    
      if (!searchTerm) {
        return res.status(400).json({ status: 'error', message: 'Search term is required' });
      }
    
      let query = '';
    
      if (filter === 'HN') {
        query = 'SELECT * FROM patient WHERE patient_HN=?';
      } else if (filter === 'ชื่อ') {
        query = 'SELECT * FROM patient WHERE patient_fname=?';
      } else if (filter === 'นามสกุล') {
        query = 'SELECT * FROM patient WHERE patient_lname=?';
      } else {
        return res.status(400).json({ status: 'error', message: 'Invalid filter' });
      }
    
      connection.execute(
        query,
        [searchTerm],
        function (err, patients, fields) {
          if (err) {
            console.error(err); // Log the database error for debugging
            return res.status(500).json({ status: 'error', message: 'Database error' });
          }
    
          if (!patients || patients.length === 0) {
            return res.status(404).json({ status: 'error', message: 'No user found' });
          }
    
          const token2 = jwt.sign({
            patient_HN: patients[0].patient_HN,
            patient_fname: patients[0].patient_fname,
            patient_lname: patients[0].patient_lname,
            patient_visit: patients[0].patient_visit,
            patient_status: patients[0].patient_status,
            date_of_first: patients[0].date_of_first,
            duration: patients[0].duration
          }, secret2);
       
          // ส่งค่า token2 กลับไปในการตอบสนอ
          res.json({ status: 'ok', message: 'Found!', token2: token2 , results: patients });
        }
      );
    });

    app.post('/getToken2', jsonParser, function (req, res, next) {
      // รับค่า patient_HN จากคำร้องขอ
      const patientHN = req.body.patient_HN;
    
      // ค้นหาผู้ป่วยโดยใช้ patient_HN
      connection.execute(
        'SELECT * FROM patient WHERE patient_HN = ?',
        [patientHN],
        function (err, patients, fields) {
          if (err) {
            console.error(err); // บันทึกข้อผิดพลาดในฐานข้อมูลเพื่อการดีบัก
            return res.status(500).json({ status: 'error', message: 'Database error' });
          }
    
          if (!patients || patients.length === 0) {
            return res.status(404).json({ status: 'error', message: 'No user found' });
          }
    
          // สร้าง token2 สำหรับผู้ป่วยที่พบ
          const token2 = jwt.sign({
            patient_HN: patients[0].patient_HN,
            patient_fname: patients[0].patient_fname,
            patient_lname: patients[0].patient_lname,
            patient_visit: patients[0].patient_visit,
            patient_status: patients[0].patient_status,
            date: patients[0].date,
            date_of_first: patients[0].date_of_first,
            duration: patients[0].duration
          }, secret2);
             
          // ส่งค่า token2 กลับในการตอบสนอ
          res.json({ status: 'ok', token2: token2 });
        }
      );
    });
    
    
      
                  app.get('/history', jsonParser, function (req, res, next) {
                  connection.execute(
                      'SELECT date, patient_HN, patient_fname, patient_lname, patient_status, patient_visit, assessment_status, nrs, activity, emotion, walk, work, relationship, sleep, happy, satisfied, bpi, movement, activityAndDisease, dailyRoutines, eating, awareness, pps, ss, nv, sfi72, date_of_first, duration, assessor_fname, assessor_lname FROM assessment',
                      function(err, results, fields) {
                        if (err) {
                          res.json({status: 'error', message: 'err'}); 
                          return 
                        }else{
                          res.json({results: results});
                        }
                      }
                    );
                  });

                const getPatientInfo = (req, res) => {
                connection.execute(
                  'SELECT patient_fname, patient_lname, patient_HN, patient_status, patient_visit, date, date_of_first, duration FROM patient',
                  function (err, results, fields) {
                    if (err) {
                      res.json({ status: 'error', message: 'err' });
                      return;
                    } else {
                      res.json({ results: results });
                    }
                  }
                );
              };

              const cancelTreatment = (req, res) => {
                const { patient_HN } = req.params;
                const { patient_status } = req.body;
                
                connection.execute(
                  'UPDATE patient SET patient_status = ? WHERE patient_HN = ?',
                  [patient_status, patient_HN],
                  function (err, updateStatusResult, fields) {
                      if (err) {
                          console.error(err);
                          return res.json({ status: 'error', message: 'Failed to update patient status' });
                      }
                      res.json({ status: 'ok', message: `Cancelled treatment for patient HN ${patient_HN}` });

                  }
              );

              }
            

  

              // ใช้ middleware jsonParser ทั้งสองรายการ
              app.get('/patient_info', jsonParser, getPatientInfo);
              app.put('/cancel_treatment/:patient_HN', jsonParser, cancelTreatment);

              

app.listen(7000, function () {
    console.log('CORS-enabled web server listening on port 7000')
  })