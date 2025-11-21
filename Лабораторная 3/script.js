class ImageProcessor {
    constructor() {
        this.originalImage = null;
        this.processedImage = null;
        this.originalCanvas = document.getElementById('originalCanvas');
        this.processedCanvas = document.getElementById('processedCanvas');
        this.originalCtx = this.originalCanvas.getContext('2d');
        this.processedCtx = this.processedCanvas.getContext('2d');
        
        this.initEventListeners();
        this.setupDefaultCanvas();
    }

    setupDefaultCanvas() {
        this.originalCanvas.width = 400;
        this.originalCanvas.height = 300;
        this.processedCanvas.width = 400;
        this.processedCanvas.height = 300;
        
        this.originalCtx.fillStyle = '#000';
        this.originalCtx.fillRect(0, 0, this.originalCanvas.width, this.originalCanvas.height);
        this.processedCtx.fillStyle = '#000';
        this.processedCtx.fillRect(0, 0, this.processedCanvas.width, this.processedCanvas.height);
        
        this.originalCtx.fillStyle = '#00ff41';
        this.originalCtx.font = '16px Arial';
        this.originalCtx.textAlign = 'center';
        this.originalCtx.fillText('Загрузите изображение', this.originalCanvas.width/2, this.originalCanvas.height/2);
        
        this.processedCtx.fillStyle = '#00ff41';
        this.processedCtx.font = '16px Arial';
        this.processedCtx.textAlign = 'center';
        this.processedCtx.fillText('Обработанное изображение', this.processedCanvas.width/2, this.processedCanvas.height/2);
    }

    initEventListeners() {
        document.getElementById('imageInput').addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                this.loadImage(e.target.files[0]);
            }
        });

        document.querySelectorAll('input[name="method"]').forEach(radio => {
            radio.addEventListener('change', () => this.processImage());
        });

        document.getElementById('kernelSize').addEventListener('input', (e) => {
            document.getElementById('kernelValue').textContent = e.target.value;
            this.processImage();
        });

        document.getElementById('threshold').addEventListener('input', (e) => {
            document.getElementById('thresholdValue').textContent = e.target.value;
            this.processImage();
        });

        document.getElementById('blockSize').addEventListener('input', (e) => {
            document.getElementById('blockSizeValue').textContent = e.target.value;
            this.processImage();
        });

        document.getElementById('cConstant').addEventListener('input', (e) => {
            document.getElementById('cValue').textContent = e.target.value;
            this.processImage();
        });
    }

    loadImage(file) {
        if (!file || !file.type.match('image.*')) {
            alert('Пожалуйста, выберите файл изображения');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.originalImage = img;
                this.displayOriginalImage();
                this.processImage();
            };
            img.onerror = () => {
                alert('Ошибка загрузки изображения');
            };
            img.src = e.target.result;
        };
        reader.onerror = () => {
            alert('Ошибка чтения файла');
        };
        reader.readAsDataURL(file);
    }

    loadTestImage(type) {
        const img = this[`create${type.charAt(0).toUpperCase() + type.slice(1)}Image`]();
        this.originalImage = img;
        this.displayOriginalImage();
        this.processImage();
    }

    displayOriginalImage() {
        const canvas = this.originalCanvas;
        const ctx = this.originalCtx;
        
        if (!this.originalImage) return;
        
        const container = canvas.parentElement;
        const maxWidth = container.clientWidth - 30;
        const maxHeight = container.clientHeight - 80;
        
        let { width, height } = this.originalImage;
        
        if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
        }
        if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(this.originalImage, 0, 0, width, height);
    }

    processImage() {
        if (!this.originalImage) {
            console.log('Нет изображения для обработки');
            return;
        }

        const method = document.querySelector('input[name="method"]:checked').value;
        const kernelSize = parseInt(document.getElementById('kernelSize').value);
        const threshold = parseInt(document.getElementById('threshold').value);
        const blockSize = parseInt(document.getElementById('blockSize').value);
        const cValue = parseInt(document.getElementById('cConstant').value);

        const imageData = this.getImageData(this.originalImage);
        
        let processedData;
        try {
            switch (method) {
                case 'original':
                    processedData = imageData;
                    break;
                case 'gaussian':
                    processedData = this.gaussianBlur(imageData, kernelSize);
                    break;
                case 'median':
                    processedData = this.medianFilter(imageData, kernelSize);
                    break;
                case 'blur':
                    processedData = this.boxBlur(imageData, kernelSize);
                    break;
                case 'binary':
                    processedData = this.globalThreshold(imageData, threshold);
                    break;
                case 'otsu':
                    processedData = this.otsuThreshold(imageData);
                    break;
                case 'adaptiveMean':
                    processedData = this.adaptiveThreshold(imageData, blockSize, cValue, 'mean');
                    break;
                case 'adaptiveGaussian':
                    processedData = this.adaptiveThreshold(imageData, blockSize, cValue, 'gaussian');
                    break;
                default:
                    processedData = imageData;
            }
            
            this.displayProcessedImage(processedData);
        } catch (error) {
            console.error('Ошибка обработки:', error);
            alert('Ошибка при обработке изображения: ' + error.message);
        }
    }

    getImageData(image) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    displayProcessedImage(imageData) {
        const canvas = this.processedCanvas;
        const ctx = this.processedCtx;
        
        const container = canvas.parentElement;
        const maxWidth = container.clientWidth - 30;
        const maxHeight = container.clientHeight - 80;
        
        let { width, height } = imageData;
        
        if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
        }
        if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = imageData.width;
        tempCanvas.height = imageData.height;
        tempCtx.putImageData(imageData, 0, 0);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(tempCanvas, 0, 0, imageData.width, imageData.height, 0, 0, width, height);
    }

    gaussianBlur(imageData, kernelSize) {
        const data = new Uint8ClampedArray(imageData.data);
        const width = imageData.width;
        const height = imageData.height;
        const result = new Uint8ClampedArray(data.length);
        
        const kernel = this.createGaussianKernel(kernelSize);
        const radius = Math.floor(kernelSize / 2);
        
        const tempData = new Uint8ClampedArray(data.length);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                for (let c = 0; c < 3; c++) {
                    let sum = 0;
                    let weightSum = 0;
                    
                    for (let kx = -radius; kx <= radius; kx++) {
                        const nx = Math.max(0, Math.min(width - 1, x + kx));
                        const pixel = (y * width + nx) * 4 + c;
                        const weight = kernel[kx + radius];
                        sum += data[pixel] * weight;
                        weightSum += weight;
                    }
                    
                    const resultPixel = (y * width + x) * 4 + c;
                    tempData[resultPixel] = sum / weightSum;
                }
                tempData[(y * width + x) * 4 + 3] = 255;
            }
        }
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                for (let c = 0; c < 3; c++) {
                    let sum = 0;
                    let weightSum = 0;
                    
                    for (let ky = -radius; ky <= radius; ky++) {
                        const ny = Math.max(0, Math.min(height - 1, y + ky));
                        const pixel = (ny * width + x) * 4 + c;
                        const weight = kernel[ky + radius];
                        sum += tempData[pixel] * weight;
                        weightSum += weight;
                    }
                    
                    const resultPixel = (y * width + x) * 4 + c;
                    result[resultPixel] = sum / weightSum;
                }
                result[(y * width + x) * 4 + 3] = 255;
            }
        }
        
        return new ImageData(result, width, height);
    }

    createGaussianKernel(size) {
        const kernel = [];
        const sigma = size / 3;
        const radius = Math.floor(size / 2);
        let sum = 0;
        
        for (let i = -radius; i <= radius; i++) {
            const value = Math.exp(-(i * i) / (2 * sigma * sigma)) / (Math.sqrt(2 * Math.PI) * sigma);
            kernel[i + radius] = value;
            sum += value;
        }
        
        for (let i = 0; i < size; i++) {
            kernel[i] /= sum;
        }
        
        return kernel;
    }

    medianFilter(imageData, kernelSize) {
        const data = new Uint8ClampedArray(imageData.data);
        const width = imageData.width;
        const height = imageData.height;
        const result = new Uint8ClampedArray(data.length);
        const radius = Math.floor(kernelSize / 2);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                for (let c = 0; c < 3; c++) {
                    const values = [];
                    
                    for (let ky = -radius; ky <= radius; ky++) {
                        for (let kx = -radius; kx <= radius; kx++) {
                            const ny = Math.max(0, Math.min(height - 1, y + ky));
                            const nx = Math.max(0, Math.min(width - 1, x + kx));
                            const pixel = (ny * width + nx) * 4 + c;
                            values.push(data[pixel]);
                        }
                    }
                    
                    values.sort((a, b) => a - b);
                    const median = values[Math.floor(values.length / 2)];
                    
                    const resultPixel = (y * width + x) * 4 + c;
                    result[resultPixel] = median;
                }
                result[(y * width + x) * 4 + 3] = 255;
            }
        }
        
        return new ImageData(result, width, height);
    }

    boxBlur(imageData, kernelSize) {
        const data = new Uint8ClampedArray(imageData.data);
        const width = imageData.width;
        const height = imageData.height;
        const result = new Uint8ClampedArray(data.length);
        const radius = Math.floor(kernelSize / 2);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                for (let c = 0; c < 3; c++) {
                    let sum = 0;
                    let count = 0;
                    
                    for (let ky = -radius; ky <= radius; ky++) {
                        for (let kx = -radius; kx <= radius; kx++) {
                            const ny = Math.max(0, Math.min(height - 1, y + ky));
                            const nx = Math.max(0, Math.min(width - 1, x + kx));
                            const pixel = (ny * width + nx) * 4 + c;
                            sum += data[pixel];
                            count++;
                        }
                    }
                    
                    const resultPixel = (y * width + x) * 4 + c;
                    result[resultPixel] = sum / count;
                }
                result[(y * width + x) * 4 + 3] = 255;
            }
        }
        
        return new ImageData(result, width, height);
    }

    globalThreshold(imageData, threshold) {
        const data = new Uint8ClampedArray(imageData.data);
        const width = imageData.width;
        const height = imageData.height;
        const result = new Uint8ClampedArray(data.length);
        
        for (let i = 0; i < data.length; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
            const binary = gray > threshold ? 255 : 0;
            
            result[i] = binary;
            result[i+1] = binary;
            result[i+2] = binary;
            result[i+3] = 255;
        }
        
        return new ImageData(result, width, height);
    }

    otsuThreshold(imageData) {
        const data = new Uint8ClampedArray(imageData.data);
        const width = imageData.width;
        const height = imageData.height;
        
        const histogram = new Array(256).fill(0);
        for (let i = 0; i < data.length; i += 4) {
            const gray = Math.round(0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2]);
            histogram[gray]++;
        }
        
        const total = width * height;
        let sum = 0;
        for (let i = 0; i < 256; i++) {
            sum += i * histogram[i];
        }
        
        let sumB = 0;
        let wB = 0;
        let wF = 0;
        let maxVariance = 0;
        let threshold = 0;
        
        for (let i = 0; i < 256; i++) {
            wB += histogram[i];
            if (wB === 0) continue;
            
            wF = total - wB;
            if (wF === 0) break;
            
            sumB += i * histogram[i];
            
            const mB = sumB / wB;
            const mF = (sum - sumB) / wF;
            
            const variance = wB * wF * (mB - mF) * (mB - mF);
            if (variance > maxVariance) {
                maxVariance = variance;
                threshold = i;
            }
        }
        
        document.getElementById('threshold').value = threshold;
        document.getElementById('thresholdValue').textContent = threshold;
        
        return this.globalThreshold(imageData, threshold);
    }

    adaptiveThreshold(imageData, blockSize, cValue, method) {
        const data = new Uint8ClampedArray(imageData.data);
        const width = imageData.width;
        const height = imageData.height;
        const result = new Uint8ClampedArray(data.length);
        const radius = Math.floor(blockSize / 2);
        
        const grayData = new Array(width * height);
        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
            grayData[j] = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
        }
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let sum = 0;
                let weightSum = 0;
                
                for (let ky = -radius; ky <= radius; ky++) {
                    for (let kx = -radius; kx <= radius; kx++) {
                        const ny = Math.max(0, Math.min(height - 1, y + ky));
                        const nx = Math.max(0, Math.min(width - 1, x + kx));
                        
                        let weight = 1;
                        if (method === 'gaussian') {
                            const dist = Math.sqrt(ky*ky + kx*kx);
                            weight = Math.exp(-(dist * dist) / (2 * (radius/2) * (radius/2)));
                        }
                        
                        sum += grayData[ny * width + nx] * weight;
                        weightSum += weight;
                    }
                }
                
                const localMean = sum / weightSum;
                const gray = grayData[y * width + x];
                
                const binary = gray > (localMean - cValue) ? 255 : 0;
                
                const idx = (y * width + x) * 4;
                result[idx] = binary;
                result[idx+1] = binary;
                result[idx+2] = binary;
                result[idx+3] = 255;
            }
        }
        
        return new ImageData(result, width, height);
    }

    createNoisyImage() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 400;
        canvas.height = 300;
        
    
        ctx.fillStyle = '#808080';
        ctx.fillRect(0, 0, 400, 300);
        
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Noisy Image', 200, 150);
        
        const imageData = ctx.getImageData(0, 0, 400, 300);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            if (Math.random() < 0.15) {
                const noise = Math.random() < 0.5 ? 0 : 255;
                data[i] = noise;
                data[i+1] = noise;
                data[i+2] = noise;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        const img = new Image();
        img.src = canvas.toDataURL();
        return img;
    }

    createBlurredImage() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 400;
        canvas.height = 300;
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 400, 300);
        
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        
        ctx.filter = 'blur(8px)';
        ctx.fillText('Blurred Text', 200, 150);
        ctx.filter = 'none';
        
        const img = new Image();
        img.src = canvas.toDataURL();
        return img;
    }

    createLowContrastImage() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 400;
        canvas.height = 300;
        
        ctx.fillStyle = '#707070';
        ctx.fillRect(0, 0, 400, 300);
        
        ctx.fillStyle = '#505050';
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Low Contrast', 200, 150);
        
        const img = new Image();
        img.src = canvas.toDataURL();
        return img;
    }

    createUnevenLightingImage() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 400;
        canvas.height = 300;
        
        const gradient = ctx.createLinearGradient(0, 0, 400, 0);
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(0.3, '#A0A0A0');
        gradient.addColorStop(0.7, '#606060');
        gradient.addColorStop(1, '#202020');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 400, 300);
        
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Uneven Lighting', 200, 150);
        
        const img = new Image();
        img.src = canvas.toDataURL();
        return img;
    }
}

