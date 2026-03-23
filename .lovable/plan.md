

## Fix Broken CI Workflows

The current `.github/workflows/deno.yml` is malformed — it contains two workflows (Android APK + Deno) merged into one file with corrupted content in the artifact path line.

### Changes

1. **Delete** `.github/workflows/deno.yml` (the malformed combined file)

2. **Create** `.github/workflows/android-apk.yml` — clean Android APK build workflow with:
   - Triggers: `workflow_dispatch` + push to main
   - Concurrency group to cancel stale runs
   - Minimal `contents: read` permissions
   - Correct artifact upload path

3. **Create** `.github/workflows/deno.yml` — clean Deno lint/test workflow with:
   - Triggers: push + PR to main
   - Concurrency group
   - Minimal permissions
   - Pinned `setup-deno` action hash

Both files match the exact YAML provided in the user's message. No other files are affected.

