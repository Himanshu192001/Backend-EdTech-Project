const Section = require("../models/section");
const SubSection = require("../models/subSection");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
require('dotenv').config();


exports.createSubSection = async (req, res ) =>
{
    try
    {
        const {sectionID , title , timeDuration , description} = req.body;
        const video = req.files.videoFile;

        if(!sectionID || !title || !timeDuration || !description || !video)
        {
            return res.status(400).json({
                success:false,
                message:"All fields are required"
            })
        }

        const uploadDetails = await uploadImageToCloudinary(video , process.env.FOLDER_NAME);

        const subSection = await SubSection.create({
            title:title,
            timeDuration:timeDuration,
            description:description,
            videoUrl:uploadDetails.secure_url
        });

        //update the section with this subsection id 
        const updatedSection = await Section.findByIdAndUpdate(sectionId , {$push:{subSection:subSection._id}} , {new:true});

        return res.status(200).json({
            success:true,
            message:"SubSection created successfully ",
            data:updatedSection
        })
    }
    catch(error)
    {
        res.status(500).json({
            success:false,
            message:"Internal Server Error!"
        })
    }
}

exports.updateSubSection = async (req , res) =>
{
    try
    {
        const {  subSectionId, title , timeDuration , description} = req.body;
        const video = req.files.videoFile;

        if(!subSectionId || !title || !timeDuration || !description || !video)
        {
            return res.status(400).json({
                success:false,
                message:"All fields are required"
            })
        }

        const uploadDetails = await uploadImageToCloudinary(video , process.env.FOLDER_NAME);

        const updatedSubSection = await SubSection.findByIdAndUpdate({_id : subSectionId},{
            title:title,
            timeDuration:timeDuration,
            description:description,
            videoUrl:uploadDetails.secure_url
        } , {new:true});

        return res.status(200).json({
            success:false,
            message:"Sub Section Updated Successfully",
            data:updatedSubSection
        })

    }
    catch(error)
    {
        res.status(500).json({
            success:false,
            message:"Internal Server Error!"
        })
    }
}

exports.deleteSubSection = async (req , res ) =>
{
    try
    {
        const {  subSectionId } = req.body;

        if(!subSectionId )
        {
            return res.status(400).json({
                success:false,
                message:"Invalid Data ID"
            })
        }

        await SubSection.findByIdAndDelete({_id : subSectionId});
        
        return res.status(202).json({
            success:true,
            message:"Sub Section deleted successfully",
        })
    }
    catch(error)
    {
        res.status(500).json({
            success:false,
            message:"Internal Server Error!"
        })
    }
}