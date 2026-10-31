import mongoose from 'mongoose';

/**
 * Validates that required environment variables are present before startup.
 */
const validateEnv = (): void => {
  const required = ['MONGODB_URI', 'JWT_SECRET'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`[Config] Missing required environment variables: ${missing.join(', ')}`);
    console.error('[Config] Copy server/.env.example to server/.env and fill in the values.');
    process.exit(1);
  }
};

/**
 * Connects to MongoDB using the MONGODB_URI environment variable.
 * Exits the process on failure so the server never starts in a broken state.
 */
const connectDB = async (): Promise<void> => {
  validateEnv();

  const uri = process.env.MONGODB_URI as string;

  try {
    const conn = await mongoose.connect(uri);
    console.log(`[Database] MongoDB connected: ${conn.connection.host}`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Database] Connection failed: ${message}`);
    process.exit(1);
  }
};

// Log connection events for observability
mongoose.connection.on('disconnected', () => {
  console.warn('[Database] MongoDB disconnected.');
});

mongoose.connection.on('reconnected', () => {
  console.log('[Database] MongoDB reconnected.');
});

export default connectDB;
