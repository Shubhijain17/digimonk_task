const videoModel = require('../models/videoModel');
const { returnServerRes } = require('../utils');
const { getUserById } = require('./authController');
const fs = require('fs');
const path = require('path');

const getAllVideos = (req, res) => {
  try {
    let videos;
    
    // Admin can see all videos, Users can only see their own
    if (req.user.role === 'Admin') {
      videos = videoModel.getAllVideos();
    } else {
      videos = videoModel.getVideosByUserId(req.user.id);
    }
    const mappedVideos = videos.map(video => {
      let fileSize = 0;
      // Try to get file size
      if (video.filename) {
        const filePath = path.join(__dirname, '../uploads/videos', video.filename);
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          fileSize = stats.size;
        }
      }
      
      return {
        ...video,
        createdBy: video.uploadedByUsername,
        size: fileSize,
        mimetype: 'video/webm',
        originalName: video.filename
      };
    });

    return returnServerRes(res, 200, true, 'Videos fetched successfully', mappedVideos);
  } catch (error) {
    return returnServerRes(res, 500, false, 'Error fetching videos', { error: error.message });
  }
};

const getVideoById = (req, res) => {
  try {
    const { id } = req.params;
    const video = videoModel.getVideoById(id);

    if (!video) {
      return returnServerRes(res, 404, false, 'Video not found');
    }

    if (req.user.role !== 'Admin' && video.uploadedBy !== req.user.id) {
      return returnServerRes(res, 403, false, 'Access denied. You can only view your own videos.');
    }

    return returnServerRes(res, 200, true, 'Video fetched successfully', { video });
  } catch (error) {
    return returnServerRes(res, 500, false, 'Error fetching video', { error: error.message });
  }
};

const createVideo = (req, res) => {
  try {
    if (!req.file) {
      return returnServerRes(res, 400, false, 'Video file is required');
    }

    const { title, description, duration } = req.body;

    if (!title) {
      fs.unlinkSync(req.file.path);
      return returnServerRes(res, 400, false, 'Title is required');
    }

    const user = getUserById(req.user.id);
    const uploadedByUsername = user ? user.username : `user_${req.user.id}`;

    let videoDuration = 0;
    if (duration) {
      const parsedDuration = parseFloat(duration);
      if (!isNaN(parsedDuration) && parsedDuration > 0) {
        videoDuration = parsedDuration;
      }
    }

    const videoData = {
      title,
      description: description || '',
      videoUrl: `/api/videos/file/${req.file.filename}`, 
      filename: req.file.filename,
      duration: videoDuration,
      uploadedBy: req.user.id,
      uploadedByUsername: uploadedByUsername
    };

    const newVideo = videoModel.createVideo(videoData);

    return returnServerRes(res, 201, true, 'Video uploaded successfully', { video: newVideo });
  } catch (error) {
    // Delete uploaded file if there's an error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    return returnServerRes(res, 500, false, 'Error creating video', { error: error.message });
  }
};

const deleteVideo = (req, res) => {
  try {
    const { id } = req.params;
    const videoId = parseInt(id);
    
    if (isNaN(videoId)) {
      return returnServerRes(res, 400, false, 'Invalid video ID');
    }

    const video = videoModel.getVideoById(videoId);

    if (!video) {
      console.log(`[VIDEO] Delete failed: Video ID ${videoId} not found`);
      return returnServerRes(res, 404, false, 'Video not found');
    }

    if (req.user.role !== 'Admin' && video.uploadedBy !== req.user.id) {
      console.log(`[VIDEO] Delete failed: Access denied for user ${req.user.id} on video ${videoId}`);
      return returnServerRes(res, 403, false, 'Access denied. You can only delete your own videos.');
    }

    if (video.filename) {
      const filePath = path.join(__dirname, '../uploads/videos', video.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`[VIDEO] Deleted file: ${video.filename}`);
      }
    }

    const deletedVideo = videoModel.deleteVideo(videoId);

    if (!deletedVideo) {
      return returnServerRes(res, 404, false, 'Video not found in storage');
    }

    console.log(`[VIDEO] Video ${videoId} deleted successfully by user ${req.user.id}`);
    return returnServerRes(res, 200, true, 'Video deleted successfully', { video: deletedVideo });
  } catch (error) {
    console.error('[VIDEO] Error deleting video:', error);
    return returnServerRes(res, 500, false, 'Error deleting video', { error: error.message });
  }
};

const streamVideo = (req, res) => {
  try {
    const { id } = req.params;
    const videoId = parseInt(id);
    
    if (isNaN(videoId)) {
      return returnServerRes(res, 400, false, 'Invalid video ID');
    }
    
    const video = videoModel.getVideoById(videoId);

    if (!video) {
      return returnServerRes(res, 404, false, 'Video not found');
    }

    if (req.user.role !== 'Admin' && video.uploadedBy !== req.user.id) {
      return returnServerRes(res, 403, false, 'Access denied. You can only view your own videos.');
    }

    const filePath = path.join(__dirname, '../uploads/videos', video.filename);

    if (!fs.existsSync(filePath)) {
      return returnServerRes(res, 404, false, 'Video file not found');
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    const ext = path.extname(video.filename).toLowerCase();
    const contentTypeMap = {
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mov': 'video/quicktime',
      '.avi': 'video/x-msvideo',
      '.3gp': 'video/3gpp'
    };
    const contentType = contentTypeMap[ext] || 'video/webm';

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': contentType,
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    return returnServerRes(res, 500, false, 'Error streaming video', { error: error.message });
  }
};


const getVideoFile = (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads/videos', filename);

    if (!fs.existsSync(filePath)) {
      return returnServerRes(res, 404, false, 'Video file not found');
    }

    const videos = videoModel.getAllVideos();
    const video = videos.find(v => v.filename === filename);

    if (video) {
      if (req.user.role !== 'Admin' && video.uploadedBy !== req.user.id) {
        return returnServerRes(res, 403, false, 'Access denied. You can only view your own videos.');
      }
    }

    res.sendFile(path.resolve(filePath));
  } catch (error) {
    return returnServerRes(res, 500, false, 'Error serving video file', { error: error.message });
  }
};

const rescanVideos = (req, res) => {
  try {
    const result = videoModel.rescanVideos();
    
    return returnServerRes(res, 200, true, 'Videos rescanned successfully', {
      added: result.added,
      total: result.total,
      message: `Found and added ${result.added} new videos. Total videos: ${result.total}`
    });
  } catch (error) {
    return returnServerRes(res, 500, false, 'Error rescanning videos', { error: error.message });
  }
};

module.exports = {
  getAllVideos,
  getVideoById,
  createVideo,
  deleteVideo,
  streamVideo,
  getVideoFile,
  rescanVideos
};

