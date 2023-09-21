const { default: mongoose } = require("mongoose");
const Course = require("../models/course");
const ratingAndReview = require('../models/ratingAndReview');

exports.createRating = async (req, res) =>
{
    try{
        const userId = req.user.id;
        const {courseId, rating , review } = req.body;

        if(!courseId || !rating , !review)
        {
            return res.status(400).json({
                success:false,
                message:"All fields are required"
            })
        }

        const courseDetails = await Course.findOne({_id:courseId , 
                                                    studentEnrolled:{ $elemMatch:{ $eq:userId } } });

        if(!courseDetails)
        {
            return res.status(404).json({
                success:false,
                message:"Student is not enrolled in the course"
            })
        }

        const isReviewed = await ratingAndReview.findOne({user:userId , course:courseId});

        if(isReview)
        {
            return res.status(400).json({
                success:false,
                message:"Rating already exists"
            })
        }

        const addedReview =  await ratingAndReview.create({
            user:userId,
            rating : rating,
            review:review,
            course:courseDetails._id
        });

       const updatedCourseDetail =  await Course.findByIdAndUpdate(
            {_id:courseId},
            { $push: {ratingAndReview:addedReview._id} },
            { new:true });


        return res.status(201).json({
            success:true,
            message:"Review added successfully",
            data:addedReview
        })

    }
    catch(error)
    {
        return res.status(500).json({
            success:false,
            message:"Something went wrong !"
        })
    }
}

exports.getAvgRating = async (req, res) =>
{
    try
    {
        const {courseId} = req.body;

        const result = await ratingAndReview.aggregate([
            {
                 $match:{
                    course: mongoose.Types.ObjectId(courseId)
                },
            },
            {
                $group:{
                    _id:null,
                    averageRating : { $avg:'$rating'}
                }
            }
        ]);

        if(result.length == 0)
        {
            return res.status(200).json({
                success:true,
                message:"No rating found"
            })
        }

        return res.statu(200).json({
            success:true,
            message:"Rating fetched successfully",
            data: result[0].averageRating 
        })

    }
    catch(error)
    {
        res.status(500).json({
            success:false,
            message:error.message
        })
    }
}

//get all rating and review 

exports.getAllRating = async (req, res) =>
{
    try
    {
        const allReviews = await ratingAndReview.find({}).sort('desc').populate({
             path:"user",
             select:"firstName lastName email image"
            }).populate({
                path:"course",
                select:"courseName"
            });
        
            return res.status(200).json({
                success:true,
                message:"All ratings and reviews fetched successfully ",
                data:allReviews
            })
    }
    catch(error)
    {
        res.status(500).json({
            success:false,
            message:error.message
        })
    }
}