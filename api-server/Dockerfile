#base image
FROM python:3.11-slim

# Install system dependencies for InspireFace.
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    libmagic1 \
    patchelf \
    binutils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# install required python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Clear executable-stack requirement on InspireFace native library
RUN LIB="/usr/local/lib/python3.11/site-packages/inspireface/modules/core/libs/linux/x64/libInspireFace.so" && \
    test -f "$LIB" && \
    patchelf --clear-execstack "$LIB" && \
    readelf -l "$LIB" | grep -A1 GNU_STACK || true

# copy everything else
COPY . .

EXPOSE 8000