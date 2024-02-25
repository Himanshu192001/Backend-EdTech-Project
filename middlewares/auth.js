const User = require('../models/user');
require('dotenv').config();
const jwt = require('jsonwebtoken');

//auth
exports.auth = async (req,res,next) =>
{
    try{
        const token = req.cookies.token || req.header("Authorization")?.replace('Bearer',"") || req.body.token;

        //if no token 
        if(!token){
            return res.status(401).json({
                success:false,
                message:"Token is missing",
            })
        }

        //verify the token
        try{
            const decodeToken = await jwt.verify(token , process.env.JWT_SECRET);
            req.user = decodeToken;
            console.log(decodeToken , "Decode Token");
        }
        catch(error){
            return res.status(401).json({
                success:false,
                message:"Invalid Token",
            })
        }
        next();

    }catch(error)
    {
        return res.status(401).json({
            success:false,
            message:"Something went wrong while validate !",
        })
    }
}

// isStudent 
exports.isStudent = async (req, res, next) =>
{
    try{
        if(req.user.accountType !== 'Student')
        {
            return res.status(401).json({
                success:false,
                message:"This is protectect route for student only"
            })
        }
    }
    catch(error)
    {
        return res.status(500).json({
            success:false,
            message:"Something went wrong!"
        })
    }
    next();
}

// isInstructor
exports.isInstructor = async (req, res, next) =>
{
    try{
        if(req.user.accountType !== 'Instructor')
        {
            return res.status(401).json({
                success:false,
                message:"This is protectect route for Instructor only"
            })
        }
    }
    catch(error)
    {
        return res.status(500).json({
            success:false,
            message:"Something went wrong!"
        })
    }
    next();
}

// isAdmin
exports.isAdmin = async (req, res, next) =>
{
    try{
        
        if(req.user.accountType !== 'Admin')
        {
            return res.status(401).json({
                success:false,
                message:"This is protectect route for Admin only"
            })
        }
    }
    catch(error)
    {
        return res.status(500).json({
            success:false,
            message:"Something went wrong!"
        })
    }
    next();
}