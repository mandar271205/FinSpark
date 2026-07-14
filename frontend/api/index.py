from streamlit_vercel import StreamlitServer
import os
import sys

# Ensure the frontend directory is in the path
frontend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if frontend_dir not in sys.path:
    sys.path.insert(0, frontend_dir)

# Initialize the Streamlit Server wrapper
# Pointing it to the main app file
app_path = os.path.join(frontend_dir, "app.py")

# Create the WSGI/ASGI application wrapper for Vercel Serverless
app = StreamlitServer(app_path)

# Vercel looks for 'app' or handles requests via the object exposed here
