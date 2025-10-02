import React, { useEffect, useRef } from "react";

/**
 * UltraGradientBackground (WebGL)
 * -------------------------------------------------
 * Full-viewport animated gradient with 3–4 colors that slowly mix & twirl.
 * Starts with soft color blobs (not striped lines). Includes CSS fallback if
 * WebGL is unavailable.
 */

export default function UltraGradientBackground({
  speed = 0.10,
  opacity = 1,
  palette = ["#05080c", "#101b30", "#2a0f24", "#d4a5a5"],
  quality = "med",
  blobs = 4,
  bandStrength = 0.0,
  children,
}) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    
    const gl = canvas.getContext("webgl", { antialias: false, alpha: true });

    let pxRatio = Math.min(2, window.devicePixelRatio || 1);

    function hexToRgb(h) {
      const s = h.replace('#','');
      const b = s.length === 3 ? s.split('').map(c => c + c).join('') : s;
      const num = parseInt(b, 16);
      return [(num >> 16 & 255) / 255, (num >> 8 & 255) / 255, (num & 255) / 255];
    }

    if (!gl) {
      canvas.style.display = 'none';
      const fallback = document.createElement('div');
      fallback.style.position = 'fixed';
      fallback.style.inset = '0';
      fallback.style.zIndex = '0';
      fallback.style.backgroundSize = '220% 220%';
      fallback.style.animation = `ultra-pan ${120 / Math.max(0.01, speed)}s ease-in-out infinite alternate`;
      const c = (i, a = 0.85) => {
        const [r,g,b] = hexToRgb(palette[i % palette.length]);
        return `rgba(${Math.round(r*255)},${Math.round(g*255)},${Math.round(b*255)},${a})`;
      };
      fallback.style.backgroundImage = `
        radial-gradient(40% 35% at 70% 70%, ${c(3)}, rgba(0,0,0,0) 60%),
        radial-gradient(45% 40% at 30% 35%, ${c(1)}, rgba(0,0,0,0) 60%),
        radial-gradient(60% 55% at 85% 20%, ${c(2,0.7)}, rgba(0,0,0,0) 60%),
        linear-gradient(120deg, ${c(0)}, ${c(0)})`;
      document.body.appendChild(fallback);
      const style = document.createElement('style');
      style.innerHTML = `@keyframes ultra-pan {0%{background-position: 0% 0%}100%{background-position: 100% 100%}}`;
      document.head.appendChild(style);
      return () => { 
        if (document.body.contains(fallback)) document.body.removeChild(fallback); 
        if (document.head.contains(style)) document.head.removeChild(style); 
      };
    }

    // --- Vertex shader ----------------------------------------------------
    const vs = gl.createShader(gl.VERTEX_SHADER);
    const VS_SRC = `
      attribute vec2 a; 
      void main(){ 
        gl_Position = vec4(a, 0.0, 1.0); 
      }
    `;
    gl.shaderSource(vs, VS_SRC);
    gl.compileShader(vs);

    // --- Fragment shader --------------------------------------------------
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    const FS_SRC = `
      precision mediump float;
      uniform vec2 u_res; 
      uniform float u_time;
      uniform vec3 u_cols[8];
      uniform float u_enable[8];
      uniform int u_blobs;
      uniform float u_band;
      uniform float u_phase[8];

      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123); }
      float noise(vec2 p){
        vec2 i=floor(p), f=fract(p);
        float a=hash(i), b=hash(i+vec2(1.0,0.0));
        float c=hash(i+vec2(0.0,1.0)), d=hash(i+vec2(1.0,1.0));
        vec2 u=f*f*(3.0-2.0*f);
        return mix(a,b,u.x)+ (c-a)*u.y*(1.0-u.x)+ (d-b)*u.x*u.y;
      }
      float fbm(vec2 p){
        float v=0.0; float a=0.5; mat2 m=mat2(1.6,1.2,-1.2,1.6);
        for(int i=0;i<5;i++){ v+=a*noise(p); p=m*p; a*=0.5; }
        return v;
      }
      mat2 rot(float a){ float s=sin(a), c=cos(a); return mat2(c,-s,s,c); }

      void main(){
        vec2 p = (gl_FragCoord.xy - 0.5*u_res) / u_res.y;
        float t = u_time * 0.25;

        float tw = fbm(p*1.4 + vec2(t*0.6, -t*0.4));
        vec2 w = rot((tw-0.5) * 1.2) * (p + 0.18*vec2(fbm(p*2.0+t), fbm(p*2.0-t)));

        // Blend all palette colors initially
        vec3 base = vec3(0.0);
        float cnt = 0.0;
        for (int i=0; i<8; i++) {
          float en = u_enable[i];
          base += u_cols[i] * en;
          cnt += en;
        }
        base /= max(cnt, 1.0);
        vec3 col = base * 0.65;

        float acc = 0.0;
        for (int i=0; i<8; i++) {
          float fi = float(i);
          float enabled = step(fi, float(u_blobs - 1)) * u_enable[i];
          float spd = 0.4 + 0.35 * sin(fi*4.71 + 1.7);
          float ph  = u_phase[i]; // randomized phase offset
          vec2 center = vec2(
            sin(t*spd + ph)*0.65,
            cos(t*(spd*0.8) + ph*1.3)*0.5
          );
          float radius = 0.65 + 0.2 * sin(t*0.7 + ph);
          float d = length(w - center);
          float g = smoothstep(radius, 0.0, d) * enabled;
          col = mix(col, col + u_cols[i] * (g * 0.65), 0.6);
          acc += g;
        }
        col = mix(col, col / (0.6 + acc), 0.35);

        // Cap brightness to avoid white flares in overlaps
        col = min(col, vec3(0.9));

        float ub = clamp(u_band, 0.0, 1.0);
        float band = smoothstep(-0.2, -0.6, w.x*0.7 - w.y + 0.1) * ub;
        col = mix(col, vec3(1.00, 0.55, 0.20), band);

        float vig = smoothstep(1.25, 0.25, length(p));
        col *= mix(0.85, 1.0, vig);
        col = pow(col, vec3(0.9));

        float gn = noise(gl_FragCoord.xy*0.6 + t*150.0);
        col = mix(col, col + (gn-0.5)*0.04, 0.6);

        gl_FragColor = vec4(col, 1.0);
      }
    `;
    gl.shaderSource(fs, FS_SRC);
    gl.compileShader(fs);

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if(!gl.getProgramParameter(prog, gl.LINK_STATUS)){
      console.error('Program link error:\n', gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'u_res');
    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uCols0 = gl.getUniformLocation(prog, 'u_cols[0]');
    const uEnable0 = gl.getUniformLocation(prog, 'u_enable[0]');
    const uBlobs = gl.getUniformLocation(prog, 'u_blobs');
    const uBand = gl.getUniformLocation(prog, 'u_band');
    const uPhase0 = gl.getUniformLocation(prog, 'u_phase[0]');

    const cols = palette.slice(0, 8).map(hexToRgb);
    while (cols.length < 8) cols.push(cols[cols.length-1] || [0.0,0.0,0.0]);
    const enables = new Float32Array(8);
    for (let i = 0; i < 8; i++) enables[i] = i < Math.max(1, Math.min(8, palette.length)) ? 1.0 : 0.0;

    // random phase offsets for blobs
    const phases = new Float32Array(8);
    for (let i = 0; i < 8; i++) phases[i] = Math.random() * 6.28318; // 0..2π

    function setPalette() {
      const flat = new Float32Array(cols.flat());
      if (uCols0) gl.uniform3fv(uCols0, flat);
      if (uEnable0) gl.uniform1fv(uEnable0, enables);
      if (uPhase0) gl.uniform1fv(uPhase0, phases);
    }

    function setSize() {
      const factor = quality === 'low' ? 0.6 : quality === 'high' ? 1.0 : 0.8;
      pxRatio = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.floor(window.innerWidth * pxRatio * factor);
      const h = Math.floor(window.innerHeight * pxRatio * factor);
      canvas.width = w; canvas.height = h;
      canvas.style.width = '100%'; canvas.style.height = '100%';
      gl.viewport(0,0,w,h);
      if (uRes) gl.uniform2f(uRes, w, h);
    }

    setPalette();
    setSize();

    const blobsSafe = Math.max(3, Math.min(8, Math.floor(Number.isFinite(blobs) ? blobs : 4)));
    const rawBand = Number.isFinite(bandStrength) ? bandStrength : 0.0;
    const bandSafe = Math.max(0.0, Math.min(1.0, rawBand));

    if (uBlobs) gl.uniform1i(uBlobs, blobsSafe);
    if (uBand)  gl.uniform1f(uBand, bandSafe);

    window.addEventListener('resize', setSize);

    // Start at a pseudo-random time offset to avoid lined-up look
    let raf = 0; let start = performance.now() - 5000 * Math.random();
    function frame(now) {
      const t = (now - start) * speed * 0.001;
      if (uTime) gl.uniform1f(uTime, t);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => { 
      cancelAnimationFrame(raf); 
      window.removeEventListener('resize', setSize); 
    };
  }, [palette.join(','), quality, speed, blobs, bandStrength]);

  return (
    <div className="fixed inset-0 z-0" style={{ backgroundColor: "#000" }}>
      <canvas ref={ref} style={{ width: '100%', height: '100%', opacity }} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}