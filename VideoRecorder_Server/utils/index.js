

const returnServerRes = (res, statusCode, success, message, data = {}) => {
  try {
    return res.status(statusCode).json({
      success,
      status: success ? 'success' : 'error', 
      message,
      data,
    });
  } catch (error) {
    console.error(error); 
    return res.status(500).json({
      success: false,
      status: 'error',
      message: "Internal server error",
    });
  }
};

module.exports = {
  returnServerRes
};

