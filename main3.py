from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from smb.SMBConnection import SMBConnection
from io import BytesIO
import os
from pathlib import Path
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware

# Configuración FastAPI
app = FastAPI()

# Configuración de CORS (opcional, si se necesita habilitar el acceso desde diferentes orígenes)
origins = ["*"]
methods = ["POST"]
headers = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=methods,
    allow_headers=headers,
)

# Configuración de SMB
UPLOAD_FOLDER = Path("//10.10.0.239/Fotos")
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png'}

def connect_to_smb_server(server, username, password):
    """Configura la conexión SMB utilizando pysmb"""
    try:
        conn = SMBConnection(username, password, "client_machine", server, use_ntlm_v2=True)
        connected = conn.connect(server, 445)
        if not connected:
            raise HTTPException(status_code=500, detail="No se pudo conectar al servidor SMB")
        print("Conexión establecida al servidor SMB.")
        return conn
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al conectar con el servidor SMB: {e}")

# Función para escribir en el servidor SMB
def upload_to_smb(file_data, filename, server, share_name, username, password):
    conn = None
    try:
        # Conectar al servidor SMB
        conn = connect_to_smb_server(server, username, password)

        # Transformar file_data en un objeto de flujo binario
        file_like = BytesIO(file_data)

        # Subir archivo al recurso compartido SMB
        conn.storeFile(share_name, filename, file_like)
        print(f"Archivo '{filename}' subido exitosamente al servidor SMB.")
    except Exception as e:
        if "C0000022" in str(e):
            raise HTTPException(status_code=403, detail="Permiso denegado para escribir en el recurso compartido SMB.")
        raise HTTPException(status_code=500, detail=f"Error al subir el archivo: {e}")
    finally:
        if conn:
            conn.close()

# Función para verificar extensiones permitidas
def allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    # Verificar si el archivo tiene una extensión permitida
    if not allowed_file(file.filename):
        raise HTTPException(status_code=400, detail="Tipo de archivo no permitido")
    
    # Extraer el nombre base del archivo y su extensión
    filename = os.path.basename(file.filename)
    base_name, extension = os.path.splitext(filename)

    # Obtener la fecha y hora actuales
    current_datetime = datetime.now().strftime("%d%m%Y%H%M")
    
    # Concatenar fecha y hora al nombre del archivo
    new_filename = f"{base_name}_{current_datetime}{extension}"

    # Parámetros para la conexión SMB
    server = "10.10.0.239"  # Dirección del servidor SMB
    share_name = "fotos"    # Nombre del recurso compartido en el servidor
    username = "derroche"    # Nombre de usuario
    password = "nKVHB4m1S3"    # Contraseña

    try:
        # Leer el contenido del archivo
        file_data = await file.read()

        # Subir archivo al servidor SMB
        upload_to_smb(file_data, new_filename, server, share_name, username, password)

        return JSONResponse(content={
            "filename": new_filename,
            "message": "Archivo subido exitosamente"
        }, status_code=200)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en el procesamiento del archivo: {e}")

# Inicia el servidor FastAPI
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)