const User = require('../models/user');
const mailSender = require('../utils/mailSender');
const mailFormat = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
const bcrypt = require('bcrypt');
const crypto = require('crypto');

//resetPasswordToken
exports.resetPasswordToken = async (req,res) =>{
    try{
        const {email } = req.body;
        const user = await User.findOne({email: email});
        if(user)
        {
            if(email.match(mailFormat))
            {
                //generate token
		        const token = crypto.randomBytes(20).toString("hex");
                const updatedDetails = await User.findOneAndUpdate({email:email},{token:token,resetPasswordExpires: Date.now() + 5*60*1000},{new:true});

                const url = `http://localhost:3000/update-password/${token}`;
                await mailSender(
                    email,
                    "Password Reset",
                    `Your Link for email verification is ${url}. Please click this url to reset your password.`
                );

                res.json({
                        success: true,
                        message:
                            "Email Sent Successfully, Please Check Your Email to Continue Further",
                    });
            }
            else
            {
                return res.status(401).json({
                    success:false,
                    message:"Please enter the valid email address"
                })
            }
        }
        else
        {
            return res.status(401).json({
                success:false,
                message:"Email is not registered"
            })
        }
        
    }
    catch(error)
    {
        console.error(error);
        return res.status(500).json({
            success:false,
            error : error.message,
            message:"Something went wrong !"
        })
    }
}


//resetPassword
exports.resetPassword = async (req,res) =>
{
    try{
        const {token , newPassword , confirmPassword} = req.body;

        if(newPassword == confirmPassword)
        {
            const user = await User.findOne({token:token});
            
            if(user)
            {
                // check token expiry
                if(user.resetPasswordExpires < Date.now())
                {
                    return res.status(400).json({
                        success:false,
                        message:"Token is expired !"
                    })
                }

                const hashPassword = await bcrypt.hash(newPassword , 10);

                const updatedUserDetail = await User.findOneAndUpdate({email:user.email},{password:hashPassword } , {new:true});

                return res.status(201).json({
                    success:true,
                    message:'Password Updated Successfully',
                    data:updatedUserDetail
                })

            }else
            {
                return res.status(400).json({
                    success:false,
                    message:"Token is invalid !"
                })
            }
        }
        else
        {
            return res.status(400).json({
                success:false,
                message:"Confirm password didn't match"
            })
        }

    }
    catch(error)
    {
        console.error(error);
        return res.status(500).json({
            success:false,
            message:"Something went wrong !"
        })
    }
}
