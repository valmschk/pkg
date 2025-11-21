
const width = 2; 
const height = 2.5;
const depth = 0.5; 
const baseVertices = [
    {x: -1, y: -1, z: 0.25}, 
    {x: -1, y:  1, z: 0.25}, 
    {x: -0.6, y: 1, z: 0.25}, 
    {x: -0.6, y: -0.5, z: 0.25}, 
    {x: -1.0, y: -1.0, z: 0.25}, 
    {x: -1.0, y:  1.0, z: 0.25}, 
    {x: -0.7, y:  1.0, z: 0.25}, 
    {x:  0.0, y: -0.2, z: 0.25}, 
    {x:  0.7, y:  1.0, z: 0.25}, 
    {x:  1.0, y:  1.0, z: 0.25}, 
    {x:  1.0, y: -1.0, z: 0.25}, 
    {x:  0.7, y: -1.0, z: 0.25}, 
    {x:  0.5, y:  0.4, z: 0.25}, 
    {x:  0.0, y: -0.8, z: 0.25}, 
    {x: -0.5, y:  0.4, z: 0.25}, 
    {x: -0.7, y: -1.0, z: 0.25}, 
];

const numFront = baseVertices.length;
for(let i=0; i<numFront; i++) {
    baseVertices.push({ ...baseVertices[i], z: -0.25 });
}

const edges = [];
for(let i=0; i<numFront; i++) edges.push([i, (i+1)%numFront]);
for(let i=0; i<numFront; i++) edges.push([i+numFront, ((i+1)%numFront)+numFront]);
for(let i=0; i<numFront; i++) edges.push([i, i+numFront]);


const canvas3d = document.getElementById('canvas3d');
const ctx3d = canvas3d.getContext('2d');

const canvasesProj = {
    xy: document.getElementById('projXY').getContext('2d'),
    xz: document.getElementById('projXZ').getContext('2d'),
    yz: document.getElementById('projYZ').getContext('2d')
};

function resizeCanvas(canvas) {
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
}

function resizeAll() {
    resizeCanvas(canvas3d);
    resizeCanvas(document.getElementById('projXY'));
    resizeCanvas(document.getElementById('projXZ'));
    resizeCanvas(document.getElementById('projYZ'));
    drawScene();
}
window.addEventListener('resize', resizeAll);
setTimeout(resizeAll, 100); 
function identityMatrix() {
    return [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ];
}

function multiplyMatrices(a, b) {
    const result = new Array(16).fill(0);
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            let sum = 0;
            for (let k = 0; k < 4; k++) {
                sum += a[row * 4 + k] * b[k * 4 + col];
            }
            result[row * 4 + col] = sum;
        }
    }
    return result;
}

function transformVertex(v, m) {
    const x = v.x * m[0] + v.y * m[1] + v.z * m[2] + m[3];
    const y = v.x * m[4] + v.y * m[5] + v.z * m[6] + m[7];
    const z = v.x * m[8] + v.y * m[9] + v.z * m[10] + m[11];
    const w = v.x * m[12] + v.y * m[13] + v.z * m[14] + m[15];
    return { x: x, y: y, z: z };
}

function getScaleMatrix(s) {
    return [
        s, 0, 0, 0,
        0, s, 0, 0,
        0, 0, s, 0,
        0, 0, 0, 1
    ];
}

function getTranslationMatrix(tx, ty, tz) {
    return [
        1, 0, 0, tx,
        0, 1, 0, ty,
        0, 0, 1, tz,
        0, 0, 0, 1
    ];
}

function getRotationMatrix(ux, uy, uz, angleDeg) {
    const rad = angleDeg * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const oneMinusCos = 1 - cos;

    const len = Math.sqrt(ux*ux + uy*uy + uz*uz);
    if (len === 0) return identityMatrix();
    const x = ux/len, y = uy/len, z = uz/len;

    return [
        cos + x*x*oneMinusCos,      x*y*oneMinusCos - z*sin,    x*z*oneMinusCos + y*sin,    0,
        y*x*oneMinusCos + z*sin,    cos + y*y*oneMinusCos,      y*z*oneMinusCos - x*sin,    0,
        z*x*oneMinusCos - y*sin,    z*y*oneMinusCos + x*sin,    cos + z*z*oneMinusCos,      0,
        0,                          0,                          0,                          1
    ];
}

function getTransformData() {
    return {
        scale: parseFloat(document.getElementById('scale').value),
        tx: parseFloat(document.getElementById('tx').value) / 50, 
        ty: parseFloat(document.getElementById('ty').value) / 50, 
        tz: parseFloat(document.getElementById('tz').value) / 50,
        ax: parseFloat(document.getElementById('ax').value) || 0,
        ay: parseFloat(document.getElementById('ay').value) || 1,
        az: parseFloat(document.getElementById('az').value) || 0,
        angle: parseFloat(document.getElementById('angle').value)
    };
}

function renderMatrixOutput(m) {
    const container = document.getElementById('matrix-output');
    container.innerHTML = '';
    m.forEach(val => {
        const div = document.createElement('div');
        div.className = 'matrix-cell';
        div.innerText = val.toFixed(2);
        container.appendChild(div);
    });
}

