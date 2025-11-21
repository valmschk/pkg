const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const fileInput = document.getElementById('fileInput');
const logDiv = document.getElementById('log');
const coordinatesDiv = document.getElementById('coordinates');
const fileNameDiv = document.getElementById('fileName');

let segments = [];
let polygonVertices = [];
let clipWindow = { xmin: 0, ymin: 0, xmax: 0, ymax: 0 };
let isDataLoaded = false;

const INSIDE = 0;
const LEFT = 1;
const RIGHT = 2;
const BOTTOM = 4;
const TOP = 8;

let transform = { scale: 1, offsetX: 0, offsetY: 0, minX: 0, minY: 0 };

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    fileNameDiv.textContent = file.name;
    fileNameDiv.style.color = '#10b981';
    
    const reader = new FileReader();
    reader.onload = (event) => {
        parseFileContent(event.target.result);
        processData();
    };
    reader.readAsText(file);
});

document.querySelectorAll('input[name="mode"]').forEach(radio => {
    radio.addEventListener('change', () => {
        if (isDataLoaded) {
            processData();
        }
    });
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    if (isDataLoaded) {
        const logicalCoords = screenToLogical(x, y);
        coordinatesDiv.textContent = `X: ${logicalCoords.x.toFixed(1)}, Y: ${logicalCoords.y.toFixed(1)}`;
    }
});

function parseFileContent(text) {
    const tokens = text.trim().split(/\s+/).map(Number);
    
    if (tokens.length < 5) {
        showError("Файл слишком короткий или неверный формат!");
        return;
    }

    let ptr = 0;
    const n = tokens[ptr++];
    
    const mode = document.querySelector('input[name="mode"]:checked').value;
    
    segments = [];
    polygonVertices = [];

    if (mode === 'lines') {
        for (let i = 0; i < n; i++) {
            if (ptr + 3 >= tokens.length) {
                showError("Недостаточно координат для отрезков!");
                return;
            }
            segments.push({
                x1: tokens[ptr++],
                y1: tokens[ptr++],
                x2: tokens[ptr++],
                y2: tokens[ptr++]
            });
        }
    } else {
        for (let i = 0; i < n; i++) {
            if (ptr + 1 >= tokens.length) {
                showError("Недостаточно координат для вершин многоугольника!");
                return;
            }
            polygonVertices.push({
                x: tokens[ptr++],
                y: tokens[ptr++]
            });
        }
    }

    if (ptr + 3 >= tokens.length) {
        showError("Недостаточно координат для окна отсечения!");
        return;
    }

    clipWindow.xmin = tokens[ptr++];
    clipWindow.ymin = tokens[ptr++];
    clipWindow.xmax = tokens[ptr++];
    clipWindow.ymax = tokens[ptr++];

    if (clipWindow.xmin > clipWindow.xmax) [clipWindow.xmin, clipWindow.xmax] = [clipWindow.xmax, clipWindow.xmin];
    if (clipWindow.ymin > clipWindow.ymax) [clipWindow.ymin, clipWindow.ymax] = [clipWindow.ymax, clipWindow.ymin];

    isDataLoaded = true;
    
    if (mode === 'lines') {
        logDiv.innerHTML = `<span style="color: #10b981">✓ Загружено: ${n} отрезков</span>\nОкно: [${clipWindow.xmin}, ${clipWindow.ymin}] - [${clipWindow.xmax}, ${clipWindow.ymax}]`;
    } else {
        logDiv.innerHTML = `<span style="color: #10b981">✓ Загружено: ${n} вершин многоугольника</span>\nОкно: [${clipWindow.xmin}, ${clipWindow.ymin}] - [${clipWindow.xmax}, ${clipWindow.ymax}]`;
    }
}

