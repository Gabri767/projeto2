/**
 * MATRIX CYBER TERMINAL & VISUALIZER ENGINE
 * Projeto 2 - GitHub Pages
 */

(function () {
    'use strict';

    // --- Configuração e Estado ---
    const state = {
        theme: 'matrix',
        soundEnabled: false,
        speed: 15,
        density: 50,
        startTime: Date.now(),
        fps: 60,
        lastFrameTime: performance.now(),
        commandHistory: [],
        historyIndex: -1
    };

    const THEME_COLORS = {
        matrix: {
            primary: '#00ff66',
            lead: '#ffffff',
            trail: 'rgba(0, 255, 102, 0.85)',
            bg: 'rgba(5, 10, 7, 0.12)'
        },
        cyberpunk: {
            primary: '#00f0ff',
            lead: '#ff007f',
            trail: 'rgba(0, 240, 255, 0.85)',
            bg: 'rgba(6, 8, 20, 0.12)'
        },
        amber: {
            primary: '#ffaa00',
            lead: '#fff7e6',
            trail: 'rgba(255, 170, 0, 0.85)',
            bg: 'rgba(15, 11, 4, 0.12)'
        },
        crimson: {
            primary: '#ff2a4b',
            lead: '#ffffff',
            trail: 'rgba(255, 42, 75, 0.85)',
            bg: 'rgba(13, 4, 6, 0.12)'
        }
    };

    // --- Web Audio API Synth (Sem arquivos de áudio externos) ---
    let audioCtx = null;

    function getAudioContext() {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                audioCtx = new AudioContextClass();
            }
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    function playSound(type) {
        if (!state.soundEnabled) return;
        try {
            const ctx = getAudioContext();
            if (!ctx) return;

            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'key') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600 + Math.random() * 400, now);
                gain.gain.setValueAtTime(0.04, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
            } else if (type === 'enter') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
                osc.start(now);
                osc.stop(now + 0.12);
            } else if (type === 'theme') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
                gain.gain.setValueAtTime(0.06, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
            } else if (type === 'error') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.setValueAtTime(110, now + 0.08);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
            }
        } catch (e) {
            console.error('Erro de áudio:', e);
        }
    }

    // --- Canvas Matrix Rain Engine ---
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas ? canvas.getContext('2d') : null;

    let columns = 0;
    let drops = [];
    const characters = 'ｦｱｳｴｵｶｷｹｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ1234567890ABCDEF@#$%&*+-/<>{}[]=';
    const fontSize = 16;

    function initCanvas() {
        if (!canvas || !ctx) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        columns = Math.floor(canvas.width / fontSize);
        drops = [];
        for (let i = 0; i < columns; i++) {
            drops[i] = Math.floor(Math.random() * -canvas.height / fontSize);
        }
    }

    let frameCount = 0;
    function renderMatrix() {
        if (!canvas || !ctx) return;

        // Fundo semitransparente para criar rastro
        const themeConfig = THEME_COLORS[state.theme] || THEME_COLORS.matrix;
        ctx.fillStyle = themeConfig.bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = `${fontSize}px "Fira Code", monospace`;

        const step = Math.max(1, Math.floor(35 - state.speed));

        for (let i = 0; i < drops.length; i++) {
            // Densidade de caracteres
            if ((i % Math.floor(110 - state.density)) > 2) continue;

            const text = characters.charAt(Math.floor(Math.random() * characters.length));
            const x = i * fontSize;
            const y = drops[i] * fontSize;

            // Caractere líder brilhante
            ctx.fillStyle = themeConfig.lead;
            ctx.shadowBlur = 8;
            ctx.shadowColor = themeConfig.primary;
            ctx.fillText(text, x, y);

            // Caractere de rastro
            if (drops[i] > 1) {
                const prevChar = characters.charAt(Math.floor(Math.random() * characters.length));
                ctx.fillStyle = themeConfig.trail;
                ctx.shadowBlur = 4;
                ctx.fillText(prevChar, x, y - fontSize);
            }

            // Atualiza posição do drop
            if (frameCount % step === 0) {
                if (y > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                } else {
                    drops[i]++;
                }
            }
        }
        ctx.shadowBlur = 0;
    }

    // --- Loop Principal de Animação e FPS ---
    function animationLoop(timestamp) {
        frameCount++;

        // Cálculo de FPS
        if (timestamp - state.lastFrameTime >= 500) {
            const currentFps = Math.round((frameCount * 1000) / (timestamp - state.lastFrameTime));
            const fpsEl = document.getElementById('stat-fps');
            if (fpsEl) fpsEl.textContent = `${Math.min(60, currentFps)} FPS`;
            state.lastFrameTime = timestamp;
            frameCount = 0;
        }

        renderMatrix();
        requestAnimationFrame(animationLoop);
    }

    // --- Terminal Engine ---
    const termOutput = document.getElementById('term-output');
    const termInput = document.getElementById('term-input');

    function printToTerminal(text, className = '') {
        if (!termOutput) return;
        const line = document.createElement('div');
        line.className = `term-line ${className}`;
        line.innerHTML = text;
        termOutput.appendChild(line);
        termOutput.scrollTop = termOutput.scrollHeight;
    }

    const COMMANDS = {
        help: () => {
            return `
<b>Comandos Disponíveis:</b>
- <span class="term-accent">help</span>: Lista todos os comandos do sistema
- <span class="term-accent">about</span>: Informações sobre o Projeto 2
- <span class="term-accent">theme &lt;matrix|cyberpunk|amber|crimson&gt;</span>: Altera o tema visual
- <span class="term-accent">speed &lt;5-30&gt;</span>: Define a velocidade da animação Matrix
- <span class="term-accent">density &lt;20-100&gt;</span>: Define a densidade de chuva Matrix
- <span class="term-accent">projects</span>: Exibe os projetos relacionados
- <span class="term-accent">ping</span>: Testa conectividade com a rede Matrix
- <span class="term-accent">matrix</span>: Mensagem de transmissão do sistema
- <span class="term-accent">clear</span>: Limpa o histórico do terminal
- <span class="term-accent">date</span>: Mostra data e hora atual do sistema
            `.trim();
        },
        about: () => {
            return `
<span class="term-prompt">MATRIX OPERATING SYSTEM - PROJETO 2</span>
Desenvolvido com HTML5 Canvas, Vanilla JavaScript moderno, Web Audio API e CSS Glassmorphism.
Repositório: <a href="https://github.com/Gabri767/projeto2" target="_blank" style="color: var(--primary)">github.com/Gabri767/projeto2</a>
Hospedado via GitHub Pages.
            `.trim();
        },
        projects: () => {
            return `
<b>Projetos no Hub:</b>
1. <b>Projeto 2:</b> Terminal Interativo & Visualizador Matrix (Este repositório)
2. <b>Projeto 3:</b> Matrix Digital Rain Standalone - <a href="https://gabri767.github.io/projeto3/" target="_blank" style="color:var(--accent)">https://gabri767.github.io/projeto3/</a>
            `.trim();
        },
        matrix: () => {
            return `
<span class="term-prompt">"Wake up, Neo... The Matrix has you. Follow the white rabbit. Knock, knock, Neo."</span>
            `.trim();
        },
        clear: () => {
            if (termOutput) {
                termOutput.innerHTML = '';
            }
            return null;
        },
        ping: () => {
            const ms = Math.floor(Math.random() * 15) + 8;
            return `PONG! Resposta de 127.0.0.1: tempo=${ms}ms TTL=64`;
        },
        date: () => {
            return new Date().toLocaleString('pt-BR');
        }
    };

    function executeCommand(rawInput) {
        const input = rawInput.trim();
        if (!input) return;

        // Histórico
        state.commandHistory.push(input);
        state.historyIndex = state.commandHistory.length;

        // Exibe o comando inserido
        printToTerminal(`<span class="term-prompt">guest@matrix:~$</span> ${escapeHTML(input)}`);

        const parts = input.split(' ');
        const cmd = parts[0].toLowerCase();
        const arg = parts[1] ? parts[1].toLowerCase() : '';

        playSound('enter');

        if (cmd === 'clear') {
            COMMANDS.clear();
            return;
        }

        if (cmd === 'theme') {
            if (['matrix', 'cyberpunk', 'amber', 'crimson'].includes(arg)) {
                setTheme(arg);
                printToTerminal(`Tema alterado com sucesso para: <span class="term-accent">${arg}</span>`);
            } else {
                printToTerminal(`Tema inválido. Escolha: <span class="term-accent">matrix, cyberpunk, amber, crimson</span>`, 'term-dim');
            }
            return;
        }

        if (cmd === 'speed') {
            const val = parseInt(arg, 10);
            if (!isNaN(val) && val >= 5 && val <= 30) {
                state.speed = val;
                const speedSlider = document.getElementById('speed-slider');
                const speedVal = document.getElementById('speed-val');
                if (speedSlider) speedSlider.value = val;
                if (speedVal) speedVal.textContent = `${(val / 15).toFixed(1)}x`;
                printToTerminal(`Velocidade ajustada para: <span class="term-accent">${val}</span>`);
            } else {
                printToTerminal('Valor de velocidade inválido. Use um valor entre 5 e 30.', 'term-dim');
            }
            return;
        }

        if (cmd === 'density') {
            const val = parseInt(arg, 10);
            if (!isNaN(val) && val >= 20 && val <= 100) {
                state.density = val;
                const densitySlider = document.getElementById('density-slider');
                const densityVal = document.getElementById('density-val');
                if (densitySlider) densitySlider.value = val;
                if (densityVal) densityVal.textContent = `${val}%`;
                printToTerminal(`Densidade ajustada para: <span class="term-accent">${val}%</span>`);
            } else {
                printToTerminal('Valor de densidade inválido. Use um valor entre 20 e 100.', 'term-dim');
            }
            return;
        }

        if (COMMANDS[cmd]) {
            const result = COMMANDS[cmd]();
            if (result) printToTerminal(result);
        } else {
            playSound('error');
            printToTerminal(`Comando não reconhecido: '<span class="term-accent">${escapeHTML(cmd)}</span>'. Digite <span class="term-prompt">'help'</span> para ver os comandos.`, 'term-dim');
        }
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag));
    }

    // --- Troca de Tema ---
    function setTheme(themeName) {
        state.theme = themeName;
        document.documentElement.setAttribute('data-theme', themeName === 'matrix' ? '' : themeName);
        const themeSelector = document.getElementById('theme-selector');
        if (themeSelector) themeSelector.value = themeName;
        playSound('theme');
    }

    // --- Uptime e Telemetria ---
    function updateTelemetry() {
        const uptimeEl = document.getElementById('stat-uptime');
        if (uptimeEl) {
            const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
            const hrs = String(Math.floor(elapsed / 3600)).padStart(2, '0');
            const mins = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
            const secs = String(elapsed % 60).padStart(2, '0');
            uptimeEl.textContent = `${hrs}:${mins}:${secs}`;
        }

        const nodesEl = document.getElementById('stat-nodes');
        if (nodesEl && Math.random() > 0.8) {
            const baseNodes = 1024 + Math.floor(Math.random() * 50) - 25;
            nodesEl.textContent = baseNodes.toLocaleString();
        }

        const latEl = document.getElementById('stat-latency');
        if (latEl && Math.random() > 0.7) {
            latEl.textContent = `${Math.floor(Math.random() * 8) + 10}ms`;
        }
    }

    // --- Event Listeners ---
    function setupEvents() {
        window.addEventListener('resize', initCanvas);

        // Input do Terminal
        if (termInput) {
            termInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    executeCommand(termInput.value);
                    termInput.value = '';
                } else if (e.key === 'ArrowUp') {
                    if (state.commandHistory.length > 0 && state.historyIndex > 0) {
                        state.historyIndex--;
                        termInput.value = state.commandHistory[state.historyIndex];
                    }
                    e.preventDefault();
                } else if (e.key === 'ArrowDown') {
                    if (state.historyIndex < state.commandHistory.length - 1) {
                        state.historyIndex++;
                        termInput.value = state.commandHistory[state.historyIndex];
                    } else {
                        state.historyIndex = state.commandHistory.length;
                        termInput.value = '';
                    }
                    e.preventDefault();
                } else if (e.key.length === 1) {
                    playSound('key');
                }
            });
        }

        // Foco automático no terminal ao clicar na janela
        const termCard = document.querySelector('.terminal-card');
        if (termCard && termInput) {
            termCard.addEventListener('click', () => {
                termInput.focus();
            });
        }

        // Seletor de Tema
        const themeSelector = document.getElementById('theme-selector');
        if (themeSelector) {
            themeSelector.addEventListener('change', (e) => {
                setTheme(e.target.value);
            });
        }

        // Botão de Áudio
        const audioBtn = document.getElementById('btn-audio-toggle');
        const audioIcon = document.getElementById('audio-icon');
        if (audioBtn) {
            audioBtn.addEventListener('click', () => {
                state.soundEnabled = !state.soundEnabled;
                if (audioIcon) {
                    audioIcon.textContent = state.soundEnabled ? '🔊' : '🔇';
                }
                if (state.soundEnabled) {
                    getAudioContext();
                    playSound('theme');
                    printToTerminal('Efeitos sonoros <span class="term-accent">ATIVADOS</span>.');
                } else {
                    printToTerminal('Efeitos sonoros <span class="term-dim">DESATIVADOS</span>.');
                }
            });
        }

        // Slider de Densidade
        const densitySlider = document.getElementById('density-slider');
        const densityVal = document.getElementById('density-val');
        if (densitySlider) {
            densitySlider.addEventListener('input', (e) => {
                state.density = parseInt(e.target.value, 10);
                if (densityVal) densityVal.textContent = `${state.density}%`;
            });
        }

        // Slider de Velocidade
        const speedSlider = document.getElementById('speed-slider');
        const speedVal = document.getElementById('speed-val');
        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => {
                state.speed = parseInt(e.target.value, 10);
                if (speedVal) speedVal.textContent = `${(state.speed / 15).toFixed(1)}x`;
            });
        }
    }

    // --- Inicialização ---
    window.addEventListener('DOMContentLoaded', () => {
        initCanvas();
        setupEvents();
        requestAnimationFrame(animationLoop);
        setInterval(updateTelemetry, 1000);
    });

})();
