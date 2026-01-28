"use client"

import React, { useEffect, useCallback, useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Button } from "@/components/ui/button"

interface CelebrationProps {
    open: boolean
    onClose: () => void
    taskCount: number
}

type CelebrationType = "fireworks" | "earthquake" | "explosion" | "aurora" | "meteor"

// 70 frases inspiradoras de Cal Newport, GTD, Deep Work - una por celebración
const DEEP_WORK_MESSAGES: readonly string[] = [
    // Cal Newport - Deep Work
    "El trabajo profundo es cada vez más rare y valioso.",
    "La capacidad de concentrarse es un superpoder.",
    "Cada tarea completada es capacidad mental construida.",
    "Lo profundo es lo que mueve al mundo.",
    "Tu atención es tu recurso más escaso.",
    "Hoy practicaste el arte de la concentración.",
    "El trabajo superficial es fácil. Lo profundo requiere valentía.",
    "Construiste tu capacidad para trabajo difícil.",
    "Distraerse es fácil. Enfocarse es un logro.",
    "Tu cerebro se fortalece con cada tarea profunda.",
    "La calidad de tu trabajo = tiempo invertido × intensidad de concentración",
    "Has dominado el arte de lo profundo hoy.",
    "La calidez de la tecnología no puede reemplazar la profundidad.",
    "Tu mente es para cosas importantes, no triviales.",
    "Hoy invertiste en tu capital intelectual.",
    "Las herramientas son auxiliares, tú eres el arquitecto.",
    "Lo mediocre abunda. Lo profundo escasea. Y tú lo hiciste.",
    "Cada tarea completada es una victoria contra lo superficial.",
    "Tu capacidad de enfoque es tu ventaja competitiva.",
    "El trabajo profundo es significativo. Y hoy fue significativo.",
    "Productividad sin intención es ruido.",
    "Hoy no procesaste información. Creaste valor.",
    "La soledad y la concentración son aliados. Hoy los utilizaste.",
    "Tu cerebro está diseñado para la profundidad, no la distracción.",
    "Reclamaste tu mente hoy. Eso vale mucho.",
    "Lo valioso requiere concentración sin interrupción.",
    "Hoy no estabas disponible. Estabas enfocado. Eso es poder.",
    "La felicidad proviene de la creación profunda, no el consumo superficial.",

    // David Allen - GTD
    "Tu mente es para tener ideas, no para mantenerlas.",
    "Has completado el ciclo. Tu mente está más libre.",
    "Una mente como el agua es el objetivo. Hoy te acercaste.",
    "Capturar, aclarar, organizar, reflexionar, hacer. Lo hiciste.",
    "Tu sistema funcionó. Las tareas están completadas.",
    "Lo próximo se define por lo que completaste hoy.",
    "Has cerrado circuitos abiertos. Eso libera energía mental.",
    "Tu sistema externo funcionó. Tu mente descansó.",
    "Completar permite crear. Hoy estás listo para crear.",
    "No hay cosas pendientes en tu mente. Solo logros.",
    "Has procesado tu mundo. Ahora puedes vivir en él.",
    "El vacío mental permite la claridad. Hoy tuviste claridad.",
    "Tu bandeja de entrada está vacía en lo importante.",
    "Completar es el primer paso de la creación.",
    "Tu sistema te sirvió. Le diste sentido a tus tareas.",
    "Lo que capturas, lo procesas. Lo procesado, se completó.",
    "Has aclarado tu mundo. Eso es productividad real.",
    "Tu mente está para tener ideas brillantes, no tareas pendientes.",
    "Has organizado tu realidad. Ahora puedes disfrutarla.",
    "Completado es mejor que perfecto. Hoy completaste.",
    "La revisión semanal empieza con las tareas de hoy.",
    "Has definido lo próximo. Has ejecutado. Has completado.",
    "Tu external brain funcionó. Tu mente creativa floreció.",

    // Filosofía de productividad y enfoque
    "Lo importante es más importante que lo urgente.",
    "Has priorizado lo esencial. Eso es liderazgo personal.",
    "Menos pero mejor. Hoy lo demostraste.",
    "La excelencia no es un acto, es un hábito.",
    "Tu inversión hoy compone interés mañana.",
    "Pequeñas victorias hoy, grandes logros mañana.",
    "Has ejecutado en lo fundamental. Olvida lo trivial.",
    "La calidad de tus tareas define la calidad de tu vida.",
    "Hoy no fuiste eficiente. Fuiste efectivo.",
    "El progreso real es silencioso. Lo escuchaste hoy.",
    "Has avanzado en lo que realmente importa.",
    "Tus acciones hoy son el embudo de tu mañana.",
    "La abundancia viene de enfocarse en lo esencial.",
    "Has eliminado lo urgente para hacer lo importante.",
    "Tu energía finita se invirtió en lo infinito.",
    "Comenzaste donde estás. Usaste lo que tenes. Hiciste.",
    "La constancia es la superpotencia que ejercitaste hoy.",
    "El momento de actuar es ahora. Tú actuaste.",
    "Tu atención es tu moneda más valiosa. La gastaste bien.",
    "El éxito es la suma de pequeñas acciones completadas.",
    "No dejaste para mañana lo que avanzaste hoy.",
    "Has reducido el ruido para aumentar el impacto.",
    "Tu mejor recurso es tu enfoque. Lo usaste bien.",
    "Progresar es mejor que planear. Hoy progresaste.",
    "La acción sobre la perfección. Hoy actuaste.",
    "Un objetivo a la vez, con claridad. Lo lograste.",
    "Hoy resolviste algo importante. Eso es suficiente.",
    "Tu logro de hoy construye tu mañana.",
    "Simplificaste, priorizaste, ejecutaste. Luego celebramos.",
    "Calidad sobre cantidad en todo. Hoy elegiste calidad.",
    "Las tareas pendientes drenan energía. Las completadas, liberan.",
    "Termina hoy y descansa tranquilo. Lo lograste."
] as const