function processData() {
    if (!isDataLoaded) return;

    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    let allX = [clipWindow.xmin, clipWindow.xmax];
    let allY = [clipWindow.ymin, clipWindow.ymax];
    
    const mode = document.querySelector('input[name="mode"]:checked').value;
    
    if (mode === 'lines') {
        segments.forEach(s => {
            allX.push(s.x1, s.x2);
            allY.push(s.y1, s.y2);
        });
    } else {
        polygonVertices.forEach(v => {
            allX.push(v.x);
            allY.push(v.y);
        });
    }

    const minX = Math.min(...allX);
    const maxX = Math.max(...allX);
    const minY = Math.min(...allY);
    const maxY = Math.max(...allY);

    transform.minX = minX;
    transform.minY = minY;

    const padding = 80;
    const scaleX = (canvas.width - padding * 2) / (maxX - minX || 1);
    const scaleY = (canvas.height - padding * 2) / (maxY - minY || 1);
    transform.scale = Math.min(scaleX, scaleY);

    transform.offsetX = padding - minX * transform.scale;
    transform.offsetY = canvas.height - padding + minY * transform.scale;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawCoordinateSystem();

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    
    if (mode === 'lines') {
        segments.forEach(s => {
            const p1 = toScreen(s.x1, s.y1);
            const p2 = toScreen(s.x2, s.y2);
            drawLine(p1, p2);
        });
    } else {
        drawPolygon(polygonVertices, false);
    }
    ctx.setLineDash([]);

    drawClipWindow();

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';

    if (mode === 'lines') {
        segments.forEach(s => {
            const clipped = cohenSutherland(s.x1, s.y1, s.x2, s.y2);
            if (clipped) {
                const p1 = toScreen(clipped.x1, clipped.y1);
                const p2 = toScreen(clipped.x2, clipped.y2);
                drawLine(p1, p2);
                drawPoint(p1, '#10b981');
                drawPoint(p2, '#10b981');
            }
        });
    } else {
        const clippedPoly = sutherlandHodgman(polygonVertices, clipWindow);
        if (clippedPoly.length > 0) {
            drawPolygon(clippedPoly, true);
        }
    }
}

function toScreen(x, y) {
    return {
        x: transform.offsetX + x * transform.scale,
        y: transform.offsetY - y * transform.scale
    };
}

function screenToLogical(screenX, screenY) {
    return {
        x: (screenX - transform.offsetX) / transform.scale,
        y: (transform.offsetY - screenY) / transform.scale
    };
}

function drawLine(p1, p2) {
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
}

function drawPoint(p, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
}

function drawPolygon(vertices, isClipped) {
    if (vertices.length === 0) return;

    ctx.beginPath();
    const start = toScreen(vertices[0].x, vertices[0].y);
    ctx.moveTo(start.x, start.y);

    for (let i = 1; i < vertices.length; i++) {
        const p = toScreen(vertices[i].x, vertices[i].y);
        ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();

    if (isClipped) {
        ctx.fill();
        ctx.stroke();
        vertices.forEach(vertex => {
            const p = toScreen(vertex.x, vertex.y);
            drawPoint(p, '#10b981');
        });
    } else {
        ctx.stroke();
    }
}

function drawClipWindow() {
    const p1 = toScreen(clipWindow.xmin, clipWindow.ymin);
    const p2 = toScreen(clipWindow.xmax, clipWindow.ymax);
    
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(239, 68, 68, 0.05)';
    
    ctx.beginPath();
    ctx.rect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
    ctx.fill();
    ctx.stroke();
}

function drawGrid() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    const step = 50;
    const startX = Math.floor(transform.minX / step) * step;
    const endX = startX + Math.ceil(canvas.width / (transform.scale * step)) * step;
    
    for (let x = startX; x <= endX; x += step) {
        const p1 = toScreen(x, transform.minY);
        const p2 = toScreen(x, transform.minY + canvas.height / transform.scale);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    }
}

