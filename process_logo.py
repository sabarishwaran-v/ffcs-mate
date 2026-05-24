from PIL import Image
import os

source_path = '/Users/sabarishwaranv/.gemini/antigravity/brain/ae6d2c6f-a40e-45e7-9e27-622b759717a9/logo_concept_minimal_1779644115491.png'
dest_dir = 'src/images/icons'
favicon_path = 'src/images/favicon.png'

# Load image and convert to RGBA
img = Image.open(source_path).convert("RGBA")
datas = img.getdata()

# Make white background transparent
newData = []
for item in datas:
    # If the pixel is very close to white, make it transparent
    if item[0] > 240 and item[1] > 240 and item[2] > 240:
        newData.append((255, 255, 255, 0))
    else:
        newData.append(item)

img.putdata(newData)

# Crop image to bounding box (removes transparent padding)
bbox = img.getbbox()
if bbox:
    img = img.crop(bbox)

# Save main favicon
img.thumbnail((512, 512), Image.Resampling.LANCZOS)
img.save(favicon_path, "PNG")

# Generate different sizes
sizes = [72, 96, 128, 144, 152, 192, 384, 512]
if not os.path.exists(dest_dir):
    os.makedirs(dest_dir)

for size in sizes:
    resized_img = img.resize((size, size), Image.Resampling.LANCZOS)
    resized_img.save(os.path.join(dest_dir, f'icon-{size}x{size}.png'), "PNG")

print("Successfully processed and generated all logo icons.")