function getRandomDeepWorkMessage(): string {
    return DEEP_WORK_MESSAGES[Math.floor(Math.random() * DEEP_WORK_MESSAGES.length)]
}

// Helper to get random celebration type
function getRandomCelebrationType(): CelebrationType {
    const types: CelebrationType[] = ["fireworks", "earthquake", "explosion", "aurora", "meteor"]
    return types[Math.floor(Math.random() * types.length)]
}

export function FocoCompletionCelebration({ open, onClose, taskCount }: CelebrationProps) {
    const handleClose = useCallback(() => {
        onClose()
    }, [onClose])

    return (
        <AnimatePresence>
            {open && (
                <CelebrationContent
                    taskCount={taskCount}
                    onClose={handleClose}
                />
            )}
        </AnimatePresence>
    )
}

// Internal component that gets a random type on mount
function CelebrationContent({ taskCount, onClose }: { taskCount: number; onClose: () => void }) {
    const celebrationType = getRandomCelebrationType()
    const message = getRandomDeepWorkMessage()

    useEffect(() => {
        // Auto-close after animation
        const timer = setTimeout(() => {
            onClose()
        }, 5000)

        return () => clearTimeout(timer)
    }, [onClose])

    return (
        <>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 z-50"
                onClick={onClose}
            />

            {/* Celebration Content - Full screen overlay */}
            <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
                {celebrationType === "fireworks" && <FireworksCelebration taskCount={taskCount} message={message} onClose={onClose} />}
                {celebrationType === "earthquake" && <EarthquakeCelebration taskCount={taskCount} message={message} onClose={onClose} />}
                {celebrationType === "explosion" && <ExplosionCelebration taskCount={taskCount} message={message} onClose={onClose} />}
                {celebrationType === "aurora" && <AuroraCelebration taskCount={taskCount} message={message} onClose={onClose} />}
                {celebrationType === "meteor" && <MeteorCelebration taskCount={taskCount} message={message} onClose={onClose} />}
            </div>
        </>
    )
}

