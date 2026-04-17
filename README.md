# 🤖 Bot de Discord — Node.js

Bot de roleplay con DNI, licencias, vehículos, patentes, moderación y formularios.

## Comandos

### Prefijo `!`
| Comando | Descripción |
|---|---|
| `!say <mensaje>` | Envía embed de normativas |
| `!msg <mensaje>` | Envía mensaje normal |
| `!limpiar [n]` | Borra hasta 100 mensajes |
| `!info` | Info del bot |
| `!registrarpatente <nom> <pat> <tipo>` | Registrar patente |
| `!verpatente` | Ver tu patente |
| `!registrarvehiculo <prop> <marca> <año> <modelo> <tipo> <patente>` | Registrar vehículo |
| `!vervehiculo` | Ver tu vehículo |

### Slash `/`
| Comando | Descripción |
|---|---|
| `/estadisticas` | Stats del servidor |
| `/perfil [usuario]` | Ver perfil |
| `/roblox <usuario>` | Info de Roblox |
| `/creardni` | Crear DNI |
| `/ver-dni` | Ver tu DNI |
| `/eliminardni` | Eliminar tu DNI |
| `/crearlicencia` | Crear licencia |
| `/ver-licencia` | Ver tu licencia |
| `/eliminarlicencia` | Eliminar licencia |
| `/warns [usuario]` | Ver warns (admin) |
| `/ban <usuario>` | Banear (admin) |
| `/crearformulario` | Crear formulario (dueño) |
| `/borrarformulario` | Borrar formulario (dueño) |
| `/verrespuestas` | Ver respuestas (dueño) |

## Setup local

```bash
npm install
cp .env.example .env
# Editar .env con tu TOKEN y CLIENT_ID
npm start
```

## Deploy en Render

1. Subir a GitHub
2. Crear nuevo **Web Service** en Render
3. Build command: `npm install`
4. Start command: `npm start`
5. Agregar variables de entorno: `TOKEN` y `CLIENT_ID`
