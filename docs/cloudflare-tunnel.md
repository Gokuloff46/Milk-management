Cloudflare Tunnel + Docker (frontend, backend, database)

Goal
- Expose frontend, backend and optionally a database using Cloudflare Tunnel (outbound-only), while running the app with Docker Compose.
- Provide three reachable endpoints (subdomains) — one each for frontend, backend, and DB management — while keeping the DB locked down.

Key points and recommendations
- Prefer not to expose raw MongoDB directly via Cloudflare Tunnel as an open public TCP port. Instead:
  - Use an internal admin/management HTTP endpoint (with strong auth) that proxies selected DB actions.
  - Or require Cloudflare Access / Zero Trust policies for the DB hostname to restrict who can reach it.
- Cloudflare Tunnel creates an outbound connection from your host/container to Cloudflare; Cloudflare then routes incoming traffic to your tunnel according to `ingress` rules.

Files added
- `docker-compose.yml` — added a `cloudflared` service that reads `./cloudflared/config.yml`.
- `cloudflared/config.yml` — example ingress mapping (replace hostnames and tunnel id/credentials).

Quick start (local testing)
1. Install `cloudflared` locally and authenticate with your Cloudflare account.
   - https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation

2. Create a tunnel (on your dev machine) and copy the credentials into the repo folder:
   ```powershell
   # create tunnel and download credentials
   cloudflared tunnel create my-milk-tunnel
   # this prints a tunnel ID; copy the generated JSON to ./cloudflared/<tunnel-id>.json
   ```

3. Edit `cloudflared/config.yml`:
   - Replace `TUNNEL-UUID-GOES-HERE` with the tunnel id (or use the generated filename's id).
   - Replace `frontend.example.com` and `api.example.com` with real hostnames in your Cloudflare zone, or use temporary hosts.

4. Start Docker Compose:
   ```powershell
   # from repository root
   docker compose up --build
   ```

5. Create DNS records in your Cloudflare dashboard for the hostnames and set them to "Managed by Cloudflare Tunnel" (or follow the Cloudflare UI to connect the ingress).

6. Security (recommended):
   - Protect the `api.example.com` ingress path with Cloudflare Access (require login / SSO) and issue a client certificate for any management proxy.
   - Do NOT expose MongoDB without strict Access rules; prefer an internal-only management API.
   - Store secrets (Mongo credentials, tunnel credentials) using Docker secrets or your cloud's secret manager.

Testing endpoints
- Frontend should be visible at https://frontend.example.com
- Backend at https://api.example.com (use Postman / curl to test)

If you want, I can:
- Edit `server` to add an optional lightweight management proxy (HTTP) that forwards limited DB operations behind basic auth.
- Help you create Cloudflare Access policies for the subdomains.
- Walk you through generating the tunnel credentials and wiring them into the `cloudflared` service (I can run commands if you permit terminal actions).

