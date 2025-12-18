
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const round = (v, d = 3) => Number(Number(v).toFixed(d));
const isNum = v => isFinite(Number(v));
const D65 = { X: 95.047, Y: 100.000, Z: 108.883 };

function rgbToHsv(r, g, b) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h = h * 60;
    if (h < 0) h += 360;
  }
  const v = max;
  const s = max === 0 ? 0 : d / max;
  return { h: round(h), s: round(s * 100), v: round(v * 100) };
}

function hsvToRgb(h, s, v) {
  s = isFinite(s) ? s / 100 : 0;
  v = isFinite(v) ? v / 100 : 0;
  h = isFinite(h) ? ((h % 360) + 360) % 360 : 0;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let rp = 0, gp = 0, bp = 0;
  if (0 <= h && h < 60) { rp = c; gp = x; bp = 0; }
  else if (60 <= h && h < 120) { rp = x; gp = c; bp = 0; }
  else if (120 <= h && h < 180) { rp = 0; gp = c; bp = x; }
  else if (180 <= h && h < 240) { rp = 0; gp = x; bp = c; }
  else if (240 <= h && h < 300) { rp = x; gp = 0; bp = c; }
  else { rp = c; gp = 0; bp = x; }
  const r = round((rp + m) * 255);
  const g = round((gp + m) * 255);
  const b = round((bp + m) * 255);
  return { r: clamp(r, 0, 255), g: clamp(g, 0, 255), b: clamp(b, 0, 255) };
}

function rgbToHsl(r, g, b) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h = h * 60;
    if (h < 0) h += 360;
  }
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { h: round(h), s: round(s * 100), l: round(l * 100) };
}

function hslToRgb(h, s, l) {
  h = isFinite(h) ? ((h % 360) + 360) % 360 : 0;
  s = isFinite(s) ? s / 100 : 0;
  l = isFinite(l) ? l / 100 : 0;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let rp = 0, gp = 0, bp = 0;
  if (0 <= h && h < 60) { rp = c; gp = x; bp = 0; }
  else if (60 <= h && h < 120) { rp = x; gp = c; bp = 0; }
  else if (120 <= h && h < 180) { rp = 0; gp = c; bp = x; }
  else if (180 <= h && h < 240) { rp = 0; gp = x; bp = c; }
  else if (240 <= h && h < 300) { rp = x; gp = 0; bp = c; }
  else { rp = c; gp = 0; bp = x; }
  const r = round((rp + m) * 255);
  const g = round((gp + m) * 255);
  const b = round((bp + m) * 255);
  return { r: clamp(r, 0, 255), g: clamp(g, 0, 255), b: clamp(b, 0, 255) };
}

function rgbToCmyk(r, g, b) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const k = 1 - Math.max(rn, gn, bn);
  if (k >= 1 - 1e-9) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }
  const c = (1 - rn - k) / (1 - k);
  const m = (1 - gn - k) / (1 - k);
  const y = (1 - bn - k) / (1 - k);
  return { c: round(c * 100), m: round(m * 100), y: round(y * 100), k: round(k * 100) };
}

function cmykToRgb(c, m, y, k) {
  const C = c / 100, M = m / 100, Y = y / 100, K = k / 100;
  const rawR = 255 * (1 - C) * (1 - K);
  const rawG = 255 * (1 - M) * (1 - K);
  const rawB = 255 * (1 - Y) * (1 - K);
  const ri = Math.round(rawR), gi = Math.round(rawG), bi = Math.round(rawB);
  return {
    raw: { r: rawR, g: rawG, b: rawB },
    rgb: { r: clamp(ri, 0, 255), g: clamp(gi, 0, 255), b: clamp(bi, 0, 255) }
  };
}

function RGBtoXYZ(r, g, b) {
  let rn = r / 255, gn = g / 255, bn = b / 255;
  const invGamma = v => v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  rn = invGamma(rn); gn = invGamma(gn); bn = invGamma(bn);
  const X = (rn * 0.4124564 + gn * 0.3575761 + bn * 0.1804375) * 100;
  const Y = (rn * 0.2126729 + gn * 0.7151522 + bn * 0.0721750) * 100;
  const Z = (rn * 0.0193339 + gn * 0.1191920 + bn * 0.9503041) * 100;
  return { X: round(X), Y: round(Y), Z: round(Z) };
}