let imageProcessor;

function saveImage() {
    if (!imageProcessor || !imageProcessor.processedCanvas) {
        alert('Нет обработанного изображения для сохранения');
        return;
    }
    
    const link = document.createElement('a');
    link.download = 'processed_image.png';
    link.href = imageProcessor.processedCanvas.toDataURL();
    link.click();
}

function compareNoisy() {
    if (!imageProcessor) return;
    
    imageProcessor.loadTestImage('noisy');
    
    setTimeout(() => {
        document.querySelector('input[value="median"]').checked = true;
        imageProcessor.processImage();
        
        setTimeout(() => {
            alert('РЕЗУЛЬТАТ СРАВНЕНИЯ:\n\n🎯 Зашумленные изображения:\n• Медианный фильтр > Гауссов фильтр\n• Эффективно убирает импульсный шум типа "соль-перец"\n• Сохраняет четкие границы объектов');
        }, 300);
    }, 100);
}

function compareUneven() {
    if (!imageProcessor) return;
    
    imageProcessor.loadTestImage('uneven');
    
    setTimeout(() => {
        document.querySelector('input[value="adaptiveMean"]').checked = true;
        imageProcessor.processImage();
        
        setTimeout(() => {
            alert('РЕЗУЛЬТАТ СРАВНЕНИЯ:\n\n🔆 Неравномерное освещение:\n• Адаптивные методы > Глобальные методы\n• Локальное вычисление порога для каждой области\n• Текст читается даже в тенях');
        }, 300);
    }, 100);
}

