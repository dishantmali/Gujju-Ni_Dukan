#!/usr/bin/env bash
set -o errexit

# Upgrade pip
python -m pip install --upgrade pip 

# Install all requirements (including the newly added django-resized)
pip install -r requirements.txt 

python manage.py collectstatic --no-input 
python manage.py migrate 

# Superuser creation (already handled in your script)
python manage.py createsuperuser --noinput || true 