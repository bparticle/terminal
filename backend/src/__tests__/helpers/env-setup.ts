// This file runs before test modules are loaded (via jest setupFiles).
// Sets environment variables needed before config/constants.ts is imported.
process.env.NODE_ENV = 'development';
process.env.PORT = '0';
