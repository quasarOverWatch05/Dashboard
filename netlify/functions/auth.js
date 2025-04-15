import bcrypt from 'bcryptjs';

// In a real application, you would use a database
// This is a simple in-memory store for demonstration
const users = [
  {
    username: 'admin',
    // This is the hashed version of 'admin123'
    passwordHash: '$2a$10$rBSGqKRKN1Yd1C1Zqh.Uf.d9ZHFg3l3J6Z.rU0iJxlxS7IVpb5Eni'
  },
  {
    username: 'demo',
    // This is the hashed version of 'demo123'
    passwordHash: '$2a$10$xLCNGOr5K8oCmVvKUJWMJeYk3RfXlAZQNBWXFEYnzI5dPZ1CvNM5e'
  }
];

// Helper function to find a user
function findUser(username) {
  return users.find(user => user.username === username);
}

// Main handler function
export async function handler(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
      headers: {
        'Allow': 'POST'
      }
    };
  }

  try {
    // Parse the request body
    const data = JSON.parse(event.body);
    const { username, password, action } = data;

    // Validate input
    if (!username || (!password && action !== 'verify')) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          success: false, 
          message: 'Username and password are required' 
        })
      };
    }

    // Handle different actions
    switch (action) {
      case 'login':
        return await handleLogin(username, password);
      
      case 'register':
        return await handleRegister(username, password);
      
      case 'verify':
        return await handleVerify(username);
        
      default:
        return await handleLogin(username, password);
    }
  } catch (error) {
    console.error('Authentication error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        success: false, 
        message: 'Internal server error' 
      })
    };
  }
}

// Handle login requests
async function handleLogin(username, password) {
  // Find the user
  const user = findUser(username);
  
  // If user doesn't exist
  if (!user) {
    return {
      statusCode: 401,
      body: JSON.stringify({ 
        success: false, 
        message: 'Invalid username or password' 
      })
    };
  }
  
  // Compare passwords
  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  
  if (!passwordMatch) {
    return {
      statusCode: 401,
      body: JSON.stringify({ 
        success: false, 
        message: 'Invalid username or password' 
      })
    };
  }
  
  // Success - in a real app, you might generate a JWT token here
  return {
    statusCode: 200,
    body: JSON.stringify({ 
      success: true, 
      message: 'Authentication successful',
      user: {
        username: user.username
        // Don't include the password hash in the response!
      }
    })
  };
}

// Handle registration requests
async function handleRegister(username, password) {
  // Check if username already exists
  if (findUser(username)) {
    return {
      statusCode: 409,
      body: JSON.stringify({ 
        success: false, 
        message: 'Username already exists' 
      })
    };
  }
  
  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  
  // Store the new user (in a real app, this would go to a database)
  users.push({
    username,
    passwordHash
  });
  
  return {
    statusCode: 201,
    body: JSON.stringify({ 
      success: true, 
      message: 'User registered successfully' 
    })
  };
}

// Handle token verification
async function handleVerify(username) {
  // In a real app, this would verify a JWT token
  // For this demo, we just check if the username exists
  const user = findUser(username);
  
  if (user) {
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: 'User verified',
        user: {
          username: user.username
        }
      })
    };
  } else {
    return {
      statusCode: 401,
      body: JSON.stringify({ 
        success: false, 
        message: 'Invalid user' 
      })
    };
  }
}