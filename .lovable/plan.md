

# Plan: Create Tanner Logo from Photo & Apply to Merch

## What We're Building
A professional logo based on the uploaded photo of Tanner (the fluffy red/brown doodle), then applying it across the merch store branding and regenerating product images with the new logo.

## Steps

### 1. Generate Tanner Logo
- Use AI image generation to create a clean, stylized logo from the uploaded dog photo
- Style: bold, modern brand mark — think clean vector-style illustration of Tanner's distinctive silhouette/face with the fluffy curly fur
- Generate variations: full logo (icon + "TANNER" wordmark) and icon-only version
- Save to `src/assets/merch/tanner-logo.png`

### 2. Update Merch Store Header
- Replace the generic ShoppingBag icon in MerchStore.tsx header with the new Tanner logo
- Use the logo as the brand identity throughout the store

### 3. Regenerate Product Images with Tanner Branding
- Regenerate all 15 product mockups using the Tanner dog logo/illustration as the brand mark on each product:
  - T-shirts, hoodies, caps with Tanner's face/silhouette printed on them
  - Dog accessories featuring the Tanner brand
  - Mugs, stickers with the logo
- Each product shot remains photorealistic lifestyle photography but now features the actual Tanner branding

### 4. Add Logo to Site Header
- Optionally add a small Tanner logo icon to the TerminalHeader for brand consistency

### Technical Details
- AI image generation via `google/gemini-3-pro-image-preview` for highest quality logo output
- Logo saved as PNG asset imported via ES6 modules
- All 15 product images regenerated with Tanner branding baked in
- No database changes needed — products already exist, only images update

