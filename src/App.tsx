import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  Heart, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Settings, 
  Play, 
  Sliders, 
  Keyboard, 
  Info, 
  Skull, 
  Sparkles, 
  Check,
  Award,
  Zap,
  Sword
} from 'lucide-react';

// ==========================================
// AUDIO SYNTHESIZER (Web Audio API)
// 100% client-side, zero assets required
// ==========================================
class SoundEffects {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  constructor() {
    // Lazy initialize to avoid blocking user interaction policies
  }

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  play(type: 'slash' | 'hit' | 'potion' | 'hurt' | 'gameover' | 'level' | 'click') {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      // Resume context if suspended
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      const now = this.ctx.currentTime;

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'slash') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.12);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'hit') {
        // Exploding noise
        const bufferSize = this.ctx.sampleRate * 0.1;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, now);

        noise.connect(filter);
        filter.connect(gain);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        noise.start(now);
        noise.stop(now + 0.1);
      } else if (type === 'potion') {
        // High-pitched chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.setValueAtTime(600, now + 0.06);
        osc.frequency.setValueAtTime(900, now + 0.12);
        osc.frequency.setValueAtTime(1300, now + 0.18);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'hurt') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(60, now + 0.15);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'gameover') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.4);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);

        // Add a second low drone for dramatic effect
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(147, now);
        osc2.frequency.linearRampToValueAtTime(73, now + 0.5);
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        gain2.gain.setValueAtTime(0.2, now);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        osc2.start(now);
        osc2.stop(now + 0.6);
      } else if (type === 'level') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(330, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(990, now + 0.2);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch (e) {
      console.warn('Audio synthesis failed:', e);
    }
  }
}

const sfx = new SoundEffects();

// ==========================================
// PROCEDURAL CANVAS GENERATORS (Asset Fallbacks)
// Guarantees gorgeous custom styling even offline
// ==========================================

