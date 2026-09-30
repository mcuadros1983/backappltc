# Integración ARCA: primera etapa

Implementación sobre `mcuadros1983/backappltc`, commit base `d216a66`.

Esta etapa implementa configuración por empresa/ambiente, autenticación WSAA
para el servicio `wslsp` y consultas del sector pecuario. La emisión fiscal y
la integración con Hacienda, IVA y pagos quedan para la siguiente etapa.

## Instalación

El ZIP contiene los archivos nuevos y las versiones modificadas de
`routes/indexRoute.js`, `models/index.js`, `boot/auditHooks.js`, `package.json`,
`package-lock.json` y `.gitignore`. Incluye también `cambios.patch` para revisar
o aplicar el cambio con Git.

Si tu backend avanzó desde `d216a66`, aplicá el patch comprobando primero
`git apply --check cambios.patch`; evitá reemplazar completos los archivos
compartidos, porque podrías perder cambios posteriores. El patch se aplica
desde la raíz del backend con `git apply cambios.patch`.

Requisitos del módulo: Node.js 18 o superior, PostgreSQL y OpenSSL disponible
como `openssl` en PATH. En Windows debe estar instalado y en PATH; en Railway
debe estar presente en la imagen utilizada por el backend.

```bash
npm install
openssl version
npm run test:arca
```

Los modelos nuevos se importan en `models/index.js`. El arranque actual del ERP
llama `modelo.sync()` y crea las tablas `arca_configuracion` y `arca_ticket`.
No se agregan columnas a las tablas de Hacienda, Empresa o ComprobanteEgreso.
La configuración tiene una relación con Empresa y un índice único por
`empresa_id + ambiente`.

No se ejecutó el backend completo ni se modificó una base real en esta revisión.

## Credenciales en el servidor

Cada configuración apunta a una referencia, por ejemplo `ELMANGO_HOMO`.
Las claves y certificados se instalan exclusivamente en el servidor y no se
envían a través de los endpoints de configuración.

Para archivos locales:

```dotenv
ARCA_ELMANGO_HOMO_CERT_PATH=/ruta/privada/certificado-homologacion.pem
ARCA_ELMANGO_HOMO_KEY_PATH=/ruta/privada/clave-homologacion.pem
ARCA_TIMEOUT_MS=30000
```

Para Railway se puede utilizar el contenido completo PEM en variables secretas:

```dotenv
ARCA_ELMANGO_HOMO_CERT_PEM="CONTENIDO COMPLETO DEL CERTIFICADO PEM"
ARCA_ELMANGO_HOMO_KEY_PEM="CONTENIDO COMPLETO DE LA CLAVE PEM"
```

Los valores PEM admiten saltos reales o `\n` literales. Usá una sola fuente
por certificado/clave: `PEM` o `PATH`. Si la clave tiene contraseña, agregá
`ARCA_ELMANGO_HOMO_KEY_PASSPHRASE`.

Generá una clave de cifrado independiente para la caché de tickets:

```bash
openssl rand -base64 32
```

Guardá el resultado en la variable secreta `ARCA_TICKET_ENCRYPTION_KEY`.
Debe conservarse entre reinicios y ser idéntica en todas las réplicas del mismo
backend. No la publiques en GitHub. Los tickets se guardan cifrados con
AES-256-GCM en PostgreSQL, separados por certificado, ambiente y servicio.

La referencia de producción debe tener sus propias variables, por ejemplo
`ELMANGO_PROD`. Las consultas de producción requieren además
`ARCA_ALLOW_PRODUCTION_QUERIES=true`. Por defecto se utiliza homologación.
Esta variable no incorpora una ruta de emisión fiscal.

## Habilitación en ARCA

El certificado debe estar habilitado para consumir WSLSP y representar el CUIT
de la Empresa. La validación local comprueba formato, vigencia y correspondencia
entre certificado y clave; ARCA valida la habilitación efectiva.

Verificá el CUIT cargado en Empresa, incluyendo su dígito verificador. El CUIT
del emisor y el CUIT del autorizado de una liquidación son datos diferentes.

El número de punto de venta es el código fiscal, no el ID interno de PtoVenta.
`00011` se guarda como `11`. Configurarlo no implica que esté habilitado en ARCA:
verificalo mediante la consulta de puntos de venta.

## Permisos y sesión

Las rutas se montan después de `JWTAuth` y `attachPermissions`; utilizan la
cookie de sesión `jwtToken` ya existente en el ERP.

- `arca.consultar`: disponibilidad, autenticación y consultas.
- `arca.configurar`: leer y modificar la configuración.
- El administrador conserva el bypass por rol 1 o `admin.all` del middleware.

Estos permisos siguen el esquema global actual del ERP: permiten operar sobre
las empresas indicadas en la URL. No agregan un nuevo filtro de pertenencia por
empresa. Si se habilitan para usuarios no administradores, asignarlos teniendo
en cuenta ese alcance.

## Endpoints

La base habitual de desarrollo es `http://localhost:5000`. Todas las rutas de
consulta admiten `?ambiente=homologacion`; si se omite, ese es el valor utilizado.