// ============================================================================
// VARIANT 1: REALISTIC FIREWORKS - Canvas-based with physics, trails, and flashes
// ============================================================================
function FireworksCelebration({ taskCount, message, onClose }: { taskCount: number; message: string; onClose: () => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        // Non-null assertions for use in class closures
        const canvasNN = canvas
        const ctxNN = ctx

        const resizeCanvas = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }
        resizeCanvas()
        window.addEventListener("resize", resizeCanvas)

        class Particle {
            x: number
            y: number
            vx: number
            vy: number
            alpha: number
            color: string
            size: number
            decay: number
            trail: { x: number; y: number; alpha: number }[]

            constructor(x: number, y: number, color: string) {
                this.x = x
                this.y = y
                const angle = Math.random() * Math.PI * 2
                const speed = Math.random() * 6 + 2
                this.vx = Math.cos(angle) * speed
                this.vy = Math.sin(angle) * speed
                this.alpha = 1
                this.color = color
                this.size = Math.random() * 3 + 1
                this.decay = Math.random() * 0.015 + 0.01
                this.trail = []
            }

            update() {
                this.trail.push({ x: this.x, y: this.y, alpha: this.alpha })
                if (this.trail.length > 10) this.trail.shift()
                this.vy += 0.05
                this.vx *= 0.99
                this.vy *= 0.99
                this.x += this.vx
                this.y += this.vy
                this.alpha -= this.decay
            }

            draw(ctx: CanvasRenderingContext2D) {
                for (let i = 0; i < this.trail.length; i++) {
                    const t = this.trail[i]
                    const trailAlpha = (i / this.trail.length) * this.alpha * 0.5
                    ctx.beginPath()
                    ctx.arc(t.x, t.y, this.size * (i / this.trail.length), 0, Math.PI * 2)
                    ctx.fillStyle = this.hexToRgba(this.color, trailAlpha)
                    ctx.fill()
                }
                ctx.beginPath()
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
                ctx.fillStyle = this.hexToRgba(this.color, this.alpha)
                ctx.shadowBlur = 10
                ctx.shadowColor = this.color
                ctx.fill()
                ctx.shadowBlur = 0
            }

            hexToRgba(hex: string, alpha: number): string {
                const r = parseInt(hex.slice(1, 3), 16)
                const g = parseInt(hex.slice(3, 5), 16)
                const b = parseInt(hex.slice(5, 7), 16)
                return `rgba(${r}, ${g}, ${b}, ${alpha})`
            }

            isDead(): boolean {
                return this.alpha <= 0
            }
        }

        class Firework {
            x: number
            y: number
            targetY: number
            color: string
            particles: Particle[]
            exploded: boolean
            trail: { x: number; y: number }[]

            constructor() {
                this.x = Math.random() * canvasNN.width
                this.y = canvasNN.height
                this.targetY = Math.random() * canvasNN.height * 0.4 + canvasNN.height * 0.1
                const colors = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#95E1D3", "#F38181", "#AA96DA", "#FCBAD3", "#FF9F43", "#EE5A24", "#00D2D3"]
                this.color = colors[Math.floor(Math.random() * colors.length)]
                this.particles = []
                this.exploded = false
                this.trail = []
            }

            update(ctx: CanvasRenderingContext2D) {
                if (!this.exploded) {
                    this.trail.push({ x: this.x, y: this.y })
                    if (this.trail.length > 15) this.trail.shift()
                    this.y -= 8
                    if (this.y <= this.targetY) {
                        this.explode(ctx)
                    }
                } else {
                    this.particles = this.particles.filter(p => {
                        p.update()
                        return !p.isDead()
                    })
                }
            }

            explode(ctx: CanvasRenderingContext2D) {
                this.exploded = true
                for (let i = 0; i < 80; i++) {
                    this.particles.push(new Particle(this.x, this.y, this.color))
                }
                ctx.fillStyle = `rgba(255, 255, 255, 0.3)`
                ctx.fillRect(0, 0, canvasNN.width, canvasNN.height)
            }

            draw(ctx: CanvasRenderingContext2D) {
                if (!this.exploded) {
                    for (let i = 0; i < this.trail.length; i++) {
                        const t = this.trail[i]
                        ctx.beginPath()
                        ctx.arc(t.x, t.y, 2, 0, Math.PI * 2)
                        ctx.fillStyle = `rgba(255, 200, 100, ${i / this.trail.length * 0.8})`
                        ctx.fill()
                    }
                    ctx.beginPath()
                    ctx.arc(this.x, this.y, 3, 0, Math.PI * 2)
                    ctx.fillStyle = "#FFF"
                    ctx.shadowBlur = 15
                    ctx.shadowColor = this.color
                    ctx.fill()
                    ctx.shadowBlur = 0
                } else {
                    this.particles.forEach(p => p.draw(ctx))
                }
            }

            isDead(): boolean {
                return this.exploded && this.particles.length === 0
            }
        }

        let fireworks: Firework[] = []
        let animationFrame: number

        const launchInterval = setInterval(() => {
            if (fireworks.length < 15) {
                fireworks.push(new Firework())
            }
        }, 300)

        setTimeout(() => {
            clearInterval(launchInterval)
        }, 3000)

        const animate = () => {
            ctxNN.fillStyle = "rgba(0, 0, 0, 0.15)"
            ctxNN.fillRect(0, 0, canvasNN.width, canvasNN.height)

            fireworks = fireworks.filter(fw => {
                fw.update(ctxNN)
                fw.draw(ctxNN)
                return !fw.isDead()
            })

            animationFrame = requestAnimationFrame(animate)
        }

        animate()

        return () => {
            window.removeEventListener("resize", resizeCanvas)
            clearInterval(launchInterval)
            cancelAnimationFrame(animationFrame)
        }
    }, [])

    return (
        <>
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="absolute inset-0 flex items-center justify-center pointer-events-auto"
            >
                <div className="text-center max-w-2xl px-6">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1, rotate: [0, -5, 5, 0] }}
                        transition={{ delay: 0.7, duration: 0.5 }}
                        className="text-8xl mb-8"
                    >
                        ✨
                    </motion.div>
                    <motion.h2
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="text-4xl md:text-5xl font-bold text-white mb-6 drop-shadow-2xl"
                    >
                        Completado
                    </motion.h2>
                    <motion.p
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.9 }}
                        className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed"
                    >
                        {message}
                    </motion.p>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.1 }}
                        className="text-sm text-white/60 mb-8"
                    >
                        {taskCount} {taskCount === 1 ? 'tarea completada' : 'tareas completadas'}
                    </motion.p>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1.2, type: "spring" }}
                    >
                        <Button size="lg" onClick={onClose} className="bg-white text-black hover:bg-white/90 shadow-xl">
                            Continuar
                        </Button>
                    </motion.div>
                </div>
            </motion.div>
        </>
    )
}