function createGroundTexture(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Floor color - dark medieval stone blue-slate (Vibrant Palette)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 512, 512);

  // Draw dark cobblestone tile grid
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 4;
  const tileSize = 64;

  for (let x = 0; x < 512; x += tileSize) {
    for (let y = 0; y < 512; y += tileSize) {
      // Background stone color variation
      ctx.fillStyle = (x + y) % 128 === 0 ? '#111827' : '#0f172a';
      ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);

      // Mystical glowing rune/lines
      if (Math.random() > 0.92) {
        ctx.fillStyle = '#3b82f6'; // Glowing blue slate moss
        ctx.fillRect(x + tileSize / 3, y + tileSize / 3, tileSize / 4, tileSize / 4);
      }

      ctx.strokeRect(x, y, tileSize, tileSize);
    }
  }

  // Add vintage noise effect
  for (let i = 0; i < 5000; i++) {
    const nx = Math.random() * 512;
    const ny = Math.random() * 512;
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.03})`;
    ctx.fillRect(nx, ny, 2, 2);
  }

  return canvas;
}

function createPlayerFallbackTexture(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 1024, 1024);

  const drawKnight = (cx: number, cy: number, state: 'idle' | 'run' | 'attack' | 'hurt', frame: number) => {
    let bobY = 0;
    let staffAngle = 0;
    let robeColor = '#4f46e5';
    let skinColor = '#fbcfe8';
    
    if (state === 'idle') {
      bobY = Math.sin(frame * Math.PI / 2) * 4;
    } else if (state === 'run') {
      bobY = (frame % 2 === 0) ? 8 : -4;
    } else if (state === 'attack') {
      staffAngle = (frame / 3) * Math.PI / 3;
    } else if (state === 'hurt') {
      robeColor = '#ef4444';
      bobY = 10;
    }

    ctx.fillStyle = robeColor;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 140 + bobY, 50, 70, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#312e81';
    ctx.beginPath();
    ctx.moveTo(cx - 58, cy + 90 + bobY);
    ctx.lineTo(cx, cy + 10 + bobY);
    ctx.lineTo(cx + 58, cy + 90 + bobY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#6366f1';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 90 + bobY, 65, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(cx, cy + 105 + bobY, 25, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = state === 'hurt' ? '#f59e0b' : '#06b6d4';
    ctx.fillRect(cx - 8, cy + 100 + bobY, 8, 8);
    ctx.fillRect(cx + 10, cy + 100 + bobY, 8, 8);

    ctx.save();
    ctx.translate(cx + 47, cy + 145 + bobY);
    ctx.rotate(staffAngle);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(0, 75);
    ctx.lineTo(0, -75);
    ctx.stroke();

    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(0, -80, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(cx - 33, cy + 205 + bobY, 25, 15);
    ctx.fillRect(cx + 8, cy + 205 + bobY, 25, 15);
  };

  for (let col = 0; col < 4; col++) {
    drawKnight(col * 256 + 128, 128, 'idle', col);
  }

  for (let col = 0; col < 4; col++) {
    drawKnight(col * 256 + 128, 384, 'run', col);
  }

  for (let col = 0; col < 4; col++) {
    drawKnight(col * 256 + 128, 640, 'attack', col);
  }

  for (let col = 0; col < 4; col++) {
    drawKnight(col * 256 + 128, 896, 'hurt', col);
  }

  return canvas;
}

function createBossFallbackTexture(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1024; // 4 columns
  canvas.height = 512; // 2 rows
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 1024, 512);

  // Helper to draw a single frame of the giant boss demon
  const drawBoss = (cx: number, cy: number, stepY: number, row: number) => {
    // Cape / aura (electric purple/dark violet)
    ctx.fillStyle = row === 1 ? '#ef4444' : '#7c3aed';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 30 + stepY, 70, 80, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body (dark navy/obsidian)
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 40 + stepY, 50, 60, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sinister glowing eyes (large)
    ctx.fillStyle = row === 1 ? '#fbbf24' : '#f43f5e';
    ctx.beginPath();
    ctx.arc(cx - 22, cy + 10 + stepY, 15, 0, Math.PI * 2);
    ctx.arc(cx + 22, cy + 10 + stepY, 15, 0, Math.PI * 2);
    ctx.fill();

    // Slit pupil
    ctx.fillStyle = '#000000';
    ctx.fillRect(cx - 24, cy + 5 + stepY, 4, 10);
    ctx.fillRect(cx + 20, cy + 5 + stepY, 4, 10);

    // Sinister fanged smile
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(cx - 20, cy + 35 + stepY);
    ctx.lineTo(cx - 10, cy + 45 + stepY);
    ctx.lineTo(cx, cy + 38 + stepY);
    ctx.lineTo(cx + 10, cy + 45 + stepY);
    ctx.lineTo(cx + 20, cy + 35 + stepY);
    ctx.closePath();
    ctx.fill();

    // Crown spikes (golden)
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(cx - 40, cy - 30 + stepY);
    ctx.lineTo(cx - 25, cy - 65 + stepY);
    ctx.lineTo(cx - 10, cy - 35 + stepY);
    ctx.lineTo(cx, cy - 80 + stepY); // centerpiece spike
    ctx.lineTo(cx + 10, cy - 35 + stepY);
    ctx.lineTo(cx + 25, cy - 65 + stepY);
    ctx.lineTo(cx + 40, cy - 30 + stepY);
    ctx.closePath();
    ctx.fill();
  };

  // Row 0: Idle (Top, coordinates Y range [0, 256])
  for (let col = 0; col < 4; col++) {
    const cx = col * 256 + 128;
    const cy = 128;
    const pulse = Math.sin(col * Math.PI / 2) * 8;
    drawBoss(cx, cy, pulse, 0);
  }

  // Row 1: Attack/Running (Bottom, coordinates Y range [256, 512])
  for (let col = 0; col < 4; col++) {
    const cx = col * 256 + 128;
    const cy = 384;
    const pulse = col % 2 === 0 ? 12 : -6;
    drawBoss(cx, cy, pulse, 1);
  }

  return canvas;
}

function createEnemyFallbackTexture(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1024; // 4 columns
  canvas.height = 512; // 2 rows (Row 0: Idle, Row 1: Walk)
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 1024, 512);

  // Helper to draw a single frame of a green spooky goblin/demon
  const drawGoblin = (cx: number, cy: number, stepY: number, sizeMul: number) => {
    // Body (dark neon green/emerald)
    ctx.fillStyle = '#059669';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 30 + stepY, 40, 50, 0, 0, Math.PI * 2);
    ctx.fill();

    // Spooky red eyes
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(cx - 15, cy + stepY, 12, 0, Math.PI * 2);
    ctx.arc(cx + 15, cy + stepY, 12, 0, Math.PI * 2);
    ctx.fill();

    // Yellow pupil
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(cx - 17, cy - 2 + stepY, 4, 4);
    ctx.fillRect(cx + 13, cy - 2 + stepY, 4, 4);

    // Mouth / sharp teeth
    ctx.fillStyle = '#060505';
    ctx.beginPath();
    ctx.arc(cx, cy + 22 + stepY, 15, 0, Math.PI);
    ctx.fill();

    // Horns
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.moveTo(cx - 30, cy - 20 + stepY);
    ctx.lineTo(cx - 45, cy - 50 + stepY);
    ctx.lineTo(cx - 15, cy - 25 + stepY);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx + 30, cy - 20 + stepY);
    ctx.lineTo(cx + 45, cy - 50 + stepY);
    ctx.lineTo(cx + 15, cy - 25 + stepY);
    ctx.closePath();
    ctx.fill();

    // Feet/Legs
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(cx - 25, cy + 70 + stepY, 15, 15);
    ctx.fillRect(cx + 10, cy + 70 + stepY, 15, 15);
  };

  // Generate 4 idle frames (Row 0: Top, coordinates in Canvas Y range [0, 256])
  for (let col = 0; col < 4; col++) {
    const cx = col * 256 + 128;
    const cy = 128;
    // Tiny pulse bobbing
    const pulse = Math.sin(col * Math.PI / 2) * 5;
    drawGoblin(cx, cy, pulse, 1.0);
  }

  // Generate 4 walking frames (Row 1: Bottom, coordinates Y range [256, 512])
  for (let col = 0; col < 4; col++) {
    const cx = col * 256 + 128;
    const cy = 384;
    // Step height bobbing
    const step = col % 2 === 0 ? 10 : -5;
    drawGoblin(cx, cy, step, 1.0);
  }

  return canvas;
}

function createPotionFallbackTexture(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 256);

  // Red mystical glass beaker
  // Cork top
  ctx.fillStyle = '#b45309';
  ctx.fillRect(113, 30, 30, 20);

  // Glass neck
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(118, 50, 20, 40);

  // Rounded potion liquid container
  ctx.fillStyle = '#cbd5e1'; // outer glass
  ctx.beginPath();
  ctx.arc(128, 140, 65, 0, Math.PI * 2);
  ctx.fill();

  // Glowing Red liquid inside
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(128, 145, 55, 0, Math.PI * 2);
  ctx.fill();

  // Liquid shine glow
  ctx.fillStyle = '#fca5a5';
  ctx.beginPath();
  ctx.ellipse(108, 115, 15, 8, -Math.PI/4, 0, Math.PI * 2);
  ctx.fill();

  // Magical bubble particles
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(148, 130, 6, 0, Math.PI * 2);
  ctx.arc(128, 160, 4, 0, Math.PI * 2);
  ctx.arc(110, 150, 5, 0, Math.PI * 2);
  ctx.fill();

  return canvas;
}

// Helper to safely load game assets, using custom beautiful canvas fallbacks on CORS block
function loadGameTexture(url: string, fallback: () => HTMLCanvasElement): THREE.Texture {
  const loader = new THREE.TextureLoader();
  const canvas = fallback();
  const fallbackTexture = new THREE.Texture(canvas);
  fallbackTexture.colorSpace = THREE.SRGBColorSpace;
  fallbackTexture.needsUpdate = true;

  // Attempt to load remote URL
  const realTexture = loader.load(
    url,
    (loaded) => {
      loaded.colorSpace = THREE.SRGBColorSpace;
      // Replace fallback properties
      (fallbackTexture as any).image = loaded.image;
      fallbackTexture.needsUpdate = true;
    },
    undefined,
    () => {
      console.warn(`Failed to load texture from ${url}. Using high-quality procedural fallback canvas texture.`);
    }
  );

  return fallbackTexture;
}

// ==========================================
// TYPE DEFINITIONS
// ==========================================
interface Enemy {
  id: string;
  position: THREE.Vector3;
  hp: number;
  maxHp: number;
  state: 'idle' | 'chase' | 'knockback' | 'dead';
  knockbackTimer: number;
  knockbackVelocity: THREE.Vector3;
  animFrame: number;
  animTimer: number;
  speed: number;
  facingRight: boolean;
  mesh: THREE.Mesh;
  attackFlashTimer: number;
  hitFlashTimer: number;
  whiteFlashTimer: number;
  isSecondHit: boolean; // Indicates if enemy is launched into orbit on second hit
  launchVelocity: THREE.Vector3;
  rotationSpeed: number;
  radius: number;
}

interface Potion {
  id: string;
  position: THREE.Vector3;
  collected: boolean;
  mesh: THREE.Mesh;
  pulseTimer: number;
}

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  life: number;
  maxLife: number;
  mesh: THREE.Mesh;
}

interface Boss {
  id: string;
  position: THREE.Vector3;
  hp: number;
  maxHp: number;
  state: 'idle' | 'telegraph' | 'shoot' | 'dash' | 'dead';
  stateTimer: number;
  animFrame: number;
  animTimer: number;
  facingRight: boolean;
  mesh: THREE.Mesh;
  shadowMesh?: THREE.Mesh;
  dangerRingMesh?: THREE.Mesh;
  hitFlashTimer: number;
  whiteFlashTimer: number;
  scalePulseTimer: number;
  shootTimer: number;
  dashTarget: THREE.Vector3 | null;
  radius: number;
  bossActiveTime: number;
}

interface BossFireball {
  id: string;
  position: THREE.Vector3;
  targetPosition: THREE.Vector3;
  mesh: THREE.Mesh;
  warningMesh: THREE.Mesh;
  state: 'rising' | 'falling';
  timer: number;
  totalDuration: number;
}

interface WarpPortal {
  position: THREE.Vector3;
  mesh: THREE.Mesh;
  active: boolean;
}

// ==========================================
// MAIN REACT APPLET COMPONENT
// ==========================================
export default function App() {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover' | 'options' | 'ending'>('menu');
  const [health, setHealth] = useState<number>(5);
  const [potionsCollected, setPotionsCollected] = useState<number>(0);
  const [enemiesDefeated, setEnemiesDefeated] = useState<number>(0);
  const [timeSurvived, setTimeSurvived] = useState<number>(0);

  // Boss React states for HUD and game logic
  const [bossHealth, setBossHealth] = useState<number | null>(null);
  const [bossMaxHealth, setBossMaxHealth] = useState<number | null>(null);
  const [bossActive, setBossActive] = useState<boolean>(false);
  const [portalActive, setPortalActive] = useState<boolean>(false);

  // Options settings (Persistent states)
  const [controlPreset, setControlPreset] = useState<'wasd' | 'arrows'>('wasd');
  const [playerSpeedPreset, setPlayerSpeedPreset] = useState<number>(1.25);
  const [cameraAnglePreset, setCameraAnglePreset] = useState<'isometric' | 'topdown'>('isometric');
  const [screenShakeEnabled, setScreenShakeEnabled] = useState<boolean>(true);
  const [muted, setMuted] = useState<boolean>(false);

  // Hurt splash overlay state
  const [hurtOverlay, setHurtOverlay] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // References for mutable game variables to bypass React render bottleneck
  const gameRef = useRef<{
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    renderer: THREE.WebGLRenderer | null;
    clock: THREE.Clock | null;
    
    // Game Entities
    player: {
      position: THREE.Vector3;
      velocity: THREE.Vector3;
      facingRight: boolean;
      radius: number;
      speedMultiplier: number;
      isAttacking: boolean;
      attackTimer: number;
      lastAttackTime: number;
      attackDuration: number;
      mesh: THREE.Mesh | null;
      slashArcMesh: THREE.Mesh | null;
      damageTimer: number;
      animFrame: number;
      animTimer: number;
    };
    enemies: Enemy[];
    potions: Potion[];
    particles: Particle[];
    boss: Boss | null;
    bossFireballs: BossFireball[];
    warpPortal: WarpPortal | null;

    // Background spawn clocks
    spawnTimer: number;
    spawnInterval: number;
    timeCounter: number;

    // Camera shake
    shakeIntensity: number;
    shakeTimer: number;

    // Keys
    keys: { [key: string]: boolean };

    // Textures
    playerTexture: THREE.Texture | null;
    enemyTexture: THREE.Texture | null;
    potionTexture: THREE.Texture | null;
    bossTexture: THREE.Texture | null;
    
    // Animation request ID
    animationFrameId: number | null;
  }>({
    scene: null,
    camera: null,
    renderer: null,
    clock: null,
    player: {
      position: new THREE.Vector3(0, 0.9, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      facingRight: true,
      radius: 0.8,
      speedMultiplier: 1.25,
      isAttacking: false,
      attackTimer: 0,
      lastAttackTime: 0,
      attackDuration: 0.15,
      mesh: null,
      slashArcMesh: null,
      damageTimer: 0,
      animFrame: 0,
      animTimer: 0,
    },
    enemies: [],
    potions: [],
    particles: [],
    boss: null,
    bossFireballs: [],
    warpPortal: null,
    spawnTimer: 0,
    spawnInterval: 2.0, // Initial enemy spawn interval in seconds
    timeCounter: 0,
    shakeIntensity: 0,
    shakeTimer: 0,
    keys: {},
    playerTexture: null,
    enemyTexture: null,
    potionTexture: null,
    bossTexture: null,
    animationFrameId: null,
  });

  // Sync settings/options with the mutable gameRef
  useEffect(() => {
    gameRef.current.player.speedMultiplier = playerSpeedPreset;
    sfx.enabled = !muted;
  }, [playerSpeedPreset, muted]);

  // Synchronize options with inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      gameRef.current.keys[e.key.toLowerCase()] = true;

      // Handle direct keyboard attack
      if (e.key === ' ' || e.key.toLowerCase() === 'j') {
        triggerPlayerAttack();
      }

      // Handle potion use with key E
      if (e.key.toLowerCase() === 'e') {
        handleTouchPotion();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      gameRef.current.keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [controlPreset, potionsCollected, health]);

  // Handle play state triggers
  useEffect(() => {
    if (gameState === 'playing') {
      sfx.play('level');
      initGameEngine();
    } else {
      cleanupGameEngine();
    }
    return () => cleanupGameEngine();
  }, [gameState]);

  // ==========================================
  // GAME ENGINE INITIALIZATION
  // ==========================================
  const initGameEngine = () => {
    if (!containerRef.current) return;

    // Cleanup first to avoid duplicates
    cleanupGameEngine();

    const width = containerRef.current.clientWidth || 1024;
    const height = containerRef.current.clientHeight || 768;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0b0f19'); // Space slate deep blue
    scene.fog = new THREE.FogExp2('#0b0f19', 0.04);
    gameRef.current.scene = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    gameRef.current.camera = camera;

    // Position camera based on settings
    updateCameraAngle(camera);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Clear inner canvas
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);
    gameRef.current.renderer = renderer;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight('#1e293b', 2.0); // Rich environmental light
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight('#3b82f6', 2.5); // Radiant neon blue lighting
    dirLight.position.set(20, 40, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const floorLight = new THREE.DirectionalLight('#10b981', 1.0); // Secondary emerald floor highlights
    floorLight.position.set(-20, 10, -20);
    scene.add(floorLight);

    // 5. Textures (Prefetch or generate fallback immediately)
    const groundTexCanvas = createGroundTexture();
    const groundTexture = new THREE.CanvasTexture(groundTexCanvas);
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(25, 25); // Create cobblestone layout over 50x50

    // Load custom sprites with procedural in-memory safety fallbacks
    gameRef.current.playerTexture = loadGameTexture(
      'https://raw.githubusercontent.com/banyapon/banyapon.github.io/refs/heads/main/studio/images/player.png',
      createPlayerFallbackTexture
    );
    // Configure player spritesheet repeat and wrap modes (4 columns, 4 rows)
    gameRef.current.playerTexture.wrapS = THREE.RepeatWrapping;
    gameRef.current.playerTexture.wrapT = THREE.RepeatWrapping;
    gameRef.current.playerTexture.repeat.set(1 / 4, 1 / 4);
    gameRef.current.playerTexture.offset.set(0, 0.75); // Start on Row 1 (Idle top row is 0.75 in UV)

    gameRef.current.enemyTexture = loadGameTexture(
      'https://raw.githubusercontent.com/banyapon/banyapon.github.io/refs/heads/main/studio/images/enemy.png',
      createEnemyFallbackTexture
    );

    gameRef.current.potionTexture = loadGameTexture(
      'https://raw.githubusercontent.com/banyapon/banyapon.github.io/refs/heads/main/studio/images/potion.png',
      createPotionFallbackTexture
    );

    gameRef.current.bossTexture = loadGameTexture(
      'https://res.cloudinary.com/dsucg33fv/image/upload/v1782709455/boss_e8jti1.png',
      createBossFallbackTexture
    );

    // 6. Ground Plane (50x50)
    const groundGeo = new THREE.PlaneGeometry(50, 50);
    const groundMat = new THREE.MeshBasicMaterial({ 
      map: groundTexture, 
      side: THREE.DoubleSide 
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Grid wireframe outline for a tech/arcade feel
    const gridHelper = new THREE.GridHelper(50, 50, '#3b82f6', '#1e293b');
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // 7. Player Mesh (2D Plane facing camera / Billboard)
    const playerGeo = new THREE.PlaneGeometry(1.6, 1.6);
    const playerMat = new THREE.MeshBasicMaterial({
      map: gameRef.current.playerTexture,
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide
    });
    const playerMesh = new THREE.Mesh(playerGeo, playerMat);
    playerMesh.position.copy(gameRef.current.player.position);
    playerMesh.castShadow = true;
    scene.add(playerMesh);
    gameRef.current.player.mesh = playerMesh;

    // Beautiful glowing base aura under player
    const auraGeo = new THREE.RingGeometry(0.1, 0.7, 32);
    const auraMat = new THREE.MeshBasicMaterial({ 
      color: '#3b82f6', 
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4
    });
    const auraMesh = new THREE.Mesh(auraGeo, auraMat);
    auraMesh.rotation.x = -Math.PI / 2;
    auraMesh.position.y = 0.02;
    playerMesh.add(auraMesh);

    // 8. Player Slash Effect Arc Mesh
    const slashGeo = new THREE.RingGeometry(0.5, 1.8, 32, 1, 0, Math.PI);
    const slashMat = new THREE.MeshBasicMaterial({
      color: '#22d3ee', // Bright glowing cyan
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    });
    const slashMesh = new THREE.Mesh(slashGeo, slashMat);
    slashMesh.rotation.x = -Math.PI / 2;
    slashMesh.position.set(0, 0, 0);
    scene.add(slashMesh);
    gameRef.current.player.slashArcMesh = slashMesh;

    // Reset game state counters
    setHealth(5);
    setPotionsCollected(0);
    setEnemiesDefeated(0);
    setTimeSurvived(0);
    setBossHealth(null);
    setBossMaxHealth(null);
    setBossActive(false);
    setPortalActive(false);

    gameRef.current.enemies = [];
    gameRef.current.potions = [];
    gameRef.current.particles = [];
    gameRef.current.boss = null;
    gameRef.current.bossFireballs = [];
    gameRef.current.warpPortal = null;
    gameRef.current.keys = {};
    gameRef.current.spawnTimer = 0;
    gameRef.current.spawnInterval = 2.0;
    gameRef.current.timeCounter = 0;
    gameRef.current.player.position.set(0, 0.9, 0);
    gameRef.current.clock = new THREE.Clock();

    // Spawn 5 initial potions scattered around
    for (let i = 0; i < 5; i++) {
      spawnPotion();
    }

    // Start engine loops
    gameRef.current.animationFrameId = requestAnimationFrame(gameLoop);

    // Handle viewport resize dynamically
    window.addEventListener('resize', handleResize);
  };

  const cleanupGameEngine = () => {
    if (gameRef.current.animationFrameId) {
      cancelAnimationFrame(gameRef.current.animationFrameId);
      gameRef.current.animationFrameId = null;
    }
    window.removeEventListener('resize', handleResize);
    if (gameRef.current.renderer) {
      gameRef.current.renderer.dispose();
    }
  };

  const handleResize = () => {
    if (!containerRef.current || !gameRef.current.camera || !gameRef.current.renderer) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    gameRef.current.camera.aspect = width / height;
    gameRef.current.camera.updateProjectionMatrix();
    gameRef.current.renderer.setSize(width, height);
  };

  const updateCameraAngle = (camera: THREE.PerspectiveCamera) => {
    const playerPos = gameRef.current.player.position;
    if (cameraAnglePreset === 'isometric') {
      camera.position.set(playerPos.x + 0, playerPos.y + 11, playerPos.z + 11);
      camera.lookAt(playerPos.x, playerPos.y + 0.5, playerPos.z);
    } else {
      // Direct Top-down tactical view
      camera.position.set(playerPos.x + 0, playerPos.y + 15, playerPos.z + 2);
      camera.lookAt(playerPos.x, playerPos.y, playerPos.z);
    }
  };

  // ==========================================
  // SPAWN LOGIC: POTIONS & ENEMIES
  // ==========================================
  const spawnPotion = () => {
    const scene = gameRef.current.scene;
    const tex = gameRef.current.potionTexture;
    if (!scene || !tex) return;

    // Create custom billboard plane for Potion
    const potGeo = new THREE.PlaneGeometry(1.0, 1.0);
    const potMat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide
    });
    const potMesh = new THREE.Mesh(potGeo, potMat);

    // Random location on 50x50 field
    const px = (Math.random() - 0.5) * 44;
    const pz = (Math.random() - 0.5) * 44;
    potMesh.position.set(px, 0.5, pz);
    scene.add(potMesh);

    // Tiny magical base circle under potion
    const ringGeo = new THREE.RingGeometry(0.1, 0.4, 16);
    const ringMat = new THREE.MeshBasicMaterial({ 
      color: '#10b981', 
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = -0.45;
    potMesh.add(ringMesh);

    gameRef.current.potions.push({
      id: Math.random().toString(),
      position: potMesh.position,
      collected: false,
      mesh: potMesh,
      pulseTimer: Math.random() * 10
    });
  };

  const spawnEnemy = () => {
    const scene = gameRef.current.scene;
    const tex = gameRef.current.enemyTexture;
    const playerPos = gameRef.current.player.position;
    if (!scene || !tex) return;

    // Slice texture dimensions (2 rows, 4 columns)
    const enemyTex = tex.clone();
    enemyTex.wrapS = THREE.RepeatWrapping;
    enemyTex.wrapT = THREE.RepeatWrapping;
    enemyTex.repeat.set(1 / 4, 1 / 2); // 4 horizontal columns, 2 vertical rows
    enemyTex.offset.set(0, 0.5); // Start on Row 1 (Idle top row coordinate)
    enemyTex.needsUpdate = true;

    const enemyGeo = new THREE.PlaneGeometry(1.5, 1.5);
    const enemyMat = new THREE.MeshBasicMaterial({
      map: enemyTex,
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide
    });
    const enemyMesh = new THREE.Mesh(enemyGeo, enemyMat);

    // Spawn from outside the view distance (around 15-25 units away)
    const angle = Math.random() * Math.PI * 2;
    const distance = 16 + Math.random() * 8;
    const ex = playerPos.x + Math.cos(angle) * distance;
    const ez = playerPos.z + Math.sin(angle) * distance;

    // Boundaries check
    const clampedX = Math.max(-24, Math.min(24, ex));
    const clampedZ = Math.max(-24, Math.min(24, ez));

    enemyMesh.position.set(clampedX, 0.75, clampedZ);
    scene.add(enemyMesh);

    // Add small shadow plane under enemy
    const shadowGeo = new THREE.RingGeometry(0.1, 0.5, 16);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: '#000000',
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -0.74;
    enemyMesh.add(shadowMesh);

    gameRef.current.enemies.push({
      id: Math.random().toString(),
      position: enemyMesh.position,
      hp: 2,
      maxHp: 2,
      state: 'chase',
      knockbackTimer: 0,
      knockbackVelocity: new THREE.Vector3(),
      animFrame: 0,
      animTimer: 0,
      speed: 1.8 + Math.random() * 1.2, // Slightly randomized enemy speed
      facingRight: Math.random() > 0.5,
      mesh: enemyMesh,
      attackFlashTimer: 0,
      hitFlashTimer: 0,
      whiteFlashTimer: 0,
      isSecondHit: false,
      launchVelocity: new THREE.Vector3(),
      rotationSpeed: 0,
      radius: 0.75
    });
  };

  const triggerPlayerHurt = (amount: number, sourcePos?: THREE.Vector3) => {
    const player = gameRef.current.player;
    if (player.damageTimer > 0) return;

    player.damageTimer = 1.5; // Invincibility timeframe
    sfx.play('hurt');

    // Trigger massive red screen flash overlay visual
    setHurtOverlay(true);
    setTimeout(() => setHurtOverlay(false), 200);

    if (screenShakeEnabled) {
      gameRef.current.shakeIntensity = 0.45;
      gameRef.current.shakeTimer = 0.35;
    }

    if (sourcePos) {
      // Push player back from contact location
      const pushback = player.position.clone().sub(sourcePos);
      pushback.y = 0;
      pushback.normalize();
      player.position.addScaledVector(pushback, 1.8);
    }

    setHealth((prevHp) => {
      const nextHp = prevHp - amount;
      if (nextHp <= 0) {
        // Trigger Game Over Sequence
        sfx.play('gameover');
        setGameState('gameover');
      }
      return nextHp;
    });
  };

  const spawnBoss = () => {
    const scene = gameRef.current.scene;
    const tex = gameRef.current.bossTexture;
    const playerPos = gameRef.current.player.position;
    if (!scene || !tex) return;

    // Clear existing enemies so we have a clean duel
    gameRef.current.enemies.forEach((enemy) => {
      enemy.mesh.visible = false;
      scene.remove(enemy.mesh);
    });
    gameRef.current.enemies = [];

    // Slice texture dimensions (2 rows, 4 columns)
    const bossTex = tex.clone();
    bossTex.wrapS = THREE.RepeatWrapping;
    bossTex.wrapT = THREE.RepeatWrapping;
    bossTex.repeat.set(1 / 4, 1 / 2); // 4 horizontal columns, 2 vertical rows
    bossTex.offset.set(0, 0.5); // Start on Row 1 (Idle top row coordinate)
    bossTex.needsUpdate = true;

    // Boss has appropriate size (2.6x2.6)
    const bossGeo = new THREE.PlaneGeometry(2.6, 2.6);
    const bossMat = new THREE.MeshBasicMaterial({
      map: bossTex,
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide
    });
    const bossMesh = new THREE.Mesh(bossGeo, bossMat);

    // Spawn near the center but away from player
    let bx = (Math.random() - 0.5) * 15;
    let bz = (Math.random() - 0.5) * 15;
    while (playerPos.distanceTo(new THREE.Vector3(bx, 1.3, bz)) < 12) {
      bx = (Math.random() - 0.5) * 30;
      bz = (Math.random() - 0.5) * 30;
    }

    bossMesh.position.set(bx, 1.3, bz);
    scene.add(bossMesh);

    // Big shadow under boss (added directly to scene to prevent sinking when boss scales/bobs)
    const shadowGeo = new THREE.RingGeometry(0.1, 1.0, 32);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: '#000000',
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(bx, 0.01, bz);
    scene.add(shadowMesh);

    // Danger ring around feet (added directly to scene to prevent sinking)
    const dangerRingGeo = new THREE.RingGeometry(1.1, 1.3, 32);
    const dangerRingMat = new THREE.MeshBasicMaterial({
      color: '#ef4444',
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    const dangerRingMesh = new THREE.Mesh(dangerRingGeo, dangerRingMat);
    dangerRingMesh.rotation.x = -Math.PI / 2;
    dangerRingMesh.position.set(bx, 0.02, bz);
    scene.add(dangerRingMesh);

    gameRef.current.boss = {
      id: 'boss-1',
      position: bossMesh.position,
      hp: 12, // Requires 12 hits, which meets the "not less than 10 hits" condition
      maxHp: 12,
      state: 'idle',
      stateTimer: 2.0,
      animFrame: 0,
      animTimer: 0,
      facingRight: true,
      mesh: bossMesh,
      shadowMesh: shadowMesh,
      dangerRingMesh: dangerRingMesh,
      hitFlashTimer: 0,
      whiteFlashTimer: 0,
      scalePulseTimer: 0,
      shootTimer: 8.0, // First fireball after 8 seconds
      dashTarget: null,
      radius: 1.3,
      bossActiveTime: 0
    };

    setBossHealth(12);
    setBossMaxHealth(12);
    setBossActive(true);

    if (screenShakeEnabled) {
      gameRef.current.shakeIntensity = 0.6;
      gameRef.current.shakeTimer = 1.0;
    }

    spawnParticles(bossMesh.position, '#7c3aed', 35, 1.3);
    spawnParticles(bossMesh.position, '#ef4444', 20, 1.1);
    sfx.play('level');
  };

  const spawnFireball = (playerPos: THREE.Vector3) => {
    const scene = gameRef.current.scene;
    if (!scene) return;

    // Create warning indicator mesh on the ground (grows and blinks red)
    const warnGeo = new THREE.RingGeometry(0.1, 1.3, 32);
    const warnMat = new THREE.MeshBasicMaterial({
      color: '#ef4444',
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    const warnMesh = new THREE.Mesh(warnGeo, warnMat);
    warnMesh.rotation.x = -Math.PI / 2;
    warnMesh.position.y = 0.05;

    // Place target position randomly within 5 units of current player position
    const offsetAngle = Math.random() * Math.PI * 2;
    const offsetDist = Math.random() * 6; // Max 6 units spread
    const tx = playerPos.x + Math.cos(offsetAngle) * offsetDist;
    const tz = playerPos.z + Math.sin(offsetAngle) * offsetDist;

    // Clamp target to field boundaries
    const targetX = Math.max(-24, Math.min(24, tx));
    const targetZ = Math.max(-24, Math.min(24, tz));
    const targetPos = new THREE.Vector3(targetX, 0, targetZ);
    warnMesh.position.set(targetX, 0.05, targetZ);
    scene.add(warnMesh);

    // Create Fireball Sphere Mesh
    const ballGeo = new THREE.SphereGeometry(0.6, 16, 16);
    const ballMat = new THREE.MeshBasicMaterial({
      color: '#f97316', // bright fiery orange
      transparent: true,
      opacity: 0.95
    });
    const ballMesh = new THREE.Mesh(ballGeo, ballMat);

    // Fireball starts high up in the sky, at a random altitude
    const startY = 18 + Math.random() * 5;
    ballMesh.position.set(targetX, startY, targetZ);
    scene.add(ballMesh);

    // Add small glowing trail mesh to the fireball
    const trailGeo = new THREE.ConeGeometry(0.4, 1.2, 16);
    const trailMat = new THREE.MeshBasicMaterial({
      color: '#ef4444',
      transparent: true,
      opacity: 0.7
    });
    const trailMesh = new THREE.Mesh(trailGeo, trailMat);
    trailMesh.rotation.x = Math.PI; // point upwards
    trailMesh.position.y = 0.6;
    ballMesh.add(trailMesh);

    gameRef.current.bossFireballs.push({
      id: Math.random().toString(),
      position: ballMesh.position,
      targetPosition: targetPos,
      mesh: ballMesh,
      warningMesh: warnMesh,
      state: 'falling', // starts in falling state directly, traveling from high above to the ground
      timer: 0,
      totalDuration: 2.5 + Math.random() * 0.8 // 2.5 to 3.3 seconds to fall, giving enough warning time
    });
  };

  const spawnWarpPortal = (pos: THREE.Vector3) => {
    const scene = gameRef.current.scene;
    if (!scene) return;

    // Prismatic glowing ring geometry
    const portalGeo = new THREE.TorusGeometry(1.2, 0.15, 16, 100);
    const portalMat = new THREE.MeshBasicMaterial({
      color: '#10b981', // Emerald green warp gate
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    const portalMesh = new THREE.Mesh(portalGeo, portalMat);
    
    // Stand upright (perpendicular to ground) and spin
    portalMesh.position.copy(pos);
    portalMesh.position.y = 1.3;
    scene.add(portalMesh);

    // Inner glowing circle plane
    const innerGeo = new THREE.CircleGeometry(1.2, 32);
    const innerMat = new THREE.MeshBasicMaterial({
      color: '#059669',
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    portalMesh.add(innerMesh);

    gameRef.current.warpPortal = {
      position: portalMesh.position,
      mesh: portalMesh,
      active: true
    };

    setPortalActive(true);

    // Spawn a wave of bright emerald particles
    spawnParticles(portalMesh.position, '#10b981', 30, 1.2);
  };

  // ==========================================
  // PARTICLE SYSTEM ENGINE
  // ==========================================
  const spawnParticles = (pos: THREE.Vector3, colorHex: string, count: number, speedScale: number = 1) => {
    const scene = gameRef.current.scene;
    if (!scene) return;

    for (let i = 0; i < count; i++) {
      const pGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
      const pMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colorHex),
        transparent: true,
        opacity: 0.9
      });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.position.copy(pos);
      // Small vertical lift offset to make particles explode nicely
      pMesh.position.y += (Math.random() - 0.2) * 0.5;
      scene.add(pMesh);

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 6 * speedScale,
        (Math.random() * 4 + 2) * speedScale,
        (Math.random() - 0.5) * 6 * speedScale
      );

      gameRef.current.particles.push({
        position: pMesh.position,
        velocity,
        color: pMat.color,
        size: 0.15,
        life: 1.0,
        maxLife: 0.5 + Math.random() * 0.5,
        mesh: pMesh
      });
    }
  };

  // ==========================================
  // ATTACK ACTION & KNOCKBACK/DEFEAT SYSTEM
  // ==========================================
  const triggerPlayerAttack = () => {
    const player = gameRef.current.player;
    if (player.isAttacking) return; // Prevent spamming within exact duration

    player.isAttacking = true;
    player.attackTimer = player.attackDuration;
    player.lastAttackTime = Date.now();

    sfx.play('slash');

    // Trigger Screen Shake for weapon swing feedback
    if (screenShakeEnabled) {
      gameRef.current.shakeIntensity = 0.15;
      gameRef.current.shakeTimer = 0.12;
    }

    // Positions for slash direction
    const forward = new THREE.Vector3(0, 0, -1);
    if (player.facingRight) {
      forward.set(1, 0, 0);
    } else {
      forward.set(-1, 0, 0);
    }

    // Align Slash arc effect visually in front of player
    const arc = player.slashArcMesh;
    if (arc) {
      arc.position.copy(player.position);
      // Offset slightly forward in direction player is looking
      arc.position.addScaledVector(forward, 1.2);
      arc.position.y = 0.5;

      // Rotate/Flip arc plane based on direction
      arc.rotation.z = player.facingRight ? 0 : Math.PI;
      const arcMat = arc.material as THREE.MeshBasicMaterial;
      arcMat.opacity = 0.9;
    }

    // Spawn slice spark particles
    const sparkPos = player.position.clone().addScaledVector(forward, 1.3);
    spawnParticles(sparkPos, '#22d3ee', 6, 0.6);

    // Hit registration for enemies in range
    gameRef.current.enemies.forEach((enemy) => {
      if (enemy.state === 'dead' || enemy.isSecondHit) return;

      const dist = player.position.distanceTo(enemy.position);
      if (dist < 3.2) {
        // Calculate vector from player to enemy
        const hitVec = enemy.position.clone().sub(player.position);
        hitVec.y = 0;
        hitVec.normalize();

        // Reduce enemy hit points
        enemy.hp -= 1;
        sfx.play('hit');

        // Flash indicator timers
        enemy.hitFlashTimer = 0.25;

        // Visual Spark particles on contact
        spawnParticles(enemy.position, '#ffffff', 8, 1.2);

        if (enemy.hp === 1) {
          // First Hit: Knockback backward in the direction the attack was delivered
          enemy.state = 'knockback';
          enemy.knockbackTimer = 0.4;
          enemy.knockbackVelocity.copy(hitVec).multiplyScalar(15); // Powerful pushback force
        } else if (enemy.hp <= 0) {
          // Second Hit: Launch out of boundary! Fly high into sky and spin or fade
          enemy.isSecondHit = true;
          enemy.state = 'dead';
          
          // Apply strong launching projectile velocity
          enemy.launchVelocity.copy(hitVec).multiplyScalar(12);
          enemy.launchVelocity.y = 22; // High arc lift
          enemy.rotationSpeed = (Math.random() - 0.5) * 45; // Super rapid spinning out

          // White rapid blinding flash
          enemy.whiteFlashTimer = 1.2;

          // Splendid explosion particles
          spawnParticles(enemy.position, '#00ff88', 15, 1.8);
          spawnParticles(enemy.position, '#fbbf24', 10, 1.5);

          // Update game score statistics
          setEnemiesDefeated((prev) => {
            const next = prev + 1;
            // Gradually reduce spawn intervals to scale difficulty as enemies are defeated
            gameRef.current.spawnInterval = Math.max(0.6, 2.0 - (next * 0.04));
            if (next >= 50 && !gameRef.current.boss && !gameRef.current.warpPortal) {
              // Trigger Boss Spawn after a tiny delay
              setTimeout(() => {
                spawnBoss();
              }, 100);
            }
            return next;
          });
        }
      }
    }
    );

    // Hit registration for Boss in range
    const boss = gameRef.current.boss;
    if (boss && boss.state !== 'dead') {
      const dist = player.position.distanceTo(boss.position);
      if (dist < 3.0) { // Larger hit range for Boss since Boss is larger than regular enemies
        // Reduce Boss HP
        boss.hp -= 1;
        setBossHealth(boss.hp);
        sfx.play('hit');

        // Flash boss mesh
        boss.hitFlashTimer = 0.3;

        // Spark particles
        spawnParticles(boss.position, '#7c3aed', 12, 1.3);

        // Check if boss defeated
        if (boss.hp <= 0) {
          boss.state = 'dead';
          setBossActive(false);

          // Hide and remove shadow and danger ring immediately from the scene
          if (boss.shadowMesh) {
            boss.shadowMesh.visible = false;
            gameRef.current.scene?.remove(boss.shadowMesh);
          }
          if (boss.dangerRingMesh) {
            boss.dangerRingMesh.visible = false;
            gameRef.current.scene?.remove(boss.dangerRingMesh);
          }

          // Spawn massive death explosion particles
          spawnParticles(boss.position, '#7c3aed', 40, 2.5);
          spawnParticles(boss.position, '#fbbf24', 30, 2.0);
          spawnParticles(boss.position, '#ffffff', 20, 1.8);

          // Screen shake
          if (screenShakeEnabled) {
            gameRef.current.shakeIntensity = 0.8;
            gameRef.current.shakeTimer = 1.5;
          }

          // Fade out and remove boss mesh
          let t = 0;
          const fadeInterval = setInterval(() => {
            t += 0.1;
            if (boss.mesh) {
              const scale = Math.max(0, 2.6 * (1.0 - t));
              boss.mesh.scale.set(scale, scale, scale);
              if (scale <= 0) {
                boss.mesh.visible = false;
                gameRef.current.scene?.remove(boss.mesh);
                clearInterval(fadeInterval);
              }
            }
          }, 50);

          // Spawn the Warp Portal!
          spawnWarpPortal(boss.position);
        }
      }
    }
  };

  // On-screen Touch Button Attack trigger
  const handleTouchAttack = () => {
    triggerPlayerAttack();
  };

  // On-screen Potion usage
  const handleTouchPotion = () => {
    // Check if player has potions and is not already at max health
    if (potionsCollected > 0 && health < 5) {
      setPotionsCollected((p) => p - 1);
      setHealth((h) => Math.min(5, h + 1));
      sfx.play('potion');
      const playerPos = gameRef.current.player.position;
      spawnParticles(playerPos, '#10b981', 15, 0.8);
    }
  };

  // ==========================================
  // CORE APPLET ENGINE GAME LOOP
  // ==========================================
  const gameLoop = () => {
    const ref = gameRef.current;
    if (!ref.scene || !ref.camera || !ref.renderer || !ref.clock) return;

    const delta = Math.min(ref.clock.getDelta(), 0.1); // Cap delta to prevent teleports on lag spikes
    const time = ref.clock.getElapsedTime();

    // 1. Time Survived Tracker update
    ref.timeCounter += delta;
    if (ref.timeCounter >= 1.0) {
      setTimeSurvived((prev) => prev + 1);
      ref.timeCounter = 0;
    }

    // 2. Screen shake decay
    if (ref.shakeTimer > 0) {
      ref.shakeTimer -= delta;
      if (ref.shakeTimer <= 0) {
        ref.shakeIntensity = 0;
      }
    }

    // 3. Spawning timer (Random enemies every 1-3 seconds, scaled by spawnInterval setting)
    // - If warp portal is active, no enemies spawn.
    // - If no boss exists, spawn normally.
    // - If boss exists, allow spawning ONLY after the boss has been active for 10 seconds, but with a slightly reduced spawn rate.
    if (!ref.warpPortal) {
      let canSpawn = false;
      let intervalMultiplier = 1.0;

      if (!ref.boss) {
        canSpawn = true;
      } else if (ref.boss.state !== 'dead' && ref.boss.bossActiveTime >= 10.0) {
        canSpawn = true;
        intervalMultiplier = 1.6; // Increase spawn interval by 1.6x for a slightly reduced spawn rate than normal
      }

      if (canSpawn) {
        ref.spawnTimer += delta;
        const currentDynamicInterval = ref.spawnInterval * intervalMultiplier * (0.8 + Math.random() * 0.4);
        if (ref.spawnTimer >= currentDynamicInterval) {
          spawnEnemy();
          ref.spawnTimer = 0;
        }
      }
    }

    // 4. Update Player Motion
    const player = ref.player;
    const moveX = (ref.keys['d'] || ref.keys['arrowright'] ? 1 : 0) - (ref.keys['a'] || ref.keys['arrowleft'] ? 1 : 0);
    const moveZ = (ref.keys['s'] || ref.keys['arrowdown'] ? 1 : 0) - (ref.keys['w'] || ref.keys['arrowup'] ? 1 : 0);

    const inputVec = new THREE.Vector3(moveX, 0, moveZ);
    if (inputVec.lengthSq() > 0) {
      inputVec.normalize();
      
      // Face left or right based on walking direction
      if (moveX > 0) {
        player.facingRight = true;
      } else if (moveX < 0) {
        player.facingRight = false;
      }

      // 8-direction speed calculations
      const speed = 7.0 * player.speedMultiplier;
      player.position.addScaledVector(inputVec, speed * delta);

      // Boundaries clamp for 50x50 map
      player.position.x = Math.max(-24.5, Math.min(24.5, player.position.x));
      player.position.z = Math.max(-24.5, Math.min(24.5, player.position.z));

      // Animated walking wobble effect (scale & rotation bounce)
      if (player.mesh) {
        player.mesh.scale.x = player.facingRight ? 1 : -1;
        player.mesh.rotation.z = Math.sin(time * 16) * 0.12; // High pace retro steps wobble
        player.mesh.position.y = 0.9 + Math.abs(Math.sin(time * 16)) * 0.15; // Bobbing height

        // Spawn running dust clouds
        if (Math.random() > 0.85) {
          const dustPos = player.position.clone();
          dustPos.y = 0.15;
          spawnParticles(dustPos, '#cbd5e1', 1, 0.2);
        }
      }
    } else {
      // Idle state animations
      if (player.mesh) {
        player.mesh.scale.x = player.facingRight ? 1 : -1;
        player.mesh.rotation.z = 0;
        player.mesh.position.y = 0.9 + Math.sin(time * 3.5) * 0.05; // Gentle breath floating animation
      }
    }

    if (player.mesh) {
      player.mesh.position.x = player.position.x;
      player.mesh.position.z = player.position.z;
    }

    // Standardized player sprite animation coordinates (4 rows, 4 columns)
    if (ref.playerTexture) {
      player.animTimer += delta;
      if (player.animTimer >= 0.12) {
        player.animFrame = (player.animFrame + 1) % 4;
        player.animTimer = 0;
      }

      // Determine the active animation row based on player states:
      // Row 1 (Top in image): Idle -> UV offset.y = 0.75
      // Row 2: Run -> UV offset.y = 0.50
      // Row 3: Attack -> UV offset.y = 0.25
      // Row 4 (Bottom in image): Hurt/Injured -> UV offset.y = 0.00
      let playerRowOffset = 0.75; // Row 1: Idle
      if (player.damageTimer > 0) {
        playerRowOffset = 0.0; // Row 4: Hurt/Injured
      } else if (player.isAttacking) {
        playerRowOffset = 0.25; // Row 3: Attack
      } else if (inputVec.lengthSq() > 0) {
        playerRowOffset = 0.50; // Row 2: Run and movement
      }

      ref.playerTexture.offset.x = player.animFrame * 0.25;
      ref.playerTexture.offset.y = playerRowOffset;
    }

    // Decoloring Slash Arc effect gradually
    if (player.isAttacking) {
      player.attackTimer -= delta;
      if (player.slashArcMesh) {
        const mat = player.slashArcMesh.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0, player.attackTimer / player.attackDuration);
      }
      if (player.attackTimer <= 0) {
        player.isAttacking = false;
      }
    }

    // Damage cooldown ticker
    if (player.damageTimer > 0) {
      player.damageTimer -= delta;
      if (player.mesh) {
        const mat = player.mesh.material as THREE.MeshBasicMaterial;
        // Make mesh flash red when invincible after hit
        if (Math.floor(time * 20) % 2 === 0) {
          mat.color.setHex(0xff0000);
        } else {
          mat.color.setHex(0xffffff);
        }
      }
    } else {
      if (player.mesh) {
        const mat = player.mesh.material as THREE.MeshBasicMaterial;
        mat.color.setHex(0xffffff);
      }
    }

    // 5. Update Potions Bobbing & Collision checks
    ref.potions.forEach((pot) => {
      if (pot.collected) return;

      pot.pulseTimer += delta * 4;
      pot.mesh.position.y = 0.5 + Math.sin(pot.pulseTimer) * 0.12; // Bobbing
      pot.mesh.rotation.y = time * 0.6; // Soft spin

      // Billboard rotation face camera
      pot.mesh.quaternion.copy(ref.camera!.quaternion);

      // Check pickup bounds
      const dist = player.position.distanceTo(pot.position);
      if (dist < 1.3) {
        pot.collected = true;
        pot.mesh.visible = false;
        ref.scene!.remove(pot.mesh);

        // Play ding sound
        sfx.play('potion');

        // Particles
        spawnParticles(pot.position, '#10b981', 12, 0.7);

        // Add potion to count (inventory)
        setPotionsCollected((prev) => prev + 1);

        // Spawn a replacement potion somewhere else on the map
        setTimeout(() => {
          if (gameState === 'playing') spawnPotion();
        }, 3000);
      }
    });
    // Remove collected potions from list
    ref.potions = ref.potions.filter((pot) => !pot.collected);

    // 6. Update Enemies Behavior & Motion
    ref.enemies.forEach((enemy) => {
      if (enemy.state === 'dead' && !enemy.isSecondHit) return;

      // Handle custom Billboard orientation matching camera face
      enemy.mesh.quaternion.copy(ref.camera!.quaternion);

      // Flash logic decay
      if (enemy.hitFlashTimer > 0) {
        enemy.hitFlashTimer -= delta;
        const mat = enemy.mesh.material as THREE.MeshBasicMaterial;
        mat.color.setHex(0xffffff); // Blink bright white/silver on hit
      } else if (enemy.attackFlashTimer > 0) {
        enemy.attackFlashTimer -= delta;
        const mat = enemy.mesh.material as THREE.MeshBasicMaterial;
        mat.color.setHex(0xef4444); // Flash scarlet red during action charge
      } else {
        const mat = enemy.mesh.material as THREE.MeshBasicMaterial;
        mat.color.setHex(0xffffff); // Restore normal appearance
      }

      // Handle SECOND HIT launch orbit motion (Flying spin decay)
      if (enemy.isSecondHit) {
        // Spin and launch into orbit
        enemy.mesh.position.addScaledVector(enemy.launchVelocity, delta);
        enemy.launchVelocity.y -= 35 * delta; // Gravity pull down
        enemy.mesh.rotation.z += enemy.rotationSpeed * delta;
        
        // Scale down size to vanish
        const scaleDecay = Math.max(0, enemy.mesh.scale.x - delta * 1.5);
        enemy.mesh.scale.set(scaleDecay, scaleDecay, scaleDecay);

        if (enemy.mesh.position.y < -15 || scaleDecay <= 0) {
          enemy.mesh.visible = false;
          ref.scene!.remove(enemy.mesh);
        }
        return;
      }

      // Normal movement states (Chase or Knockback)
      if (enemy.state === 'knockback') {
        enemy.mesh.position.addScaledVector(enemy.knockbackVelocity, delta);
        enemy.knockbackTimer -= delta;
        
        // Custom animation wiggle
        enemy.mesh.rotation.z = Math.sin(time * 35) * 0.25;

        if (enemy.knockbackTimer <= 0) {
          enemy.state = 'chase';
        }
      } else if (enemy.state === 'chase') {
        // Calculate heading to player
        const toPlayer = player.position.clone().sub(enemy.position);
        toPlayer.y = 0;
        const dist = toPlayer.length();

        // Standardized sprite animation coordinates (Row 1 is walking)
        const map = (enemy.mesh.material as THREE.MeshBasicMaterial).map;
        if (map) {
          enemy.animTimer += delta;
          if (enemy.animTimer >= 0.12) {
            enemy.animFrame = (enemy.animFrame + 1) % 4; // 4 vertical frame columns loop
            map.offset.x = enemy.animFrame * 0.25;
            map.offset.y = 0.0; // Bottom Row 0 in ThreeJS UV is walk
            enemy.animTimer = 0;
          }
        }

        if (dist > 0.8) {
          toPlayer.normalize();
          
          // Face character orientation left/right
          enemy.facingRight = toPlayer.x > 0;
          enemy.mesh.scale.x = enemy.facingRight ? 1 : -1;

          // Push enemies away from each other to prevent cluttering (Simple Flocking repulsion)
          const repulsion = new THREE.Vector3();
          ref.enemies.forEach((other) => {
            if (other.id === enemy.id || other.state === 'dead') return;
            const separationDist = enemy.position.distanceTo(other.position);
            if (separationDist < 1.4) {
              const repelVec = enemy.position.clone().sub(other.position);
              repelVec.y = 0;
              repelVec.normalize();
              // Inversely proportional to distance
              repulsion.addScaledVector(repelVec, (1.4 - separationDist) * 3);
            }
          });

          const movement = toPlayer.multiplyScalar(enemy.speed).add(repulsion);
          movement.y = 0;
          enemy.mesh.position.addScaledVector(movement, delta);

          // Gentle bobbing height
          enemy.mesh.position.y = 0.75 + Math.abs(Math.sin(time * 8)) * 0.08;
        }

        // Damage Player triggers (Close proximity attack)
        if (dist < 1.2 && player.damageTimer <= 0) {
          // Trigger Flash Red indicator
          enemy.attackFlashTimer = 0.4;
          player.damageTimer = 1.5; // Invincibility timeframe

          sfx.play('hurt');

          // Trigger massive red screen flash overlay visual
          setHurtOverlay(true);
          setTimeout(() => setHurtOverlay(false), 200);

          if (screenShakeEnabled) {
            ref.shakeIntensity = 0.4;
            ref.shakeTimer = 0.35;
          }

          // Push player back from enemy contact location
          const pushback = player.position.clone().sub(enemy.position);
          pushback.y = 0;
          pushback.normalize();
          player.position.addScaledVector(pushback, 1.8);

          setHealth((prevHp) => {
            const nextHp = prevHp - 1;
            if (nextHp <= 0) {
              // Trigger Game Over Sequence
              sfx.play('gameover');
              setGameState('gameover');
            }
            return nextHp;
          });
        }
      }
    });

    // Clean up completely dead or exited-screen enemies
    ref.enemies = ref.enemies.filter((enemy) => {
      const isOut = enemy.isSecondHit && enemy.mesh.position.y < -14;
      if (isOut) {
        return false;
      }
      return true;
    });

    // 7. Update Active Particle systems
    ref.particles.forEach((part) => {
      part.position.addScaledVector(part.velocity, delta);
      part.velocity.y -= 9.8 * delta; // Gravity pull
      part.life -= delta;

      // Shrink size over lifetime
      const lifePct = Math.max(0, part.life / part.maxLife);
      part.mesh.scale.set(lifePct, lifePct, lifePct);

      if (part.life <= 0) {
        part.mesh.visible = false;
        ref.scene!.remove(part.mesh);
      }
    });
    ref.particles = ref.particles.filter((part) => part.life > 0);

    // 7b. Update Boss Behavior & Motion
    const boss = ref.boss;
    if (boss && boss.state !== 'dead') {
      // Track seconds boss has been alive
      boss.bossActiveTime += delta;

      // 1. Face camera
      boss.mesh.quaternion.copy(ref.camera!.quaternion);

      // Flash logic decay
      if (boss.hitFlashTimer > 0) {
        boss.hitFlashTimer -= delta;
        const mat = boss.mesh.material as THREE.MeshBasicMaterial;
        mat.color.setHex(0xaaaaaa); // Light gray/silver flash
      } else {
        const mat = boss.mesh.material as THREE.MeshBasicMaterial;
        mat.color.setHex(0xffffff); // Normal appearance
      }

      // Tick state timers
      boss.stateTimer -= delta;
      boss.shootTimer -= delta;

      // Fireball shooting timer (every 10-15 seconds)
      if (boss.shootTimer <= 0 && (boss.state === 'idle' || boss.state === 'dash')) {
        boss.state = 'telegraph';
        boss.stateTimer = 2.0; // 2 seconds pulse warning
        boss.shootTimer = 10.0 + Math.random() * 5.0; // Reset shoot timer between 10 to 15s
      }

      // Tick animation spritesheet
      boss.animTimer += delta;
      if (boss.animTimer >= 0.15) {
        boss.animFrame = (boss.animFrame + 1) % 4;
        const map = (boss.mesh.material as THREE.MeshBasicMaterial).map;
        if (map) {
          map.offset.x = boss.animFrame * 0.25;
          // Row 0 is normal (idle/dash), Row 1 (Bottom) is angry/telegraph
          map.offset.y = (boss.state === 'telegraph') ? 0.0 : 0.5;
        }
        boss.animTimer = 0;
      }

      // Update flat ground meshes to track boss horizontal position
      if (boss.shadowMesh) {
        boss.shadowMesh.position.set(boss.position.x, 0.01, boss.position.z);
      }
      if (boss.dangerRingMesh) {
        boss.dangerRingMesh.position.set(boss.position.x, 0.02, boss.position.z);
      }

      // State machine logic
      if (boss.state === 'idle') {
        // Float bobbing effect
        boss.mesh.position.y = 1.3 + Math.sin(time * 3.5) * 0.12;
        
        // Always look towards player x-axis
        boss.facingRight = player.position.x > boss.position.x;
        boss.mesh.scale.x = boss.facingRight ? 2.6 : -2.6;
        boss.mesh.scale.y = 2.6;
        boss.mesh.scale.z = 2.6;

        // Transition from Idle to Dash after some time
        if (boss.stateTimer <= 0) {
          // Dash toward player (near) or choose a spot far away (far)
          const isNear = Math.random() > 0.4;
          let targetPos = new THREE.Vector3();
          
          if (isNear) {
            targetPos.copy(player.position);
          } else {
            // Find a point away from player
            const angle = Math.random() * Math.PI * 2;
            const distance = 12 + Math.random() * 10;
            targetPos.set(
              player.position.x + Math.cos(angle) * distance,
              1.3,
              player.position.z + Math.sin(angle) * distance
            );
          }

          // Clamp to boundary
          targetPos.x = Math.max(-23, Math.min(23, targetPos.x));
          targetPos.z = Math.max(-23, Math.min(23, targetPos.z));
          targetPos.y = 1.3;

          boss.dashTarget = targetPos;
          boss.state = 'dash';
          boss.stateTimer = 1.5; // Max 1.5s dash safety
        }

        // Proximity damage to player
        const distToPlayer = player.position.distanceTo(boss.position);
        if (distToPlayer < 1.6 && player.damageTimer <= 0) {
          triggerPlayerHurt(1, boss.position);
        }

      } else if (boss.state === 'dash') {
        // High-speed slide/dash movement
        boss.position.y = 1.3; // keep at ground level
        if (boss.dashTarget) {
          const toTarget = boss.dashTarget.clone().sub(boss.position);
          toTarget.y = 0;
          const dist = toTarget.length();

          if (dist > 0.6) {
            toTarget.normalize();
            boss.facingRight = toTarget.x > 0;
            boss.mesh.scale.x = boss.facingRight ? 2.6 : -2.6;
            boss.mesh.scale.y = 2.6;
            boss.mesh.scale.z = 2.6;

            const dashSpeed = 15.5;
            boss.position.addScaledVector(toTarget, dashSpeed * delta);

            // Emit dust particles
            if (Math.random() > 0.6) {
              const dustPos = boss.position.clone();
              dustPos.y = 0.25;
              spawnParticles(dustPos, '#7c3aed', 1, 0.4);
            }
          } else {
            // Reclaimed destination!
            boss.state = 'idle';
            boss.stateTimer = 1.5 + Math.random() * 1.5;
          }
        }

        if (boss.stateTimer <= 0) {
          boss.state = 'idle';
          boss.stateTimer = 1.5 + Math.random() * 1.5;
        }

        // Dash contact with player (heavy damage & high pushback)
        const distToPlayer = player.position.distanceTo(boss.position);
        if (distToPlayer < 1.8 && player.damageTimer <= 0) {
          triggerPlayerHurt(1, boss.position);
          const push = player.position.clone().sub(boss.position).normalize().multiplyScalar(4);
          player.position.add(push);
        }

      } else if (boss.state === 'telegraph') {
        // Pulsate scaling prior to throwing fireball
        const pulse = 2.6 + Math.sin(time * 20.0) * 0.5;
        boss.mesh.scale.set(pulse * (boss.facingRight ? 1 : -1), pulse, pulse);
        
        // Slide slightly towards ground
        boss.mesh.position.y = 1.3;

        if (boss.stateTimer <= 0) {
          // Fireball release!
          sfx.play('level');
          
          // Throw 4 fireballs in a row
          for (let i = 0; i < 4; i++) {
            spawnFireball(player.position);
          }

          // Reset scale and go back to idle
          boss.mesh.scale.set(boss.facingRight ? 2.6 : -2.6, 2.6, 2.6);
          boss.state = 'idle';
          boss.stateTimer = 1.8;
        }
      }
    }

    // 7c. Update Boss Fireballs
    ref.bossFireballs.forEach((ball) => {
      ball.timer += delta;
      const progress = Math.min(1.0, ball.timer / ball.totalDuration);

      // Warning indicator scaling & blinking animation
      if (ball.warningMesh) {
        const blink = Math.floor(progress * 15) % 2 === 0;
        (ball.warningMesh.material as THREE.MeshBasicMaterial).opacity = blink ? 0.75 : 0.25;
        const scale = 0.7 + Math.sin(progress * Math.PI) * 0.5;
        ball.warningMesh.scale.set(scale, scale, scale);
      }

      // Linear descent of the fireball downwards
      const startY = 18;
      const currentY = Math.max(0.35, startY * (1.0 - progress));
      ball.position.y = currentY;

      // Slowly rotate fireball sphere
      ball.mesh.rotation.y += delta * 6;

      // Contact with floor (Impact explosion)
      if (progress >= 1.0 || ball.position.y <= 0.4) {
        ball.mesh.visible = false;
        ball.warningMesh.visible = false;
        ref.scene!.remove(ball.mesh);
        ref.scene!.remove(ball.warningMesh);

        // Splatters of flame/embers particles
        sfx.play('hit');
        spawnParticles(ball.targetPosition, '#ef4444', 12, 1.2);
        spawnParticles(ball.targetPosition, '#f59e0b', 8, 0.9);

        // Player range damage check
        const distToPlayer = player.position.distanceTo(ball.targetPosition);
        if (distToPlayer < 1.8 && player.damageTimer <= 0) {
          triggerPlayerHurt(1);
        }

        (ball as any).dead = true;
      }
    });
    ref.bossFireballs = ref.bossFireballs.filter((ball) => !(ball as any).dead);

    // 7d. Update Warp Portal
    const portal = ref.warpPortal;
    if (portal && portal.active) {
      portal.mesh.rotation.y = time * 2.5; // Spin warping rings
      portal.mesh.rotation.z = time * 0.6;

      const pScale = 1.0 + Math.sin(time * 6) * 0.12;
      portal.mesh.scale.set(pScale, pScale, pScale);

      // Float emerald particles
      if (Math.random() > 0.88) {
        const pBubble = portal.position.clone();
        pBubble.x += (Math.random() - 0.5) * 1.5;
        pBubble.z += (Math.random() - 0.5) * 1.5;
        pBubble.y = 0.15;
        spawnParticles(pBubble, '#10b981', 1, 0.35);
      }

      // Collision trigger with Portal (Enters victory screen ending)
      const dist = player.position.distanceTo(portal.position);
      if (dist < 1.4) {
        sfx.play('level');
        setGameState('ending');
      }
    }

    // 8. Handle Camera Follow & Screen Shake effects
    const cameraDest = new THREE.Vector3();
    if (cameraAnglePreset === 'isometric') {
      cameraDest.set(player.position.x, player.position.y + 11, player.position.z + 11);
    } else {
      cameraDest.set(player.position.x, player.position.y + 15, player.position.z + 2);
    }

    // Smooth transition camera follow (Lerp dampening)
    ref.camera.position.lerp(cameraDest, 6.0 * delta);

    // Shake Camera offset calculation
    if (ref.shakeTimer > 0) {
      const sx = (Math.random() - 0.5) * ref.shakeIntensity;
      const sy = (Math.random() - 0.5) * ref.shakeIntensity;
      const sz = (Math.random() - 0.5) * ref.shakeIntensity;
      ref.camera.position.add(new THREE.Vector3(sx, sy, sz));
    }

    // Orient camera looking at player
    ref.camera.lookAt(player.position.x, player.position.y + 0.5, player.position.z);

    // Render step
    ref.renderer.render(ref.scene, ref.camera);

    // Recursively loop frame
    ref.animationFrameId = requestAnimationFrame(gameLoop);
  };

  // ==========================================
  // CLICK SOUND GENERATOR FOR MENUS
  // ==========================================
  const playClick = () => {
    sfx.play('click');
  };

  return (
    <div className="w-screen h-screen bg-[#0F172A] text-white relative overflow-hidden font-sans select-none flex flex-col items-center justify-center">
      
      {/* BACKGROUND SCI-FI STYLISH NEON GRID */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute w-[2000px] h-[2000px] top-[-500px] left-[-500px] bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:40px_40px] opacity-30" 
          style={{ transform: 'perspective(1000px) rotateX(60deg)' }}
        ></div>
        <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/10 blur-[120px] rounded-full"></div>
      </div>

      {/* THREE.JS GAME INTERACTIVE CANVAS */}
      <div 
        ref={containerRef} 
        id="canvas-stage" 
        className="absolute inset-0 z-10 w-full h-full bg-[#0b0f19]"
      />

      {/* SCREEN RED FLASH OVERLAY ON HURT DAMAGE */}
      <div 
        id="hurt-overlay"
        className={`absolute inset-0 z-30 bg-red-600/30 pointer-events-none transition-opacity duration-75 ${
          hurtOverlay ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* ==========================================
          GAME HUD HUD INTERFACE
          ========================================== */}
      {gameState === 'playing' && (
        <div className="absolute inset-0 z-20 flex flex-col justify-between p-6 md:p-10 pointer-events-none">
          
          {/* Top Info Bar */}
          <div className="flex justify-between items-start">
            
            {/* Health Bar (Glowing red circles from Vibrant Palette theme) */}
            <div className="flex flex-col gap-2 bg-black/40 backdrop-blur-md p-4 rounded-3xl border border-white/10">
              <div className="flex items-center gap-3">
                <div className="text-xs font-black uppercase tracking-widest text-blue-400 px-1">Hero Health</div>
                <div className="flex gap-2">
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-6 h-6 rounded-full transition-all duration-300 ${
                        i < health 
                          ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)] border border-red-400 scale-100' 
                          : 'bg-slate-700/80 border border-slate-600 scale-90'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* BOSS HEALTH BAR (TOP CENTER OVERLAY) */}
            {bossActive && bossHealth !== null && bossMaxHealth !== null && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 w-full max-w-[280px] md:max-w-[420px] bg-black/75 backdrop-blur-lg px-6 py-4 rounded-[28px] border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.2)] flex flex-col items-center gap-2 animate-pulse pointer-events-auto">
                <div className="flex justify-between w-full items-center">
                  <div className="text-[11px] font-black uppercase tracking-[0.25em] text-red-500 font-mono">⚠️ RAGE DEMON BOSS ⚠️</div>
                  <div className="text-[12px] font-black text-red-400 font-mono">{bossHealth} / {bossMaxHealth} HP</div>
                </div>
                {/* Visual heart bars or pip markers */}
                <div className="w-full h-3.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700 p-0.5 flex">
                  {[...Array(bossMaxHealth)].map((_, idx) => (
                    <div 
                      key={idx}
                      className={`h-full flex-1 transition-all duration-300 first:rounded-l-full last:rounded-r-full ${
                        idx < bossHealth 
                          ? 'bg-gradient-to-r from-red-600 to-amber-500 border-r border-red-900/30 shadow-[0_0_6px_rgba(239,68,68,0.7)]' 
                          : 'bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-[9px] text-red-400/80 font-semibold tracking-wider uppercase">Avoid Fireballs & Strike to Vanquish!</div>
              </div>
            )}

            {/* Score & Potions displays */}
            <div className="flex gap-3">
              {/* Score / Slashes */}
              <div className="bg-black/40 backdrop-blur-md px-5 py-3 rounded-3xl border border-white/10 flex flex-col items-end">
                <div className="text-[10px] font-black uppercase tracking-widest text-blue-400">Enemies Slashed</div>
                <div className="text-2xl font-mono font-bold text-white tracking-tight">{enemiesDefeated}</div>
              </div>

              {/* Potions Container */}
              <div className="bg-black/40 backdrop-blur-md px-5 py-3 rounded-3xl border border-white/10 flex flex-col items-end">
                <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Potions Held</div>
                <div className="text-2xl font-mono font-bold text-emerald-300 tracking-tight">{potionsCollected}</div>
              </div>
            </div>

          </div>

          {/* Bottom HUD - Controls Info & Mobile Gamepad Overlay */}
          <div className="flex justify-between items-end">
            
            {/* Control Reminder */}
            <div className="flex gap-4 pointer-events-auto">
              <div className="flex flex-col gap-2 bg-black/40 backdrop-blur-md p-4 rounded-[24px] border border-white/10 hidden sm:flex">
                <div className="text-[10px] text-center opacity-60 uppercase tracking-widest font-bold text-blue-400">
                  {controlPreset === 'wasd' ? 'WASD Move' : 'Arrow Keys Move'}
                </div>
                {controlPreset === 'wasd' ? (
                  <div className="flex flex-col gap-1 items-center">
                    <div className="w-9 h-9 bg-white/10 rounded-lg border border-white/20 flex items-center justify-center font-bold text-sm">W</div>
                    <div className="flex gap-1">
                      <div className="w-9 h-9 bg-white/10 rounded-lg border border-white/20 flex items-center justify-center font-bold text-sm">A</div>
                      <div className="w-9 h-9 bg-white/10 rounded-lg border border-white/20 flex items-center justify-center font-bold text-sm">S</div>
                      <div className="w-9 h-9 bg-white/10 rounded-lg border border-white/20 flex items-center justify-center font-bold text-sm">D</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 items-center">
                    <div className="w-9 h-9 bg-white/10 rounded-lg border border-white/20 flex items-center justify-center font-bold text-sm">▲</div>
                    <div className="flex gap-1">
                      <div className="w-9 h-9 bg-white/10 rounded-lg border border-white/20 flex items-center justify-center font-bold text-sm">◀</div>
                      <div className="w-9 h-9 bg-white/10 rounded-lg border border-white/20 flex items-center justify-center font-bold text-sm">▼</div>
                      <div className="w-9 h-9 bg-white/10 rounded-lg border border-white/20 flex items-center justify-center font-bold text-sm">▶</div>
                    </div>
                  </div>
                )}
                <div className="text-[10px] text-center opacity-50 uppercase tracking-widest mt-1">
                  Space / J to Slash
                </div>
                <div className="text-[10px] text-center opacity-70 uppercase tracking-widest mt-1 text-emerald-400 font-bold">
                  E to Use Potion
                </div>
              </div>
            </div>

            {/* In-Game Action Menu HUD Controls */}
            <div className="flex gap-4 items-center pointer-events-auto">
              
              {/* Settings shortcut */}
              <button 
                onClick={() => { playClick(); setGameState('options'); }}
                className="w-12 h-12 rounded-full bg-slate-800/80 border border-white/10 flex items-center justify-center hover:bg-slate-700 active:scale-95 transition-all text-white cursor-pointer"
                title="Options"
              >
                <Settings size={20} />
              </button>

              {/* Mobile Gamepad Attack Action Button */}
              <button 
                onClick={handleTouchAttack}
                className="group w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 border-4 border-blue-400 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.6)] hover:scale-105 active:scale-90 transition-all cursor-pointer"
              >
                <Sword size={22} className="text-white mb-0.5" />
                <span className="text-[8px] font-black uppercase tracking-widest">SLASH</span>
              </button>

              {/* Mobile Gamepad Potion Consumption Button */}
              <button 
                onClick={handleTouchPotion}
                disabled={potionsCollected <= 0}
                className={`group w-16 h-16 rounded-full flex flex-col items-center justify-center border-4 transition-all ${
                  potionsCollected > 0 
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-700 border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.5)] active:scale-90 cursor-pointer' 
                    : 'bg-slate-800/80 border-slate-700 opacity-40 cursor-not-allowed'
                }`}
              >
                <Sparkles size={20} className="text-white mb-0.5" />
                <span className="text-[8px] font-black uppercase tracking-widest">POTION</span>
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ==========================================
          START MENU OVERLAY (Vibrant Palette Theme)
          ========================================== */}
      {gameState === 'menu' && (
        <div id="start-menu" className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6">
          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
            {/* Animated decorative graphics */}
            <div className="absolute top-[30%] left-[15%] w-16 h-24 bg-blue-500/20 border-2 border-blue-500/50 rounded-lg flex flex-col items-center justify-center animate-pulse">
              <div className="w-4 h-4 bg-white/20 rounded-full mb-2"></div>
              <div className="w-8 h-2 bg-white/20 rounded-full"></div>
            </div>
            <div className="absolute top-[50%] right-[20%] w-16 h-16 bg-emerald-500/20 border-2 border-emerald-500/50 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-emerald-400 rounded-sm"></div>
            </div>
          </div>

          <div className="z-10 flex flex-col items-center mb-10 text-center">
            {/* Iconic Logo YAKSA SLASH */}
            <div className="relative w-32 h-32 mb-8 animate-bounce transition-transform duration-300 hover:scale-110">
              {/* Outer decorative pulsing glow */}
              <div className="absolute inset-0 bg-amber-500/15 rounded-full filter blur-xl animate-pulse"></div>
              
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_25px_rgba(245,158,11,0.45)] select-none">
                <defs>
                  <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="25%" stopColor="#f59e0b" />
                    <stop offset="60%" stopColor="#b45309" />
                    <stop offset="100%" stopColor="#78350f" />
                  </linearGradient>
                  <linearGradient id="slashGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#b45309" stopOpacity="0.3" />
                    <stop offset="50%" stopColor="#ffffff" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#fef08a" stopOpacity="1" />
                  </linearGradient>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                
                <g filter="url(#glow)">
                  {/* Background Shield/Portal Shape */}
                  <polygon points="50,6 90,26 90,74 50,94 10,74 10,26" fill="#0f172a" stroke="url(#goldGrad)" strokeWidth="2.5" opacity="0.95" />
                  
                  {/* Outer delicate gauge */}
                  <circle cx="50" cy="50" r="39" fill="none" stroke="url(#goldGrad)" strokeWidth="1" strokeDasharray="4,8" opacity="0.4" />
                  
                  {/* Yaksa horns forming the left & right branch of Y */}
                  {/* Left curve branch */}
                  <path d="M 28,26 C 34,31 43,40 46,49 C 43,51 36,46 25,36 Z" fill="url(#goldGrad)" />
                  <path d="M 25,36 L 43,51 L 41,53 L 23,38 Z" fill="#1e293b" opacity="0.3" />
                  
                  {/* Right curve branch */}
                  <path d="M 72,26 C 66,31 57,40 54,49 C 57,51 64,46 75,36 Z" fill="url(#goldGrad)" />
                  <path d="M 75,36 L 57,51 L 59,53 L 77,38 Z" fill="#1e293b" opacity="0.3" />
                  
                  {/* Central blade stem of Y */}
                  <path d="M 50,28 L 55,44 L 55,84 L 50,90 L 45,84 L 45,44 Z" fill="url(#goldGrad)" />
                  {/* Blade fuller groove */}
                  <line x1="50" y1="36" x2="50" y2="82" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                  
                  {/* Cross guard */}
                  <path d="M 34,44 L 66,44 L 60,49 L 40,49 Z" fill="#1e293b" stroke="url(#goldGrad)" strokeWidth="1" />
                  
                  {/* Giant Glowing Red/Orange Gem in Center */}
                  <circle cx="50" cy="44" r="3" fill="#ef4444" />
                  
                  {/* Epic Diagonal Sword Slash slicing across the logo */}
                  <line x1="12" y1="78" x2="88" y2="22" stroke="url(#slashGrad)" strokeWidth="4" strokeLinecap="round" />
                  <line x1="14" y1="76" x2="86" y2="24" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                </g>
              </svg>
            </div>

            <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic bg-clip-text text-transparent bg-gradient-to-b from-yellow-200 via-amber-400 to-amber-700 select-none leading-none drop-shadow-[0_4px_15px_rgba(245,158,11,0.3)]">
              YAKSA SLASH
            </h1>
            <p className="text-amber-400 font-bold tracking-[0.4em] uppercase text-xs md:text-sm mt-3 flex items-center justify-center gap-2">
              <Sparkles size={14} className="animate-pulse text-amber-300" />
              Legend of the Demon Slayer
            </p>
          </div>

          {/* Navigation Controls */}
          <div className="z-10 flex flex-col gap-4 w-72 md:w-80">
            <button 
              onClick={() => { playClick(); setGameState('playing'); }}
              className="group bg-white text-black font-black py-4 px-6 rounded-2xl flex items-center justify-between hover:scale-105 active:scale-95 transition-all shadow-[0_10px_20px_rgba(255,255,255,0.1)] cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Play size={20} fill="black" />
                <span className="text-lg uppercase tracking-tight font-black">Start Adventure</span>
              </div>
              <div className="w-2.5 h-2.5 bg-black rotate-45" />
            </button>

            <button 
              onClick={() => { playClick(); setGameState('options'); }}
              className="bg-white/10 text-white font-bold py-4 px-6 rounded-2xl border border-white/10 flex items-center justify-between hover:bg-white/20 hover:scale-102 active:scale-98 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Sliders size={20} className="text-blue-400" />
                <span className="text-lg uppercase tracking-tight">Options Settings</span>
              </div>
              <div className="w-2 h-2 border-2 border-blue-400 rounded-full" />
            </button>

            {/* Character Info Card */}
            <div className="mt-4 p-4 rounded-2xl bg-slate-900/90 border border-white/5 flex gap-3 items-center">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center overflow-hidden border border-white/10">
                <img 
                  src="https://raw.githubusercontent.com/banyapon/banyapon.github.io/refs/heads/main/studio/images/player.png" 
                  alt="Player Sprite" 
                  className="w-10 h-10 object-contain image-render-pixel"
                  onError={(e) => {
                    // Load fallback in UI
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="flex-1 text-left">
                <div className="text-[10px] font-black uppercase text-blue-400 tracking-wider">HERO AVATAR</div>
                <div className="text-xs text-slate-300 leading-tight">Controls: WASD/Arrows keys to move, Space/J to attack enemies.</div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-6 text-[10px] uppercase tracking-[0.4em] text-slate-500">
            Version 1.0.8-Build
          </div>
        </div>
      )}

      {/* ==========================================
          OPTIONS / ADJUST CONTROLS SCREEN OVERLAY
          ========================================== */}
      {gameState === 'options' && (
        <div id="options-menu" className="absolute inset-0 z-20 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-md bg-slate-900/80 rounded-3xl border border-white/10 p-6 md:p-8 flex flex-col gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <Settings className="text-blue-400" size={24} />
                <h2 className="text-2xl font-black uppercase tracking-tight">Options Settings</h2>
              </div>
              <button 
                onClick={() => { playClick(); setGameState('menu'); }}
                className="text-slate-400 hover:text-white text-sm uppercase font-bold px-3 py-1 bg-white/5 rounded-lg border border-white/5 cursor-pointer"
              >
                Back
              </button>
            </div>

            {/* 1. Control Key Binding Option */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Keyboard size={14} /> Control Buttons Preset
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => { playClick(); setControlPreset('wasd'); }}
                  className={`py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-between transition-all cursor-pointer ${
                    controlPreset === 'wasd' 
                      ? 'bg-blue-600 text-white border-2 border-blue-400 shadow-md' 
                      : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <span>W, A, S, D Keys</span>
                  {controlPreset === 'wasd' && <Check size={16} />}
                </button>

                <button 
                  onClick={() => { playClick(); setControlPreset('arrows'); }}
                  className={`py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-between transition-all cursor-pointer ${
                    controlPreset === 'arrows' 
                      ? 'bg-blue-600 text-white border-2 border-blue-400 shadow-md' 
                      : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <span>Arrow Keys</span>
                  {controlPreset === 'arrows' && <Check size={16} />}
                </button>
              </div>
            </div>

            {/* 2. Character Movement Speed Settings */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Zap size={14} /> Hero Agility Speed
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Normal (1x)', value: 1.0 },
                  { label: 'Agile (1.25x)', value: 1.25 },
                  { label: 'Blitz (1.5x)', value: 1.5 }
                ].map((item) => (
                  <button 
                    key={item.value}
                    onClick={() => { playClick(); setPlayerSpeedPreset(item.value); }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      playerSpeedPreset === item.value 
                        ? 'bg-blue-600 text-white border border-blue-400' 
                        : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Camera Perspective Toggle */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Info size={14} /> Camera Lens Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => { playClick(); setCameraAnglePreset('isometric'); }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    cameraAnglePreset === 'isometric' 
                      ? 'bg-blue-600 text-white border border-blue-400' 
                      : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10'
                  }`}
                >
                  3D Isometric Follow (45°)
                </button>

                <button 
                  onClick={() => { playClick(); setCameraAnglePreset('topdown'); }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    cameraAnglePreset === 'topdown' 
                      ? 'bg-blue-600 text-white border border-blue-400' 
                      : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10'
                  }`}
                >
                  Tactical Top-Down (90°)
                </button>
              </div>
            </div>

            {/* 4. Mute / Vibration checkboxes */}
            <div className="flex flex-col gap-3 pt-2 border-t border-white/10">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-300">Screen Shake Feedback</span>
                <input 
                  type="checkbox" 
                  checked={screenShakeEnabled}
                  onChange={(e) => { playClick(); setScreenShakeEnabled(e.target.checked); }}
                  className="w-5 h-5 rounded accent-blue-500 cursor-pointer"
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-300">SFX Audio Tones</span>
                <button 
                  onClick={() => setMuted(!muted)}
                  className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 cursor-pointer"
                >
                  {muted ? <VolumeX size={16} className="text-red-400" /> : <Volume2 size={16} className="text-emerald-400" />}
                </button>
              </div>
            </div>

            {/* 5. Save & Confirm Options */}
            <button 
              onClick={() => { playClick(); setGameState('menu'); }}
              className="mt-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black py-3.5 rounded-xl uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              Apply Options
            </button>

          </div>
        </div>
      )}

      {/* ==========================================
          GAME OVER SCREEN OVERLAY (Vibrant Palette)
          ========================================== */}
      {gameState === 'gameover' && (
        <div id="gameover-menu" className="absolute inset-0 z-20 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-sm bg-red-950/20 rounded-3xl border border-red-500/20 p-8 flex flex-col items-center text-center gap-6 shadow-[0_20px_50px_rgba(239,68,68,0.15)] animate-fade-in">
            
            <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse">
              <Skull className="text-red-500" size={38} />
            </div>

            <div className="flex flex-col gap-1.5">
              <h2 className="text-4xl font-black uppercase tracking-tight text-red-500 italic">Game Over</h2>
              <p className="text-xs text-slate-400 tracking-widest uppercase">The Horde has Overwhelmed You</p>
            </div>

            {/* Stats Summary Panel */}
            <div className="w-full grid grid-cols-3 gap-2 bg-black/40 p-4 rounded-2xl border border-white/5 font-mono">
              <div className="flex flex-col items-center">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">Time</span>
                <span className="text-base text-white font-black">{timeSurvived}s</span>
              </div>
              <div className="flex flex-col items-center border-x border-white/10">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">Defeated</span>
                <span className="text-base text-blue-400 font-black">{enemiesDefeated}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">Potions</span>
                <span className="text-base text-emerald-400 font-black">{potionsCollected}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <button 
                onClick={() => { playClick(); setGameState('playing'); }}
                className="bg-white text-black font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-2 hover:scale-102 active:scale-98 transition-all cursor-pointer"
              >
                <RotateCcw size={18} />
                <span className="text-base uppercase tracking-tight font-black">Restart Battle</span>
              </button>

              <button 
                onClick={() => { playClick(); setGameState('menu'); }}
                className="bg-white/5 text-slate-400 font-bold py-3 px-6 rounded-2xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer"
              >
                Main Menu
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ==========================================
          GAME VICTORY / ENDING SCREEN OVERLAY
          ========================================== */}
      {gameState === 'ending' && (
        <div id="ending-menu" className="absolute inset-0 z-20 bg-slate-950/95 backdrop-blur-lg flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-md bg-emerald-950/20 rounded-3xl border border-emerald-500/30 p-8 flex flex-col items-center text-center gap-6 shadow-[0_20px_60px_rgba(16,185,129,0.2)] animate-fade-in">
            
            <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.5)] animate-bounce">
              <Award className="text-emerald-400" size={48} />
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-emerald-400 italic">
                VICTORY!
              </h2>
              <p className="text-sm font-semibold text-emerald-300 uppercase tracking-widest">
                ปราบ Boss สำเร็จ!
              </p>
              <p className="text-xs text-slate-300 max-w-sm mt-1 leading-relaxed">
                คุณสามารถก้าวผ่านประตูมิติ Warp Portal คืนสู่โลกแห่งความเป็นจริงได้อย่างปลอดภัย!
              </p>
            </div>

            {/* Victory Statistics */}
            <div className="w-full bg-black/50 p-5 rounded-2xl border border-white/10 flex flex-col gap-3 font-mono text-sm">
              <div className="text-xs font-black uppercase text-emerald-400 tracking-wider text-left border-b border-white/5 pb-2 flex items-center gap-1.5">
                <Sparkles size={14} /> Battle Record / บันทึกการต่อสู้
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Time Survived / เวลา</span>
                <span className="text-white font-bold">{timeSurvived} วินาที</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Enemies Defeated / กำจัดศัตรู</span>
                <span className="text-blue-400 font-bold">{enemiesDefeated} ตัว</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Boss Encounter / ปราบ Boss</span>
                <span className="text-purple-400 font-bold">สำเร็จ (100%)</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full mt-2">
              <button 
                onClick={() => { playClick(); setGameState('playing'); }}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-2 hover:scale-102 active:scale-98 transition-all cursor-pointer shadow-[0_4px_14px_rgba(16,185,129,0.3)]"
              >
                <RotateCcw size={18} />
                <span className="text-base uppercase tracking-tight font-black font-sans">Play Again / เล่นอีกครั้ง</span>
              </button>

              <button 
                onClick={() => { playClick(); setGameState('menu'); }}
                className="bg-white/5 text-slate-400 font-bold py-3 px-6 rounded-2xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer font-sans"
              >
                Back to Main Menu / กลับหน้าหลัก
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
