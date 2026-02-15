# Raspberry Pi Scraper Worker Setup

This guide runs your Instagram scraper worker on a Raspberry Pi while your website stays deployed on Render.

## 1) What to transfer to the Pi

Simplest and safest: transfer the whole project (excluding `node_modules` and `dist`).

From your local machine:

```bash
rsync -avz --delete \
  --exclude node_modules \
  --exclude dist \
  --exclude .git \
  ./ pi@<PI_IP>:/home/pi/giveaway-engine/
```

If `rsync` is unavailable, copy the project folder manually with SCP/SFTP.

## 2) SSH into Pi

```bash
ssh pi@<PI_IP>
cd /home/pi/giveaway-engine
```

## 3) Install system dependencies

```bash
sudo apt update
sudo apt install -y ca-certificates curl git
sudo apt install -y chromium-browser || sudo apt install -y chromium
```

Install Node.js 20:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

## 4) Install app dependencies

```bash
cd /home/pi/giveaway-engine
npm install
```

## 5) Create worker env file

```bash
cp .env.pi.worker.example .env
nano .env
```

Set these values in `.env`:

- `SCRAPER_RELAY_SECRET` = same secret used by your Render server
- `SCRAPER_SERVER_URL` = `wss://pickusawinner.com`
- `INSTAGRAM_USERNAME` and `INSTAGRAM_PASSWORD`
- `SCRAPER_EXECUTABLE_PATH` = Chromium path on Pi

Find Chromium path:

```bash
which chromium-browser || which chromium
```

## 6) Test worker manually

```bash
cd /home/pi/giveaway-engine
npm run scraper:worker:pi
```

You should see:

- connected to `/ws/scraper`
- waiting for scrape requests

Press `Ctrl+C` to stop.

## 7) Run continuously (systemd)

Copy service file:

```bash
sudo cp deploy/raspberry-pi/pickusawinner-scraper-worker.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable pickusawinner-scraper-worker
sudo systemctl start pickusawinner-scraper-worker
```

Check status/logs:

```bash
sudo systemctl status pickusawinner-scraper-worker
journalctl -u pickusawinner-scraper-worker -f
```

## 8) Updating code later

After code changes, re-transfer files, then:

```bash
cd /home/pi/giveaway-engine
npm install
sudo systemctl restart pickusawinner-scraper-worker
```

## Troubleshooting

- Worker not connecting:
  - Verify `SCRAPER_RELAY_SECRET` exactly matches server secret.
  - Verify `SCRAPER_SERVER_URL` starts with `wss://`.
- Chromium launch fails:
  - Check `SCRAPER_EXECUTABLE_PATH` using `which chromium-browser` or `which chromium`.
- Instagram login issues:
  - Verify username/password in `.env`.
  - Run manually first (`npm run scraper:worker:pi`) to inspect logs.
