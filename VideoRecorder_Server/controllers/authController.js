const { returnServerRes } = require('../utils');

const users = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123', 
    role: 'Admin'
  },
  {
    id: 2,
    username: 'user1',
    password: 'user123', 
    role: 'User'
  },
  {
    id: 3,
    username: 'user2',
    password: 'user123', 
    role: 'User'
  }
];

const login = (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return returnServerRes(res, 400, false, 'Username and password are required');
    }

    
    const user = users.find(
      u => u.username === username && u.password === password
    );

    if (!user) {
      return returnServerRes(res, 401, false, 'Invalid credentials');
    }

    // Simple token (in production, use JWT)
    const token = `token_${user.id}_${user.role}_${Date.now()}`;

    return returnServerRes(res, 200, true, 'Login successful', {
      token: token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role.toLowerCase(), 
        email: `${user.username}@example.com` 
      }
    });
  } catch (error) {
    return returnServerRes(res, 500, false, 'Server error', { error: error.message });
  }
};

const getUsers = () => users;
const getUserById = (id) => users.find(u => u.id === id);

module.exports = {
  login,
  getUsers,
  getUserById
};

