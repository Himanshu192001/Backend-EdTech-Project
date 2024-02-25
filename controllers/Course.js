const Category = require('../models/category')
const User = require('../models/user')
const Course = require('../models/course');
const { uploadImageToCloudinary } = require('../utils/imageUploader');



// handler to create course 
exports.createCourse = async (req , res ) =>
{
    try{

        // data of the course getting Category id in body
        let {courseName , courseDescription , whatYouWillLearn , price ,tag ,  category , status , instructions} = req.body;
        console.log(req.body);
        //get the thumbnail of the course 
        const thumbnail = req.files.thumbnailImage;
        console.log(thumbnail);

        //validation on the course data
        if(!courseName || !courseDescription || !whatYouWillLearn || !price || !tag || !category || !thumbnail )
        {
            return res.status(400).json({
                success:false,
                message:'All fields are required',
            })
        }

        if (!status || status === undefined) {
			status = "Draft";
		}

        const userId = req.user.id;
        const instructorDetails = await User.findOne({_id : userId});
        if(!instructorDetails)
        {
            return res.status(400).json({
                success:false,
                message:'Instructor Details are not Found ',
            });
        }


        const CategoryDetails = await Category.findById(category);
        if(!CategoryDetails)
        {
            return res.status(400).json({
                success:false,
                message:'Category Details are not Found ',
            });
        }

        //upload image to cloudinary
        const thumbnailImage = await uploadImageToCloudinary(thumbnail , process.env.FOLDER_NAME , )


        //create an entry for new course 
        const newCourse = Course.create({
            courseName,
            courseDescription,
            instructor: instructorDetails._id,
            whatYouWillLearn,
            price,
            tag:tag,
            thumbnail: thumbnailImage.secure_url,
            category:CategoryDetails._id,
            status:status,
            instructions:instructions,
        } , {new : true});

        //add an entry of the course in the instructor schema 
        await User.findByIdAndUpdate(
            {_id:instructorDetails._id},
            {
                $push:{
                    courses: newCourse._id
                }
            },{new:true});
        
        // add an course in the Category schema 
        await Category.findByIdAndUpdate(
            {_id: CategoryDetails._id},
            {
                $push:{
                    courses : newCourse._id,
                }
            },
            {new:true}
            );

         return res.status(201).json({
            success:true,
            message:"Course created succesfully",
            data: newCourse
         })   
    }
    catch(error)
    {
        console.error(error);
        return res.status(500).json({
            success:false,
            message:"Internal server error !"
        })
    }
}


// get all the created course  handler

exports.getAllCourses = async (req , res) =>
{
    try
    {
        const allCourses = await Course.find({} , {courseName:true,
                                                    price:true,
                                                    thumbnail:true,
                                                    instructor:true,
                                                    ratingAndReview:true,
                                                    studentsEnrolled:true,
                                                    }).populate("instructor").exec();
        return res.status(200).json({
            success:true,
            data: allCourses,
            message:"List of all the courses "
        })
    }
    catch(error)
    {
        return res.status(500).json({
            success:false,
            message:"Internal server error !"
        })
    }
}

exports.getCourseDetails = async ( req , res ) =>
{
    try
    {
        const {courseId} = req.body;

        const courseDetail = await Course.findById(courseId).populate({
            path:'instructor',
            populate:{
                path:'additionalDetails'
            }
        }).populate({
            path:'courseContent',
            populate:{
                path:'subSection'
            }
        }).populate('ratingAndReview').populate('category').exec();
        if(!courseDetail)
        {
            return res.status(400).json({
                success:false,
                message:`Could not find the course with ${courseId}`
            });
        }

        return res.status(200).json({
            success:true,
            message:"Course Details fetched Successfully",
            data:courseDetail
        })
    }
    catch(error)
    {
        return res.status(500).json({
            success:false,
            message:error.message
        })
    }
}