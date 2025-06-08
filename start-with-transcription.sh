#!/bin/bash

# Startup script to run LibreChat with background transcription
# Usage: ./start-with-transcription.sh

echo "🚀 Starting LibreChat with Background Transcription..."

# Check if Redis is configured
if [ "$USE_REDIS" != "true" ]; then
    echo "⚠️  Warning: USE_REDIS is not set to 'true'. Background transcription will be disabled."
fi

# Check if OpenAI API key is configured
if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  Warning: OPENAI_API_KEY not configured. Background transcription will be disabled."
fi

# Function to cleanup background processes
cleanup() {
    echo "🛑 Shutting down..."
    kill $WORKER_PID 2>/dev/null
    kill $SERVER_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start the transcription worker in background
echo "📝 Starting transcription worker..."
cd api && node server/simple-transcription-worker.js &
WORKER_PID=$!
cd ..

# Wait a moment for worker to initialize
sleep 2

# Start the main server
echo "🌐 Starting main server..."
cd api && node server/index.js &
SERVER_PID=$!
cd ..

echo "✅ LibreChat started!"
echo "   - Main server: http://localhost:${PORT:-3080}"
echo "   - Transcription worker PID: $WORKER_PID"
echo "   - Main server PID: $SERVER_PID"
echo ""
echo "Press Ctrl+C to stop both processes"

# Wait for both processes
wait $SERVER_PID $WORKER_PID 