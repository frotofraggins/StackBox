const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
};

exports.handler = async (event) => {
  try {
    const { httpMethod, path, body } = event;
    const pathParts = path.split('/').filter(p => p);
    const action = pathParts[pathParts.length - 1];

    if (httpMethod === 'OPTIONS') {
      return { statusCode: 200, headers };
    }

    const requestBody = body ? JSON.parse(body) : {};

    switch (action) {
      case 'login':
        return await handleLogin(requestBody);
      case 'register':
        return await handleRegister(requestBody);
      case 'verify':
        return await handleVerify(event.headers.Authorization);
      default:
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Endpoint not found' })
        };
    }
  } catch (error) {
    console.error('Auth error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

async function handleLogin({ email, password }) {
  try {
    const result = await docClient.send(new GetCommand({
      TableName: process.env.USERS_TABLE,
      IndexName: 'EmailIndex',
      Key: { email }
    }));

    if (!result.Item) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid credentials' })
      };
    }

    const user = result.Item;
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid credentials' })
      };
    }

    const token = jwt.sign(
      { userId: user.userId, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        token,
        user: {
          userId: user.userId,
          email: user.email,
          name: user.name
        }
      })
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Login failed' })
    };
  }
}

async function handleRegister({ email, password, name }) {
  try {
    // Check if user exists
    const existingUser = await docClient.send(new GetCommand({
      TableName: process.env.USERS_TABLE,
      IndexName: 'EmailIndex',
      Key: { email }
    }));

    if (existingUser.Item) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ error: 'User already exists' })
      };
    }

    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const passwordHash = await bcrypt.hash(password, 10);

    await docClient.send(new PutCommand({
      TableName: process.env.USERS_TABLE,
      Item: {
        userId,
        email,
        name,
        passwordHash,
        createdAt: new Date().toISOString(),
        subscription: 'trial'
      }
    }));

    const token = jwt.sign(
      { userId, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        token,
        user: { userId, email, name }
      })
    };
  } catch (error) {
    console.error('Register error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Registration failed' })
    };
  }
}

async function handleVerify(authHeader) {
  try {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'No token provided' })
      };
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ user: decoded })
    };
  } catch (error) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Invalid token' })
    };
  }
}
