const Profile = require("../models/profile");
const User = require("../models/user");
const Course = require("../models/course");
// const cron = require("node-cron");


exports.updateProfile = async (req , res ) =>
{
    try
    {
        const {dateOfBirth='',about='' , contactNumber , gender} = req.body;
        const userID = req.user.id;

        if(!userID || !contactNumber || !gender )
        {
            return res.status(400).json({
                success:false,
                message:"All fields are required"
            })
        }

        const userDetails = await User.findById(userID);
        const profileId = userDetails.additionalDetails;
        const profileDetails = await Profile.findById(profileId);

        profileDetails.dateOfBirth = dateOfBirth;
        profileDetails.about = about;
        profileDetails.contactNumber = contactNumber;
        profileDetails.gender = gender;
        await profileDetails.save();

        return res.status(200).json({
            success:true,
            message:"Profile updated successfully",
            data:profileDetails
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

exports.deleteAccount = async (req , res ) =>
{
    try
    {
        const id = req.user.id;

        const userDetails = await User.findById(id);

        if(!userDetails)
        {
            return res.status(404).json({
                success:false,
                message:" User not found "
            });
        }

         await Profile.findByIdAndDelete(userDetails.additionalDetails);

         user.courses.forEach(async (element) => {
             await Course.findByIdAndUpdate({_id : element} ,{ $pull:{studentEnrolled : id} }, {new:true});
         });

         await User.findByIdAndDelete(id);

         return res.status(202).json({
            success:true,
            message:"Account deleted Successfully"
         });
    }
    catch(error)
    {
        return res.status(500).json({
            success:false,
            message:"Internal Server Error !"
        })
    }
}

exports.getAllUserDetails = async (req, res) => {
	try {
		const id = req.user.id;
		const userDetails = await User.findById(id)
			.populate("additionalDetails")
			.exec();
		console.log(userDetails);
		res.status(200).json({
			success: true,
			message: "User Data fetched successfully",
			data: userDetails,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

exports.updateDisplayPicture = async (req, res) => {
    try {
      const displayPicture = req.files.displayPicture
      const userId = req.user.id
      const image = await uploadImageToCloudinary(
        displayPicture,
        process.env.FOLDER_NAME,
        1000,
        1000
      )
      console.log(image)
      const updatedProfile = await User.findByIdAndUpdate(
        { _id: userId },
        { image: image.secure_url },
        { new: true }
      )
      res.send({
        success: true,
        message: `Image Updated successfully`,
        data: updatedProfile,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
};
  
exports.getEnrolledCourses = async (req, res) => {
    try {
      const userId = req.user.id
      const userDetails = await User.findOne({
        _id: userId,
      })
        .populate("courses")
        .exec()
      if (!userDetails) {
        return res.status(400).json({
          success: false,
          message: `Could not find user with id: ${userDetails}`,
        })
      }
      return res.status(200).json({
        success: true,
        data: userDetails.courses,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
};