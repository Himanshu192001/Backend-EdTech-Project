const Category = require('../models/category');


//create Category route handler
exports.createCategory = async (req, res) =>
{
    try{
        const {name , description } = req.body;
        if(!name || !description)
        {
            return res.status(400).json({
                success:false,
                message:"All fields are required"
            })
        }
        const Category = await Category.create({name : name , description : description});
        console.log(Category);

        return res.status(201).json({
            success:true,
            message:"Category created successfully",
            data:Category
        });
    }
    catch(error)
    {
        res.status(500).json({
            success:false,
            message:error.message
        })
    }
}


//get all Category route handler
exports.showAllCategories= async (req , res) =>
{
    try{
        const Categories = await Category.find({},{name:true , description : true});
        res.status(200).json({
            success:true,
            message:"All Categories fetched successfully",
            data : Categories
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

exports.categoryPageDetails = async (req ,res ) =>
{
    try
    {
        const {categoryId} = req.body;

        //get courses for the specified category
        const selectedCategory = await Category.findById(categoryId).populate('courses').exec();

        console.log("Selected Category :  " , selectedCategory);

        //category not found 
        if(!selectedCategory)
        {
            return res.status(404).json({
                success:false,
                message:"Category not found ",
            })
        }

        //when no courses in the category
        if(selectedCategory.courses.length == 0)
        {
            return res.status(200).json({
                success:true,
                message:"No courses found for the selected category.",
            })
        }

        const selectedCourses = selectedCategory.courses;

        //get the category of the different courses
        const categoriesExceptSelected = await Category.findById({_id:{$ne:{categoryId}}}).populate("courses").exec();
        let differentCourses = [];
        for( categories of categoriesExceptSelected)
        {
            differentCourses.push(...categories.courses);
        }

        // Get top-selling courses across all categories
		const allCategories = await Category.find().populate("courses");
		const allCourses = allCategories.flatMap((category) => category.courses);
		const mostSellingCourses = allCourses
			.sort((a, b) => b.studentEnrolled - a.studentEnrolled)
			.slice(0, 10);

		res.status(200).json({
			selectedCourses: selectedCourses,
			differentCourses: differentCourses,
			mostSellingCourses: mostSellingCourses,
		});

    }
    catch(error)
    {
        return res.status(500).json({
			success: false,
			message: "Internal server error",
			error: error.message,
		});
    }
}