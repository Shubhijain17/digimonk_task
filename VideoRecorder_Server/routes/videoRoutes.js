const express = require('express');
const router = express.Router();
const multer = require('multer');
const videoController = require('../controllers/videoController');
const { authenticate } = require('../middleware/authMiddleware');
const upload = require('../config/multer');
const { returnServerRes } = require('../utils');

/**
 * @swagger
 * /api/videos:
 *   get:
 *     summary: Get all videos
 *     description: Retrieve all videos. Admin users see all videos, regular users see only their own videos.
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Videos retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Videos fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Video'
 *       401:
 *         description: Unauthorized - No token provided
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', authenticate, videoController.getAllVideos);

/**
 * @swagger
 * /api/videos/{id}/stream:
 *   get:
 *     summary: Stream video file
 *     description: Stream video file by ID with proper range support for video playback. Supports partial content requests.
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Video ID
 *         example: 1
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         description: Authentication token (alternative to Bearer header)
 *     responses:
 *       200:
 *         description: Video stream (full content)
 *         content:
 *           video/webm:
 *             schema:
 *               type: string
 *               format: binary
 *       206:
 *         description: Partial content (range request)
 *         content:
 *           video/webm:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Access denied
 *       404:
 *         description: Video not found
 */
router.get('/:id/stream', authenticate, videoController.streamVideo);

/**
 * @swagger
 * /api/videos/{id}:
 *   get:
 *     summary: Get video by ID
 *     description: Retrieve a specific video by its ID. Users can only access their own videos, admins can access all.
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Video ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Video retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Video fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     video:
 *                       $ref: '#/components/schemas/Video'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Access denied
 *       404:
 *         description: Video not found
 */
router.get('/:id', authenticate, videoController.getVideoById);

/**
 * @swagger
 * /api/videos/file/{filename}:
 *   get:
 *     summary: Get video file by filename
 *     description: Serve video file directly by filename. Fallback endpoint for video access.
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Video filename
 *         example: recording-1234567890.webm
 *     responses:
 *       200:
 *         description: Video file
 *         content:
 *           video/webm:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Access denied
 *       404:
 *         description: Video file not found
 */
router.get('/file/:filename', authenticate, videoController.getVideoFile);

/**
 * @swagger
 * /api/videos/upload:
 *   post:
 *     summary: Upload a new video
 *     description: 'Upload a video file to the server. Maximum file size is 500MB. Supported formats: webm, mp4, mov, avi, 3gp.'
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - video
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: 'Video file (max 500MB)'
 *               title:
 *                 type: string
 *                 description: Video title (optional)
 *                 example: My Recording
 *               description:
 *                 type: string
 *                 description: Video description (optional)
 *               duration:
 *                 type: number
 *                 description: Video duration in seconds (optional)
 *                 example: 30.5
 *     responses:
 *       201:
 *         description: Video uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Video uploaded successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     video:
 *                       $ref: '#/components/schemas/Video'
 *       400:
 *         description: Bad request - Missing file or invalid file type
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/upload', authenticate, (req, res, next) => {
  upload.single('video')(req, res, (err) => {
    if (err) {
      // Handle multer errors
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return returnServerRes(res, 400, false, 'File too large. Maximum size is 500MB.');
        }
        return returnServerRes(res, 400, false, `Upload error: ${err.message}`);
      }
      return returnServerRes(res, 400, false, err.message || 'File upload error');
    }
    next();
  });
}, videoController.createVideo);

/**
 * @swagger
 * /api/videos/{id}:
 *   delete:
 *     summary: Delete a video
 *     description: Delete a video by ID. Users can only delete their own videos, admins can delete any video.
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Video ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Video deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Video deleted successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     video:
 *                       $ref: '#/components/schemas/Video'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Access denied
 *       404:
 *         description: Video not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticate, videoController.deleteVideo);

/**
 * @swagger
 * /api/videos/rescan:
 *   post:
 *     summary: Rescan videos directory
 *     description: Manually trigger a rescan of the videos directory to detect any new video files. Useful after server restart.
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Videos rescanned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Videos rescanned successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     added:
 *                       type: integer
 *                       description: Number of new videos added
 *                       example: 2
 *                     total:
 *                       type: integer
 *                       description: Total number of videos
 *                       example: 10
 *                     message:
 *                       type: string
 *                       example: 'Found and added 2 new videos. Total videos: 10'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/rescan', authenticate, videoController.rescanVideos);

module.exports = router;