// ============================================================================
// VARIANT 2: EARTHQUAKE CONFETTI - Screen shake + falling confetti rain
// ============================================================================
function EarthquakeCelebration({ taskCount, message, onClose }: { taskCount: number; message: string; onClose: () => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        // Non-null assertions for use in class closures
        const canvasNN = canvas
        const ctxNN = ctx

        canvas.width = window.innerWidth
        canvas.height = window.innerHeight

        document.body.style.animation = "shake 0.5s infinite"
        setTimeout(() => {
            document.body.style.animation = ""
        }, 4000)

        class Confetti {
            x: number
            y: number
            vx: number
            vy: number
            rotation: number
            rotationSpeed: number
            color: string
            size: number
            shape: "square" | "circle"
            oscillation: number
            oscillationSpeed: number

            constructor() {
                this.x = Math.random() * canvasNN.width
                this.y = -20
                this.vx = (Math.random() - 0.5) * 4
                this.vy = Math.random() * 3 + 2
                this.rotation = Math.random() * 360
                this.rotationSpeed = (Math.random() - 0.5) * 10
                const colors = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#95E1D3", "#F38181", "#AA96DA", "#FCBAD3", "#FF9F43", "#EE5A24"]
                this.color = colors[Math.floor(Math.random() * colors.length)]
                this.size = Math.random() * 12 + 6
                this.shape = Math.random() > 0.5 ? "square" : "circle"
                this.oscillation = Math.random() * Math.PI * 2
                this.oscillationSpeed = Math.random() * 0.1 + 0.05
            }

            update() {
                this.oscillation += this.oscillationSpeed
                this.x += this.vx + Math.sin(this.oscillation) * 2
                this.y += this.vy
                this.vy += 0.05
                this.rotation += this.rotationSpeed
            }

            draw(ctx: CanvasRenderingContext2D) {
                ctx.save()
                ctx.translate(this.x, this.y)
                ctx.rotate((this.rotation * Math.PI) / 180)
                ctx.fillStyle = this.color
                ctx.shadowBlur = 5
                ctx.shadowColor = this.color
                if (this.shape === "square") {
                    ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size)
                } else {
                    ctx.beginPath()
                    ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2)
                    ctx.fill()
                }
                ctx.restore()
            }

            isOffScreen(): boolean {
                return this.y > canvasNN.height + 20
            }
        }

        let confetti: Confetti[] = []

        const spawnInterval = setInterval(() => {
            for (let i = 0; i < 5; i++) {
                confetti.push(new Confetti())
            }
        }, 50)

        setTimeout(() => {
            clearInterval(spawnInterval)
        }, 3000)

        const animate = () => {
            ctxNN.clearRect(0, 0, canvasNN.width, canvasNN.height)
            confetti = confetti.filter(c => {
                c.update()
                c.draw(ctxNN)
                return !c.isOffScreen()
            })
            requestAnimationFrame(animate)
        }

        animate()

        return () => {
            clearInterval(spawnInterval)
            document.body.style.animation = ""
        }
    }, [])

    return (
        <>
            <style>{`@keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); } 20%, 40%, 60%, 80% { transform: translateX(8px); } }`}</style>

            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.3, 0.3, 0] }}
                transition={{ times: [0, 0.1, 0.9, 1], duration: 4 }}
                className="absolute inset-0 bg-orange-500/10 mix-blend-overlay"
            />

            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="absolute inset-0 flex items-center justify-center pointer-events-auto"
            >
                <motion.div
                    animate={{ x: [0, -5, 5, -3, 3, 0], y: [0, 3, -3, 2, -2, 0] }}
                    transition={{ duration: 0.5, repeat: 4, repeatDelay: 0.5 }}
                    className="text-center max-w-2xl px-6"
                >
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                        className="text-8xl mb-8"
                    >
                        🎯
                    </motion.div>
                    <motion.h2
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-4xl md:text-5xl font-bold text-white mb-6 drop-shadow-2xl"
                    >
                        Foco Completado
                    </motion.h2>
                    <motion.p
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed"
                    >
                        {message}
                    </motion.p>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9 }}
                        className="text-sm text-white/60 mb-8"
                    >
                        {taskCount} {taskCount === 1 ? 'tarea completada' : 'tareas completadas'}
                    </motion.p>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1, type: "spring" }}
                    >
                        <Button size="lg" onClick={onClose} className="bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-xl">
                            Continuar
                        </Button>
                    </motion.div>
                </motion.div>
            </motion.div>
        </>
    )
}

