// WebGL Ocean Shader
(function() {
    const canvas = document.getElementById('webgl-canvas');
    const fallback = document.getElementById('fallback-bg');
    
    // Check WebGL support
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
        console.warn('WebGL not supported, using fallback');
        fallback.classList.add('active');
        canvas.style.display = 'none';
        return;
    }

    // Vertex shader
    const vertexShaderSource = `
        attribute vec2 a_position;
        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
    `;

    // Fragment shader with ocean-inspired dither effect
    const fragmentShaderSource = `
        precision mediump float;
        uniform float u_time;
        uniform vec2 u_resolution;
        
        float noise(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        float smoothNoise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            
            float a = noise(i);
            float b = noise(i + vec2(1.0, 0.0));
            float c = noise(i + vec2(0.0, 1.0));
            float d = noise(i + vec2(1.0, 1.0));
            
            return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }
        
        float fbm(vec2 p) {
            float value = 0.0;
            float amplitude = 0.5;
            float frequency = 1.0;
            
            for(int i = 0; i < 5; i++) {
                value += amplitude * smoothNoise(p * frequency);
                frequency *= 2.0;
                amplitude *= 0.5;
            }
            return value;
        }
        
        float dither(vec2 p) {
            return fract(dot(p, vec2(0.129898, 0.78233)) * 43758.5453);
        }
        
        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution;
            vec2 p = uv * 3.0;
            
            float wave1 = fbm(p + vec2(u_time * 0.05, u_time * 0.03));
            float wave2 = fbm(p * 1.5 - vec2(u_time * 0.04, u_time * 0.02));
            
            float pattern = wave1 * 0.6 + wave2 * 0.4;
            
            float ditherValue = dither(gl_FragCoord.xy) * 0.08;
            pattern += ditherValue;
            
            vec3 deepBlue = vec3(0.05, 0.08, 0.15);
            vec3 midBlue = vec3(0.08, 0.12, 0.22);
            vec3 steelGray = vec3(0.15, 0.18, 0.24);
            vec3 accentCyan = vec3(0.15, 0.25, 0.35);
            
            vec3 color = mix(deepBlue, midBlue, pattern);
            color = mix(color, steelGray, smoothstep(0.4, 0.8, pattern));
            color = mix(color, accentCyan, smoothstep(0.7, 1.0, pattern) * 0.3);
            
            float vignette = 1.0 - length(uv - 0.5) * 0.7;
            color *= vignette;
            
            gl_FragColor = vec4(color, 1.0);
        }
    `;

    // Compile shader helper
    function compileShader(source, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    // Create program
    const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
    
    if (!vertexShader || !fragmentShader) {
        console.warn('Shader compilation failed, using fallback');
        fallback.classList.add('active');
        canvas.style.display = 'none';
        return;
    }

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program linking error:', gl.getProgramInfoLog(program));
        fallback.classList.add('active');
        canvas.style.display = 'none';
        return;
    }

    gl.useProgram(program);

    // Create full-screen quad
    const positions = new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
         1,  1,
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Get uniform locations
    const timeLocation = gl.getUniformLocation(program, 'u_time');
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');

    // Resize handler
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    }
    
    resize();
    window.addEventListener('resize', resize);

    // Animation loop
    const startTime = Date.now();
    function render() {
        const time = (Date.now() - startTime) * 0.001;
        gl.uniform1f(timeLocation, time);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        requestAnimationFrame(render);
    }
    render();
})();

// GSAP Animations
document.addEventListener('DOMContentLoaded', function() {
    // Check if GSAP loaded
    if (typeof gsap === 'undefined') {
        console.warn('GSAP not loaded, skipping animations');
        return;
    }

    // Header animation
    gsap.from('.logo', {
        opacity: 0,
        y: -20,
        duration: 0.8,
        ease: 'power2.out'
    });

    gsap.from('.nav-links a', {
        opacity: 0,
        y: -20,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
        delay: 0.3
    });

    // Hero animation
    gsap.from('.badge', {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: 'power2.out',
        delay: 0.2
    });

    gsap.from('.hero-title', {
        opacity: 0,
        y: 40,
        duration: 1,
        ease: 'power2.out',
        delay: 0.4
    });

    gsap.from('.hero-description', {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: 'power2.out',
        delay: 0.6
    });

    gsap.from('.hero-buttons .btn', {
        opacity: 0,
        y: 20,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power2.out',
        delay: 0.8
    });

    // Feature cards scroll animation
    gsap.utils.toArray('.feature-card').forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            opacity: 0,
            y: 50,
            duration: 0.8,
            delay: i * 0.15,
            ease: 'power2.out'
        });
    });

    // Technical section animation
    gsap.from('.technical-content', {
        scrollTrigger: {
            trigger: '.technical-content',
            start: 'top 80%',
            toggleActions: 'play none none none'
        },
        opacity: 0,
        x: -50,
        duration: 0.8,
        ease: 'power2.out'
    });

    gsap.from('.stats-card', {
        scrollTrigger: {
            trigger: '.stats-card',
            start: 'top 80%',
            toggleActions: 'play none none none'
        },
        opacity: 0,
        x: 50,
        duration: 0.8,
        ease: 'power2.out'
    });

    // Stat items animation
    gsap.utils.toArray('.stat-item').forEach((item, i) => {
        gsap.from(item, {
            scrollTrigger: {
                trigger: item,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            opacity: 0,
            y: 20,
            duration: 0.6,
            delay: i * 0.1,
            ease: 'power2.out'
        });
    });

    // Button hover animations
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            gsap.to(btn, {
                scale: 1.05,
                duration: 0.3,
                ease: 'power2.out'
            });
        });

        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, {
                scale: 1,
                duration: 0.3,
                ease: 'power2.out'
            });
        });
    });

    // Feature card hover effect
    document.querySelectorAll('.feature-card').forEach(card => {
        const number = card.querySelector('.feature-number');
        
        card.addEventListener('mouseenter', () => {
            gsap.to(card, {
                y: -8,
                duration: 0.4,
                ease: 'power2.out'
            });
            gsap.to(number, {
                scale: 1.1,
                duration: 0.3,
                ease: 'power2.out'
            });
        });

        card.addEventListener('mouseleave', () => {
            gsap.to(card, {
                y: 0,
                duration: 0.4,
                ease: 'power2.out'
            });
            gsap.to(number, {
                scale: 1,
                duration: 0.3,
                ease: 'power2.out'
            });
        });
    });

    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                gsap.to(window, {
                    duration: 1,
                    scrollTo: {
                        y: target,
                        offsetY: 80
                    },
                    ease: 'power2.inOut'
                });
            }
        });
    });
});