function XYZtoRGB(X, Y, Z) {
  let x = X / 100, y = Y / 100, z = Z / 100;
  let rn = x * 3.2404542 + y * -1.5371385 + z * -0.4985314;
  let gn = x * -0.9692660 + y * 1.8760108 + z * 0.0415560;
  let bn = x * 0.0556434 + y * -0.2040259 + z * 1.0572252;
  const gamma = v => v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  let r = gamma(rn), g = gamma(gn), b = gamma(bn);
  const raw = { r: r * 255, g: g * 255, b: b * 255 };
  const clamped = { r: clamp(Math.round(raw.r), 0, 255), g: clamp(Math.round(raw.g), 0, 255), b: clamp(Math.round(raw.b), 0, 255) };
  return { raw, rgb: clamped };
}

function XYZtoLAB(X, Y, Z) {
  let xr = X / D65.X, yr = Y / D65.Y, zr = Z / D65.Z;
  const f = t => t > 0.008856 ? Math.pow(t, 1 / 3) : (7.787 * t + 16 / 116);
  const fx = f(xr), fy = f(yr), fz = f(zr);
  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const b = 200 * (fy - fz);
  return { L: round(L), a: round(a), b: round(b) };
}

function LABtoXYZ(L, a, b) {
  const fy = (L + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;
  const fInv = t => (Math.pow(t, 3) > 0.008856) ? Math.pow(t, 3) : ((t - 16 / 116) / 7.787);
  const xr = fInv(fx), yr = fInv(fy), zr = fInv(fz);
  const X = xr * D65.X, Y = yr * D65.Y, Z = zr * D65.Z;
  return { X: round(X), Y: round(Y), Z: round(Z) };
}

function rgbToHex(r, g, b) {
  const toHex = n => {
    const v = clamp(Math.round(n), 0, 255);
    return v.toString(16).padStart(2, '0');
  };
  return "#" + [r, g, b].map(toHex).join('').toUpperCase();
}

const $ = id => document.getElementById(id);
const parts = {
  rInput: $('rInput'), gInput: $('gInput'), bInput: $('bInput'),
  rRange: $('rRange'), gRange: $('gRange'), bRange: $('bRange'),
  cInput: $('cInput'), mInput: $('mInput'), yInput: $('yInput'), kInput: $('kInput'),
  cRange: $('cRange'), mRange: $('mRange'), yRange: $('yRange'), kRange: $('kRange'),
  hInput: $('hInput'), sInput: $('sInput'), vInput: $('vInput'),
  hRange: $('hRange'), sRange: $('sRange'), vRange: $('vRange'),
  hhInput: $('hhInput'), slInput: $('slInput'), llInput: $('llInput'),
  hhRange: $('hhRange'), slRange: $('slRange'), llRange: $('llRange'),
  xInput: $('xInput'), yInputXYZ: $('yInputXYZ'), zInput: $('zInput'),
  lInput: $('lInput'), aInput: $('aInput'), b2Input: $('b2Input'),
  colorPicker: $('colorPicker'), swatch: $('swatch'),
  hexOut: $('hexOut'), cssOut: $('cssOut'),
  warning: $('warning'), cieCanvas: $('cieCanvas')
};

let suspend = false;

function setRGBUI(r, g, b) {
  parts.rInput.value = Math.round(r);
  parts.gInput.value = Math.round(g);
  parts.bInput.value = Math.round(b);
  parts.rRange.value = Math.round(r);
  parts.gRange.value = Math.round(g);
  parts.bRange.value = Math.round(b);
}

function setCMYKUI(c, m, y, k) {
  parts.cInput.value = round(c);
  parts.mInput.value = round(m);
  parts.yInput.value = round(y);
  parts.kInput.value = round(k);
  parts.cRange.value = round(c);
  parts.mRange.value = round(m);
  parts.yRange.value = round(y);
  parts.kRange.value = round(k);
}

function setHSVUI(h, s, v) {
  const hValue = Number(round(h));
  parts.hInput.value = round(h);
  parts.sInput.value = round(s);
  parts.vInput.value = round(v);
  parts.hRange.value = hValue === 360 ? 360 : round(h);
  parts.sRange.value = round(s);
  parts.vRange.value = round(v);
}

function setHSLUI(h, s, l) {
  const hValue = Number(round(h));
  parts.hhInput.value = round(h);
  parts.slInput.value = round(s);
  parts.llInput.value = round(l);
  parts.hhRange.value = hValue === 360 ? 360 : round(h);
  parts.slRange.value = round(s);
  parts.llRange.value = round(l);
}

function setXYZUI(X, Y, Z) {
  parts.xInput.value = round(X, 2);
  parts.yInputXYZ.value = round(Y, 2);
  parts.zInput.value = round(Z, 2);
}

function setLABUI(L, a, b) {
  parts.lInput.value = round(L, 2);
  parts.aInput.value = round(a, 2);
  parts.b2Input.value = round(b, 2);
}

function setPicker(hex) {
  parts.colorPicker.value = hex;
}

function setSwatch(hex) {
  if (parts.swatch) parts.swatch.style.background = hex;
  if (parts.hexOut) parts.hexOut.textContent = hex.toUpperCase();
  if (parts.cssOut) parts.cssOut.textContent = `background: ${hex};`;
}

let _warnT = null;

function showWarning(text) {
  if (!parts.warning) return;
  if (!text) {
    parts.warning.classList.add('hidden');
    parts.warning.textContent = '';
    return;
  }
  parts.warning.textContent = text;
  parts.warning.classList.remove('hidden');
  clearTimeout(_warnT);
  _warnT = setTimeout(() => {
    parts.warning.classList.add('hidden');
  }, 3500);
}

function toNumber(v, fallback = 0) { 
  const n = Number(v); 
  return isFinite(n) ? n : fallback; 
}

function updateFromRGB(r, g, b, cause = 'rgb') {
  if (suspend) return;
  suspend = true;
  try {
    const rn = clamp(Math.round(toNumber(r)), 0, 255);
    const gn = clamp(Math.round(toNumber(g)), 0, 255);
    const bn = clamp(Math.round(toNumber(b)), 0, 255);
    
    if (cause !== 'rgb') {
      setRGBUI(rn, gn, bn);
    }
    
    const cmyk = rgbToCmyk(rn, gn, bn);
    if (cause !== 'cmyk') {
      setCMYKUI(cmyk.c, cmyk.m, cmyk.y, cmyk.k);
    }
    
    const hsv = rgbToHsv(rn, gn, bn);
    if (cause !== 'hsv') {
      setHSVUI(hsv.h, hsv.s, hsv.v);
    }
    
    const hsl = rgbToHsl(rn, gn, bn);
    if (cause !== 'hsl') {
      setHSLUI(hsl.h, hsl.s, hsl.l);
    }
    
    const xyz = RGBtoXYZ(rn, gn, bn);
    if (cause !== 'xyz') {
      setXYZUI(xyz.X, xyz.Y, xyz.Z);
    }
    
    const lab = XYZtoLAB(xyz.X, xyz.Y, xyz.Z);
    if (cause !== 'lab') {
      setLABUI(lab.L, lab.a, lab.b);
    }
    
    const hex = rgbToHex(rn, gn, bn);
    setPicker(hex); 
    setSwatch(hex);
    
    showWarning('');
    
    if (typeof drawCIEPointFromXYZ === 'function') {
      drawCIEPointFromXYZ(xyz.X, xyz.Y, xyz.Z);
    }
  } finally {
    suspend = false;
  }
}

function updateFromCMYK(c, m, y, k) {
  const cn = clamp(toNumber(c), 0, 100);
  const mn = clamp(toNumber(m), 0, 100);
  const yn = clamp(toNumber(y), 0, 100);
  const kn = clamp(toNumber(k), 0, 100);
  
  setCMYKUI(cn, mn, yn, kn);
  
  const result = cmykToRgb(cn, mn, yn, kn);
  const rgb = result.rgb;
  
  updateFromRGB(rgb.r, rgb.g, rgb.b, 'cmyk');
  
  const raw = result.raw;
  if (raw.r < 0 || raw.r > 255 || raw.g < 0 || raw.g > 255 || raw.b < 0 || raw.b > 255) {
    showWarning('Внимание: при преобразовании CMYK→RGB некоторые компоненты были обрезаны до допустимого диапазона.');
  }
}

function updateFromHSV(h, s, v) {
  let hn = toNumber(h);
  if (hn === 360) {
    hn = 360; 
  } else {
    hn = ((hn % 360) + 360) % 360; 
  }
  
  const sn = clamp(toNumber(s), 0, 100);
  const vn = clamp(toNumber(v), 0, 100);
  
  setHSVUI(hn, sn, vn);
  
  const rgb = hsvToRgb(hn, sn, vn);
  
  updateFromRGB(rgb.r, rgb.g, rgb.b, 'hsv');
}

function updateFromHSL(h, s, l) {
  let hn = toNumber(h);
  if (hn === 360) {
    hn = 360; 
  } else {
    hn = ((hn % 360) + 360) % 360; 
  }
  
  const sn = clamp(toNumber(s), 0, 100);
  const ln = clamp(toNumber(l), 0, 100);
  
  setHSLUI(hn, sn, ln);
  
  const rgb = hslToRgb(hn, sn, ln);
  
  updateFromRGB(rgb.r, rgb.g, rgb.b, 'hsl');
}

function updateFromXYZ(X, Y, Z) {
  const Xn = toNumber(X, 0);
  const Yn = toNumber(Y, 0);
  const Zn = toNumber(Z, 0);
  
  setXYZUI(Xn, Yn, Zn);
  
  const result = XYZtoRGB(Xn, Yn, Zn);
  const rgb = result.rgb;
  
  updateFromRGB(rgb.r, rgb.g, rgb.b, 'xyz');
  
  const raw = result.raw;
  if (raw.r < 0 || raw.r > 255 || raw.g < 0 || raw.g > 255 || raw.b < 0 || raw.b > 255) {
    showWarning('Внимание: XYZ → RGB привело к выходу за sRGB гамму; цвет был приведён к допустимому диапазону.');
  }
}

function updateFromLAB(L, a, b) {
  const Ln = toNumber(L, 0);
  const an = toNumber(a, 0);
  const bn = toNumber(b, 0);
  
  setLABUI(Ln, an, bn);
  
  const xyz = LABtoXYZ(Ln, an, bn);
  
  updateFromXYZ(xyz.X, xyz.Y, xyz.Z);
}

function attachEvents() {
  if (parts.rInput) parts.rInput.addEventListener('input', () => updateFromRGB(parts.rInput.value, parts.gInput.value, parts.bInput.value, 'rgb'));
  if (parts.gInput) parts.gInput.addEventListener('input', () => updateFromRGB(parts.rInput.value, parts.gInput.value, parts.bInput.value, 'rgb'));
  if (parts.bInput) parts.bInput.addEventListener('input', () => updateFromRGB(parts.rInput.value, parts.gInput.value, parts.bInput.value, 'rgb'));
  
  if (parts.rRange) parts.rRange.addEventListener('input', () => updateFromRGB(parts.rRange.value, parts.gRange.value, parts.bRange.value, 'rgb'));
  if (parts.gRange) parts.gRange.addEventListener('input', () => updateFromRGB(parts.rRange.value, parts.gRange.value, parts.bRange.value, 'rgb'));
  if (parts.bRange) parts.bRange.addEventListener('input', () => updateFromRGB(parts.rRange.value, parts.gRange.value, parts.bRange.value, 'rgb'));

  if (parts.cInput) parts.cInput.addEventListener('input', () => updateFromCMYK(parts.cInput.value, parts.mInput.value, parts.yInput.value, parts.kInput.value));
  if (parts.mInput) parts.mInput.addEventListener('input', () => updateFromCMYK(parts.cInput.value, parts.mInput.value, parts.yInput.value, parts.kInput.value));
  if (parts.yInput) parts.yInput.addEventListener('input', () => updateFromCMYK(parts.cInput.value, parts.mInput.value, parts.yInput.value, parts.kInput.value));
  if (parts.kInput) parts.kInput.addEventListener('input', () => updateFromCMYK(parts.cInput.value, parts.mInput.value, parts.yInput.value, parts.kInput.value));
  
  if (parts.cRange) parts.cRange.addEventListener('input', () => updateFromCMYK(parts.cRange.value, parts.mRange.value, parts.yRange.value, parts.kRange.value));
  if (parts.mRange) parts.mRange.addEventListener('input', () => updateFromCMYK(parts.cRange.value, parts.mRange.value, parts.yRange.value, parts.kRange.value));
  if (parts.yRange) parts.yRange.addEventListener('input', () => updateFromCMYK(parts.cRange.value, parts.mRange.value, parts.yRange.value, parts.kRange.value));
  if (parts.kRange) parts.kRange.addEventListener('input', () => updateFromCMYK(parts.cRange.value, parts.mRange.value, parts.yRange.value, parts.kRange.value));

  if (parts.hInput) parts.hInput.addEventListener('input', () => updateFromHSV(parts.hInput.value, parts.sInput.value, parts.vInput.value));
  if (parts.sInput) parts.sInput.addEventListener('input', () => updateFromHSV(parts.hInput.value, parts.sInput.value, parts.vInput.value));
  if (parts.vInput) parts.vInput.addEventListener('input', () => updateFromHSV(parts.hInput.value, parts.sInput.value, parts.vInput.value));
  
  if (parts.hRange) parts.hRange.addEventListener('input', () => {
    let hValue = parts.hRange.value;
    if (hValue >= 359.5) hValue = 360;
    updateFromHSV(hValue, parts.sInput.value, parts.vInput.value);
  });
  if (parts.sRange) parts.sRange.addEventListener('input', () => {
    updateFromHSV(parts.hInput.value, parts.sRange.value, parts.vInput.value);
  });
  if (parts.vRange) parts.vRange.addEventListener('input', () => {
    updateFromHSV(parts.hInput.value, parts.sInput.value, parts.vRange.value);
  });

  if (parts.hhInput) parts.hhInput.addEventListener('input', () => updateFromHSL(parts.hhInput.value, parts.slInput.value, parts.llInput.value));
  if (parts.slInput) parts.slInput.addEventListener('input', () => updateFromHSL(parts.hhInput.value, parts.slInput.value, parts.llInput.value));
  if (parts.llInput) parts.llInput.addEventListener('input', () => updateFromHSL(parts.hhInput.value, parts.slInput.value, parts.llInput.value));
  
  if (parts.hhRange) parts.hhRange.addEventListener('input', () => {
    let hValue = parts.hhRange.value;
    if (hValue >= 359.5) hValue = 360;
    updateFromHSL(hValue, parts.slInput.value, parts.llInput.value);
  });
  if (parts.slRange) parts.slRange.addEventListener('input', () => {
    updateFromHSL(parts.hhInput.value, parts.slRange.value, parts.llInput.value);
  });
  if (parts.llRange) parts.llRange.addEventListener('input', () => {
    updateFromHSL(parts.hhInput.value, parts.slInput.value, parts.llRange.value);
  });

  if (parts.xInput) parts.xInput.addEventListener('input', () => updateFromXYZ(parts.xInput.value, parts.yInputXYZ.value, parts.zInput.value));
  if (parts.yInputXYZ) parts.yInputXYZ.addEventListener('input', () => updateFromXYZ(parts.xInput.value, parts.yInputXYZ.value, parts.zInput.value));
  if (parts.zInput) parts.zInput.addEventListener('input', () => updateFromXYZ(parts.xInput.value, parts.yInputXYZ.value, parts.zInput.value));

  if (parts.lInput) parts.lInput.addEventListener('input', () => updateFromLAB(parts.lInput.value, parts.aInput.value, parts.b2Input.value));
  if (parts.aInput) parts.aInput.addEventListener('input', () => updateFromLAB(parts.lInput.value, parts.aInput.value, parts.b2Input.value));
  if (parts.b2Input) parts.b2Input.addEventListener('input', () => updateFromLAB(parts.lInput.value, parts.aInput.value, parts.b2Input.value));

  if (parts.colorPicker) {
    parts.colorPicker.addEventListener('input', e => {
      const hex = e.target.value;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      updateFromRGB(r, g, b, 'picker');
    });
  }

  document.querySelectorAll('.presetRow button').forEach(btn => {
    btn.addEventListener('click', e => {
      const hex = e.currentTarget.dataset.hex;
      if (!hex) return;
      if (parts.colorPicker) parts.colorPicker.value = hex;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      updateFromRGB(r, g, b, 'preset');
    });
  });

  document.querySelectorAll('input[type=number]').forEach(inp => {
    inp.addEventListener('keydown', e => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        const step = e.key === 'ArrowUp' ? 1 : -1;
        const min = inp.hasAttribute('min') ? Number(inp.getAttribute('min')) : -Infinity;
        const max = inp.hasAttribute('max') ? Number(inp.getAttribute('max')) : Infinity;
        const val = toNumber(inp.value, 0) + step;
        inp.value = clamp(val, min, max);
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        e.preventDefault();
      }
    });
  });

  initCIECanvas();
}