// ============================================================================
// VARIANT 3: EXPLOSION - Shockwave, expanding rings, and component distortion
// ============================================================================
function ExplosionCelebration({ taskCount, message, onClose }: { taskCount: number; message: string; onClose: () => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        // Non-null assertions for use in class closures
        const canvasNN = canvas
        const ctxNN = ctx

        canvas.width = window.innerWidth
        canvas.height = window.innerHeight

        const pulseInterval = setInterval(() => {
            document.body.style.filter = "brightness(1.15) saturate(1.1)"
            setTimeout(() => {
                document.body.style.filter = ""
            }, 100)
        }, 500)

        setTimeout(() => {
            clearInterval(pulseInterval)
        }, 3000)

        class Shockwave {
            x: number
            y: number
            radius: number
            maxRadius: number
            alpha: number
            color: string
            lineWidth: number

            constructor() {
                this.x = canvasNN.width / 2
                this.y = canvasNN.height / 2
                this.radius = 0
                this.maxRadius = Math.max(canvasNN.width, canvasNN.height) * 0.8
                this.alpha = 1
                const colors = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#AA96DA"]
                this.color = colors[Math.floor(Math.random() * colors.length)]
                this.lineWidth = 20
            }

            update() {
                this.radius += 15
                this.alpha = 1 - (this.radius / this.maxRadius)
                this.lineWidth = 20 * this.alpha
            }

            draw(ctx: CanvasRenderingContext2D) {
                if (this.alpha <= 0) return
                ctx.save()
                ctx.beginPath()
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
                ctx.strokeStyle = this.color.replace(")", `, ${this.alpha})`).replace("rgb", "rgba")
                ctx.lineWidth = this.lineWidth
                ctx.shadowBlur = 30
                ctx.shadowColor = this.color
                ctx.stroke()
                ctx.restore()
            }

            isDead(): boolean {
                return this.radius >= this.maxRadius
            }
        }

        class Debris {
            x: number
            y: number
            vx: number
            vy: number
            size: number
            color: string
            rotation: number
            rotationSpeed: number
            alpha: number

            constructor() {
                const angle = Math.random() * Math.PI * 2
                const speed = Math.random() * 15 + 5
                this.x = canvasNN.width / 2
                this.y = canvasNN.height / 2
                this.vx = Math.cos(angle) * speed
                this.vy = Math.sin(angle) * speed
                this.size = Math.random() * 30 + 10
                const colors = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#95E1D3", "#F38181", "#AA96DA", "#FCBAD3"]
                this.color = colors[Math.floor(Math.random() * colors.length)]
                this.rotation = Math.random() * 360
                this.rotationSpeed = (Math.random() - 0.5) * 20
                this.alpha = 1
            }

            update() {
                this.x += this.vx
                this.y += this.vy
                this.vy += 0.3
                this.vx *= 0.98
                this.vy *= 0.98
                this.rotation += this.rotationSpeed
                this.alpha -= 0.01
                this.size *= 0.99
            }

            draw(ctx: CanvasRenderingContext2D) {
                ctx.save()
                ctx.translate(this.x, this.y)
                ctx.rotate((this.rotation * Math.PI) / 180)
                ctx.globalAlpha = this.alpha
                ctx.fillStyle = this.color
                ctx.shadowBlur = 20
                ctx.shadowColor = this.color
                ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size)
                ctx.restore()
            }

            isDead(): boolean {
                return this.alpha <= 0 || this.size < 1
            }
        }

        class StarParticle {
            x: number
            y: number
            vx: number
            vy: number
            size: number
            alpha: number

            constructor() {
                this.x = canvasNN.width / 2
                this.y = canvasNN.height / 2
                const angle = Math.random() * Math.PI * 2
                const speed = Math.random() * 25 + 10
                this.vx = Math.cos(angle) * speed
                this.vy = Math.sin(angle) * speed
                this.size = Math.random() * 4 + 2
                this.alpha = 1
            }

            update() {
                this.x += this.vx
                this.y += this.vy
                this.vy += 0.2
                this.alpha -= 0.02
            }

            draw(ctx: CanvasRenderingContext2D) {
                ctx.save()
                ctx.globalAlpha = this.alpha
                ctx.fillStyle = "#FFF"
                ctx.shadowBlur = 10
                ctx.shadowColor = "#FFF"
                ctx.beginPath()
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
                ctx.fill()
                ctx.restore()
            }

            isDead(): boolean {
                return this.alpha <= 0
            }
        }

        let shockwaves: Shockwave[] = []
        let debris: Debris[] = []
        let stars: StarParticle[] = []

        setTimeout(() => {
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    shockwaves.push(new Shockwave())
                }, i * 200)
            }
            for (let i = 0; i < 50; i++) {
                debris.push(new Debris())
            }
            for (let i = 0; i < 100; i++) {
                stars.push(new StarParticle())
            }
        }, 300)

        const animate = () => {
            ctxNN.fillStyle = "rgba(0, 0, 0, 0.1)"
            ctxNN.fillRect(0, 0, canvasNN.width, canvasNN.height)

            shockwaves = shockwaves.filter(sw => {
                sw.update()
                sw.draw(ctxNN)
                return !sw.isDead()
            })

            debris = debris.filter(d => {
                d.update()
                d.draw(ctxNN)
                return !d.isDead()
            })

            stars = stars.filter(s => {
                s.update()
                s.draw(ctxNN)
                return !s.isDead()
            })

            requestAnimationFrame(animate)
        }

        animate()

        return () => {
            clearInterval(pulseInterval)
            document.body.style.filter = ""
        }
    }, [])

    return (
        <>
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.5, times: [0, 0.1, 1] }}
                className="absolute inset-0 bg-white pointer-events-none"
            />

            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-auto"
            >
                <motion.div
                    animate={{ scale: [1, 1.05, 1], rotate: [0, 1, -1, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-center max-w-2xl px-6"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.7, type: "spring", stiffness: 300, damping: 10 }}
                        className="text-8xl mb-8"
                    >
                        💫
                    </motion.div>
                    <motion.h2
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.8, type: "spring", stiffness: 100 }}
                        className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-white to-yellow-200 mb-6"
                        style={{ filter: "drop-shadow(0 0 20px rgba(255,255,255,0.5))" }}
                    >
                        Logro Alcanzado
                    </motion.h2>
                    <motion.p
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.9 }}
                        className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed"
                    >
                        {message}
                    </motion.p>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.1 }}
                        className="text-sm text-white/60 mb-8"
                    >
                        {taskCount} {taskCount === 1 ? 'tarea completada' : 'tareas completadas'}
                    </motion.p>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1.2, type: "spring" }}
                    >
                        <Button size="lg" onClick={onClose} className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:opacity-90 shadow-xl">
                            Continuar
                        </Button>
                    </motion.div>
                </motion.div>
            </motion.div>
        </>
    )
}

