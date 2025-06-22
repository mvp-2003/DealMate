# Multi-stage build for Python AI Service
FROM python:3.11-slim as builder

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Production stage
FROM python:3.11-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd --create-home --shell /bin/bash dealpal

# Set working directory
WORKDIR /app

# Copy Python packages from builder stage
COPY --from=builder /root/.local /home/dealpal/.local

# Copy application code
COPY . .

# Change ownership to dealpal user
RUN chown -R dealpal:dealpal /app

# Switch to dealpal user
USER dealpal

# Add local packages to PATH
ENV PATH=/home/dealpal/.local/bin:$PATH

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8001/health')"

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