function drawCoordinateSystem() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    
    if (0 >= transform.minY && 0 <= transform.minY + canvas.height / transform.scale) {
        const p1 = toScreen(transform.minX, 0);
        const p2 = toScreen(transform.minX + canvas.width / transform.scale, 0);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    }
    
    if (0 >= transform.minX && 0 <= transform.minX + canvas.width / transform.scale) {
        const p1 = toScreen(0, transform.minY);
        const p2 = toScreen(0, transform.minY + canvas.height / transform.scale);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    }
}

function computeCode(x, y) {
    let code = INSIDE;
    if (x < clipWindow.xmin) code |= LEFT;
    else if (x > clipWindow.xmax) code |= RIGHT;
    if (y < clipWindow.ymin) code |= BOTTOM;
    else if (y > clipWindow.ymax) code |= TOP;
    return code;
}

function cohenSutherland(x1, y1, x2, y2) {
    let code1 = computeCode(x1, y1);
    let code2 = computeCode(x2, y2);
    let accept = false;

    while (true) {
        if ((code1 | code2) === 0) {
            accept = true;
            break;
        } else if ((code1 & code2) !== 0) {
            break;
        } else {
            let codeOut = code1 !== 0 ? code1 : code2;
            let x, y;

            if (codeOut & TOP) {
                x = x1 + (x2 - x1) * (clipWindow.ymax - y1) / (y2 - y1);
                y = clipWindow.ymax;
            } else if (codeOut & BOTTOM) {
                x = x1 + (x2 - x1) * (clipWindow.ymin - y1) / (y2 - y1);
                y = clipWindow.ymin;
            } else if (codeOut & RIGHT) {
                y = y1 + (y2 - y1) * (clipWindow.xmax - x1) / (x2 - x1);
                x = clipWindow.xmax;
            } else if (codeOut & LEFT) {
                y = y1 + (y2 - y1) * (clipWindow.xmin - x1) / (x2 - x1);
                x = clipWindow.xmin;
            }

            if (codeOut === code1) {
                x1 = x;
                y1 = y;
                code1 = computeCode(x1, y1);
            } else {
                x2 = x;
                y2 = y;
                code2 = computeCode(x2, y2);
            }
        }
    }
    if (accept) return { x1, y1, x2, y2 };
    return null;
}

function sutherlandHodgman(subjectPoly, clipRect) {
    let outputList = subjectPoly;

    const edges = [
        { type: 'left', val: clipRect.xmin },
        { type: 'right', val: clipRect.xmax },
        { type: 'bottom', val: clipRect.ymin },
        { type: 'top', val: clipRect.ymax }
    ];

    edges.forEach(edge => {
        const inputList = outputList;
        outputList = [];
        if (inputList.length === 0) return;

        let s = inputList[inputList.length - 1];

        inputList.forEach(e => {
            if (isInside(e, edge)) {
                if (!isInside(s, edge)) {
                    outputList.push(intersection(s, e, edge));
                }
                outputList.push(e);
            } else if (isInside(s, edge)) {
                outputList.push(intersection(s, e, edge));
            }
            s = e;
        });
    });

    return outputList;
}

function isInside(p, edge) {
    switch(edge.type) {
        case 'left': return p.x >= edge.val;
        case 'right': return p.x <= edge.val;
        case 'bottom': return p.y >= edge.val;
        case 'top': return p.y <= edge.val;
    }
}

function intersection(cp1, cp2, edge) {
    if (edge.type === 'left' || edge.type === 'right') {
        return {
            x: edge.val,
            y: cp1.y + (edge.val - cp1.x) * (cp2.y - cp1.y) / (cp2.x - cp1.x)
        };
    } else {
        return {
            x: cp1.x + (edge.val - cp1.y) * (cp2.x - cp1.x) / (cp2.y - cp1.y),
            y: edge.val
        };
    }
}

function showError(message) {
    logDiv.innerHTML = `<span style="color: #ef4444">✗ ${message}</span>`;
}

window.addEventListener('resize', () => {
    if (isDataLoaded) processData();
});