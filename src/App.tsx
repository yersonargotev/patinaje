import { invoke } from "@tauri-apps/api/core";
import { useEffect, useRef, useState } from "react";
import "./App.css";
import { AthleteManager } from "./components/AthleteManager";
import { ControlPanel } from "./components/ControlPanel";
import { FinishModal } from "./components/FinishModal";
import { StatusDisplay } from "./components/StatusDisplay";
import { Timer } from "./components/Timer";
import { Track } from "./components/Track";
import type { Athlete, TestConfig, TrackPosition } from "./types";
import { AudioService } from "./utils/audio";
import { calculateTotalDistance } from "./utils/timing";
import { getPeriodData } from "./utils/testData";
import { Toaster, toast } from "sonner";

function App() {
	const [config, setConfig] = useState<TestConfig>({
		recoveryTime: 45,
		currentPeriod: 2,
		athleteCount: 1,
		isRunning: false,
		isPaused: false,
		isFinished: false,
	});

	const [showFinishModal, setShowFinishModal] = useState(false);
	const [position, setPosition] = useState<TrackPosition>({
		period: 2,
		lap: 0,
		segment: 0,
		elapsedTime: 0,
	});

	const [athletes, setAthletes] = useState<Athlete[]>([
		{
			id: 1,
			name: "",
			age: 0,
			weight: 0,
			height: 0,
			active: true,
			completedPeriods: [],
			totalDistance: 0,
		},
	]);

	const [isRecovery, setIsRecovery] = useState(false);
	const [workTime, setWorkTime] = useState(0);
	const [currentRecoveryTime, setCurrentRecoveryTime] = useState(0);
	const [totalTime, setTotalTime] = useState(0);
	const [prepCountdown, setPrepCountdown] = useState<number | null>(null);

	const audioService = useRef<AudioService>(new AudioService());
	const workTimer = useRef<number>();
	const recoveryTimer = useRef<number>();
	const recoveryInterval = useRef<number>();
	const totalTimeInterval = useRef<number>();
	const isStartingRef = useRef(false);

	// Limpiar temporizadores al desmontar
	useEffect(() => {
		return () => {
			if (totalTimeInterval.current) clearInterval(totalTimeInterval.current);
			if (recoveryTimer.current) clearTimeout(recoveryTimer.current);
			if (recoveryInterval.current) clearInterval(recoveryInterval.current);
		};
	}, []);

	useEffect(() => {
		audioService.current.preloadAll().catch((error) => {
			console.error("Error loading audio files:", error);
		});

		return () => {
			if (totalTimeInterval.current) {
				clearInterval(totalTimeInterval.current);
			}
			if (recoveryTimer.current) {
				clearTimeout(recoveryTimer.current);
			}
		};
	}, []);

	useEffect(() => {
		if (
			config.isRunning &&
			!config.isPaused &&
			!config.isFinished &&
			!isRecovery
		) {
			const periodData = getPeriodData(position.period);
			if (!periodData) return;

			// Inicializar workTime
			if (!config.isPaused) {
				setWorkTime(0);
				// Reproducir beep inicial al comenzar el periodo
				audioService.current?.playIntervalBeep();
			}

			const startTime = performance.now();
			let lastBeepTime = 0;
			let animationFrameId: number;

			const updateTimer = async (currentTime: number) => {
				const elapsed = (currentTime - startTime) / 1000; // Convertir a segundos
				setWorkTime(elapsed);

				// Calcular si debemos emitir un beep basado en el tiempo parcial
				const currentInterval = Math.floor(elapsed / periodData.partialTime);
				const shouldBeep =
					currentInterval > Math.floor(lastBeepTime / periodData.partialTime);

				if (shouldBeep && elapsed >= periodData.partialTime) {
					audioService.current?.playIntervalBeep();
					lastBeepTime = elapsed;
				}

				// Actualizar posición y distancia
				setPosition((prev) => {
					const newElapsedTime = elapsed;
					// Calcular nueva distancia para atletas activos
					setAthletes((currentAthletes) =>
						currentAthletes.map((athlete) =>
							athlete.active
								? {
										...athlete,
										totalDistance: calculateTotalDistance(
											position.period,
											newElapsedTime,
										),
									}
								: athlete,
						),
					);
					return { ...prev, elapsedTime: newElapsedTime };
				});

				// Verificar si hemos alcanzado el tiempo total del periodo
				if (elapsed >= periodData.totalTime) {
					cancelAnimationFrame(animationFrameId);

					// Actualizar completed periods para atletas activos
					setAthletes((currentAthletes) =>
						currentAthletes.map((athlete) =>
							athlete.active
								? {
										...athlete,
										completedPeriods: [
											...athlete.completedPeriods,
											position.period,
										],
									}
								: athlete,
						),
					);

					// Esperar a que termine el último beep
					await new Promise((resolve) => setTimeout(resolve, 500));

					// Anunciar finalización del trabajo
					await audioService.current?.announceWorkComplete();

					// Esperar a que termine el anuncio
					await new Promise((resolve) => setTimeout(resolve, 1500));

					// Iniciar fase de recuperación y actualizar periodo
					setIsRecovery(true);
					setWorkTime(0);
					setPosition((prev) => ({
						period: prev.period + 1,
						lap: 0,
						segment: 0,
						elapsedTime: 0,
					}));
					return;
				}

				animationFrameId = requestAnimationFrame(updateTimer);
			};

			animationFrameId = requestAnimationFrame(updateTimer);

			return () => {
				if (animationFrameId) {
					cancelAnimationFrame(animationFrameId);
				}
			};
		}
	}, [
		config.isRunning,
		config.isPaused,
		config.isFinished,
		isRecovery,
		position.period,
	]);

	// Temporizador de recuperación
	useEffect(() => {
		const startRecovery = async () => {
			if (isStartingRef.current) return;
			isStartingRef.current = true;

			try {
				// Reiniciar el tiempo de recuperación al valor configurado
				setCurrentRecoveryTime(config.recoveryTime);

				// Esperar un segundo antes de iniciar los anuncios de audio
				await new Promise((resolve) => setTimeout(resolve, 1000));

				// Reproducir anuncio de inicio de recuperación
				await audioService.current?.announceRecoveryStart();

				// Esperar otro segundo antes de iniciar la cuenta regresiva
				await new Promise((resolve) => setTimeout(resolve, 1000));

				// Iniciar la cuenta regresiva
				recoveryInterval.current = window.setInterval(() => {
					setCurrentRecoveryTime((prevTime) => {
						// Cuando llegue a 15 segundos, reproducir el aviso
						if (prevTime === 15) {
							audioService.current?.playFifteenSeconds();
						}

						if (prevTime <= 0) {
							if (recoveryInterval.current) {
								clearInterval(recoveryInterval.current);
							}
							return 0;
						}
						return prevTime - 1;
					});
				}, 1000);

				// Configurar el temporizador para finalizar la recuperación
				recoveryTimer.current = window.setTimeout(
					async () => {
						// Limpiar el intervalo de la cuenta regresiva
						if (recoveryInterval.current) {
							clearInterval(recoveryInterval.current);
						}

						// Esperar a que termine la cuenta regresiva
						await new Promise((resolve) => setTimeout(resolve, 1000));

						// Anunciar fin de recuperación
						await audioService.current?.announceRecoveryComplete();

						// Esperar a que termine el anuncio
						await new Promise((resolve) => setTimeout(resolve, 2000));

						// Preparar para el siguiente periodo
						setIsRecovery(false);
						setCurrentRecoveryTime(config.recoveryTime);

						// Esperar antes de iniciar el siguiente periodo
						await new Promise((resolve) => setTimeout(resolve, 1000));

						// Solo anunciar inicio si no está pausado y sigue corriendo
						if (config.isRunning && !config.isPaused) {
							await audioService.current?.announceWorkStart();
						}
					},
					config.recoveryTime * 1000 + 1000,
				);
			} finally {
				isStartingRef.current = false;
			}
		};

		// Solo iniciar recuperación si estamos en modo recuperación y el test está corriendo
		if (isRecovery && config.isRunning && !config.isPaused) {
			startRecovery();
		}

		// Limpiar temporizadores al desmontar o cuando cambian las dependencias
		return () => {
			if (recoveryTimer.current) {
				clearTimeout(recoveryTimer.current);
				recoveryTimer.current = undefined;
			}
			if (recoveryInterval.current) {
				clearInterval(recoveryInterval.current);
				recoveryInterval.current = undefined;
			}
		};
	}, [isRecovery, config.isRunning, config.isPaused, config.recoveryTime]);

	// Efecto para manejar la pausa durante la recuperación
	useEffect(() => {
		// Si está pausado, limpiar todos los temporizadores
		if (config.isPaused) {
			if (recoveryTimer.current) {
				clearTimeout(recoveryTimer.current);
				recoveryTimer.current = undefined;
			}
			if (recoveryInterval.current) {
				clearInterval(recoveryInterval.current);
				recoveryInterval.current = undefined;
			}
			return;
		}

		// Solo reanudar si estamos en recuperación y el test está corriendo
		if (isRecovery && config.isRunning && currentRecoveryTime > 0) {
			recoveryInterval.current = window.setInterval(() => {
				setCurrentRecoveryTime((prevTime) => {
					if (prevTime === 15) {
						audioService.current?.playFifteenSeconds();
					}

					if (prevTime <= 0) {
						if (recoveryInterval.current) {
							clearInterval(recoveryInterval.current);
							recoveryInterval.current = undefined;
						}
						return 0;
					}
					return prevTime - 1;
				});
			}, 1000);

			recoveryTimer.current = window.setTimeout(async () => {
				if (recoveryInterval.current) {
					clearInterval(recoveryInterval.current);
					recoveryInterval.current = undefined;
				}

				await audioService.current?.announceRecoveryComplete();
				await new Promise((resolve) => setTimeout(resolve, 2000));

				setIsRecovery(false);
				setCurrentRecoveryTime(config.recoveryTime);

				// Esperar antes de iniciar el siguiente periodo
				await new Promise((resolve) => setTimeout(resolve, 1000));

				// Solo anunciar inicio si no está pausado y sigue corriendo
				if (config.isRunning && !config.isPaused) {
					await audioService.current?.announceWorkStart();
				}
			}, currentRecoveryTime * 1000);
		}

		return () => {
			if (recoveryTimer.current) {
				clearTimeout(recoveryTimer.current);
				recoveryTimer.current = undefined;
			}
			if (recoveryInterval.current) {
				clearInterval(recoveryInterval.current);
				recoveryInterval.current = undefined;
			}
		};
	}, [
		config.isPaused,
		config.isRunning,
		isRecovery,
		currentRecoveryTime,
		config.recoveryTime,
	]);

	useEffect(() => {
		if (config.isRunning && !config.isPaused && !config.isFinished) {
			totalTimeInterval.current = window.setInterval(() => {
				setTotalTime((t) => t + 0.1);
			}, 100);
		} else if (totalTimeInterval.current) {
			clearInterval(totalTimeInterval.current);
		}

		return () => {
			if (totalTimeInterval.current) {
				clearInterval(totalTimeInterval.current);
			}
		};
	}, [config.isRunning, config.isPaused, config.isFinished]);

	const handleFinish = async () => {
		setConfig((c) => ({ ...c, isFinished: true, isRunning: false }));
		setShowFinishModal(false);

		try {
			// Verificar que invoke esté disponible
			if (typeof invoke !== "function") {
				throw new Error("Tauri invoke no está disponible");
			}

			// Validar datos antes de enviar
			const invalidAthletes = athletes
				.filter((a) => a.active)
				.filter(
					(athlete) =>
						!athlete.name.trim() ||
						athlete.age <= 0 ||
						athlete.weight <= 0 ||
						athlete.height <= 0,
				);

			if (invalidAthletes.length > 0) {
				toast.error(
					"Por favor complete todos los datos requeridos de los deportistas activos antes de finalizar.",
				);
				return;
			}

			// Save data for each active athlete using Promise.all for better performance
			await Promise.all(
				athletes
					.filter((a) => a.active)
					.map(async (athlete) => {
						try {
							await invoke("save_evaluation_data", {
								athlete: {
									name: athlete.name,
									age: athlete.age,
									weight: athlete.weight,
									height: athlete.height,
								},
								completedPeriods: JSON.stringify(athlete.completedPeriods),
								totalTime,
								totalDistance: athlete.totalDistance,
								status: "completed",
							});
						} catch (error) {
							console.error(
								`Error saving evaluation for ${athlete.name}:`,
								error,
							);
							throw new Error(
								error instanceof Error
									? error.message
									: "Error al guardar la evaluación",
							);
						}
					}),
			);

			toast.success("Evaluaciones guardadas correctamente");
		} catch (error) {
			console.error("Error saving evaluations:", error);
			toast.error(
				error instanceof Error
					? error.message
					: "Error al guardar las evaluaciones",
			);
		}
	};

	const handleFinishAthlete = async (athleteId: number) => {
		const athlete = athletes.find((a) => a.id === athleteId);
		if (!athlete) return;

		try {
			// Save the evaluation data for the finished athlete
			await invoke("save_evaluation_data", {
				athlete: {
					name: athlete.name,
					age: athlete.age,
					weight: athlete.weight,
					height: athlete.height,
				},
				completedPeriods: JSON.stringify(athlete.completedPeriods),
				totalTime,
				totalDistance: athlete.totalDistance,
				status: "completed",
			});

			// Update athlete state after successful save
			setAthletes((currentAthletes) =>
				currentAthletes.map((a) =>
					a.id === athleteId ? { ...a, active: false } : a,
				),
			);

			toast.success(`Evaluación de ${athlete.name} guardada correctamente`);

			// Check if all athletes are finished
			const remainingActiveAthletes = athletes.filter(
				(a) => a.id !== athleteId && a.active,
			).length;
			if (remainingActiveAthletes === 0) {
				setConfig((c) => ({ ...c, isFinished: true, isRunning: false }));
			}
		} catch (error) {
			console.error(`Error saving evaluation for ${athlete.name}:`, error);
			toast.error(`Error al guardar la evaluación de ${athlete.name}`);
		}
	};

	const handleStart = async () => {
		if (isStartingRef.current) return;

		// Check if any active athlete is missing required data
		const invalidAthletes = athletes
			.filter((a) => a.active)
			.filter(
				(athlete) =>
					!athlete.name.trim() ||
					athlete.age <= 0 ||
					athlete.weight <= 0 ||
					athlete.height <= 0,
			);

		if (invalidAthletes.length > 0) {
			toast.error(
				"Por favor complete todos los datos requeridos de los deportistas activos antes de iniciar.",
			);
			return;
		}

		isStartingRef.current = true;

		try {
			if (config.isPaused) {
				// Si estaba pausado, simplemente reanudamos sin reiniciar nada
				setConfig((c) => ({ ...c, isRunning: true, isPaused: false }));
				// No reproducimos ningún sonido al reanudar para no interrumpir
			} else if (!isRecovery) {
				// Start 15-second preparation countdown
				setPrepCountdown(15);

				// Start audio sequence
				await audioService.current?.playCountdown();

				// Start visual countdown after audio sequence starts
				const countdownInterval = setInterval(() => {
					setPrepCountdown((prev) => {
						if (prev === null || prev <= 1) {
							clearInterval(countdownInterval);
							return null;
						}
						return prev - 1;
					});
				}, 1000);

				// Wait for 2 seconds after countdown ends
				await new Promise((resolve) => setTimeout(resolve, 15000));

				// Play work start announcement
				await audioService.current?.announceWorkStart();

				// Wait for 3 seconds after work start announcement
				await new Promise((resolve) => setTimeout(resolve, 3000));

				// Start the test
				setConfig((c) => ({ ...c, isRunning: true, isPaused: false }));
			} else {
				setConfig((c) => ({ ...c, isRunning: true, isPaused: false }));
			}
		} catch (error) {
			console.error("Error starting test:", error);
			toast.error("Error al iniciar la prueba");
		} finally {
			isStartingRef.current = false;
		}
	};

	const handlePause = () => {
		setConfig((c) => ({ ...c, isRunning: false, isPaused: true }));
		audioService.current?.announceTestPaused();
	};

	const handleAthleteUpdate = (updatedAthlete: Athlete) => {
		setAthletes((prev) =>
			prev.map((a) => (a.id === updatedAthlete.id ? updatedAthlete : a)),
		);
	};

	const handleReset = () => {
		// Reset config to initial state
		setConfig({
			recoveryTime: 45,
			currentPeriod: 2,
			athleteCount: 1,
			isRunning: false,
			isPaused: false,
			isFinished: false,
		});

		// Reset position
		setPosition({
			period: 2,
			lap: 0,
			segment: 0,
			elapsedTime: 0,
		});

		// Reset athletes to initial state
		setAthletes([
			{
				id: 1,
				name: "",
				age: 0,
				weight: 0,
				height: 0,
				active: true,
				completedPeriods: [],
				totalDistance: 0,
			},
		]);

		// Reset all timers and states
		setIsRecovery(false);
		setWorkTime(0);
		setTotalTime(0);
		setPrepCountdown(null);

		// Clear any running intervals/timeouts
		if (workTimer.current) clearInterval(workTimer.current);
		if (recoveryTimer.current) clearTimeout(recoveryTimer.current);
		if (totalTimeInterval.current) clearInterval(totalTimeInterval.current);

		toast.success("Test reiniciado correctamente");
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-8 text-center">
				Evaluación de Entrenamiento Deportivo
			</h1>

			{prepCountdown !== null && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white p-8 rounded-lg shadow-lg text-center">
						<h2 className="text-2xl font-bold mb-4">Preparación</h2>
						<p className="text-4xl font-bold text-blue-600">{prepCountdown}</p>
					</div>
				</div>
			)}

			<div className="grid gap-8">
				<Timer
					workTime={workTime}
					recoveryTime={currentRecoveryTime}
					totalTime={totalTime}
				/>

				<StatusDisplay
					period={position.period}
					lap={position.lap}
					recoveryTime={config.recoveryTime}
					activeAthletes={athletes.filter((a) => a.active).length}
				/>

				<Track position={position} currentPeriod={config.currentPeriod} />

				<ControlPanel
					config={config}
					onStart={handleStart}
					onPause={handlePause}
					onReset={handleReset}
					onPeriodChange={(period) => {
						setConfig((c) => ({ ...c, currentPeriod: period }));
						setPosition((p) => ({ ...p, period }));
					}}
					onRecoveryTimeChange={(time) =>
						setConfig((c) => ({ ...c, recoveryTime: time }))
					}
					onAthleteCountChange={(count) => {
						setConfig((c) => ({ ...c, athleteCount: count }));
						if (count > athletes.length) {
							setAthletes((current) => [
								...current,
								...Array(count - current.length)
									.fill(0)
									.map((_, i) => ({
										id: current.length + i + 1,
										name: "",
										age: 0,
										weight: 0,
										height: 0,
										active: true,
										completedPeriods: [],
										totalDistance: 0,
									})),
							]);
						} else if (count < athletes.length) {
							setAthletes((current) => current.slice(0, count));
						}
					}}
				/>

				<AthleteManager
					athletes={athletes}
					onAthleteUpdate={handleAthleteUpdate}
					onFinishAthlete={handleFinishAthlete}
					isRunning={config.isRunning}
				/>
			</div>

			<FinishModal
				show={showFinishModal}
				onClose={() => setShowFinishModal(false)}
				onConfirm={handleFinish}
			/>

			<Toaster position="top-center" richColors />
		</div>
	);
}

export default App;