function initCIECanvas() {
  const canvas = parts.cieCanvas;
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  
  const img = ctx.createImageData(w, h);
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const x = i / (w - 1) * 0.8;
      const y = 1 - (j / (h - 1) * 0.9);
      const Y = 1.0;
      const X = (x * Y) / (y || 1e-9);
      const Z = ((1 - x - y) * Y) / (y || 1e-9);
      
      const conv = XYZtoRGB(X * 100, Y * 100, Z * 100);
      const r = conv.rgb.r, g = conv.rgb.g, b = conv.rgb.b;
      
      const idx = (j * w + i) * 4;
      img.data[idx] = r; 
      img.data[idx + 1] = g; 
      img.data[idx + 2] = b; 
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  function drawPoint(px, py) {
    ctx.putImageData(img, 0, 0);
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
  }

  function drawPointFromXYZ(X, Y, Z) {
    const sum = X + Y + Z;
    if (sum === 0) return;
    const x = X / sum, y = Y / sum;
    const px = Math.round(x / 0.8 * (w - 1));
    const py = Math.round((1 - y) / 0.9 * (h - 1));
    drawPoint(px, py);
  }

  const currXYZ = RGBtoXYZ(
    toNumber(parts.rInput.value || 255), 
    toNumber(parts.gInput.value || 77), 
    toNumber(parts.bInput.value || 138)
  );
  drawPointFromXYZ(currXYZ.X, currXYZ.Y, currXYZ.Z);

  window.drawCIEPointFromXYZ = function (X, Y, Z) {
    drawPointFromXYZ(X, Y, Z);
  };

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const px = Math.round((e.clientX - rect.left) * scaleX);
    const py = Math.round((e.clientY - rect.top) * scaleY);
    
    const x = px / (w - 1) * 0.8;
    const y = 1 - (py / (h - 1) * 0.9);
    
    const Yval = 1.0;
    const Xval = (x * Yval) / (y || 1e-9);
    const Zval = ((1 - x - y) * Yval) / (y || 1e-9);
    
    const conv = XYZtoRGB(Xval * 100, Yval * 100, Zval * 100);
    const rgb = conv.rgb;
    
    updateFromRGB(rgb.r, rgb.g, rgb.b, 'cie');
    drawPoint(px, py);
    
    if (conv.raw.r < 0 || conv.raw.r > 255 || conv.raw.g < 0 || conv.raw.g > 255 || conv.raw.b < 0 || conv.raw.b > 255) {
      showWarning('Выбранная точка x,y выходит за sRGB-гамму; цвет был приведён к области sRGB.');
    } else {
      showWarning('');
    }
  });
}

window.drawCIEPointFromXYZ = () => {};

function init() {
  attachEvents();
  updateFromRGB(255, 77, 138, 'init');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
