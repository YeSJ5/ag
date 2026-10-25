import os
import sys
from PIL import Image, ImageDraw, ImageFont

def render_terminal_to_png(command_str: str, text_content: str, output_image_path: str, title: str = "AirGuard Terminal Output"):
    os.makedirs(os.path.dirname(os.path.abspath(output_image_path)), exist_ok=True)
    
    font_path = "C:\\Windows\\Fonts\\consola.ttf"
    if not os.path.exists(font_path):
        font_path = "C:\\Windows\\Fonts\\arial.ttf"
        
    try:
        font = ImageFont.truetype(font_path, 16)
        header_font = ImageFont.truetype(font_path, 18)
        cmd_font = ImageFont.truetype(font_path, 16)
    except Exception:
        font = ImageFont.load_default()
        header_font = font
        cmd_font = font

    lines = []
    lines.append(f"$ {command_str}")
    lines.append("-" * 88)
    for l in text_content.splitlines():
        # Wrap long lines if needed
        while len(l) > 110:
            lines.append(l[:110])
            l = "    " + l[110:]
        lines.append(l)

    # Calculate image dimensions
    line_height = 22
    margin_x = 28
    margin_y = 50
    header_height = 40
    
    width = 1100
    height = margin_y + header_height + (len(lines) * line_height) + margin_y
    height = max(height, 250)

    # Terminal background: modern dark slate
    img = Image.new("RGB", (width, height), color=(18, 24, 38))
    draw = ImageDraw.Draw(img)

    # Window title bar
    draw.rectangle([0, 0, width, 40], fill=(28, 36, 54))
    
    # macOS / Linux terminal style dots
    draw.ellipse([16, 14, 28, 26], fill=(239, 68, 68))   # Red
    draw.ellipse([36, 14, 48, 26], fill=(245, 158, 11))  # Yellow
    draw.ellipse([56, 14, 68, 26], fill=(16, 185, 129))  # Green
    
    # Header title
    draw.text((85, 12), title, font=header_font, fill=(148, 163, 184))

    # Content
    curr_y = header_height + 25
    for i, line in enumerate(lines):
        if i == 0:
            # Command line in bright green / cyan
            draw.text((margin_x, curr_y), line, font=cmd_font, fill=(56, 189, 248))
        elif i == 1:
            draw.text((margin_x, curr_y), line, font=font, fill=(71, 85, 105))
        else:
            color = (226, 232, 240)
            if "PASSED" in line or "passed" in line or "SUCCESS" in line or "healthy" in line:
                color = (74, 222, 128)
            elif "FAILED" in line or "ERROR" in line or "Critical" in line or "HIGH" in line:
                color = (248, 113, 113)
            elif "WARNING" in line or "MEDIUM" in line:
                color = (251, 191, 36)
            elif "INFO" in line:
                color = (147, 197, 253)
            draw.text((margin_x, curr_y), line, font=font, fill=color)
        curr_y += line_height

    img.save(output_image_path)
    print(f"Rendered terminal shot to {output_image_path}")

if __name__ == "__main__":
    if len(sys.argv) >= 4:
        cmd = sys.argv[1]
        txt_file = sys.argv[2]
        out_png = sys.argv[3]
        title = sys.argv[4] if len(sys.argv) > 4 else "Terminal Output"
        with open(txt_file, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
        render_terminal_to_png(cmd, content, out_png, title)
