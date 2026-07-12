const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('Cloudinary Configured Successfully');
} else {
  console.log('Cloudinary credentials missing. Falling back to local public uploads.');
}

const uploadImage = async (localFilePath, folderName = 'k_designs') => {
  try {
    if (!localFilePath) return null;
    
    if (isCloudinaryConfigured) {
      const result = await cloudinary.uploader.upload(localFilePath, {
        folder: folderName,
        resource_type: 'auto'
      });
      // Delete temporary upload file from temp/
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
      return {
        url: result.secure_url,
        public_id: result.public_id
      };
    } else {
      // Local fallback
      const uploadDir = path.join(__dirname, '../public/uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const filename = `${Date.now()}-${path.basename(localFilePath)}`;
      const destinationPath = path.join(uploadDir, filename);
      
      fs.copyFileSync(localFilePath, destinationPath);
      
      // Delete temporary upload file from temp/
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
      
      return {
        url: `/uploads/${filename}`,
        public_id: `local-${filename}`
      };
    }
  } catch (error) {
    console.error('Image Upload Error:', error);
    // clean up temp file
    if (localFilePath && fs.existsSync(localFilePath)) {
      try { fs.unlinkSync(localFilePath); } catch (e) {}
    }
    throw error;
  }
};

const deleteImage = async (publicId) => {
  try {
    if (!publicId) return false;
    
    if (publicId.startsWith('local-')) {
      const filename = publicId.replace('local-', '');
      const filePath = path.join(__dirname, '../public/uploads', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } else if (isCloudinaryConfigured) {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    }
    return false;
  } catch (error) {
    console.error('Image Delete Error:', error);
    return false;
  }
};

module.exports = {
  uploadImage,
  deleteImage,
  isCloudinaryConfigured
};
