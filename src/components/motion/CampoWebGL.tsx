"use client";

import { useEffect, useRef } from "react";

/**
 * Campo animado em WebGL atrás do nome do cliente — só no desktop.
 *
 * POR QUE NÃO three.js: isto é um fragment shader num quad de tela cheia, não
 * uma cena 3D. Os sites premiados que auditei pagam de 515KB a 1,48MB por
 * three.js/R3F; aqui o custo é o deste arquivo, algo como 2KB comprimido. Levar
 * um motor 3D inteiro para desenhar um degradê em movimento seria pagar vinte
 * vezes o orçamento por nada.
 *
 * GUARDAS — o efeito só existe quando todas passam:
 *   · `(min-width: 1024px) and (pointer: fine)` — é enfeite de desktop. No
 *     celular, que é onde o cliente abre o link do WhatsApp, nem carrega;
 *   · `prefers-reduced-motion: no-preference`;
 *   · contexto WebGL disponível (GPU bloqueada, driver antigo, etc.).
 *
 * Em qualquer falha o componente não desenha nada e as camadas de gradiente do
 * hero continuam valendo — o fallback é o estado normal da página, não um
 * degradado.
 *
 * BATERIA: pausa quando a aba sai de foco e quando o hero sai da viewport. Um
 * rAF rodando atrás de dez seções de scroll é bateria queimada à toa.
 */
export function CampoWebGL() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const desktop = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
    const menosMovimento = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!desktop.matches || menosMovimento.matches) return;

    const gl =
      canvas.getContext("webgl", { antialias: false, alpha: true, depth: false }) ??
      canvas.getContext("experimental-webgl", { antialias: false, alpha: true });
    if (!gl || !(gl instanceof WebGLRenderingContext)) return;

    const vert = `
      attribute vec2 pos;
      void main() { gl_Position = vec4(pos, 0.0, 1.0); }
    `;

    /**
     * FBM com hash barato — sem textura, sem lookup. Duas cores de marca
     * (#1B63EC e #6E2ED0) misturadas por um campo que respira devagar, e um
     * grão fino por cima para o degradê não bandar em tela grande.
     */
    const frag = `
      precision mediump float;
      uniform vec2  resolucao;
      uniform float tempo;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float ruido(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
      }

      float fbm(vec2 p) {
        float v = 0.0, a = 0.5;
        for (int i = 0; i < 4; i++) {
          v += a * ruido(p);
          p *= 2.02;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / resolucao.xy;
        vec2 p = uv * 2.4;
        p.x *= resolucao.x / resolucao.y;

        float t = tempo * 0.045;
        float campo = fbm(p + vec2(t, t * 0.6) + fbm(p * 1.3 - t * 0.4));

        vec3 azul  = vec3(0.106, 0.388, 0.925);  // #1B63EC
        vec3 roxo  = vec3(0.431, 0.180, 0.816);  // #6E2ED0
        vec3 cor   = mix(azul, roxo, smoothstep(0.25, 0.85, campo));

        // concentra a luz no alto à direita e apaga na base, para o nome do
        // cliente (canto inferior esquerdo) manter contraste
        float luz = smoothstep(0.15, 1.05, campo) * smoothstep(0.0, 0.75, uv.y);
        luz *= mix(0.55, 1.0, uv.x);

        float grao = (hash(gl_FragCoord.xy) - 0.5) * 0.03;
        gl_FragColor = vec4(cor + grao, luz * 0.42);
      }
    `;

    const compilar = (tipo: number, fonte: string) => {
      const s = gl.createShader(tipo);
      if (!s) return null;
      gl.shaderSource(s, fonte);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        gl.deleteShader(s);
        return null;
      }
      return s;
    };

    const vs = compilar(gl.VERTEX_SHADER, vert);
    const fs = compilar(gl.FRAGMENT_SHADER, frag);
    if (!vs || !fs) return;

    const programa = gl.createProgram();
    if (!programa) return;
    gl.attachShader(programa, vs);
    gl.attachShader(programa, fs);
    gl.linkProgram(programa);
    if (!gl.getProgramParameter(programa, gl.LINK_STATUS)) return;
    gl.useProgram(programa);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const attrPos = gl.getAttribLocation(programa, "pos");
    gl.enableVertexAttribArray(attrPos);
    gl.vertexAttribPointer(attrPos, 2, gl.FLOAT, false, 0, 0);

    const uResolucao = gl.getUniformLocation(programa, "resolucao");
    const uTempo = gl.getUniformLocation(programa, "tempo");

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // DPR limitado: em tela retina o custo quadruplica e ninguém enxerga a
    // diferença num campo desfocado.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const redimensionar = () => {
      const { clientWidth: w, clientHeight: h } = canvas;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uResolucao, canvas.width, canvas.height);
    };
    redimensionar();

    const observadorTamanho = new ResizeObserver(redimensionar);
    observadorTamanho.observe(canvas);

    let quadro = 0;
    let visivelNaTela = true;
    let abaAtiva = !document.hidden;
    let inicio = performance.now();
    let acumulado = 0;

    const desenhar = (agora: number) => {
      acumulado = (agora - inicio) / 1000;
      gl.uniform1f(uTempo, acumulado);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      quadro = requestAnimationFrame(desenhar);
    };

    const avaliar = () => {
      const deveRodar = visivelNaTela && abaAtiva;
      if (deveRodar && !quadro) {
        inicio = performance.now() - acumulado * 1000;
        quadro = requestAnimationFrame(desenhar);
      } else if (!deveRodar && quadro) {
        cancelAnimationFrame(quadro);
        quadro = 0;
      }
    };

    const observadorTela = new IntersectionObserver(
      ([e]) => {
        visivelNaTela = e.isIntersecting;
        avaliar();
      },
      { threshold: 0 },
    );
    observadorTela.observe(canvas);

    const aoTrocarAba = () => {
      abaAtiva = !document.hidden;
      avaliar();
    };
    document.addEventListener("visibilitychange", aoTrocarAba);
    avaliar();

    return () => {
      if (quadro) cancelAnimationFrame(quadro);
      document.removeEventListener("visibilitychange", aoTrocarAba);
      observadorTela.disconnect();
      observadorTamanho.disconnect();
      gl.deleteProgram(programa);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="so-tela pointer-events-none absolute inset-0 -z-10 h-full w-full"
    />
  );
}
