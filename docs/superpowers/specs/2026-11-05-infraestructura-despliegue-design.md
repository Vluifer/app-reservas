# Infraestructura y despliegue de Morada — Diseño

> Fecha: 2026-11-05 · Estado: borrador, pendiente de aprobación del usuario
> Rama: `refactor/ddd-rediseno-ui` · Conversación iniciada el 2026-10-16 (mapa en
> `.superpowers/brainstorm/689-1792212017/content/mapa-infraestructura.html`)

## 1. Intención

Poner Morada en internet en `morada.<dominio>` con una infraestructura que el usuario **monte él mismo**,
entendiendo para qué sirve cada pieza. No es solo "desplegar esta app": es aprender una **receta
replicable** que pueda reutilizar en sus próximos proyectos, cada uno con su propia infraestructura y con
piezas opcionales según el proyecto.

Al principio habrá pocos usuarios y la app **no estará encendida siempre**: se enciende cuando el usuario
prueba o enseña la app y se apaga después. Por eso el diseño optimiza el costo con el servidor apagado.

**Éxito:**
- El usuario puede encender el servidor, abrir `https://morada.<dominio>` y usar la app con HTTPS.
- Un push a `main` verificado acaba desplegado sin pasos a mano.
- Puede destruir todo y recrearlo desde cero, restaurando los datos desde la copia en S3.
- Puede explicar con sus palabras qué hace cada pieza y por qué está.
- La factura con el servidor mayormente apagado ronda **2–4 USD/mes** (más el dominio, ~11 USD/año).

## 2. Cómo se trabaja (decidido por el usuario)

- **Claude explica cada pieza; el usuario escribe y ejecuta.** Claude no escribe por él los archivos de
  infraestructura (Dockerfile, Compose, Terraform, workflows, scripts). Claude revisa lo que él escribe,
  responde dudas y ayuda a depurar.
- Primero el mapa completo (ya visto y aprobado), luego pieza por pieza, en etapas.
- El plan de implementación es una **guía de aprendizaje por etapas**. Cada etapa tiene:
  qué es y por qué existe → lo que el usuario escribe/ejecuta → cómo comprobar que funciona →
  cuánto cuesta y cómo deshacerlo.
- Los cambios en el **código de la app** que la infraestructura necesite (p. ej. `output: 'standalone'`
  en `next.config.ts`) también los hace el usuario, guiado; son pocos y se señalan en su etapa.
- Los commits los hace el usuario.

## 3. Metas, no-metas y anti-metas

**Metas:** lo de la sección 1, con una única instancia de producción.

**No-metas (por ahora; quedan para después):**
- Entorno de staging.
- Logs centralizados (CloudWatch, Grafana): se usa `docker logs`.
- Alta disponibilidad, varios servidores, autoescalado.
- Mover las imágenes de Cloudinary a S3 (Cloudinary sigue como está).
- Correo saliente / notificaciones.

**Anti-metas (fracaso aunque "funcione"):**
- Facturas sorpresa: nada que cobre sin que el usuario lo sepa; alerta de presupuesto antes de crear nada.
- Servicios administrados caros de AWS: RDS, balanceadores (ALB/NLB), NAT Gateway, EKS/ECS, Elastic IP.
- Secretos dentro del repositorio o de la imagen Docker.
- Que Claude monte la infraestructura por él, o que quede una pieza que el usuario no entiende.
- Usar la cuenta root de AWS en el día a día o claves de acceso de larga duración en GitHub.

## 4. Restricciones

- Presupuesto ~10 USD/mes como techo (algo más es aceptable si el servidor queda encendido todo el mes).
- Proveedor: **AWS EC2** (elección del usuario).
- Dominio: el usuario comprará **uno personal** en **Cloudflare Registrar** para todos sus proyectos;
  cada proyecto usa un subdominio. Aún no tiene nombre: el documento usa `<dominio>`.
- Experiencia del usuario: SSH a Linux en AWS sí; GitHub Actions algo; Docker nada.
- Usuario en Windows 11 (necesitará Docker Desktop con WSL2 para las etapas locales).
- La app: Next.js 16 + Prisma 6 + PostgreSQL + Auth.js; subidas de hasta ~55 MB por formulario
  (`serverActions.bodySizeLimit`); imágenes en Cloudinary; tarea programada `GET /api/cron/expirar-reservas`
  con `Authorization: Bearer <CRON_SECRET>`. Variables: `DATABASE_URL`, `AUTH_SECRET`,
  `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CRON_SECRET`.
