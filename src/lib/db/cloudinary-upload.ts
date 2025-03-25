const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dedcqmvrg";
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || "167236172529885";
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || "VMZYjoOD6pmvcqaV9LjC44ImlqU";

export const generateSignature = (params: Record<string, string>) => {
  const crypto = require('crypto');
  
  // Sort parameters alphabetically
  const sortedParams = Object.keys(params).sort().reduce((acc: Record<string, string>, key) => {
    acc[key] = params[key];
    return acc;
  }, {});
  
  // Create string to sign
  const stringToSign = Object.entries(sortedParams)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  
  // Append API secret
  const signatureString = stringToSign + CLOUDINARY_API_SECRET;
  
  // Generate SHA-256 hash
  return crypto.createHash('sha256').update(signatureString).digest('hex');
};

export const uploadToCloudinary = async (imageUrl: string): Promise<string> => {
  try {
    console.log('Attempting to upload image:', imageUrl);
    
    // For data URLs, convert to blob directly
    let blob;
    if (imageUrl.startsWith('data:')) {
      const base64Data = imageUrl.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      blob = new Blob([byteArray], { type: 'image/png' });
    } else {
      // For URLs, fetch first
      const imageResponse = await fetch(imageUrl);
      blob = await imageResponse.blob();
    }
    
    // Create parameters for signature
    const timestamp = Math.round(new Date().getTime() / 1000).toString();
    const params = {
      timestamp,
      transformation: 'q_auto'
    };
    
    // Generate signature with all parameters
    const signature = generateSignature(params);
    
    // Create form data
    const formData = new FormData();
    formData.append('file', blob);
    formData.append('api_key', CLOUDINARY_API_KEY);
    formData.append('timestamp', timestamp);
    formData.append('transformation', 'q_auto');
    formData.append('signature', signature);
    
    console.log('Uploading to Cloudinary with cloud_name:', CLOUDINARY_CLOUD_NAME);
    
    // Upload to Cloudinary using the upload API
    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    const data = await uploadResponse.json();
    console.log('Cloudinary response:', data);
    
    if (!uploadResponse.ok) {
      throw new Error(data.error?.message || 'Failed to upload to Cloudinary');
    }
    
    // Return the original URL without transformations
    return data.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};
