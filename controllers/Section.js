const Section = require('../models/section');
const Course = require('../models/course');


exports.createSection = async (req, res ) =>    
{
    try{

        const {sectionName , courseID} = req.body;

        if(!sectionName || !courseID)
        {
            return res.status(400).json({
                success:false,
                message:"All fields are required"
            })
        }

        const newSection = await Section.create({sectionName});

        const updatedCourse = await Course.findByIdAndUpdate(
            {_id:courseID},
            {
                $push: { courseContent: newSection._id }
            },
            {new:true}).populate();

        return res.status(200).json({
            success:true,
            message:"Section created Successfully",
            data: updatedCourse
        })
    }
    catch(error)
    {
        return res.status(500).json({
            success:false,
            message:"Internal Server Error !"
        })
    }
}


exports.updateSection = async ( req , res ) => 
{
    try 
    {
        const {sectionName , sectionID} = req.body;

        if(!sectionName || !sectionID)
        {
            return res.status(400).json({
                success:false,
                message:"Insufficient Data "
            })
        }

        const updatedSection = await Section.findByIdAndUpdate(sectionID , {sectionName:sectionName} , {new:true}).populate();

        return res(201).json({
            success:true,
            message:"Section is updated successfully",
            data:updatedSection
        })
    }
    catch(error)
    {
        return res.status(500).json({
            success:false,
            message:"Internal Server Error !"
        })
    }
}

exports.deleteSection = async (req , res ) => 
{
    try
    {
        const {sectionID} = req.params;

        if(!sectionID)
        {
            return res.status(400).json({
                success:false,
                message:"Insufficient Data"
            })
        }

        await Section.findByIdAndDelete(sectionID);

        return res.status(200).json({
            success:true,
            message:"Section deleted Successfully",
        })

    }
    catch(error)
    {
        return res.status(500).json({
            success:false,
            message:"Internal Server Error !"
        })
    }
}