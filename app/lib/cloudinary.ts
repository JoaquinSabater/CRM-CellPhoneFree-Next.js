export const getCloudinaryImageUrl = (image?: string | null) => {
  if (!image) return null;

  const value = image.trim();

  if (!value) return null;

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }

  if (value.startsWith('//')) {
    return `https:${value}`;
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dpltz52z9';
  const publicId = value.startsWith('/') ? value.slice(1) : value;

  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/${publicId}`;
};