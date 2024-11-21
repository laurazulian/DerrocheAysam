from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware  # Importamos CORSMiddleware desde FastAPI
from fastapi.responses import JSONResponse
import os
from pathlib import Path

# Configuración
UPLOAD_FOLDER = Path("//sc014/TEST/GV")
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png'}

app = FastAPI()

origins = [ "http://127.0.0.1:8000",
            "http://127.0.0.1:5500",
            "http://localhost",
            "http://localhost:8080",
        ]
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

# Función para verificar las extensiones permitidas
def allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if not allowed_file(file.filename):
        raise HTTPException(status_code=400, detail="File type not allowed")
    filename = os.path.basename(file.filename)
    safe_filename = os.path.splitext(filename)[0].replace(" ", "_") + os.path.splitext(filename)[1]
    filepath = UPLOAD_FOLDER / safe_filename

    try:
        with open(filepath, "wb") as f:
            f.write(await file.read())

        return JSONResponse(content={
            "filename": safe_filename,
            "filepath": str(filepath)
        }, status_code=200)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving file: {str(e)}")

# Inicia el servidor
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
