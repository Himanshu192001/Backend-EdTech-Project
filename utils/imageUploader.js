const cloudinary = require('cloudinary').v2;

exports.uploadImageToCloudinary = async (file , folder , height , quality) =>
{
    const options = folder
    height ? options['height']=height : '';
    quality ? options['quality']=quality : '';
    options['resource_type'] = 'auto';

    return await cloudinary.uploader.upload(file.tempFilePath , options);
 }