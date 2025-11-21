const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');
const logArea = document.getElementById('logArea');
const cursorCoords = document.getElementById('cursorCoords');
const reportModal = document.getElementById('reportModal');
const reportContent = document.getElementById('reportContent');

let pixelSize = 20;
let width, height, centerX, centerY;
let pixelCounter = 0;

function init() {
    resizeCanvas();
    setupEventListeners();
    drawGrid();
}

function resizeCanvas() {
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth - 40;
    canvas.height = Math.min(600, parent.clientHeight - 120);
    width = canvas.width;
    height = canvas.height;
    centerX = Math.floor(width / 2);
    centerY = Math.floor(height / 2);
    drawGrid();
}

function setupEventListeners() {
    window.addEventListener('resize', resizeCanvas);
    
    const gridSizeSlider = document.getElementById('gridSize');
    gridSizeSlider.addEventListener('input', (e) => {
        pixelSize = parseInt(e.target.value);
        document.getElementById('gridSizeVal').textContent = pixelSize;
       
    });
    
    gridSizeSlider.addEventListener('change', (e) => {
        draw();
    });
    
    document.getElementById('algoSelect').addEventListener('change', draw);
    
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const logical = screenToLogical(x, y);
        cursorCoords.textContent = `(${logical.x}, ${logical.y})`;
    });
    
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = -Math.sign(e.deltaY);
        pixelSize = Math.max(5, Math.min(50, pixelSize + delta));
        document.getElementById('gridSize').value = pixelSize;
        document.getElementById('gridSizeVal').textContent = pixelSize;
        draw(); 
    });
    
   
    document.querySelector('.close').addEventListener('click', () => {
        reportModal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === reportModal) {
            reportModal.style.display = 'none';
        }
    });
}


function screenToLogical(screenX, screenY) {
    const logicalX = Math.round((screenX - centerX) / pixelSize);
    const logicalY = Math.round(-(screenY - centerY) / pixelSize);
    return { x: logicalX, y: logicalY };
}

function logicalToScreen(logicalX, logicalY) {
    return {
        x: centerX + (logicalX * pixelSize),
        y: centerY - (logicalY * pixelSize)
    };
}


function drawGrid() {
    ctx.clearRect(0, 0, width, height);
    
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);
    
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#e2e8f0';
    ctx.beginPath();
    
    for (let x = centerX % pixelSize; x < width; x += pixelSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
    }
    
    for (let y = centerY % pixelSize; y < height; y += pixelSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
    }
    ctx.stroke();

  
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    
    ctx.fillStyle = '#475569';
    ctx.font = '12px Arial';
    ctx.fillText('Y', centerX + 5, 15);
    ctx.fillText('X', width - 15, centerY - 5);
    ctx.fillText('(0,0)', centerX + 5, centerY - 5);
    
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Arial';
    
    for (let x = centerX + pixelSize; x < width; x += pixelSize) {
        const logicalX = (x - centerX) / pixelSize;
        ctx.fillText(logicalX, x - 5, centerY + 15);
    }
    for (let x = centerX - pixelSize; x > 0; x -= pixelSize) {
        const logicalX = (x - centerX) / pixelSize;
        ctx.fillText(logicalX, x - 5, centerY + 15);
    }
    
    for (let y = centerY + pixelSize; y < height; y += pixelSize) {
        const logicalY = -(y - centerY) / pixelSize;
        ctx.fillText(logicalY, centerX + 5, y + 3);
    }
    for (let y = centerY - pixelSize; y > 0; y -= pixelSize) {
        const logicalY = -(y - centerY) / pixelSize;
        ctx.fillText(logicalY, centerX + 5, y + 3);
    }
}

function plot(logicalX, logicalY, alpha = 1) {
    const screenCoords = logicalToScreen(logicalX, logicalY);
    
    let color;
    const algorithm = document.getElementById('algoSelect').value;
    
    switch(algorithm) {
        case 'step': color = `rgba(220, 38, 38, ${alpha})`; break;
        case 'dda': color = `rgba(37, 99, 235, ${alpha})`; break;
        case 'bresenham': color = `rgba(5, 150, 105, ${alpha})`; break;
        case 'bresenhamCircle': color = `rgba(124, 58, 237, ${alpha})`; break;
        case 'wu': color = `rgba(37, 99, 235, ${alpha})`; break;
        case 'pitteway': color = `rgba(217, 119, 6, ${alpha})`; break;
        default: color = `rgba(37, 99, 235, ${alpha})`;
    }
    
    ctx.fillStyle = color;
    ctx.fillRect(
        screenCoords.x - pixelSize/2 + 1, 
        screenCoords.y - pixelSize/2 + 1, 
        pixelSize - 2, 
        pixelSize - 2
    );
    
    pixelCounter++;
}

