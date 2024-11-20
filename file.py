from flask import Flask, request, jsonify
from flask_cors import CORS 
import os
from werkzeug.utils import secure_filename

# Configuración
UPLOAD_FOLDER = '//sc014/TEST/GV/'
ALLOWED_EXTENSIONS = { 'jpg', 'jpeg', 'png'}

app = Flask(__name__)
# Habilitar CORS para todas las rutas
CORS(app)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Función para verificar las extensiones permitidas
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)  # Se asegura de que el nombre sea seguro
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)

        # Mover el archivo al directorio de destino
        file.save(filepath)

        # Aquí puedes realizar más acciones, como devolver la ruta del archivo o el nombre
        return jsonify({'filename': filename, 'filepath': filepath}), 200
    
    return jsonify({'error': 'File not allowed'}), 400

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
