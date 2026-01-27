"use client"

import React, { useEffect, useCallback, useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Button } from "@/components/ui/button"

interface CelebrationProps {
    open: boolean
    onClose: () => void
    taskCount: number
}

type CelebrationType = "fireworks" | "earthquake" | "explosion"

// Helper to get random celebration type
function getRandomCelebrationType(): CelebrationType {
    const types: CelebrationType[] = ["fireworks", "earthquake", "explosion"]
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
                {celebrationType === "fireworks" && <FireworksCelebration taskCount={taskCount} onClose={onClose} />}
                {celebrationType === "earthquake" && <EarthquakeCelebration taskCount={taskCount} onClose={onClose} />}
                {celebrationType === "explosion" && <ExplosionCelebration taskCount={taskCount} onClose={onClose} />}
            </div>
        </>
    )
}

// ============================================================================
// VARIANT 1: REALISTIC FIREWORKS - Canvas-based with physics, trails, and flashes
// ============================================================================
function FireworksCelebration({ taskCount, onClose }: { taskCount: number; onClose: () => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }
        resizeCanvas()
        window.addEventListener("resize", resizeCanvas)

        // Firework classes
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
                // Add current position to trail
                this.trail.push({ x: this.x, y: this.y, alpha: this.alpha })
                if (this.trail.length > 10) this.trail.shift()

                // Physics with gravity
                this.vy += 0.05
                this.vx *= 0.99
                this.vy *= 0.99
                this.x += this.vx
                this.y += this.vy
                this.alpha -= this.decay
            }

            draw(ctx: CanvasRenderingContext2D) {
                // Draw trail
                for (let i = 0; i < this.trail.length; i++) {
                    const t = this.trail[i]
                    const trailAlpha = (i / this.trail.length) * this.alpha * 0.5
                    ctx.beginPath()
                    ctx.arc(t.x, t.y, this.size * (i / this.trail.length), 0, Math.PI * 2)
                    ctx.fillStyle = this.hexToRgba(this.color, trailAlpha)
                    ctx.fill()
                }

                // Draw particle with glow
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
                this.x = Math.random() * canvas.width
                this.y = canvas.height
                this.targetY = Math.random() * canvas.height * 0.4 + canvas.height * 0.1
                const colors = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#95E1D3", "#F38181", "#AA96DA", "#FCBAD3", "#FF9F43", "#EE5A24", "#00D2D3"]
                this.color = colors[Math.floor(Math.random() * colors.length)]
                this.particles = []
                this.exploded = false
                this.trail = []
            }

            update() {
                if (!this.exploded) {
                    // Rising phase
                    this.trail.push({ x: this.x, y: this.y })
                    if (this.trail.length > 15) this.trail.shift()

                    this.y -= 8
                    if (this.y <= this.targetY) {
                        this.explode()
                    }
                } else {
                    // Update particles
                    this.particles = this.particles.filter(p => {
                        p.update()
                        return !p.isDead()
                    })
                }
            }

            explode() {
                this.exploded = true
                // Create explosion particles
                for (let i = 0; i < 80; i++) {
                    this.particles.push(new Particle(this.x, this.y, this.color))
                }
                // Add flash effect
                ctx.fillStyle = `rgba(255, 255, 255, 0.3)`
                ctx.fillRect(0, 0, canvas.width, canvas.height)
            }

            draw(ctx: CanvasRenderingContext2D) {
                if (!this.exploded) {
                    // Draw trail
                    for (let i = 0; i < this.trail.length; i++) {
                        const t = this.trail[i]
                        ctx.beginPath()
                        ctx.arc(t.x, t.y, 2, 0, Math.PI * 2)
                        ctx.fillStyle = `rgba(255, 200, 100, ${i / this.trail.length * 0.8})`
                        ctx.fill()
                    }

                    // Draw rocket
                    ctx.beginPath()
                    ctx.arc(this.x, this.y, 3, 0, Math.PI * 2)
                    ctx.fillStyle = "#FFF"
                    ctx.shadowBlur = 15
                    ctx.shadowColor = this.color
                    ctx.fill()
                    ctx.shadowBlur = 0
                } else {
                    // Draw particles
                    this.particles.forEach(p => p.draw(ctx))
                }
            }

            isDead(): boolean {
                return this.exploded && this.particles.length === 0
            }
        }

        let fireworks: Firework[] = []
        let animationFrame: number

        // Launch fireworks periodically
        const launchInterval = setInterval(() => {
            if (fireworks.length < 15) {
                fireworks.push(new Firework())
            }
        }, 300)

        // Stop launching after 3 seconds
        setTimeout(() => {
            clearInterval(launchInterval)
        }, 3000)

        // Animation loop
        const animate = () => {
            // Semi-transparent black for trail effect
            ctx.fillStyle = "rgba(0, 0, 0, 0.15)"
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            fireworks = fireworks.filter(fw => {
                fw.update()
                fw.draw(ctx)
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
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
            />

            {/* Message overlay */}
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="absolute inset-0 flex items-center justify-center pointer-events-auto"
            >
                <div className="text-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1, rotate: [0, -10, 10, -5, 5, 0] }}
                        transition={{ delay: 0.7, duration: 0.5 }}
                        className="text-9xl mb-6"
                    >
                        🎆
                    </motion.div>
                    <motion.h2
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="text-5xl font-black text-white mb-4 drop-shadow-2xl"
                    >
                        ¡BOOM! ¡LO LOGRASTE!
                    </motion.h2>
                    <motion.p
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="text-xl text-white/80 mb-8"
                    >
                        {taskCount} {taskCount === 1 ? 'tarea completada' : 'tareas completadas'} • El cielo celebra contigo
                    </motion.p>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1.2, type: "spring" }}
                    >
                        <Button
                            size="lg"
                            onClick={onClose}
                            className="bg-white text-black hover:bg-white/90 shadow-2xl"
                        >
                            ¡Increíble!
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
function EarthquakeCelebration({ taskCount, onClose }: { taskCount: number; onClose: () => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        canvas.width = window.innerWidth
        canvas.height = window.innerHeight

        // Add shake effect to body
        document.body.style.animation = "shake 0.5s infinite"

        // Remove shake after animation
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
                this.x = Math.random() * canvas.width
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
                this.vy += 0.05 // gravity
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
                return this.y > canvas.height + 20
            }
        }

        let confetti: Confetti[] = []

        // Spawn confetti continuously
        const spawnInterval = setInterval(() => {
            for (let i = 0; i < 5; i++) {
                confetti.push(new Confetti())
            }
        }, 50)

        // Stop spawning after 3 seconds
        setTimeout(() => {
            clearInterval(spawnInterval)
        }, 3000)

        // Animation loop
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            confetti = confetti.filter(c => {
                c.update()
                c.draw(ctx)
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
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
                    20%, 40%, 60%, 80% { transform: translateX(8px); }
                }
            `}</style>

            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
            />

            {/* Shake effect overlay */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.3, 0.3, 0] }}
                transition={{ times: [0, 0.1, 0.9, 1], duration: 4 }}
                className="absolute inset-0 bg-red-500/10 mix-blend-overlay"
            />

            {/* Message overlay */}
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="absolute inset-0 flex items-center justify-center pointer-events-auto"
            >
                <motion.div
                    animate={{
                        x: [0, -5, 5, -3, 3, 0],
                        y: [0, 3, -3, 2, -2, 0]
                    }}
                    transition={{ duration: 0.5, repeat: 4, repeatDelay: 0.5 }}
                    className="text-center"
                >
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                        className="text-9xl mb-6"
                    >
                        🌪️
                    </motion.div>
                    <motion.h2
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-6xl font-black text-white mb-4 drop-shadow-2xl"
                        style={{ textShadow: "4px 4px 0 #FF6B6B, -2px -2px 0 #4ECDC4" }}
                    >
                        ¡TERREMOTO DE ÉXITO!
                    </motion.h2>
                    <motion.p
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="text-2xl text-white font-bold mb-8"
                    >
                        Completaste {taskCount} {taskCount === 1 ? 'tarea' : 'tareas'} • ¡La tierra se mueve!
                    </motion.p>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.9, type: "spring" }}
                    >
                        <Button
                            size="lg"
                            onClick={onClose}
                            className="bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600 shadow-2xl text-lg px-8"
                        >
                            🎉 ¡FUE MÁXIMO!
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
function ExplosionCelebration({ taskCount, onClose }: { taskCount: number; onClose: () => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        canvas.width = window.innerWidth
        canvas.height = window.innerHeight

        // Add screen pulse effect
        const pulseInterval = setInterval(() => {
            document.body.style.filter = "brightness(1.2) saturate(1.2)"
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
                this.x = canvas.width / 2
                this.y = canvas.height / 2
                this.radius = 0
                this.maxRadius = Math.max(canvas.width, canvas.height) * 0.8
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
                this.x = canvas.width / 2
                this.y = canvas.height / 2
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
                this.vy += 0.3 // gravity
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
                this.x = canvas.width / 2
                this.y = canvas.height / 2
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

        // Initial explosion
        setTimeout(() => {
            // Create shockwaves
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    shockwaves.push(new Shockwave())
                }, i * 200)
            }

            // Create debris
            for (let i = 0; i < 50; i++) {
                debris.push(new Debris())
            }

            // Create star burst
            for (let i = 0; i < 100; i++) {
                stars.push(new StarParticle())
            }
        }, 300)

        // Animation loop
        const animate = () => {
            ctx.fillStyle = "rgba(0, 0, 0, 0.1)"
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            // Update and draw shockwaves
            shockwaves = shockwaves.filter(sw => {
                sw.update()
                sw.draw(ctx)
                return !sw.isDead()
            })

            // Update and draw debris
            debris = debris.filter(d => {
                d.update()
                d.draw(ctx)
                return !d.isDead()
            })

            // Update and draw stars
            stars = stars.filter(s => {
                s.update()
                s.draw(ctx)
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
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
            />

            {/* Flash effect on explosion */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.5, times: [0, 0.1, 1] }}
                className="absolute inset-0 bg-white pointer-events-none"
            />

            {/* Message overlay */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.5, 1] }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-auto"
            >
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 2, -2, 0]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-center"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.7, type: "spring", stiffness: 300, damping: 10 }}
                        className="text-9xl mb-6"
                    >
                        💥
                    </motion.div>
                    <motion.h2
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.8, type: "spring", stiffness: 100 }}
                        className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 mb-4"
                        style={{ filter: "drop-shadow(4px 4px 0 rgba(255,255,255,0.5))" }}
                    >
                        ¡EXPLOSIÓN DE LOGROS!
                    </motion.h2>
                    <motion.p
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.9 }}
                        className="text-2xl text-white font-bold mb-8"
                    >
                        {taskCount} {taskCount === 1 ? 'meta aplastada' : 'metas aplastadas'}
                    </motion.p>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1.1, type: "spring" }}
                    >
                        <Button
                            size="lg"
                            onClick={onClose}
                            className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white hover:opacity-90 shadow-2xl text-lg px-8"
                        >
                            🚀 ¡PODEROSO!
                        </Button>
                    </motion.div>
                </motion.div>
            </motion.div>
        </>
    )
}
