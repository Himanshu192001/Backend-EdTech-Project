const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    courseName:{
        type:String,
        trim:true,
        required:true
    },
    courseDescription:{
        type:String,
        trim:true,
        required:true
    },
    instructor:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    whatYouWillLearn:{
        type:String
    },
    courseContent:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Section"
    }],
    ratingAndReview:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"RatingAndReview"
    }],
    price:{
        type:Number,
        trim : true,
        required:true
    },
    thumbnail:{
        type:String,

    },
    tag:{
        type:String,
        required:true
    },
    category:{
        type : mongoose.Schema.Types.ObjectId,
        ref:"Category"
    },
    studentEnrolled:[{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"User"
    }],
    instructions: {
		type: [String],
	},
	status: {
		type: String,
		enum: ["Draft", "Published"],
	},

});

module.exports = mongoose.model("Course" , courseSchema);