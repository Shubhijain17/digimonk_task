// In-memory storage for videos
let videos = [];
let nextId = 1;

// Initialize videos from existing files on server start
const initializeVideosFromDisk = () => {
  const fs = require('fs');
  const path = require('path');
  
  const uploadsDir = path.join(__dirname, '../uploads/videos');
  
  if (!fs.existsSync(uploadsDir)) {
    return;
  }
  
  const files = fs.readdirSync(uploadsDir);
  const videoFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.webm', '.mp4', '.mov', '.avi'].includes(ext);
  });
  
  console.log(`[INIT] Found ${videoFiles.length} video files in uploads directory`);
  
  videoFiles.forEach((filename, index) => {
    const filePath = path.join(uploadsDir, filename);
    const stats = fs.statSync(filePath);
    
    const video = {
      id: nextId++,
      title: `Recovered Video ${index + 1}`,
      description: 'Recovered from disk after server restart',
      videoUrl: `/api/videos/file/${filename}`,
      filename: filename,
      duration: 0,
      uploadedBy: 1, // Default to admin
      uploadedByUsername: 'system',
      timestamp: stats.birthtime.toISOString(),
      createdAt: stats.birthtime.toISOString()
    };
    
    videos.push(video);
  });
  
  console.log(`[INIT] Loaded ${videos.length} videos into memory`);
};

initializeVideosFromDisk();

const getAllVideos = () => {
  return videos;
};

const getVideosByUserId = (userId) => {
  return videos.filter(video => video.uploadedBy === parseInt(userId));
};

const getVideoById = (id) => {
  return videos.find(video => video.id === parseInt(id));
};

const createVideo = (videoData) => {
  const newVideo = {
    id: nextId++,
    title: videoData.title || 'Untitled Video',
    description: videoData.description || '',
    videoUrl: videoData.videoUrl, // Local file path
    filename: videoData.filename,
    duration: videoData.duration || 0,
    uploadedBy: videoData.uploadedBy,
    uploadedByUsername: videoData.uploadedByUsername,
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };
  videos.push(newVideo);
  return newVideo;
};



const deleteVideo = (id) => {
  const index = videos.findIndex(video => video.id === parseInt(id));
  if (index !== -1) {
    return videos.splice(index, 1)[0];
  }
  return null;
};

const rescanVideos = () => {
  const fs = require('fs');
  const path = require('path');
  
  const uploadsDir = path.join(__dirname, '../uploads/videos');
  
  if (!fs.existsSync(uploadsDir)) {
    return { added: 0, total: videos.length };
  }
  
  const files = fs.readdirSync(uploadsDir);
  const videoFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.webm', '.mp4', '.mov', '.avi'].includes(ext);
  });
  
  let addedCount = 0;
  
  videoFiles.forEach((filename) => {
    const exists = videos.find(v => v.filename === filename);
    
    if (!exists) {
      const filePath = path.join(uploadsDir, filename);
      const stats = fs.statSync(filePath);
      
      const video = {
        id: nextId++,
        title: `Recovered Video`,
        description: 'Recovered from disk',
        videoUrl: `/api/videos/file/${filename}`,
        filename: filename,
        duration: 0,
        uploadedBy: 1, 
        uploadedByUsername: 'system',
        timestamp: stats.birthtime.toISOString(),
        createdAt: stats.birthtime.toISOString()
      };
      
      videos.push(video);
      addedCount++;
    }
  });
  
  console.log(`[RESCAN] Added ${addedCount} new videos. Total: ${videos.length}`);
  return { added: addedCount, total: videos.length };
};

module.exports = {
  getAllVideos,
  getVideosByUserId,
  getVideoById,
  createVideo,
  deleteVideo,
  rescanVideos
};