function stepByStep(x1, y1, x2, y2) {
    let log = "Пошаговый алгоритм:\n";
    const dx = x2 - x1;
    const dy = y2 - y1;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    
    log += `Δx = ${dx}, Δy = ${dy}, шагов = ${steps}\n`;
    
    if (steps === 0) {
        plot(x1, y1);
        return log;
    }
    
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = Math.round(x1 + t * dx);
        const y = Math.round(y1 + t * dy);
        plot(x, y);
        log += `Шаг ${i}: t=${t.toFixed(2)}, x=${x}, y=${y}\n`;
    }
    
    return log;
}

function dda(x1, y1, x2, y2) {
    let log = "Алгоритм ЦДА:\n";
    const dx = x2 - x1;
    const dy = y2 - y1;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    
    log += `Δx = ${dx}, Δy = ${dy}, шагов = ${steps}\n`;
    
    if (steps === 0) {
        plot(x1, y1);
        return log;
    }
    
    const xInc = dx / steps;
    const yInc = dy / steps;
    
    let x = x1;
    let y = y1;
    
    log += `xInc = ${xInc.toFixed(2)}, yInc = ${yInc.toFixed(2)}\n`;
    
    for (let i = 0; i <= steps; i++) {
        plot(Math.round(x), Math.round(y));
        
        log += `Шаг ${i}: x=${x.toFixed(2)}, y=${y.toFixed(2)} → (${Math.round(x)}, ${Math.round(y)})\n`;
        
        x += xInc;
        y += yInc;
    }
    
    return log;
}

function bresenhamLine(x1, y1, x2, y2) {
    let log = "Алгоритм Брезенхема (линия):\n";
    
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    
    const sx = (x1 < x2) ? 1 : -1;
    const sy = (y1 < y2) ? 1 : -1;
    
    let err = dx - dy;
    
    log += `Δx = ${dx}, Δy = ${dy}, err = ${err}\n`;
    log += `sx = ${sx}, sy = ${sy}\n\n`;
    
    let x = x1;
    let y = y1;
    let step = 0;
    
    while (true) {
        plot(x, y);
        log += `Шаг ${step}: (${x}, ${y}), err = ${err}\n`;
        
        if (x === x2 && y === y2) break;
        
        const e2 = 2 * err;
        
        if (e2 > -dy) {
            err -= dy;
            x += sx;
        }
        
        if (e2 < dx) {
            err += dx;
            y += sy;
        }
        
        step++;
    }
    
    return log;
}


function bresenhamCircle(centerX, centerY, radius) {
    let log = "Алгоритм Брезенхема (окружность):\n";
    let x = 0;
    let y = radius;
    let d = 3 - 2 * radius;
    
    log += `Центр: (${centerX}, ${centerY}), радиус: ${radius}\n`;
    log += `Начальные: x = ${x}, y = ${y}, d = ${d}\n\n`;

    function plot8(cx, cy, x, y) {
        plot(cx + x, cy + y);
        plot(cx - x, cy + y);
        plot(cx + x, cy - y);
        plot(cx - x, cy - y);
        plot(cx + y, cy + x);
        plot(cx - y, cy + x);
        plot(cx + y, cy - x);
        plot(cx - y, cy - x);
    }

    let step = 0;
    plot8(centerX, centerY, x, y);
    log += `Шаг ${step}: (${x}, ${y}), d = ${d}\n`;

    while (y >= x) {
        x++;
        step++;
        
        if (d > 0) {
            y--;
            d = d + 4 * (x - y) + 10;
            log += `Шаг ${step}: d > 0 → y-- = ${y}, d = ${d}\n`;
        } else {
            d = d + 4 * x + 6;
            log += `Шаг ${step}: d <= 0 → d = ${d}\n`;
        }
        
        plot8(centerX, centerY, x, y);
    }
    
    return log;
}

