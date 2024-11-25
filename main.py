from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware  # Importamos CORSMiddleware desde FastAPI
from fastapi.responses import JSONResponse
from smb.SMBConnection import SMBConnection
from io import BytesIO
import os
from pathlib import Path
from datetime import datetime

# Configuración
#UPLOAD_FOLDER = Path("//Sc014/TEST/GV")
UPLOAD_FOLDER = Path("//10.10.0.239/Fotos")
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png'}

app = FastAPI()

origins = ["*"]
methods=["POST"]
headers=["*"]

# Agregar CORS middleware de FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permitir todos los orígenes durante el desarrollo (o ajustarlo a dominios específicos)
    allow_credentials=True,
    allow_methods=["POST"],  # Permitir todos los métodos (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Permitir todos los encabezados
)

# Función para verificar extensiones permitidas
def allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    # Verificar si el archivo tiene una extensión permitida
    if not allowed_file(file.filename):
        raise HTTPException(status_code=400, detail="File type not allowed")
    
    # Extraer el nombre base del archivo y su extensión
    filename = os.path.basename(file.filename)
    base_name, extension = os.path.splitext(filename)

    # Reemplazar espacios en el nombre del archivo
    #safe_base_name = base_name.replace(" ", "_")
    
    # Obtener la fecha y hora actuales
    current_datetime = datetime.now().strftime("%d%m%Y%H%M")
    
    # Concatenar fecha y hora al nombre del archivo
    new_filename = "{safe_base_name}_{current_datetime}{extension}"
    filepath = UPLOAD_FOLDER / new_filename
    
    try:
        # Guardar el archivo en el sistema
        with open(filepath, "wb") as f:
            f.write(await file.read())

        return JSONResponse(content={
            "filename": new_filename,
            "filepath": str(filepath)
        }, status_code=200)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving file: {str(e)}")

# Inicia el servidor
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)