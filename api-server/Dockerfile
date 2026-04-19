#base image
FROM python:3.11-slim

# Install system dependencies for InspireFace.
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# mkdir /app && cd /app    
WORKDIR /app

# install required python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# copy everything else
COPY . .

EXPOSE 8000