// ============================================================================
// VARIANT 4: AURORA BOREALIS - Flowing waves of light across the screen
// ============================================================================
function AuroraCelebration({ taskCount, message, onClose }: { taskCount: number; message: string; onClose: () => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        // Non-null assertions for use in class closures
        const canvasNN = canvas
        const ctxNN = ctx

        canvas.width = window.innerWidth
        canvas.height = window.innerHeight

        class Wave {
            y: number
            amplitude: number
            frequency: number
            speed: number
            color: string
            phase: number

            constructor() {
                this.y = Math.random() * canvasNN.height * 0.6 + canvasNN.height * 0.2
                this.amplitude = Math.random() * 80 + 40
                this.frequency = Math.random() * 0.01 + 0.005
                this.speed = Math.random() * 0.02 + 0.01
                const colors = ["rgba(0, 255, 128,", "rgba(0, 200, 255,", "rgba(128, 0, 255,", "rgba(0, 255, 200,"]
                this.color = colors[Math.floor(Math.random() * colors.length)]
                this.phase = Math.random() * Math.PI * 2
            }

            update(time: number) {
                this.phase += this.speed
            }

            draw(ctx: CanvasRenderingContext2D, time: number) {
                ctx.beginPath()
                for (let x = 0; x < canvasNN.width; x += 5) {
                    const y = this.y + Math.sin(x * this.frequency + time * this.speed + this.phase) * this.amplitude
                    if (x === 0) {
                        ctx.moveTo(x, y)
                    } else {
                        ctx.lineTo(x, y)
                    }
                }
                ctx.strokeStyle = this.color + "0.6)"
                ctx.lineWidth = 40
                ctx.lineCap = "round"
                ctx.shadowBlur = 30
                ctx.shadowColor = this.color + "0.8)"
                ctx.stroke()
            }
        }

        const waves: Wave[] = []
        for (let i = 0; i < 5; i++) {
            waves.push(new Wave())
        }

        class Star {
            x: number
            y: number
            size: number
            twinkle: number
            twinkleSpeed: number

            constructor() {
                this.x = Math.random() * canvasNN.width
                this.y = Math.random() * canvasNN.height * 0.7
                this.size = Math.random() * 2 + 1
                this.twinkle = Math.random() * Math.PI * 2
                this.twinkleSpeed = Math.random() * 0.05 + 0.02
            }

            update() {
                this.twinkle += this.twinkleSpeed
            }

            draw(ctx: CanvasRenderingContext2D) {
                const alpha = (Math.sin(this.twinkle) + 1) / 2 * 0.8 + 0.2
                ctx.beginPath()
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
                ctx.shadowBlur = 10
                ctx.shadowColor = "white"
                ctx.fill()
            }
        }

        const stars: Star[] = []
        for (let i = 0; i < 100; i++) {
            stars.push(new Star())
        }

        const startTime = Date.now()
        const animate = () => {
            const time = Date.now() - startTime

            // Dark gradient background
            const gradient = ctxNN.createLinearGradient(0, 0, 0, canvasNN.height)
            gradient.addColorStop(0, "#0a0a20")
            gradient.addColorStop(0.5, "#0f0f30")
            gradient.addColorStop(1, "#1a1a40")
            ctxNN.fillStyle = gradient
            ctxNN.fillRect(0, 0, canvasNN.width, canvasNN.height)

            // Draw stars
            stars.forEach(star => {
                star.update()
                star.draw(ctxNN)
            })

            // Draw waves
            waves.forEach(wave => {
                wave.update(time)
                wave.draw(ctxNN, time)
            })

            requestAnimationFrame(animate)
        }

        animate()

        return () => {}
    }, [])

    return (
        <>
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-auto"
            >
                <div className="text-center max-w-2xl px-6">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.7, type: "spring", stiffness: 150 }}
                        className="text-8xl mb-8"
                    >
                        🌌
                    </motion.div>
                    <motion.h2
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="text-4xl md:text-5xl font-bold text-white mb-6"
                        style={{ textShadow: "0 0 40px rgba(100, 255, 200, 0.5)" }}
                    >
                        Profundidad Alcanzada
                    </motion.h2>
                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.9 }}
                        className="text-xl md:text-2xl text-white/80 mb-8 leading-relaxed"
                    >
                        {message}
                    </motion.p>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.1 }}
                        className="text-sm text-white/50 mb-8"
                    >
                        {taskCount} {taskCount === 1 ? 'tarea completada' : 'tareas completadas'}
                    </motion.p>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1.2, type: "spring" }}
                    >
                        <Button size="lg" onClick={onClose} className="bg-white/10 backdrop-blur text-white hover:bg-white/20 border border-white/20 shadow-xl">
                            Continuar
                        </Button>
                    </motion.div>
                </div>
            </motion.div>
        </>
    )
}