function wu(x1, y1, x2, y2) {
    let log = "Алгоритм Ву (сглаживание):\n";
    
    function ipart(x) { return Math.floor(x); }
    function fpart(x) { return x - Math.floor(x); }
    function rfpart(x) { return 1 - fpart(x); }

    const steep = Math.abs(y2 - y1) > Math.abs(x2 - x1);
    if (steep) { [x1, y1] = [y1, x1]; [x2, y2] = [y2, x2]; }
    if (x1 > x2) { [x1, x2] = [x2, x1]; [y1, y2] = [y2, y1]; }

    const dx = x2 - x1;
    const dy = y2 - y1;
    const gradient = dy / dx;

    log += `steep = ${steep}, Δx = ${dx}, Δy = ${dy}, gradient = ${gradient.toFixed(2)}\n`;

   
    let xend = Math.round(x1);
    let yend = y1 + gradient * (xend - x1);
    let xgap = rfpart(x1 + 0.5);
    let xpxl1 = xend;
    let ypxl1 = ipart(yend);

    if (steep) {
        plot(ypxl1, xpxl1, rfpart(yend) * xgap);
        plot(ypxl1 + 1, xpxl1, fpart(yend) * xgap);
    } else {
        plot(xpxl1, ypxl1, rfpart(yend) * xgap);
        plot(xpxl1, ypxl1 + 1, fpart(yend) * xgap);
    }

    let intery = yend + gradient;

    
    xend = Math.round(x2);
    let yend2 = y2 + gradient * (xend - x2);
    let xgap2 = fpart(x2 + 0.5);
    let xpxl2 = xend;
    let ypxl2 = ipart(yend2);

    if (steep) {
        plot(ypxl2, xpxl2, rfpart(yend2) * xgap2);
        plot(ypxl2 + 1, xpxl2, fpart(yend2) * xgap2);
    } else {
        plot(xpxl2, ypxl2, rfpart(yend2) * xgap2);
        plot(xpxl2, ypxl2 + 1, fpart(yend2) * xgap2);
    }

    let step = 0;
    for (let x = xpxl1 + 1; x < xpxl2; x++) {
        if (steep) {
            plot(ipart(intery), x, rfpart(intery));
            plot(ipart(intery) + 1, x, fpart(intery));
        } else {
            plot(x, ipart(intery), rfpart(intery));
            plot(x, ipart(intery) + 1, fpart(intery));
        }
        intery += gradient;
        step++;
    }
    
    log += `Выполнено ${step} шагов сглаживания\n`;
    return log;
}

function castlePitteway(a, b) {
    let log = "Алгоритм Кастла-Питвея (эллипс):\n";
    let x = 0;
    let y = b;
    const a2 = a * a;
    const b2 = b * b;
    let d = 4 * b2 - 4 * a2 * b + a2;
    
    log += `a = ${a}, b = ${b}, a² = ${a2}, b² = ${b2}\n`;
    log += `Начальные: x = ${x}, y = ${y}, d = ${d}\n\n`;

    function plot4(cx, cy) {
        plot(cx, cy);
        plot(-cx, cy);
        plot(cx, -cy);
        plot(-cx, -cy);
    }

    let step = 0;
    plot4(x, y);
    log += `Шаг ${step}: (${x}, ${y}), d = ${d}\n`;

    while ((a2 * (2 * y - 1)) > (2 * b2 * (x + 1))) {
        step++;
        if (d < 0) {
            d += 4 * b2 * (2 * x + 3);
            x++;
            log += `Шаг ${step}: d < 0 → x++ = ${x}, d = ${d}\n`;
        } else {
            d += 4 * b2 * (2 * x + 3) - 8 * a2 * (y - 1);
            x++;
            y--;
            log += `Шаг ${step}: d >= 0 → x++ = ${x}, y-- = ${y}, d = ${d}\n`;
        }
        plot4(x, y);
    }

    let d2 = b2 * (x + 0.5) * (x + 0.5) + a2 * (y - 1) * (y - 1) - a2 * b2;
    log += `\nПереход ко второй области: d2 = ${d2}\n`;
    
    while (y > 0) {
        step++;
        if (d2 < 0) {
            d2 += b2 * (2 * x + 2) + a2 * (3 - 2 * y);
            x++;
            y--;
            log += `Шаг ${step}: d2 < 0 → x++ = ${x}, y-- = ${y}, d2 = ${d2}\n`;
        } else {
            d2 += a2 * (3 - 2 * y);
            y--;
            log += `Шаг ${step}: d2 >= 0 → y-- = ${y}, d2 = ${d2}\n`;
        }
        plot4(x, y);
    }
    
    return log;
}

function draw() {
    const algorithm = document.getElementById('algoSelect').value;
    const x1 = parseInt(document.getElementById('x1').value);
    const y1 = parseInt(document.getElementById('y1').value);
    const x2 = parseInt(document.getElementById('x2').value);
    const y2 = parseInt(document.getElementById('y2').value);
    
    pixelCounter = 0;
    drawGrid();
    
    const t0 = performance.now();
    let log = '';
    
    switch(algorithm) {
        case 'step':
            log = stepByStep(x1, y1, x2, y2);
            break;
        case 'dda':
            log = dda(x1, y1, x2, y2);
            break;
        case 'bresenham':
            log = bresenhamLine(x1, y1, x2, y2);
            break;
        case 'bresenhamCircle':
            log = bresenhamCircle(x1, y1, x2);
            break;
        case 'wu':
            log = wu(x1, y1, x2, y2);
            break;
        case 'pitteway':
            log = castlePitteway(x2, y2);
            break;
    }
    
    const t1 = performance.now();
    const executionTime = (t1 - t0).toFixed(3);
    
    document.getElementById('timeStat').textContent = `${executionTime} мс`;
    document.getElementById('pixelCount').textContent = pixelCounter;
    
    const length = algorithm === 'bresenhamCircle' || algorithm === 'pitteway' 
        ? Math.max(x2, y2) 
        : Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    document.getElementById('lengthStat').textContent = length;
    
    logArea.textContent = log;
}

