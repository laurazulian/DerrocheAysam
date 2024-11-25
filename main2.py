from smb.SMBConnection import SMBConnection
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from io import BytesIO

# Configuración FastAPI
app = FastAPI()

# Configuración SMB
def connect_to_smb_server(server, username, password):
    """Configura la conexión SMB utilizando pysmb"""
    try:
        # Crear la conexión SMB
        conn = SMBConnection(username, password, "client_machine", server, use_ntlm_v2=True)

        # Conectar al servidor SMB en el puerto 445
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

        # Subir archivo al recurso compartido
        conn.storeFile(share_name, filename, file_like)
        print(f"Archivo '{filename}' subido exitosamente al servidor SMB.")
    except Exception as e:
        if "C0000022" in str(e):
            raise HTTPException(status_code=403, detail="Permiso denegado para escribir en el recurso compartido SMB.")
        raise HTTPException(status_code=500, detail=f"Error al subir el archivo: {e}")
    finally:
        if conn:
            conn.close()

# Ruta para subir archivo
@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Leer contenido del archivo
        file_data = await file.read()
        filename = file.filename

        # Parámetros para la conexión SMB
        server = "10.10.0.239"  # Dirección del servidor SMB
        share_name = "fotos"    # Nombre del recurso compartido en el servidor
        username = "ejemplo"    # Nombre de usuario
        password = "ejemplo"    # Contraseña

        # Subir archivo al servidor SMB
        upload_to_smb(file_data, filename, server, share_name, username, password)

        return JSONResponse(content={"filename": filename, "message": "Archivo subido exitosamente"}, status_code=200)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en el procesamiento del archivo: {e}")

# Iniciar el servidor FastAPI
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
