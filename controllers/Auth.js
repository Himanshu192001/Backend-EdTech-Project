const OTP = require('../models/OTP');
const Users = require('../models/user');
const otpGenerator = require('otp-generator');
const Profile = require('../models/profile');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();


//send OTP
exports.sendOTP = async (req , res) =>
{
    try{
        const {email} = req.body;
        const userExist = await Users.findOne({email});
        
        if(userExist)
        {
            res.status(401).json({
                success:false,
                message:"User already Registered"
            });
        }

        let otp = await otpGenerator.generate(6,{
            upperCaseAlphabets:false,
            lowerCaseAlphabets:false,
            specialChars:false
        });
        
        let result = await OTP.findOne({otp});
        while(result)
        {
            otp = await otpGenerator.generate(6,{
                upperCaseAlphabets:false,
                lowerCaseAlphabets:false,
                specialChars:false
            });
            
            result = await OTP.findOne({otp});
        }
        console.log("OTP generated " , otp);

        const otpBody = await OTP.create({email , otp});
        console.log(otpBody , "otp added in DB");

        res.status(200).json({
            success:true,
            message:"OTP sent Successfully"
        })

    }
    catch(error)
    {
        console.log(error);
        res.status(500).json({
            success:false,
            message: error.message
        })
    }
}

// Sing up
exports.signUp = async (req , res) =>
{
    try{

        //fetch the signup data from request body
        const {
            firstName , 
            lastName , 
            accountType,
            contactNumber,
            otp,
            password,
            confirmPassword,
            email
        } = req.body;

        //validate the data 
        if(!firstName || !lastName || !otp || !password || !confirmPassword || !email)
        {
            return res.status(401).json({
                success:false,
                message: "All fields are required",
            })
        }

        // match the both password
        if(password !== confirmPassword)
        {
            return res.status(400).json({
                success:false,
                message:"Password and Confirm password values does not match . Please try again"
            })
        }

        //check user already exist or not 
        const isUserExist = await Users.findOne({email});

        console.log(isUserExist)
        if(isUserExist)
        {
            return res.status(400).json({
                success:false,
                message : "User is already registered",
            })
        }

        // find most recent otp
        const recentOTP = await  OTP.find({email}).sort({createAt:-1}).limit(1);
        // -1 means from the 'DSC' and limit 1 means only 1 doc

        //validate otp
        if(recentOTP.length == 0)
        {
            return res.status(400).json({
                success:false,
                message:"OTP not found"
            })
        }else if(otp != recentOTP[0]?.otp)
        {
            return res.status(400).json({
                 success:false,
                 message:"Invalid OTP",
            });
        }

        //Hash Password using the bcrypt module 
        const hashPassword = await bcrypt.hash(password , 10);

        //create entry in DB

        //creating user profile to add object id in the additional field
        const profileDetails = await Profile.create({gender : null , dateOfBirth:null , about : null , contactNumber:null});


        const user = await Users.create({
            firstName ,
            lastName ,
            password: hashPassword,
            email ,
            contactNumber ,
            accountType ,
            additionalDetails: profileDetails._id,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
            });

        return res.status(200).json(
            {
                success:true, 
                data : user,
                message:"User is registered successfully",
            }
        )

    }
    catch(error)
    {
        console.error(error);
        return res.status(500).json(
            {
                success:false, 
                message:"User cannot be registered . Please try again",
              
            }
        )
    }
}

//login
exports.login = async (req, res) =>
{
    try{

        const {email , password} = req.body;

        //validate password
        if(!password || !email)
        {
            return res.status(401).json({
                success:false,
                message: "All fields are required",
            })
        }

        //check user already exist or not 
        const user = await Users.findOne({email}).populate('additionalDetails');
        if(!user)
        {
            return res.status(400).json({
                success:false,
                message : "User is not registered . Please sign-up",
            })
        }

        //match password
        if( await bcrypt.compare(password , user.password))
        {
            const payload = {
                email : user.email,
                id : user._id,
                role : user.accountType
            }
            const token = jwt.sign(payload , process.env.JWT_SECRET , {expiresIn:'2h'});
            user['token'] = token;
            user['password'] = undefined;

            const options = {
                expires : new Date(Date.now() + 3*24*60*60*1000),
                httpOnly : true
            }

            //create cookie and send response 
            res.cookie("token" , token , options).status(200).json({
                success:true,
                token , 
                user , 
                message: 'Logged in successfully '
            })
        }
        else
        {
            return res.status(401).json({
                success:false,
                message:"Password is Incorrect"
            })
        }

    }catch(error)
    {
        console.log(error);
        return res.status(500).json(
            {
                success:false, 
                message:"Login Failure. Please try again",
              
            }
        )
    }
}

//change password 
exports.changePassword = async (req , res) =>
{
    try{
        const { oldPassword , newPassword , confirmPassword , email} = req.body;

        //validation
        if(!oldPassword || !newPassword || !confirmPassword )
        {
            return res.status(401).json({
                success:false,
                message: "All fields are required",
            })
        }

        //finding which user password will be change 
        const user = await Users.find({email});

        if(bcrypt.compare(oldPassword , user.password))
        {
            if(newPassword == confirmPassword){

                //incrypt the password and updating in the db
                const hashedPass = bcrypt.hash(newPassword,10);
                const updatedUser = await Users.findByIdAndUpdate(user._id , {password:hashedPass} , {new:true});

                //sending mail 
                const mailResponse = mailSender(email , 'Password change mail From StudyNotion' , '<div><h1>Your password has been changed successfully</h1></div> ');

                console.log(mailResponse , 'Mail response of Change Password');
                return res.status(202).json({
                    success:true,
                    data : updatedUser,
                    message:'Password changed successfully',
                })

            }
            else
            {
                return res.status(401).json({
                    success:false,
                    message: "confirm password is not match with new password",
                })
            }
        }
        else
        {
            return res.status(401).json({
                success:false,
                message: "Old Password is incorrect",
            })
        }

    }catch(error)
    {
        return res.status(500).json({
            success:false,
            message: "Login Failed ! , Please try again later",
        })
    }
}