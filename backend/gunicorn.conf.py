import os

bind = "0.0.0.0:" + os.getenv("PORT", "7860")
workers = 1
threads = 2
timeout = 120
accesslog = None
errorlog = "-"


def post_worker_init(worker):
    from server import app
    app.engine.warmup()
