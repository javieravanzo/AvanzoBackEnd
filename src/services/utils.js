
//Requires
const pool = require('../config/database.js');




const registerSMS = async (to,body) =>{
  
  try {            
    const sms = {
      sms_to: to,
      sms_body: body,
    };

    const SMSQuery = await pool.query('INSERT INTO Sms SET ?', [sms]);

    if(SMSQuery !== '[]' ){
      return {status: 200, data: SMSQuery};
    }else{
      return {status: 200, data: false};
    }
  }catch(e) {
    console.log(e);
    return {status: 500, message: "Error interno del servidor."};
  }

};

const registerEmail = async (email_subject,email_text,email_template_name,email_attachment_name,email_attachment_type,email_path_file_to_compile,email_user_data) =>{
  
  try {

            
    const mail = {
      email_subject: email_subject,
      email_text: email_text,
      email_template_name:email_template_name,
      email_attachment_name:email_attachment_name,
      email_attachment_type:email_attachment_type,
      email_path_file_to_compile:email_path_file_to_compile,
      email_user_data:JSON.stringify(email_user_data)
    };

    const emailQuery = await pool.query('INSERT INTO Emails SET ?', [mail]);

    if(emailQuery !== '[]' ){
      return {status: 200, data: emailQuery};
    }else{
      return {status: 200, data: false};
    }
  }catch(e) {
    console.log(e);
    return {status: 500, message: "Error interno del servidor."};
  }

};

const changeStateMail = async (email_id,state) =>{
  
  try {
   
    const emailQuery = await pool.query('UPDATE Emails SET ? where email_id = ?', [{email_sent: state}, email_id]);

            

    if(emailQuery !== '[]' ){
      return {status: 200, data: true};
    }else{
      return {status: 200, data: false};
    }
  }catch(e) {
    console.log(e);
    return {status: 500, message: "Error interno del servidor."};
  }

};


const changeStateSMS = async (sms_id,state) =>{
  
  try {
    const emailQuery = await pool.query('UPDATE sms SET ? where sms_id = ?', [{sms_forwarded: state}, sms_id]);
    if(emailQuery !== '[]' ){
      return {status: 200, data: true};
    }else{
      return {status: 200, data: false};
    }
  }catch(e) {
    console.log(e);
    return {status: 500, message: "Error interno del servidor."};
  }

};


module.exports = {registerSMS,registerEmail,changeStateMail,changeStateSMS}