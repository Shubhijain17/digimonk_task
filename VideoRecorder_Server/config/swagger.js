const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Video Recorder API',
      version: '1.0.0',
      description: 'API documentation for Video Recorder application. This API allows users to record, upload, and manage videos with role-based access control.',
      contact: {
        name: 'API Support',
        email: 'support@videorecorder.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter token in the format: Bearer {token}'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            username: {
              type: 'string',
              example: 'user1'
            },
            role: {
              type: 'string',
              enum: ['admin', 'user'],
              example: 'user'
            },
            email: {
              type: 'string',
              example: 'user1@example.com'
            }
          }
        },
        Video: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            title: {
              type: 'string',
              example: 'My Recording'
            },
            filename: {
              type: 'string',
              example: 'recording-1234567890.webm'
            },
            originalName: {
              type: 'string',
              example: 'recording-1234567890.webm'
            },
            size: {
              type: 'integer',
              example: 1024000
            },
            mimetype: {
              type: 'string',
              example: 'video/webm'
            },
            createdBy: {
              type: 'string',
              example: 'user1'
            },
            uploadedBy: {
              type: 'integer',
              example: 2
            },
            uploadedByUsername: {
              type: 'string',
              example: 'user1'
            },
            duration: {
              type: 'number',
              example: 30.5
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-11-29T12:00:00.000Z'
            },
            videoUrl: {
              type: 'string',
              example: '/api/videos/file/recording-1234567890.webm'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: {
              type: 'string',
              example: 'user1'
            },
            password: {
              type: 'string',
              example: 'user123'
            }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            status: {
              type: 'string',
              example: 'success'
            },
            message: {
              type: 'string',
              example: 'Login successful'
            },
            data: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                  example: 'token_2_User_1732876900000'
                },
                user: {
                  $ref: '#/components/schemas/User'
                }
              }
            }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            status: {
              type: 'string',
              example: 'success'
            },
            message: {
              type: 'string',
              example: 'Operation successful'
            },
            data: {
              type: 'object'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            status: {
              type: 'string',
              example: 'error'
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            data: {
              type: 'object',
              properties: {
                error: {
                  type: 'string',
                  example: 'Detailed error message'
                }
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication endpoints'
      },
      {
        name: 'Videos',
        description: 'Video management endpoints'
      }
    ]
  },
  apis: ['./routes/*.js', './server.js'] // Path to the API files
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

