/** Aceleração (m/s², sem a gravidade) que conta como pico de um passo. */
const STEP_THRESHOLD = 1.3;
/** Abaixo disso o sinal "desarma" e o próximo pico pode contar de novo. */
const RESET_THRESHOLD = 0.4;
/** Intervalo mínimo entre passos (ms): ninguém dá mais de ~3 passos por segundo. */
const MIN_STEP_INTERVAL = 300;

export type MotionPermission = "granted" | "denied" | "insecure" | "unsupported";

type DeviceMotionWithPermission = typeof DeviceMotionEvent & { requestPermission?: () => Promise<"granted" | "denied"> };

/**
 * Conta passos pelo acelerômetro do celular (evento `devicemotion`).
 * Cada passo gera um pico na aceleração; o detector separa a gravidade com uma
 * média lenta, suaviza o sinal e conta cada pico acima do limiar, com histerese
 * e um intervalo mínimo para não contar o mesmo passo duas vezes.
 */
export class StepDetector {
  steps = 0;
  /** Eventos recebidos: zero depois de alguns segundos = sem sensor (ex.: notebook). */
  samples = 0;

  private gravity = 9.81;
  private smoothed = 0;
  private armed = true;
  private lastStep = 0;

  constructor(private readonly onStep: () => void) {}

  static isSupported() {
    return typeof window !== "undefined" && "DeviceMotionEvent" in window;
  }

  /**
   * Pede acesso ao sensor. No iPhone só funciona chamado direto de um toque do
   * usuário. Em qualquer navegador, exige página segura (HTTPS ou localhost).
   */
  static async requestPermission(): Promise<MotionPermission> {
    if (!StepDetector.isSupported()) return "unsupported";
    if (!window.isSecureContext) return "insecure";
    const motion = DeviceMotionEvent as DeviceMotionWithPermission;
    if (typeof motion.requestPermission !== "function") return "granted";
    try {
      return (await motion.requestPermission()) === "granted" ? "granted" : "denied";
    } catch {
      return "denied";
    }
  }

  start() {
    window.addEventListener("devicemotion", this.handleMotion);
  }

  stop() {
    window.removeEventListener("devicemotion", this.handleMotion);
  }

  private handleMotion = (event: DeviceMotionEvent) => {
    const acceleration = event.accelerationIncludingGravity;
    if (acceleration?.x == null || acceleration.y == null || acceleration.z == null) return;
    this.samples++;

    const magnitude = Math.hypot(acceleration.x, acceleration.y, acceleration.z);
    this.gravity += (magnitude - this.gravity) * 0.02;
    this.smoothed += (magnitude - this.gravity - this.smoothed) * 0.35;

    const now = event.timeStamp || performance.now();
    if (this.armed && this.smoothed > STEP_THRESHOLD && now - this.lastStep > MIN_STEP_INTERVAL) {
      this.armed = false;
      this.lastStep = now;
      this.steps++;
      this.onStep();
    } else if (!this.armed && this.smoothed < RESET_THRESHOLD) {
      this.armed = true;
    }
  };
}
