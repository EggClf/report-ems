#!/bin/bash
# Startup script for EMS ML Backend

echo "========================================="
echo "EMS ML Prediction API Startup"
echo "========================================="
echo ""

# Check if models exist
if [ ! -f "es_model.pkl" ] || [ ! -f "mro_model.pkl" ]; then
    echo "⚠  Models not found. Generating models..."
    python create_models.py
    echo ""
fi

# Check if dependencies are installed
python -c "import fastapi" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "⚠  FastAPI not installed. Installing dependencies..."
    pip install -r requirements.txt
    echo ""
fi

echo "🚀 Starting API server..."
echo "   URL: http://172.16.28.63:8181"
echo "   Docs: http://172.16.28.63:8181/docs"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start the server
python main.py
