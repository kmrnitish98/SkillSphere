import cloudinary from '../config/cloudinary.js';
import streamifier from 'streamifier';

export const uploadFromBuffer = (buffer, folder = 'skillsphere', options = {}) => {
  return new Promise((resolve, reject) => {
    let cld_upload_stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto', // Auto-detects image, video, pdf
        ...options,
      },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );
    streamifier.createReadStream(buffer).pipe(cld_upload_stream);
  });
};
