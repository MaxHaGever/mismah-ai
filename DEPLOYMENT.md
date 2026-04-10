# Deploying To mismah.co.il On AWS

This project can be deployed cleanly on a single AWS EC2 instance with Docker Compose.

Recommended production shape:
- `https://mismah.co.il` serves the React frontend
- `https://mismah.co.il/api` proxies to the Express backend
- `https://mismah.co.il/uploads/...` serves generated PDFs and uploaded assets
- MongoDB runs in MongoDB Atlas

## Why this setup

It is the simplest production path that still gives you real AWS experience:
- EC2
- security groups
- DNS
- SSH
- Docker in production
- domain + HTTPS

It is also a good resume story because the app stays understandable.

## 1. Create infrastructure

Create:
- 1 AWS EC2 Ubuntu instance
- 1 Elastic IP for a stable public address
- 1 MongoDB Atlas cluster

Suggested EC2 starting size:
- `t3.small` or `t3.medium`

Security group:
- allow `22` from your IP
- allow `80` from anywhere
- allow `443` from anywhere

Do not expose `27017` publicly if you use Atlas.
Do not expose `5020` publicly in production.

## 2. Point your domain

Point `mismah.co.il` to the EC2 Elastic IP using your DNS provider.

Typical records:
- `A` record for `mismah.co.il`
- optional `A` record for `www.mismah.co.il`

If you want to manage DNS inside AWS, use Route 53.

## 3. Prepare the server

SSH into the server and install:

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg git
```

Install Docker:

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
```

Log out and back in after adding yourself to the Docker group.

## 4. Copy the app to EC2

Example:

```bash
git clone <your-repo-url>
cd pdf-ai-fullstack
```

## 5. Use production environment values

Create `backend/.env` on the server.

Suggested production values:

```env
PORT=5020
MONGODB_URI=<your-mongodb-atlas-uri>
JWT_SECRET=<a-new-long-random-secret>
FRONTEND_URL=https://mismah.co.il
NODE_ENV=production
OPENAI_API_KEY=<your-openai-api-key>
ADMIN_EMAILS=your@email.com
ALLOWED_ORIGIN=https://mismah.co.il

SMTP_HOST=<optional>
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<optional>
SMTP_PASS=<optional>
SMTP_FROM="Mismah <you@mismah.co.il>"
```

Frontend:
- for this single-domain deployment, set `VITE_API_URL=/api`
- leave `VITE_STATIC_URL` blank or unset so same-origin asset URLs are used

Root `.env` example:

```env
DEV_MODE=
NODE_ENV=production
FRONTEND_PORT=80
BACKEND_PORT=5020
VITE_API_URL=/api
```

Notes:
- In production, leave `DEV_MODE` blank
- With `VITE_API_URL=/api`, the frontend talks to the backend through Nginx on the same domain

## 6. Start the app

From the repo root:

```bash
docker compose up -d --build
```

At this point the app should be reachable on the server's public IP over HTTP.

## 7. Add HTTPS

Recommended approach:
- install Nginx on the EC2 host
- reverse proxy to the frontend container on port `80`
- use Certbot for Let's Encrypt

Install Nginx and Certbot:

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Basic host Nginx site config:

```nginx
server {
    server_name mismah.co.il www.mismah.co.il;

    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable it and reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Then request certificates:

```bash
sudo certbot --nginx -d mismah.co.il -d www.mismah.co.il
```

## 8. Verify production

Check:
- homepage loads
- register/login works
- first admin account works
- onboarding completes
- logo upload works
- leak PDF generation works
- generated PDFs open through `/uploads/...`

Health checks:
- `http://127.0.0.1:5020/health`
- `http://127.0.0.1:5020/api/health`

## 9. Recommended next improvements

Good next upgrades after the first deployment:
- move uploads to S3
- use Secrets Manager or SSM Parameter Store for secrets
- use CI/CD for deployment
- add monitoring/logging
- disable open registration if you want a more controlled demo

## AWS services you can truthfully mention on a resume after this

- EC2
- VPC security groups
- Route 53 if you move DNS there
- basic Linux server administration
- Docker-based deployment on AWS
- HTTPS/domain setup

If you also move uploads to S3 later, the story becomes even stronger.
