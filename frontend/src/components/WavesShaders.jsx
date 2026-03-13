import React, { useEffect, useRef } from "react";

export const WavesShaders = ({ className, speed = 1.0, intensity = 1.0, colorVariation = 1.0 }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const gl = canvas.getContext("webgl");
        if (!gl) {
            console.error("WebGL not supported");
            return;
        }

        const vs = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

        const fs = `
      precision highp float;
      uniform float iTime;
      uniform vec2 iResolution;
      uniform float u_speed;
      uniform float u_intensity;
      uniform float u_colorVariation;

      void main() {
        vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;

        float time = iTime * u_speed;
        vec3 col = vec3(0.0);

        for (int i = 0; i < 4; i++) {
            float fi = float(i);
            float freq = 1.0 + fi * 0.5;
            float phase = time * (0.5 + fi * 0.2);

            float wave1 = sin(uv.x * freq * 3.0 + phase);
            float wave2 = sin(uv.y * freq * 2.0 + phase * 1.3);
            float wave3 = sin((uv.x + uv.y) * freq * 1.5 + phase * 0.8);
            float wave4 = sin(length(uv) * freq * 4.0 + phase * 1.7);

            float plasma = (wave1 + wave2 + wave3 + wave4) * 0.25;

            vec3 layerCol = vec3(
                sin(plasma * 3.14159 + fi * 2.0 + time * u_colorVariation),
                sin(plasma * 3.14159 + fi * 2.0 + 2.094 + time * u_colorVariation * 0.8),
                sin(plasma * 3.14159 + fi * 2.0 + 4.188 + time * u_colorVariation * 1.2)
            ) * 0.5 + 0.5;

            float intensity = 1.0 / (1.0 + fi * 0.3);
            col += layerCol * intensity * u_intensity;
        }

        float centerGlow = 1.0 - length(uv) * 0.8;
        centerGlow = max(0.0, centerGlow);
        col += vec3(0.1, 0.2, 0.4) * centerGlow * 0.3;

        col = pow(col, vec3(0.8));
        gl_FragColor = vec4(col, 1.0);
      }
    `;

        function createShader(gl, type, source) {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error(gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }
            return shader;
        }

        const program = gl.createProgram();
        gl.attachShader(program, createShader(gl, gl.VERTEX_SHADER, vs));
        gl.attachShader(program, createShader(gl, gl.FRAGMENT_SHADER, fs));
        gl.linkProgram(program);
        gl.useProgram(program);

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

        const positionLocation = gl.getAttribLocation(program, "position");
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        const iTimeLoc = gl.getUniformLocation(program, "iTime");
        const iResLoc = gl.getUniformLocation(program, "iResolution");
        const uSpeedLoc = gl.getUniformLocation(program, "u_speed");
        const uIntensityLoc = gl.getUniformLocation(program, "u_intensity");
        const uColorVarLoc = gl.getUniformLocation(program, "u_colorVariation");

        let animationFrameId;
        const render = (time) => {
            time *= 0.001;

            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width;
                canvas.height = height;
                gl.viewport(0, 0, width, height);
            }

            gl.uniform1f(iTimeLoc, time);
            gl.uniform2f(iResLoc, width, height);
            gl.uniform1f(uSpeedLoc, speed);
            gl.uniform1f(uIntensityLoc, intensity);
            gl.uniform1f(uColorVarLoc, colorVariation);

            gl.drawArrays(gl.TRIANGLES, 0, 6);
            animationFrameId = requestAnimationFrame(render);
        };

        animationFrameId = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [speed, intensity, colorVariation]);

    return <canvas ref={canvasRef} className={`w-full h-full ${className}`} style={{ display: 'block' }} />;
};

export default WavesShaders;
