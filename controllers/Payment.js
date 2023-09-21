const {instance} = require('../config/razorpay');
const Course = require("../models/course");
const User = require("../models/user");
const mailSender = require("../utils/mailSender");
const {courseEnrollmentEmail} = require("../mail/templates/courseEnrollmentEmail");
const { default: mongoose } = require('mongoose');


exports.capturePayment = async (req , res ) =>
{
    const userId = req.user.id;
    const {courseId} = req.body;
    if(!courseId)
    {
        return res.status(400).json({
            success:false,
            message:"Please provide Course Id"
        })
    }
    let courseDetails;
    try{
        courseDetails= await Course.findById(courseId);
        if(!courseDetails)
        {
            return res.status(404).json({
                success:false,
                message:"course not found "
            })
        }

        // converting string id to the mongo object id 
        const uid = new mongoose.Types.ObjectId(userId);

        //checking if student is already enrolled 
        if(courseDetails.studentEnrolled.includes(uid))
        {
            return res.status(400).json({
                success:false,
                message:" Student is already Enrolled "
            })
        }
    }
    catch(error)
    {
        return res.status(500).json({
            success:false,
            message:error.message
        })
    }

    // creating order for the razorpay to proceed payment
    const amount = courseDetails.price;
    const currency = "INR";

    const options = {
        amount : amount * 100 ,
        currency , 
        receipt : Math.random(Date.now()).toString(),
        notes : {
            course_id : courseId,
            userId
        }
    }

    try{
        //initiate the payment using razorpay 
        const paymentResponse = await instance.orders.create(options);
        console.log(" PaymentResponse :   " ,paymentResponse );

        return res.status(200).json({
            success:true,
            courseName: courseDetails.courseName,
            courseDescription : courseDetails.courseDescription,
            thumbnail:courseDetails.thumbnail,
            orderId : paymentResponse.id,
            currency:paymentResponse.currency,
            amount : paymentResponse.amount
        })
    }
    catch(error)
    {   
        console.log(error)
        return res.json({
            success:false,
            message:"Could not initiate order "
        })
    }
}

// verify signature handler :- verify is the payment successfully paid or not 
exports.verifySignature = async (req , res ) => 
{
    const webHookSecret = "";

    //get the hashed signature from the razorpay 
    const signature = req.headers['x-razorpay-signature'];

    //now we can hash our webHookSecret to match the razorpay secret 
    //sha256 is a hashing algo 
    const shasum = crypto.createHmac('sha256' , webHookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    if(signature === digest)
    {
        console.log("Payment is Authorised ")

        // now add course_id in user courses schema and user_id in course enrolledStudent
        // get the courseId and userId from the notes of the payment 
        const {course_id , userId} = req.body.payload.payment.entity.notes ;

        try{
            const enrolledCourse = await Course.findByIdAndUpdate({_id:course_id} , {$push:{studentEnrolled:userId}} , {new:true});
            if(!enrolledCourse)
            {
                return res.status(500).json({
                    success:false,
                    message:'Course not found ',
                })
            }

            console.log("Enrolled Course :  " , enrolledCourse);

            const updatedUserDetails = await User.findByIdAndUpdate({_id : userId} , {$push:{courses:course_id}} , {new:true});

            if(!updatedUserDetails)
            {
                return res.status(500).json({
                    success:false,
                    message:'User not found ',
                })
            }

            console.log("User Details :  " , updatedUserDetails);

            //send the confirmation mail to user 
            const emailResponse = await mailSender(
                updatedUserDetails.email,
                "Congratulations",
                "Congratulations ,  you are onboarded into new course of StudyNotion courses"
            )

            console.log("Email Response   : " , emailResponse );
            return res.status(200).json({
                success:true,
                message:"Signature verified and student enrolled ",
            });
        }
        catch(error)
        {
            console.log(error);
            return res.status(500).json({
                success:false,
                message:error.message
            })
        }
    }
    else
    {
        return res.status(400).json({
            success:false,
            message:"Invalid request "
        })
    }
}