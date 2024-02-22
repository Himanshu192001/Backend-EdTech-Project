const mongoose = require('mongoose');
const mailSender = require('../utils/mailSender');
const otpTemplate = require('../mail/templates/emailVerificationTemplate');

const OTPSchema = new mongoose.Schema({
    
    email:{
        type : String,
        required:true
    },
    otp:{
        type:String,
        required:true,
    },
    createdAt:{
        type:Date,
        default:Date.now(),
        expires:5*60
    },
  
});

// function to send email 
async function sendVerificationMail(email , otp)
{
    try{
        const template = otpTemplate(otp);
        const mailResponse = mailSender(email , 'Verification mail From StudyNotion' , template);
        console.log("mail response" , mailResponse);
    }
    catch(error)
    {
        console.log("error occured while sending mail ", error);
    }
}

OTPSchema.pre('save' , async function (next){
    
	// Only send an email when a new document is created
    if (this.isNew) {
		await sendVerificationMail(this.email, this.otp);
	}next();

})

module.exports = mongoose.model("OTP" , OTPSchema);