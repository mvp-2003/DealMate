#!/bin/bash

# Stop all services
echo "Stopping all services..."
lsof -ti:3000 | xargs kill -9
lsof -ti:8000 | xargs kill -9
lsof -ti:8001 | xargs kill -9

echo "All services stopped."
