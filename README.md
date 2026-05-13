# frontend-fittrack
# FitTrack API & Frontend 🏃‍♂️🔥

Sistema web desarrollado con arquitectura moderna basado en una API REST utilizando Node.js, Express y MySQL, acompañado de un frontend dinámico construido con EJS y Bootstrap.

El proyecto permite registrar, visualizar, editar y eliminar actividades físicas mediante una interfaz moderna y una comunicación cliente-servidor a través de una API RESTful.

---

# 📌 Descripción del Proyecto

FitTrack es una aplicación web enfocada en la gestión de actividades físicas y ejercicios.  
El sistema permite a los usuarios registrar entrenamientos, consultar estadísticas y administrar sus rutinas mediante operaciones CRUD completas.

La aplicación fue desarrollada utilizando:

- Backend separado del frontend
- API REST con Node.js y Express
- Base de datos MySQL
- Sequelize ORM
- Frontend con EJS y Bootstrap
- Autenticación mediante JWT
- Arquitectura escalable y organizada
- Despliegue en Render

---

# 🧱 Arquitectura del Proyecto

```bash
fittrack-project/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   └── app.js
│   │
│   ├── package.json
│   └── .env
│
└── frontend/
    ├── views/
    ├── public/
    ├── routes/
    ├── app.js
    └── package.json
```

---

# 🚀 Tecnologías Utilizadas

## Backend
- Node.js
- Express.js
- Sequelize ORM
- MySQL
- JWT Authentication
- dotenv

## Frontend
- EJS
- Bootstrap 5
- Axios

## Herramientas
- Git
- GitHub
- Render
- Postman
- Aiven MySQL

---

# ⚙️ Instalación del Proyecto

## 1. Clonar el repositorio

```bash
git clone https://github.com/TU-USUARIO/fittrack-project.git
```

---

## 2. Entrar al proyecto

```bash
cd fittrack-project
```

---

# 🔥 Configuración del Backend

## Entrar al backend

```bash
cd backend
```

---

## Instalar dependencias

```bash
npm install
```

---

## Crear archivo `.env`

Crear un archivo llamado `.env` en la raíz del backend:

```env
DB_NAME=tu_base_de_datos
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_HOST=tu_host
DB_PORT=tu_puerto

JWT_SECRET=secreto123
```

---

## Ejecutar backend

```bash
npm run dev
```

Servidor:

```bash
http://localhost:3000
```

---

# 🎨 Configuración del Frontend

## Entrar al frontend

```bash
cd frontend
```

---

## Instalar dependencias

```bash
npm install
```

---

## Ejecutar frontend

```bash
npm start
```

Frontend:

```bash
http://localhost:4000
```

---

# 🗄️ Base de Datos

La aplicación utiliza MySQL como base de datos relacional.

La conexión fue realizada mediante:
- Sequelize ORM
- Aiven Cloud Database

---

# 🔐 Autenticación

El sistema utiliza autenticación JWT para proteger rutas sensibles.

Las rutas protegidas requieren:

```http
Authorization: Bearer TOKEN
```

---

# 📡 Endpoints de la API

# 🔑 Autenticación

## Login

### POST `/auth/login`

### Request

```json
{
  "username": "jose"
}
```

### Response

```json
{
  "token": "JWT_TOKEN"
}
```

---

# 🏋️ Actividades

## Obtener todas las actividades

### GET `/activities`

---

## Obtener actividad por ID

### GET `/activities/:id`

---

## Crear actividad

### POST `/activities`

### Request

```json
{
  "type": "Running",
  "duration": 30,
  "calories": 250,
  "date": "2026-05-10",
  "notes": "Morning workout"
}
```

---

## Actualizar actividad

### PUT `/activities/:id`

---

## Eliminar actividad

### DELETE `/activities/:id`

---

# ✅ Funcionalidades Implementadas

- CRUD completo
- API REST
- Arquitectura MVC
- Middleware de autenticación
- Validación de datos
- Manejo de errores
- Frontend separado del backend
- Consumo de API
- Base de datos MySQL
- JWT Authentication
- Despliegue en Render

---

# 🧪 Pruebas del Proyecto

Las pruebas de endpoints fueron realizadas utilizando:
- Postman

Se validaron:
- Operaciones CRUD
- Tokens JWT
- Respuestas HTTP
- Validaciones
- Manejo de errores

---

# ☁️ Deploy

## Backend Render

```bash
https://tu-backend.onrender.com
```

---

## Frontend Render

```bash
https://tu-frontend.onrender.com
```

---

# 🐙 Repositorio GitHub

```bash
https://github.com/TU-USUARIO/fittrack-project
```

---

# 📌 Variables de Entorno

El proyecto utiliza variables de entorno para proteger información sensible.

Ejemplo:

```env
DB_NAME=
DB_USER=
DB_PASSWORD=
DB_HOST=
DB_PORT=
JWT_SECRET=
```

---

# 🧠 Aprendizajes Obtenidos

Durante el desarrollo de este proyecto se trabajaron conceptos fundamentales del desarrollo web moderno:

- Arquitectura cliente-servidor
- APIs RESTful
- Node.js y Express
- Sequelize ORM
- MySQL
- JWT Authentication
- Frontend dinámico con EJS
- Integración frontend-backend
- Despliegue en la nube
- Control de versiones con Git y GitHub

---

# 👨‍💻 Autor

Proyecto desarrollado por:

**José Pujols**  
Estudiante de Gestión Financiera y Auditoría  
PUCMM

---

# 📄 Licencia

Este proyecto fue desarrollado con fines académicos y educativos.