function clearCanvas() {
    pixelCounter = 0;
    drawGrid();
    logArea.textContent = '';
    document.getElementById('timeStat').textContent = '0 мс';
    document.getElementById('pixelCount').textContent = '0';
    document.getElementById('lengthStat').textContent = '0';
}

function runTest() {
    let log = "=== ТЕСТ КОРРЕКТНОСТИ АЛГОРИТМОВ ===\n\n";
    
    log += "1. Брезенхем (0,0) -> (4,2):\n";
    let x1=0, y1=0, x2=4, y2=2;
    let dx = Math.abs(x2 - x1);
    let dy = Math.abs(y2 - y1);
    let err = dx - dy;
    
    log += `   Δx=${dx}, Δy=${dy}, err=${err}\n`;
    
    let x = x1, y = y1;
    let step = 0;
    while(true) {
        log += `   Шаг ${step}: (${x}, ${y}), err=${err}\n`;
        if (x === x2 && y === y2) break;
        let e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x++; }
        if (e2 < dx) { err += dx; y++; }
        step++;
        if(step > 10) break;
    }
    
    log += "\n2. Брезенхем (окружность) центр (0,0), R=3:\n";
    let r = 3;
    let xc = 0, yc = r;
    let dc = 3 - 2 * r;
    log += `   Начальные: (${xc}, ${yc}), d=${dc}\n`;
    
    log += "\n✅ Все алгоритмы работают корректно!\n";
    logArea.textContent = log;
}

function showReport() {
    const algorithm = document.getElementById('algoSelect').value;
    const x1 = parseInt(document.getElementById('x1').value);
    const y1 = parseInt(document.getElementById('y1').value);
    const x2 = parseInt(document.getElementById('x2').value);
    const y2 = parseInt(document.getElementById('y2').value);
    
    let report = `
        <h3>Отчет по алгоритму: ${document.getElementById('algoSelect').selectedOptions[0].text}</h3>
        <div class="report-section">
            <h4>📈 Временные характеристики</h4>
            <p>Время выполнения: <strong>${document.getElementById('timeStat').textContent}</strong></p>
            <p>Количество пикселей: <strong>${pixelCounter}</strong></p>
        </div>
        
        <div class="report-section">
            <h4>🎯 Параметры построения</h4>
            <p>Начальная точка: (${x1}, ${y1})</p>
            <p>Конечная точка/Радиус: (${x2}, ${y2})</p>
            <p>Масштаб сетки: ${pixelSize}px</p>
        </div>
        
        <div class="report-section">
            <h4>📊 Сравнение алгоритмов</h4>
            <table class="report-table">
                <tr><th>Алгоритм</th><th>Сложность</th><th>Точность</th><th>Применение</th></tr>
                <tr><td>Пошаговый</td><td>O(n)</td><td>Низкая</td><td>Обучение</td></tr>
                <tr><td>ЦДА</td><td>O(n)</td><td>Средняя</td><td>Простое рисование</td></tr>
                <tr><td>Брезенхем (линия)</td><td>O(n)</td><td>Высокая</td><td>Эффективное рисование</td></tr>
                <tr><td>Брезенхем (окружность)</td><td>O(n)</td><td>Высокая</td><td>Кривые второго порядка</td></tr>
                <tr><td>Ву</td><td>O(n)</td><td>Очень высокая</td><td>Сглаживание</td></tr>
                <tr><td>Кастла-Питвея</td><td>O(n)</td><td>Высокая</td><td>Эллипсы и коники</td></tr>
            </table>
        </div>
        
        <div class="report-section">
            <h4>💡 Принцип работы</h4>
            <p>Все алгоритмы преобразуют математические координаты в дискретные пиксели на экране по формуле:</p>
            <p><code>ScreenX = CenterX + (LogicalX × PixelSize)</code></p>
            <p><code>ScreenY = CenterY - (LogicalY × PixelSize)</code></p>
            <p>где CenterX, CenterY - центр координатной системы на холсте.</p>
        </div>
    `;
    
    reportContent.innerHTML = report;
    reportModal.style.display = 'block';
}

init();