- Ver memoria del proyecto: el remoto `origin` respondía "Repository not found" (posible problema de
  credenciales por otra cuenta de GitHub abierta). Hay que resolverlo antes de la etapa de CI.

### Precios de referencia (us-east-1, de agregadores; confirmar en la calculadora de AWS en la etapa 0)

| Pieza | Precio | Con ~40 h/mes encendido | Encendido todo el mes |
|---|---|---|---|
| EC2 t4g.small | 0,0168 USD/h | ~0,7 USD | ~12,3 USD |
| IPv4 pública (sin Elastic IP) | 0,005 USD/h, solo encendido | ~0,2 USD | ~3,6 USD |
| Disco EBS gp3 20 GB | ~0,08 USD/GB-mes | ~1,6 USD | ~1,6 USD |
| S3 (copias + estado de Terraform) | céntimos | <0,1 USD | <0,1 USD |
| **Total** | | **~2,5 USD** | **~17,5 USD** |
| Dominio .com (Cloudflare) | ~10,5–11 USD/año | | |

Si el uso pasa a ser "encendido siempre", la salida prevista es bajar a **t4g.micro** (~6 USD/mes, 1 GB de
RAM, con swap); no se hace ahora.

## 5. Lo decidido del cómo (por el usuario)

- **Servidor:** una EC2 **t4g.small** (ARM, 2 GB) con **Ubuntu**, creada con **Terraform**.
- **IP sin Elastic IP:** el servidor recibe una IP pública nueva cada vez que arranca (gratis con el
  servidor apagado) y **un script actualiza el registro DNS en Cloudflare** para que
  `morada.<dominio>` apunte a la IP nueva. Motivo: ahorrar ~3,6 USD/mes.
- **En el servidor, Docker Compose** con: la app (Next en modo standalone), PostgreSQL, **Caddy** (HTTPS
  automático), un contenedor/tarea de **copias de la base a S3** y la **llamada periódica al cron**
  de expirar reservas.
- **La imagen se construye en GitHub Actions** y se publica en **GHCR**; el servidor pequeño no compila Next.
- **Dos workflows:** *verificar* en cada push (typecheck, lint, tests, build) y *desplegar* en `main`
  (imagen → GHCR → servidor descarga → migra → reinicia).
- **Alerta de presupuesto en AWS** antes de crear cualquier recurso.
- **Monitor externo de caída** y **vuelta atrás** a la imagen anterior.
- **Un solo entorno** (producción).
- El día a día: **apagar el servidor**; para practicar, **destruir y recrear** con restauración desde S3.

## 6. Etapas (el orden de la guía)

Cada etapa deja algo que funciona; el usuario puede parar después de cualquiera.

0. **Cuenta AWS segura:** usuario IAM / IAM Identity Center para el día a día, MFA en root y en su usuario,
   alerta de presupuesto, confirmar precios en la calculadora, elegir región.
1. **Docker en el PC:** instalar Docker Desktop; entender imagen/contenedor; `Dockerfile` multietapa de la
   app con `output: 'standalone'`; ejecutarla localmente contra la base de desarrollo.
2. **Compose local:** app + Postgres + Caddy (en local sin HTTPS real) + cron; migraciones con
   `prisma migrate deploy` dentro del stack; variables en un `.env` fuera del repo.
3. **Terraform:** bucket S3 para el estado; EC2, grupo de seguridad, rol IAM, bucket de copias.
   `plan`/`apply`/`destroy`. Instalar Docker en el servidor al arrancar (user data).
4. **Dominio y HTTPS:** comprar el dominio en Cloudflare, token de API limitado a la zona, script de
   actualización del DNS al arrancar, Caddy obteniendo el certificado.
5. **Primer despliegue a mano:** subir la imagen a GHCR desde el PC, entrar al servidor, levantar Compose,
   migrar, probar la app en `https://morada.<dominio>`.
6. **CI (verificar):** workflow de typecheck, lint, tests unitarios, tests de integración con un Postgres
   de servicio y build.
7. **CD (desplegar):** workflow que construye la imagen ARM, la publica en GHCR y la despliega en el servidor.
8. **Copias y restauración:** copias de la base a S3, retención, y un ensayo real: `destroy` → `apply` →
   restaurar → comprobar que los datos están.
9. **Vigilar y volver atrás:** monitor externo de caída; procedimiento para volver a la imagen anterior.

## 7. Decisiones de Claude (revisables por el usuario)

Estas no las decidió el usuario; son la propuesta de Claude para completar el diseño. Las marcadas con ⚠
cambian algo del mapa que el usuario vio.

