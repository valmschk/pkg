import os
import io
from flask import Flask, render_template, request
from PIL import Image, UnidentifiedImageError, TiffImagePlugin
import time
from concurrent.futures import ThreadPoolExecutor

MAX_FILES = 100000 
SUPPORTED_FORMATS = ('JPEG', 'GIF', 'TIFF', 'BMP', 'PNG', 'PCX')

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024

def analyze_image_data(file_stream, filename):
    result = {
        'filename': filename,
        'format': 'N/A',
        'size': 'N/A',
        'dpi': 'N/A',
        'depth': 'N/A',
        'compression': 'N/A',
        'extra_info': '',
    }

    try:
        img = Image.open(file_stream)
        
        if img.format not in SUPPORTED_FORMATS:
             result['extra_info'] = f"Формат {img.format} не в списке поддерживаемых ({', '.join(SUPPORTED_FORMATS)})"
             return result

        result['format'] = img.format
        result['size'] = f"{img.width} x {img.height}"

        dpi_info = "Не указано"
        calculated_dpi = None
        
        if hasattr(img, 'info') and 'dpi' in img.info and img.info['dpi']:
            x_dpi, y_dpi = img.info['dpi']
            if x_dpi and y_dpi and x_dpi > 0 and y_dpi > 0:
                dpi_info = f"{x_dpi:.6f} x {y_dpi:.6f} DPI"
                calculated_dpi = (x_dpi, y_dpi)
        
        if dpi_info == "Не указано" and img.format == 'TIFF':
            if hasattr(img, 'tag_v2'):
                tiff_tags = img.tag_v2
                if 282 in tiff_tags:
                    x_res = tiff_tags[282]
                    if 283 in tiff_tags:
                        y_res = tiff_tags[283]
                        if x_res > 0 and y_res > 0:
                            dpi_info = f"{x_res:.6f} x {y_res:.6f} DPI"
                            calculated_dpi = (x_res, y_res)
        
        if dpi_info == "Не указано" and img.format == 'BMP':
            if hasattr(img, 'info') and 'resolution' in img.info:
                resolution = img.info['resolution']
                if resolution and len(resolution) == 2:
                    dpi_x = resolution[0] / 39.37 if resolution[0] > 0 else 0
                    dpi_y = resolution[1] / 39.37 if resolution[1] > 0 else 0
                    if dpi_x > 0 and dpi_y > 0:
                        dpi_info = f"{dpi_x:.6f} x {dpi_y:.6f} DPI"
                        calculated_dpi = (dpi_x, dpi_y)
        
        if dpi_info == "Не указано":
            if img.format == 'GIF':
                dpi_info = "72.000000 x 72.000000 DPI"
                calculated_dpi = (72.0, 72.0)
            elif img.format == 'PNG':
                dpi_info = "96.000000 x 96.000000 DPI"
                calculated_dpi = (96.0, 96.0)
            elif img.format == 'JPEG':
                dpi_info = "72.000000 x 72.000000 DPI"
                calculated_dpi = (72.0, 72.0)
            elif img.format == 'BMP':
                dpi_info = "96.000000 x 96.000000 DPI"
                calculated_dpi = (96.0, 96.0)
            elif img.format == 'TIFF':
                dpi_info = "300.000000 x 300.000000 DPI"
                calculated_dpi = (300.0, 300.0)
            elif img.format == 'PCX':
                dpi_info = "72.000000 x 72.000000 DPI"
                calculated_dpi = (72.0, 72.0)
        
        result['dpi'] = dpi_info

        mode_map = {
            '1': '1 (бинарный)', 
            'L': '8 (градации серого)', 
            'P': '8 (палитра)',
            'RGB': '24 (True Color)', 
            'RGBA': '32 (True Color + Alpha)', 
            'CMYK': '32 (CMYK)',
            'YCbCr': '24 (YCbCr)', 
            'LAB': '24 (LAB)', 
            'HSV': '24 (HSV)',
            'I': '32 (целочисленный)', 
            'F': '32 (с плавающей точкой)',
            'LA': '16 (градации серого + Alpha)',
            'PA': '16 (палитра + Alpha)'
        }
        
        if img.format == 'JPEG':
            result['depth'] = mode_map.get(img.mode, f"{img.mode} (Нестандартный)")
        elif hasattr(img, 'bits'):
            bits = img.bits
            mode_desc = mode_map.get(img.mode, f"{img.mode} (Нестандартный)")
            result['depth'] = f"{bits} бит - {mode_desc}"
        else:
            result['depth'] = mode_map.get(img.mode, f"{img.mode} (Нестандартный)")
        
        compression = 'N/A'
        compression_details = []
        
        if img.format == 'JPEG':
            compression = 'JPEG'
            if hasattr(img, 'info'):
                if 'quality' in img.info:
                    quality = img.info['quality']
                    compression_details.append(f"качество {quality}")
                else:
                    compression_details.append("качество ~75")
                
        elif img.format == 'PNG':
            compression = 'Deflate'
            if hasattr(img, 'info') and 'compression' in img.info:
                comp_method = img.info['compression']
                comp_methods = {0: 'без фильтра', 1: 'Sub', 2: 'Up', 3: 'Average', 4: 'Paeth'}
                method_desc = comp_methods.get(comp_method, f"метод {comp_method}")
                compression_details.append(f"фильтр {method_desc}")
                
        elif img.format == 'TIFF':
            if hasattr(img, 'info') and 'compression' in img.info:
                comp_value = img.info['compression']
                comp_map = {
                    1: 'без сжатия',
                    5: 'LZW',
                    6: 'JPEG',
                    7: 'JPEG',
                    8: 'Deflate',
                    32946: 'Deflate'
                }
                compression = comp_map.get(comp_value, f"код {comp_value}")
            else:
                compression = 'без сжатия'
                
        elif img.format == 'GIF':
            compression = 'LZW'
            if img.mode == 'P':
                try:
                    palette = img.getpalette()
                    if palette:
                        colors_used = len([c for c in palette if c != 0]) // 3
                        compression_details.append(f"цветов {min(colors_used, 256)}")
                except:
                    compression_details.append("цветов до 256")
            
        elif img.format == 'BMP':
            compression = 'без сжатия'
            if hasattr(img, 'info') and 'compression' in img.info:
                bmp_comp = img.info['compression']
                if bmp_comp != 0:
                    compression = 'RLE'
                    compression_details.append(f"тип {bmp_comp}")
                    
        elif img.format == 'PCX':
            compression = 'RLE'
        
        if compression_details:
            result['compression'] = f"{compression} ({', '.join(compression_details)})"
        else:
            result['compression'] = compression

        extra_details = []
        
        if img.format == 'JPEG':
            if hasattr(img, 'quantization') and img.quantization:
                tables_count = len(img.quantization)
                extra_details.append(f"Матрицы квантования: {tables_count}")
                
            if hasattr(img, '_getexif') and img._getexif():
                exif = img._getexif()
                if exif:
                    exif_tags = {
                        271: 'Производитель камеры',
                        272: 'Модель камеры',
                        274: 'Ориентация',
                        306: 'Дата съемки',
                        36867: 'Дата оригинальной съемки'
                    }
                    found_exif = []
                    for tag, desc in exif_tags.items():
                        if tag in exif and exif[tag]:
                            found_exif.append(f"{desc}: {exif[tag]}")
                    if found_exif:
                        extra_details.append("EXIF: " + "; ".join(found_exif[:2]))
        
        if img.format == 'GIF' and img.mode == 'P':
            try:
                palette = img.getpalette()
                if palette:
                    extra_details.append("GIF: Палитра до 256 цветов")
                if hasattr(img, 'is_animated') and img.is_animated:
                    extra_details.append(f"Анимированный ({img.n_frames} кадров)")
            except:
                extra_details.append("GIF: Цветовая палитра")
            
        if img.format == 'TIFF' and hasattr(img, 'tag_v2') and img.tag_v2:
            tiff_tags = img.tag_v2
            important_tags = []
            tag_names = {
                256: 'Ширина',
                257: 'Высота', 
                262: 'Фотометрическая интерпретация',
                274: 'Ориентация',
                277: 'Компонентов на пиксель'
            }
            for tag_id, tag_name in tag_names.items():
                if tag_id in tiff_tags:
                    important_tags.append(f"{tag_name}: {tiff_tags[tag_id]}")
            if important_tags:
                extra_details.append("TIFF теги: " + ", ".join(important_tags[:3]))
        
        if img.format == 'PNG':
            png_info = []
            if hasattr(img, 'info'):
                if 'gamma' in img.info:
                    png_info.append(f"Гамма: {img.info['gamma']:.3f}")
                if 'interlace' in img.info:
                    png_info.append("Чересстрочность" if img.info['interlace'] else "Без чересстрочности")
            if png_info:
                extra_details.append("PNG: " + "; ".join(png_info))
        
        if img.format == 'BMP':
            bmp_info = []
            if hasattr(img, 'info'):
                if 'bits' in img.info:
                    bmp_info.append(f"{img.info['bits']} бит/пиксель")
            if bmp_info:
                extra_details.append("BMP: " + "; ".join(bmp_info))

        result['extra_info'] = '; '.join(extra_details) if extra_details else "Базовые метаданные"

    except UnidentifiedImageError:
        result['extra_info'] = "Неизвестный/Поврежденный формат изображения."
    except Exception as e:
        result['extra_info'] = f"Ошибка при анализе: {str(e)}"

    return result

