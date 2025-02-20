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
		expectedSegment: 0,
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
	const [previousTotalTime, setPreviousTotalTime] = useState(0);
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

			if (!config.isPaused) {
				setWorkTime(0);
				audioService.current?.playIntervalBeep();
			}

			const startTime = performance.now();
			let lastBeepTime = 0;
			let animationFrameId: number;

			const updateTimer = () => {
				const now = performance.now();
				const elapsed = (now - startTime) / 1000; // Convert to seconds with millisecond precision
				setWorkTime(elapsed);

				const currentInterval = Math.floor(elapsed / periodData.partialTime);
				const currentSegment = currentInterval % 4;
				const currentLap = Math.floor(currentInterval / 4);

				const shouldBeep =
					currentInterval > Math.floor(lastBeepTime / periodData.partialTime);

				if (shouldBeep && elapsed >= periodData.partialTime) {
					audioService.current?.playIntervalBeep();
					lastBeepTime = elapsed;

					setAthletes((currentAthletes) =>
						currentAthletes.map((athlete) => {
							if (athlete.active) {
								const newDistance = athlete.totalDistance + 50;
								return {
									...athlete,
									totalDistance: newDistance,
								};
							}
							return athlete;
						}),
					);
				}

				setPosition((prev) => ({
					...prev,
					elapsedTime: elapsed,
					segment: currentSegment,
					lap: currentLap,
					expectedSegment: currentInterval % 16,
				}));

				if (elapsed >= periodData.totalTime) {
					cancelAnimationFrame(animationFrameId);

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

					const finishPeriod = async () => {
						await new Promise((resolve) => setTimeout(resolve, 500));
						await audioService.current?.announceWorkComplete();
						await new Promise((resolve) => setTimeout(resolve, 2000));
						setIsRecovery(true);
						setWorkTime(0);
						setPosition((prev) => ({
							period: prev.period + 1,
							lap: 0,
							segment: 0,
							elapsedTime: 0,
							expectedSegment: 0,
						}));
					};

					finishPeriod();
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

	// Efecto para manejar la pausa durante la recuperación
	useEffect(() => {
		if (!isRecovery || !config.isRunning || config.isPaused) return;

		let animationFrameId: number;
		const startTime = Date.now();
		const endTime = startTime + config.recoveryTime * 1000;
		let lastUpdateTime = Math.floor(config.recoveryTime);

		const startRecovery = async () => {
			// Reiniciar el tiempo de recuperación
			setCurrentRecoveryTime(config.recoveryTime);

			// Esperar un segundo antes de anunciar
			await new Promise((resolve) => setTimeout(resolve, 1000));
			await audioService.current?.announceRecoveryStart();

			const updateRecoveryTime = () => {
				const now = Date.now();
				const remaining = Math.ceil((endTime - now) / 1000);

				// Actualizar solo cuando cambia el segundo
				if (remaining !== lastUpdateTime) {
					lastUpdateTime = remaining;
					setCurrentRecoveryTime(remaining);

					// Anuncios de tiempo
					if (remaining === 15) {
						audioService.current?.playFifteenSeconds();
					}
				}

				if (remaining <= 0) {
					// Fin de la recuperación
					finishRecovery();
					return;
				}

				animationFrameId = requestAnimationFrame(updateRecoveryTime);
			};

			animationFrameId = requestAnimationFrame(updateRecoveryTime);
		};

		const finishRecovery = async () => {
			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
			}

			try {
				// Anunciar fin de recuperación
				await audioService.current?.announceRecoveryComplete();

				// Anunciar inicio del siguiente periodo
				await audioService.current?.announceWorkStartPeriod(position.period);

				// Transición al siguiente periodo
				setIsRecovery(false);
				setCurrentRecoveryTime(config.recoveryTime);
				setWorkTime(0);

				// Esperar un momento antes de iniciar el siguiente periodo
				await new Promise((resolve) => setTimeout(resolve, 1000));

				// Reproducir beep inicial del nuevo periodo
				audioService.current?.playIntervalBeep();
			} catch (error) {
				console.error("Error en la transición de recuperación:", error);
				toast.error("Error al finalizar el periodo de recuperación");
			}
		};

		startRecovery();

		return () => {
			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
			}
		};
	}, [
		isRecovery,
		config.isRunning,
		config.isPaused,
		config.recoveryTime,
		position.period,
	]);

	useEffect(() => {
		if (config.isRunning && !config.isPaused && !config.isFinished) {
			const startTime = performance.now();
			let animationFrameId: number;

			const updateTotalTime = () => {
				const now = performance.now();
				setTotalTime((now - startTime) / 1000 + previousTotalTime);
				animationFrameId = requestAnimationFrame(updateTotalTime);
			};

			animationFrameId = requestAnimationFrame(updateTotalTime);

			return () => {
				if (animationFrameId) {
					cancelAnimationFrame(animationFrameId);
				}
			};
		}
	}, [config.isRunning, config.isPaused, config.isFinished, previousTotalTime]);

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
				toast.error("Los datos de los deportistas activos no están completos.");
				return;
			}

			// Save data for each active athlete using Promise.all for better performance
			await Promise.all(
				athletes
					.filter((a) => a.active)
					.map(async (athlete) => {
						try {
							// Redondear totalTime a un número entero
							const roundedTotalTime = Math.floor(totalTime);

							await invoke("save_evaluation_data", {
								athlete: {
									name: athlete.name,
									age: athlete.age,
									weight: athlete.weight,
									height: athlete.height,
									observations: athlete.observations || "",
								},
								completedPeriods: JSON.stringify(athlete.completedPeriods),
								totalTime: roundedTotalTime,
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
			// Redondear totalTime a un número entero
			const roundedTotalTime = Math.floor(totalTime);

			// Save the evaluation data for the finished athlete
			await invoke("save_evaluation_data", {
				athlete: {
					name: athlete.name,
					age: athlete.age,
					weight: athlete.weight,
					height: athlete.height,
					observations: athlete.observations || "",
				},
				completedPeriods: JSON.stringify(athlete.completedPeriods),
				totalTime: roundedTotalTime,
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

	const handleStart = async (period: number) => {
		if (isStartingRef.current) return;

		// Verificar datos de atletas
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
				// Simplemente reanudar sin anuncios adicionales
				setConfig((c) => ({ ...c, isRunning: true, isPaused: false }));
			} else {
				// Inicio nuevo
				if (!isRecovery) {
					// Secuencia de inicio normal
					setPrepCountdown(15);
					await audioService.current?.playCountdown();

					// Cuenta regresiva visual
					for (let i = 15; i > 0; i--) {
						await new Promise((resolve) => setTimeout(resolve, 1000));
						setPrepCountdown(i - 1);
					}

					setPrepCountdown(null);
					await audioService.current?.announceWorkStartPeriod(period);
					await new Promise((resolve) => setTimeout(resolve, 2000));
				}

				setConfig((c) => ({ ...c, isRunning: true, isPaused: false }));
			}
		} catch (error) {
			console.error("Error al iniciar la prueba:", error);
			toast.error("Error al iniciar la prueba");
		} finally {
			isStartingRef.current = false;
		}
	};

	const handlePause = () => {
		setConfig((c) => ({ ...c, isRunning: false, isPaused: true }));
		setPreviousTotalTime(totalTime);
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
			expectedSegment: 0,
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
					segment={position.segment}
					recoveryTime={config.recoveryTime}
					activeAthletes={athletes.filter((a) => a.active).length}
					totalDistance={athletes[0]?.totalDistance || 0} // Usamos la distancia total del primer atleta
				/>

				<Track position={position} />

				<ControlPanel
					config={config}
					onStart={() => handleStart(position.period)}
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