// ============================================================================
// VARIANT 5: METEOR SHOWER - Meteors falling with glowing trails
// ============================================================================
function MeteorCelebration({ taskCount, message, onClose }: { taskCount: number; message: string; onClose: () => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        // Non-null assertions for use in class closures
        const canvasNN = canvas
        const ctxNN = ctx

        canvas.width = window.innerWidth
        canvas.height = window.innerHeight

        class Meteor {
            x: number
            y: number
            vx: number
            vy: number
            length: number
            alpha: number
            color: string

            constructor() {
                this.x = Math.random() * canvasNN.width * 0.8 + canvasNN.width * 0.1
                this.y = -100
                const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.3
                const speed = Math.random() * 10 + 15
                this.vx = Math.cos(angle) * speed
                this.vy = Math.sin(angle) * speed
                this.length = Math.random() * 100 + 80
                this.alpha = 1
                const colors = ["#FFD700", "#00CED1", "#FF69B4", "#7B68EE", "#00FF7F"]
                this.color = colors[Math.floor(Math.random() * colors.length)]
            }

            update() {
                this.x += this.vx
                this.y += this.vy
                this.alpha -= 0.005
            }

            draw(ctx: CanvasRenderingContext2D) {
                if (this.alpha <= 0) return

                // Trail gradient
                const gradient = ctx.createLinearGradient(
                    this.x, this.y,
                    this.x - this.vx * 10, this.y - this.vy * 10
                )
                gradient.addColorStop(0, this.color)
                gradient.addColorStop(1, "transparent")

                ctx.save()
                ctx.strokeStyle = gradient
                ctx.lineWidth = 3
                ctx.lineCap = "round"
                ctx.shadowBlur = 20
                ctx.shadowColor = this.color
                ctx.globalAlpha = this.alpha

                ctx.beginPath()
                ctx.moveTo(this.x, this.y)
                ctx.lineTo(this.x - this.vx * 10, this.y - this.vy * 10)
                ctx.stroke()

                // Bright head
                ctx.beginPath()
                ctx.arc(this.x, this.y, 4, 0, Math.PI * 2)
                ctx.fillStyle = "#FFF"
                ctx.fill()

                ctx.restore()
            }

            isDead(): boolean {
                return this.alpha <= 0 || this.y > canvasNN.height + 100
            }
        }

        class ImpactParticle {
            x: number
            y: number
            vx: number
            vy: number
            alpha: number
            size: number

            constructor(x: number, y: number) {
                this.x = x
                this.y = y
                const angle = Math.random() * Math.PI * 2
                const speed = Math.random() * 5 + 2
                this.vx = Math.cos(angle) * speed
                this.vy = Math.sin(angle) * speed
                this.alpha = 1
                this.size = Math.random() * 4 + 2
            }

            update() {
                this.x += this.vx
                this.y += this.vy
                this.vy += 0.1
                this.alpha -= 0.02
            }

            draw(ctx: CanvasRenderingContext2D) {
                if (this.alpha <= 0) return
                ctx.beginPath()
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(255, 255, 200, ${this.alpha})`
                ctx.shadowBlur = 10
                ctx.shadowColor = "gold"
                ctx.fill()
            }

            isDead(): boolean {
                return this.alpha <= 0
            }
        }

        let meteors: Meteor[] = []
        let particles: ImpactParticle[] = []

        // Spawn meteors
        const spawnInterval = setInterval(() => {
            meteors.push(new Meteor())
        }, 200)

        setTimeout(() => {
            clearInterval(spawnInterval)
        }, 3000)

        const animate = () => {
            // Clear with fade effect
            ctxNN.fillStyle = "rgba(10, 10, 30, 0.2)"
            ctxNN.fillRect(0, 0, canvasNN.width, canvasNN.height)

            // Draw stars background
            for (let i = 0; i < 50; i++) {
                const x = (i * 137) % canvasNN.width
                const y = (i * 97) % canvasNN.height
                const twinkle = Math.sin(Date.now() * 0.001 + i) * 0.5 + 0.5
                ctxNN.beginPath()
                ctxNN.arc(x, y, 1, 0, Math.PI * 2)
                ctxNN.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.5})`
                ctxNN.fill()
            }

            // Update and draw meteors
            meteors = meteors.filter(meteor => {
                meteor.update()
                meteor.draw(ctxNN)

                // Create impact particles when meteor reaches bottom
                if (meteor.y > canvasNN.height - 100 && meteor.alpha > 0.5) {
                    for (let i = 0; i < 5; i++) {
                        particles.push(new ImpactParticle(meteor.x, canvasNN.height - 50))
                    }
                }

                return !meteor.isDead()
            })

            // Update and draw particles
            particles = particles.filter(p => {
                p.update()
                p.draw(ctxNN)
                return !p.isDead()
            })

            requestAnimationFrame(animate)
        }

        animate()

        return () => {
            clearInterval(spawnInterval)
        }
    }, [])

    return (
        <>
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-auto"
            >
                <div className="text-center max-w-2xl px-6">
                    <motion.div
                        initial={{ scale: 0, rotate: -30 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
                        className="text-8xl mb-8"
                    >
                        🌠
                    </motion.div>
                    <motion.h2
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="text-4xl md:text-5xl font-bold text-white mb-6"
                        style={{ textShadow: "0 0 30px rgba(255, 215, 0, 0.5)" }}
                    >
                        Impacto Generado
                    </motion.h2>
                    <motion.p
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.9 }}
                        className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed"
                    >
                        {message}
                    </motion.p>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.1 }}
                        className="text-sm text-white/60 mb-8"
                    >
                        {taskCount} {taskCount === 1 ? 'tarea completada' : 'tareas completadas'}
                    </motion.p>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1.2, type: "spring" }}
                    >
                        <Button size="lg" onClick={onClose} className="bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:opacity-90 shadow-xl">
                            Continuar
                        </Button>
                    </motion.div>
                </div>
            </motion.div>
        </>
    )
}