@app.route('/', methods=['GET', 'POST'])
def upload_folder():
    results = None
    error = None

    if request.method == 'POST':
        if 'files' not in request.files:
            error = 'Файлы не выбраны или не найдена форма.'
            return render_template('index.html', error=error)

        uploaded_files = request.files.getlist('files')
        
        if not uploaded_files or uploaded_files[0].filename == '':
            error = 'Папка пуста или не содержит файлов.'
            return render_template('index.html', error=error)
        
        if len(uploaded_files) > MAX_FILES:
             error = f'Превышено максимальное количество файлов ({MAX_FILES}).'
             return render_template('index.html', error=error)

        ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'tif', 'tiff', 'bmp', 'pcx'}
        for file in uploaded_files:
            if '.' not in file.filename:
                error = f'Файл "{file.filename}" не имеет расширения.'
                return render_template('index.html', error=error)
            ext = file.filename.rsplit('.', 1)[1].lower()
            if ext not in ALLOWED_EXTENSIONS:
                error = f'Файл "{file.filename}" имеет запрещенный тип. Разрешены: {", ".join(ALLOWED_EXTENSIONS)}'
                return render_template('index.html', error=error)

        print(f"Начало анализа {len(uploaded_files)} файлов...")
        start_time = time.time()
        
        with ThreadPoolExecutor(max_workers=min(32, (os.cpu_count() or 1) * 2)) as executor:
            analysis_tasks = [
                executor.submit(
                    analyze_image_data, 
                    io.BytesIO(f.read()), 
                    f.filename
                )
                for f in uploaded_files
            ]
            
            results = [task.result() for task in analysis_tasks]

        end_time = time.time()
        
        processing_time = end_time - start_time
        print(f"Обработано {len(results)} файлов за {processing_time:.2f} секунд.")
        if results:
            print(f"Среднее время на файл: {processing_time / len(results):.4f} с.")

    return render_template('index.html', results=results, error=error)

if __name__ == '__main__':
    app.run(debug=True)