- **Región us-east-1** (la más barata; latencia aceptable desde Colombia).
- ⚠ **El despliegue no usa SSH.** El mapa decía "SSH desde GitHub", pero el grupo de seguridad solo abre el
  puerto 22 a la IP del usuario, así que GitHub no podría entrar. En su lugar, GitHub se autentica en AWS
  con **OIDC** (sin claves guardadas) y ordena el despliegue al servidor con **AWS Systems Manager
  (Run Command)**. El usuario sigue entrando por SSH desde su IP para aprender y depurar.
- ⚠ **Los secretos de producción viven en AWS SSM Parameter Store** (SecureString, nivel estándar, gratis),
  no en GitHub Secrets: el servidor los lee al arrancar gracias a su rol IAM y genera el `.env` de Compose.
  Así los secretos sobreviven a un `destroy`/`apply` y GitHub no guarda ninguno (solo el ARN del rol, que
  no es secreto). Incluye el token de Cloudflare y el token de lectura de GHCR.
- **El script de DNS corre en el servidor** como servicio de arranque (systemd): lee su IP pública de los
  metadatos de la instancia y actualiza el registro A con la API de Cloudflare. Funciona igual se encienda
  el servidor desde la consola, la CLI o Terraform.
- **Terraform no gestiona el registro DNS** (lo gestiona el script); así no se pelean por la IP.
- **Registro DNS sin proxy de Cloudflare (nube gris), TTL 60 s**, y Caddy obtiene el certificado de
  Let's Encrypt de forma automática. Es lo más simple de entender. El volumen de datos de Caddy vive en el
  disco del servidor, así que apagar/encender no pide certificados nuevos.
- **El estado de Terraform en S3** con bloqueo nativo de S3 (`use_lockfile`, sin DynamoDB). El bucket del
  estado se crea una vez a mano (o con una mini-configuración aparte) para evitar el problema del huevo y
  la gallina.
- **Dos configuraciones de Terraform:** una *persistente* (bucket del estado, bucket de copias, parámetros
  de SSM, rol de OIDC para GitHub) que casi nunca se destruye, y una *servidor* (EC2, grupo de seguridad,
  rol de la instancia) que se puede destruir y recrear para practicar sin perder copias ni secretos.
  La restauración desde S3 es un script que el usuario ejecuta a mano (para que vea cada paso).
- **La IP del usuario para SSH es una variable de Terraform**, porque su IP de casa puede cambiar.
- **Disco gp3 de 20 GB**; Postgres guarda sus datos en un volumen Docker en ese disco.
- **Copias:** `pg_dump` comprimido a S3 una vez al día mientras el servidor está encendido, antes de cada
  despliegue y a demanda con un script; regla de ciclo de vida que borra copias de más de 30 días.
- **Cron de reservas:** una tarea en Compose llama a `/api/cron/expirar-reservas` cada 15 minutos con el
  `CRON_SECRET`. Con el servidor apagado no corre, y no importa: el dominio ya calcula el estado vigente
  por fechas.
- **Si el servidor está apagado al hacer push a `main`,** el workflow publica la imagen y **omite el
  despliegue** con un aviso (no falla). Al encender, el servidor arranca con la última imagen desplegada;
  para traer la nueva basta lanzar el workflow a mano (`workflow_dispatch`).
- **Imagen privada en GHCR**; el servidor la descarga con un token de solo lectura guardado en SSM.
- **Sin datos demo en producción** por defecto; el seed se puede correr a mano si el usuario lo quiere.
- **Monitor externo** (servicio gratuito, p. ej. UptimeRobot): se pausa cuando el servidor se apaga a
  propósito, para que no avise en falso.
- **Dónde vive la receta:** en este repo, en `infra/terraform/`, `infra/servidor/` (Compose, Caddyfile,
  scripts) y `.github/workflows/`, con un `infra/README.md` que explica qué cambiar para otro proyecto.

## 8. Lo que queda al constructor (quien escriba el plan)

- Versiones concretas (Ubuntu LTS, Postgres, Caddy, Terraform, acciones de GitHub).
- Cómo construir la imagen ARM (runner ARM nativo de GitHub si está disponible para el repo; si no,
  buildx con QEMU) y cómo meter el CLI de Prisma en la imagen para `migrate deploy`.
- El detalle de cada etapa: comandos, archivos, comprobaciones, y explicaciones al nivel del usuario.
- La forma exacta de los nombres de recursos, etiquetas y variables de Terraform.
- Cómo encender y apagar el servidor de forma cómoda (p. ej. un par de comandos documentados).
