from python:3.8

workdir /app
copy monitor/requirements.txt .
run pip install -r requirements.txt
copy monitor/ .
cmd ["python3", "main.py"]