| Método | Ruta | Función |
|---|---|---|
| GET | `/arca/estado` | Estado real WSLSP mediante dummy; no requiere certificado |
| GET | `/arca/empresas/:id/configuracion/:ambiente` | Leer configuración |
| PUT | `/arca/empresas/:id/configuracion/:ambiente` | Crear o actualizar configuración |
| POST | `/arca/empresas/:id/autenticacion` | Obtener/reutilizar ticket; devuelve solo diagnóstico |
| GET | `/arca/empresas/:id/puntos-venta` | Puntos de venta disponibles para el CUIT |
| GET | `/arca/empresas/:id/catalogos/:catalogo` | Catálogos oficiales |
| GET | `/arca/empresas/:id/localidades?provincia=3` | Localidades por código de provincia |
| GET | `/arca/empresas/:id/categorias-por-motivo?especie=1&motivo=CODIGO` | Categorías según especie y motivo |
| GET | `/arca/empresas/:id/ultimo-comprobante?punto_venta=11&tipo_comprobante=CODIGO` | Último y siguiente número |

Los códigos de tipo de comprobante, especie y motivo se obtienen de los
catálogos oficiales. La consulta del siguiente número es informativa: no lo
reserva y todavía no puede usarse como control de concurrencia de una emisión.
Si se omite `punto_venta`, utiliza el valor guardado en la configuración.

Catálogos disponibles: `provincias`, `operaciones`, `tipos-comprobante`,
`tipos-liquidacion`, `caracteres`, `categorias`, `motivos`, `razas`, `cortes`,
`gastos` y `tributos`. Los grupos se mantienen separados según la respuesta
oficial, incluyendo bovinos, porcinos y avícolas cuando corresponda.

## Secuencia inicial de prueba

1. Iniciá sesión como administrador en el ERP y utilizá esa misma sesión en
   Postman o en el cliente HTTP que se conecte al backend.
2. Consultá `GET /arca/estado`.
3. Instalá las variables secretas y el certificado de homologación habilitado.
4. Enviá `PUT /arca/empresas/ID_REAL/configuracion/homologacion`:

```json
{
  "credenciales_ref": "ELMANGO_HOMO",
  "punto_venta": 11,
  "activa": true
}
```

5. Enviá `POST /arca/empresas/ID_REAL/autenticacion` sin cuerpo. La respuesta
   devuelve `autenticado`, ambiente, servicio y fechas de vencimiento, nunca
   `token` o `sign`.
6. Consultá puntos de venta, tipos de comprobante, operaciones, caracteres,
   razas y categorías. Guardá los códigos que correspondan al caso real.
7. Consultá el último comprobante para el tipo fiscal elegido.

Una configuración inactiva (`activa: false`) puede guardarse antes de instalar
las credenciales. Activarla exige credenciales locales válidas y clave de
cifrado, pero no solicita tickets ni comprueba la habilitación remota.

## Tickets y errores

La renovación se realiza al vencimiento. Un lock transaccional de PostgreSQL
serializa el acceso por certificado/ambiente/servicio entre réplicas. Una segunda
instancia recupera el ticket cifrado guardado por la primera. Los tickets no se
copian a la auditoría general del ERP y los errores HTTP no exponen XML ni claves.

Si WSAA informa `alreadyAuthenticated`, puede existir un ticket emitido desde
otra aplicación o un ticket que no llegó a guardarse después de su emisión.
No se reintenta en bucle: debe recuperarse ese ticket o esperar su vencimiento.

Los errores incluyen un `codigo` local y, cuando corresponde, códigos remotos
acotados. No se devuelven descripciones remotas completas porque pueden incluir
contenido de la solicitud. Verificá certificado, permisos, CUIT y parámetros
contra los manuales. Sincronizá correctamente la hora del servidor.

## Validación realizada

- `npm run test:arca`: 26 pruebas aprobadas.
- Firma CMS real con certificado de prueba y verificación criptográfica con OpenSSL.
- Tickets cifrados, vencimiento, reutilización y concurrencia con almacenamiento simulado.
- Rutas HTTP locales: autenticación, permisos y sanitización de errores.
- Consultas SOAP con respuestas simuladas y comprobación de operaciones contra
  los WSDL oficiales incluidos como fixtures.
- Consulta real `dummy` de homologación el 29/09/2026: `appserver`, `authserver`
  y `dbserver` respondieron `OK`.
- El checker general `npm run check:imports` reporta los mismos 9 hallazgos que
  el commit base; incluye imports comentados y archivos de copia. No apareció
  un hallazgo nuevo por ARCA. Esta revisión no corrige ese checker.

Falta probar WSAA y consultas autenticadas con tu certificado habilitado, y
verificar la caché contra PostgreSQL real. No se solicitaron CAE ni se emitieron
liquidaciones reales.

## Fuentes oficiales verificadas

- Manual WSLSP 2.0.6 (23/06/2026):
  https://www.afip.gov.ar/ws/WSLSP/manual_wslsp_2.0.6.pdf
- WSDL WSLSP homologación:
  https://fwshomo.afip.gov.ar/wslsp/LspService?wsdl
- WSDL WSAA homologación:
  https://wsaahomo.afip.gov.ar/ws/services/LoginCms?wsdl
- Especificación técnica WSAA:
  https://www.afip.gob.ar/ws/WSAA/Especificacion_Tecnica_WSAA_1.2.2.pdf

Los fixtures WSDL se descargaron de esos endpoints el 29/09/2026. Los tests se
ejecutan sin consultar ARCA y sin conectarse a tu base de datos.
