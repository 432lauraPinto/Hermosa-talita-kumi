import os
import urllib.request
import io
from PIL import Image, ImageDraw, ImageFont

PUBLIC_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'public')
os.makedirs(PUBLIC_DIR, exist_ok=True)

IMAGES = {
    # 7 Categorías
    'cat_facial.png': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800',
    'cat_luna.png': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800',
    'cat_corporal.png': 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=800',
    'cat_masajes.png': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800',
    'cat_depilacion.png': 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=800',
    'cat_pestanas.png': 'https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=800',
    'cat_cejas.png': 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800',

    # 3 Promociones
    'promo_bano_luna_facial.png': 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800',
    'promo_masaje_piedras.png': 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800',
    'promo_mirada_radiante.png': 'https://images.unsplash.com/photo-1512290900672-1f41b4e2f9d6?w=800',

    # 8 Productos
    'prod_serum_facial.png': 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800',
    'prod_gel_exfoliante.png': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800',
    'prod_tonico_rosas.png': 'https://images.unsplash.com/photo-1608248597359-5f284b39b56f?w=800',
    'prod_crema_corporal.png': 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=800',
    'prod_aceite_almendras.png': 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=800',
    'prod_mascarilla_arcilla.png': 'https://images.unsplash.com/photo-1567928815104-b7980ee5032e?w=800',
    'prod_protector_solar.png': 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800',
    'prod_sales_lavanda.png': 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800',

    # Tratamientos específicos
    'trat_limpieza_facial.png': 'https://images.unsplash.com/photo-1512290900672-1f41b4e2f9d6?w=800',
    'trat_hidratacion_facial.png': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800',
    'trat_iluminador_facial.png': 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800',
    'trat_acne_facial.png': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800',
    'trat_antiedad_facial.png': 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800',
    'trat_peeling_facial.png': 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800',
    'trat_bano_luna_cuerpo.png': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800',
    'trat_bano_luna_zonas.png': 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=800',
    'trat_cuidado_corporal.png': 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800',
    'trat_envoltura_corporal.png': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800',
    'trat_masaje_relajante.png': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800',
    'trat_masaje_descontracturante.png': 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=800',
    'trat_masaje_piedras.png': 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800',
    'trat_depilacion.png': 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=800',
    'trat_pestanas_cejas.png': 'https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=800',

    # ¿Por qué elegirnos?
    'elegirnos_spa_bienestar.png': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000',
}

def create_fallback_image(filename, text):
    """Crea una imagen elegante de reserva en caso de fallo de red"""
    img = Image.new('RGB', (800, 600), color=(253, 246, 248))
    draw = ImageDraw.Draw(img)
    # Dibujar bordes sutiles y texto
    draw.rectangle([20, 20, 780, 580], outline=(246, 198, 211), width=4)
    draw.text((40, 260), f"Hermosa Talita Kumi\n{text}", fill=(196, 106, 134))
    return img

def process_and_save(img, png_path, webp_path, target_size=(800, 600)):
    # Convertir a RGB o RGBA
    if img.mode not in ('RGB', 'RGBA'):
        img = img.convert('RGB')
    
    # Redimensionar conservando proporción con recorte central (center crop)
    target_w, target_h = target_size
    img_ratio = img.width / img.height
    target_ratio = target_w / target_h

    if img_ratio > target_ratio:
        new_height = target_h
        new_width = int(target_h * img_ratio)
    else:
        new_width = target_w
        new_height = int(target_w / img_ratio)

    img_resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
    left = (new_width - target_w) // 2
    top = (new_height - target_h) // 2
    img_cropped = img_resized.crop((left, top, left + target_w, top + target_h))

    # Guardar en formato PNG
    img_cropped.save(png_path, format='PNG', optimize=True)
    # Guardar en formato WebP optimizado (Módulo 17)
    img_cropped.save(webp_path, format='WEBP', quality=85)

def main():
    print(f"Iniciando descarga y generación de imágenes locales en {PUBLIC_DIR}...")
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

    for filename, url in IMAGES.items():
        base_name = os.path.splitext(filename)[0]
        png_path = os.path.join(PUBLIC_DIR, f"{base_name}.png")
        webp_path = os.path.join(PUBLIC_DIR, f"{base_name}.webp")

        print(f"Procesando: {filename}...")
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = resp.read()
                img = Image.open(io.BytesIO(data))
                process_and_save(img, png_path, webp_path)
                print(f" -> OK: {base_name}.png ({os.path.getsize(png_path)} bytes), {base_name}.webp ({os.path.getsize(webp_path)} bytes)")
        except Exception as e:
            print(f" -> Error descargando {url}: {e}. Generando fallback estético...")
            fallback = create_fallback_image(filename, base_name.replace('_', ' ').title())
            process_and_save(fallback, png_path, webp_path)
            print(f" -> Fallback generado: {base_name}.png")

    print("\n¡Todas las imágenes fueron procesadas y generadas localmente con éxito!")

if __name__ == '__main__':
    main()
