# The Winsome Illustration Library — FULL server for the team site.
# Node UI/API (library-server.mjs) + Python generation (make.py / modify.py with
# rembg), so Modify-with-AI works hosted, not just locally. Build context = this
# illustrations/ directory.
FROM node:20-slim

# Python + native libs rembg/onnxruntime need
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 python3-pip libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip3 install --no-cache-dir --break-system-packages -r requirements.txt

COPY . .

# Bake the rembg u2net model into the image so the first cutout isn't slow.
RUN python3 -c "from rembg import new_session; new_session('u2net')"

# Persistent disk gets mounted here; entrypoint seeds it from the baked assets
# on first boot, then it survives redeploys.
ENV PORT=4600 LIB_DIR=/data/generated
EXPOSE 4600
CMD ["bash", "entrypoint.sh"]
