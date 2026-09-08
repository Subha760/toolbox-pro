FROM python:3.11-slim
ENV PYTHONUNBUFFERED=1 OMP_NUM_THREADS=2 U2NET_HOME=/opt/models PORT=7860
WORKDIR /app
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
RUN mkdir -p /opt/models && python -c "from rembg import new_session; new_session('birefnet-portrait', providers=['CPUExecutionProvider'])"
COPY backend/server.py backend/gunicorn.conf.py ./
USER 1000:1000
EXPOSE 7860
CMD ["gunicorn", "--config", "gunicorn.conf.py", "server:app"]