function compareLowContrast() {
    if (!imageProcessor) return;
    
    imageProcessor.loadTestImage('lowContrast');
    
    setTimeout(() => {
        document.querySelector('input[value="otsu"]').checked = true;
        imageProcessor.processImage();
        
        setTimeout(() => {
            alert('РЕЗУЛЬТАТ СРАВНЕНИЯ:\n\n🌫️ Малоконтрастные изображения:\n• Otsu > Binary\n• Автоматический подбор оптимального порога\n• Не требует ручной настройки параметров');
        }, 300);
    }, 100);
}

function showMethodComparison() {
    const comparison = `📊 СРАВНИТЕЛЬНАЯ ТАБЛИЦА МЕТОДОВ:

🎯 ЗАШУМЛЕННЫЕ ИЗОБРАЖЕНИЯ:
✓ Медианный фильтр - лучший результат
✓ Убирает импульсный шум "соль-перец"
✗ Гауссов фильтр - размывает детали

🔆 НЕРАВНОМЕРНОЕ ОСВЕЩЕНИЕ:
✓ Адаптивные методы - оптимальный выбор
✓ Локальный порог для каждой области
✗ Глобальные методы - теряют детали в тенях

🌫️ МАЛОКОНТРАСТНЫЕ ИЗОБРАЖЕНИЯ:
✓ Otsu - автоматический подбор порога
✓ Работает без ручной настройки
✗ Binary - требует точной настройки порога

💡 ВЫВОД: Выбор метода зависит от типа изображения и характера шума`;
    alert(comparison);
}

window.addEventListener('load', () => {
    imageProcessor = new ImageProcessor();
});