function drawAxes(ctx, width, height, matrix = null) {
    const cx = width / 2;
    const cy = height / 2;
    const len = 100; 
    const origin = {x: 0, y: 0, z: 0};
    const xAxis = {x: 1, y: 0, z: 0};
    const yAxis = {x: 0, y: 1, z: 0};
    const zAxis = {x: 0, y: 0, z: 1};

    let o = origin, x = xAxis, y = yAxis, z = zAxis;
    if (matrix) {
      }
 ctx.lineWidth = 2;

    ctx.beginPath(); ctx.strokeStyle = 'red';
    ctx.moveTo(cx, cy); ctx.lineTo(cx + 50, cy); ctx.stroke();
    
    ctx.beginPath(); ctx.strokeStyle = 'green';
    ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - 50); ctx.stroke();

    ctx.beginPath(); ctx.strokeStyle = 'blue';
    ctx.moveTo(cx, cy); ctx.lineTo(cx - 30, cy + 30); ctx.stroke();
}

function projectPerspective(v, width, height) {
    const fov = 300;
    const distance = 4;
    const vizZ = v.z + distance;
    let scale = fov / (vizZ > 0.1 ? vizZ : 0.1);
    
    return {
        x: width/2 + v.x * scale,
        y: height/2 - v.y * scale 
    };
}

function projectOrtho(v, plane, w, h) {
    const scale = 40; 
    const cx = w / 2;
    const cy = h / 2;
    
    if (plane === 'xy') return { x: cx + v.x * scale, y: cy - v.y * scale };
    if (plane === 'xz') return { x: cx + v.x * scale, y: cy - v.z * scale }; 
    if (plane === 'yz') return { x: cx + v.y * scale, y: cy - v.z * scale };
}

function drawScene() {
    const data = getTransformData();

    document.getElementById('val-scale').innerText = data.scale;
    document.getElementById('val-angle').innerText = data.angle;

    const matScale = getScaleMatrix(data.scale);
    const matRot = getRotationMatrix(data.ax, data.ay, data.az, data.angle);
    const matTrans = getTranslationMatrix(data.tx, data.ty, data.tz);

    let finalMatrix = multiplyMatrices(matRot, matScale);
    finalMatrix = multiplyMatrices(matTrans, finalMatrix);

    renderMatrixOutput(finalMatrix);

    const transformedVertices = baseVertices.map(v => transformVertex(v, finalMatrix));

    ctx3d.clearRect(0, 0, canvas3d.width, canvas3d.height);
    Object.values(canvasesProj).forEach(ctx => {
        const c = ctx.canvas;
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(c.width/2, 0); ctx.lineTo(c.width/2, c.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, c.height/2); ctx.lineTo(c.width, c.height/2); ctx.stroke();
    });

    drawAxes(ctx3d, canvas3d.width, canvas3d.height); 
    ctx3d.strokeStyle = '#6c5ce7'; 
    ctx3d.lineWidth = 2;
    ctx3d.lineJoin = 'round';

    edges.forEach(edge => {
        const p1 = transformedVertices[edge[0]];
        const p2 = transformedVertices[edge[1]];

        const v1 = projectPerspective(p1, canvas3d.width, canvas3d.height);
        const v2 = projectPerspective(p2, canvas3d.width, canvas3d.height);

        ctx3d.beginPath();
        ctx3d.moveTo(v1.x, v1.y);
        ctx3d.lineTo(v2.x, v2.y);
        ctx3d.stroke();
    });

    ctx3d.fillStyle = '#a29bfe';
    transformedVertices.forEach(v => {
        const p = projectPerspective(v, canvas3d.width, canvas3d.height);
        ctx3d.beginPath();
        ctx3d.arc(p.x, p.y, 3, 0, Math.PI*2);
        ctx3d.fill();
    });

    const planes = [
        { ctx: canvasesProj.xy, type: 'xy' },
        { ctx: canvasesProj.xz, type: 'xz' },
        { ctx: canvasesProj.yz, type: 'yz' }
    ];

    planes.forEach(planeObj => {
        const ctx = planeObj.ctx;
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;
        
        ctx.strokeStyle = '#2d3436';
        ctx.lineWidth = 1.5;

        edges.forEach(edge => {
            const p1 = transformedVertices[edge[0]];
            const p2 = transformedVertices[edge[1]];

            const v1 = projectOrtho(p1, planeObj.type, w, h);
            const v2 = projectOrtho(p2, planeObj.type, w, h);

            ctx.beginPath();
            ctx.moveTo(v1.x, v1.y);
            ctx.lineTo(v2.x, v2.y);
            ctx.stroke();
        });
    });
}

const inputs = document.querySelectorAll('input');
inputs.forEach(inp => {
    inp.addEventListener('input', drawScene);
});

function resetTransform() {
    document.getElementById('scale').value = 1;
    document.getElementById('tx').value = 0;
    document.getElementById('ty').value = 0;
    document.getElementById('tz').value = 0;
    document.getElementById('angle').value = 0;
    document.getElementById('ax').value = 0;
    document.getElementById('ay').value = 1;
    document.getElementById('az').value = 0;
    drawScene();
}

drawScene();