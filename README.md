# 🚀 Tanner Terminal APK Build

## Quick Build (Recommended)

```bash
bash build.sh
```

That's it.

- ✅ No setup required if Docker is installed
- ✅ Works on Mac / Linux / Windows (via WSL or Git Bash)

---

## Output

After build completes:

```
🎉 BUILD SUCCESS
📱 APK Location:
./path/to/app-debug.apk
```

Transfer that APK to your phone/tablet and install.

---

## Advanced (Local Build)

Only use if you already have:
- Java installed
- Android SDK configured

```bash
bash build-local.sh
```

---

## Troubleshooting

- **Docker not found** → Install from https://docs.docker.com/get-docker/
- **Docker not running** → Start Docker Desktop and retry
- **APK not found** → Check Docker logs for build errors
