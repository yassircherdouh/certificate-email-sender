## Certificates Email Sender

A small tool to generate and send event certificates (PDF or PNG attachments) by email.

**Requirements:** Node.js, [ImageMagick](https://imagemagick.org/) (for drawing names on certificate images). On some Linux installs the binary is `convert` instead of `magick` — set `MAGICK_CMD=convert` in `.env` if needed.

### Structure

- `events/`
  - `<EVENT>/`
    - `config.json` – per-event subjects, email subject lines, and certificate layout (font path, offsets, font size) per role
    - `data/` – JSON lists of people per role (`{ "name": "...", "email": "..." }`)
      - `participants.json`, `organizers.json`, `mentors.json`, `contributors.json`, `speakers.json`, ...
    - `templates/` – HTML email templates per role (use `{{fullname}}` for the recipient’s name)
      - `participants.html`, `organizers.html`, `mentors.html`, `contributors.html`, `speakers.html`, ...
    - `assets/` – base certificate image and optional font per role
      - `<role>.png` (e.g. `participants.png`, `mentors.png`) and optionally `.ttf`/`.otf` for that event
    - `certificates/<role>/` – generated certificate files (PDF or PNG)
- `src/`
  - `generate-certificates.js` – generate certificates for a given event and role (PDF by default)
  - `send-certificates.js` – send those certificates via SMTP (skips recipients without a generated file)
  - `smtp.js` – Nodemailer transport using SMTP credentials
  - `templates.js` – load and render HTML templates with `{{variables}}`
- `create-event.sh` – helper script to scaffold a new `events/<EVENT>` folder
- Root: `package.json`, `package-lock.json`, `.env`, `README.md`, `LICENSE`, `node_modules/`

Example events: `events/ETCODE3/`, `events/BitCamp4/`.

### Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment (`.env`):

```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=tech-community@ensia.edu.dz
EMAIL_PASSWORD=your_smtp_or_app_password
FROM_NAME=EventName - ETC
FROM_EMAIL=tech-community@ensia.edu.dz

# Optional certificate settings:
# CERT_OUTPUT_FORMAT=pdf   # or png (default: pdf)
# MAGICK_CMD=convert       # use if ImageMagick is installed as "convert" (e.g. on Ubuntu)
# CERT_FONT_PATH=/path/to/font.otf   # global font override; otherwise use config.json per role
```

3. Prepare the event folder (e.g. ETCODE3 or BitCamp4):

- Put base images per role in `events/<EVENT>/assets/<role>.png` (e.g. `participants.png`, `mentors.png`). The `<role>` must match the `--type` you use.
- Put optional fonts in the same `assets/` folder and set `certificate.<role>.fontPath` in `config.json` (e.g. `Satoshi-Regular.otf`). Non-absolute paths are resolved under `events/<EVENT>/assets/`.
- Edit `events/<EVENT>/templates/*.html` for email content; use `{{fullname}}` for the name.
- Edit `events/<EVENT>/data/*.json` to list recipients. Each file must be valid JSON (e.g. `[]` if empty).

### Usage

Generate certificates for an event and role (PDF by default; use `CERT_OUTPUT_FORMAT=png` or `--format=png` for PNG):

```bash
node src/generate-certificates.js --event=ETCODE3 --type=participants
node src/generate-certificates.js --event=BitCamp4 --type=mentors
```

Or use the npm scripts defined in `package.json` (e.g. for ETCODE3):

```bash
npm run generate:etcode3:participants
npm run generate:etcode3:organizers
```

Send certificates (uses existing PDF/PNG in `events/<EVENT>/certificates/<role>/`; skips recipients without a file):

```bash
node src/send-certificates.js --event=ETCODE3 --type=participants
node src/send-certificates.js --event=BitCamp4 --type=mentors
```

For any event and role, use `--event=<EVENT>` and `--type=<role>` where `<role>` matches a key in `config.json` and the presence of `data/<role>.json`, `templates/<role>.html`, and `assets/<role>.png`.

### Adding a new event

Use the helper script (run from the repo root):

```bash
chmod +x create-event.sh   # once, if needed
./create-event.sh MyEvent
```

This creates `events/MyEvent/` with:

- `config.json` (default subjects and certificate layout for participants & organizers)
- `data/participants.json` and `organizers.json` (empty `[]`)
- `templates/participants.html` and `organizers.html` (simple starter with `{{fullname}}`)
- `assets/` (empty; add your `<role>.png` and optional fonts)
- `certificates/participants/` and `certificates/organizers/`

Add more roles by creating `data/<role>.json`, `templates/<role>.html`, and `assets/<role>.png`, and optionally extending `config.json` with `subjects.<role>` and `certificate.<role>` (fontPath, xOffset, yOffset, fontSize).

Then run:

```bash
node src/generate-certificates.js --event=MyEvent --type=participants
node src/send-certificates.js --event=MyEvent --type=participants
```

You can add scripts for the new event in `package.json` if you like.
