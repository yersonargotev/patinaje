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
import { calculateIntervalTime } from "./utils/timing";
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
		},
	]);

	const [isRecovery, setIsRecovery] = useState(false);
	const [workTime, setWorkTime] = useState(0);
	const [recoveryTime] = useState(0);
	const [totalTime, setTotalTime] = useState(0);
	const [prepCountdown, setPrepCountdown] = useState<number | null>(null);

	const audioService = useRef<AudioService>(new AudioService());
	const workTimer = useRef<number>();
	const recoveryTimer = useRef<number>();
	const totalTimeInterval = useRef<number>();
	const isStartingRef = useRef(false);

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

	// Temporizador de recuperación
	useEffect(() => {
		const startRecovery = async () => {
			if (isStartingRef.current) return;
			isStartingRef.current = true;

			try {
				// Reproducir cuenta regresiva para recuperación
				await audioService.current?.playCountdown();
				await audioService.current?.announceRecoveryStart();

				// Iniciar el temporizador de recuperación después de la cuenta regresiva
				recoveryTimer.current = window.setTimeout(() => {
					setIsRecovery(false);
					audioService.current?.announceRecoveryComplete();
				}, config.recoveryTime * 1000);
			} finally {
				isStartingRef.current = false;
			}
		};

		if (isRecovery && config.isRunning && !config.isPaused) {
			startRecovery();
		}

		return () => {
			if (recoveryTimer.current) {
				clearTimeout(recoveryTimer.current);
			}
		};
	}, [isRecovery, config.isRunning, config.isPaused, config.recoveryTime]);

	useEffect(() => {
		if (config.isRunning && !config.isPaused && !config.isFinished) {
			totalTimeInterval.current = window.setInterval(() => {
				setTotalTime((t) => t + 1);
			}, 1000);
		} else if (totalTimeInterval.current) {
			clearInterval(totalTimeInterval.current);
		}

		return () => {
			if (totalTimeInterval.current) {
				clearInterval(totalTimeInterval.current);
			}
		};
	}, [config.isRunning, config.isPaused, config.isFinished]);

	useEffect(() => {
		let timer: number;

		if (
			config.isRunning &&
			!config.isPaused &&
			!config.isFinished &&
			!isRecovery
		) {
			setWorkTime(0);

			workTimer.current = window.setInterval(() => {
				setWorkTime((t) => t + 1);
			}, 1000);

			const interval = calculateIntervalTime(config.currentPeriod);
			timer = window.setInterval(() => {
				audioService.current?.playIntervalBeep();

				setPosition((prev) => {
					const newSegment = (prev.segment + 1) % 8;
					const newLap = newSegment === 0 ? (prev.lap + 1) % 4 : prev.lap;

					if (newLap === 0 && newSegment === 0) {
						// Update completed periods for active athletes
						setAthletes((currentAthletes) =>
							currentAthletes.map((athlete) =>
								athlete.active
									? {
											...athlete,
											completedPeriods: [
												...athlete.completedPeriods,
												prev.period,
											],
										}
									: athlete,
							),
						);

						audioService.current?.announceWorkComplete();
						setIsRecovery(true);
						return { period: prev.period + 1, lap: 0, segment: 0 };
					}

					return { ...prev, lap: newLap, segment: newSegment };
				});
			}, interval * 1000);
		}

		return () => {
			if (timer) clearInterval(timer);
			if (workTimer.current) clearInterval(workTimer.current);
		};
	}, [
		config.isRunning,
		config.isPaused,
		config.isFinished,
		config.currentPeriod,
		isRecovery,
	]);

	const handleFinish = async () => {
		setConfig((c) => ({ ...c, isFinished: true, isRunning: false }));
		setShowFinishModal(false);

		try {
			// Verificar que invoke esté disponible
			if (typeof invoke !== "function") {
				throw new Error("Tauri invoke no está disponible");
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
								status: "completed",
							});
						} catch (error) {
							console.error(
								`Error saving evaluation for ${athlete.name}:`,
								error,
							);
							throw error;
						}
					}),
			);

			toast.success("Evaluaciones guardadas correctamente");
		} catch (error) {
			console.error("Error saving evaluations:", error);
			toast.error("Error al guardar las evaluaciones");
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
			if (!isRecovery) {
				// Start 10-second preparation countdown
				setPrepCountdown(10);
				const countdownInterval = setInterval(() => {
					setPrepCountdown((prev) => {
						if (prev === null || prev <= 1) {
							clearInterval(countdownInterval);
							return null;
						}
						return prev - 1;
					});
				}, 1000);

				// Wait for countdown to complete
				await new Promise((resolve) => setTimeout(resolve, 10000));

				await audioService.current?.playCountdown();
				await audioService.current?.announceWorkStart();
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
		setConfig((c) => ({ ...c, isPaused: true }));
	};

	const handleAthleteUpdate = (updatedAthlete: Athlete) => {
		setAthletes((prev) =>
			prev.map((a) => (a.id === updatedAthlete.id ? updatedAthlete : a)),
		);
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
					recoveryTime={recoveryTime}
					totalTime={totalTime}
				/>

				<StatusDisplay
					period={position.period}
					lap={position.lap}
					recoveryTime={config.recoveryTime}
					activeAthletes={athletes.filter((a) => a.active).length}
				/>

				<Track position={position} />

				<ControlPanel
					config={config}
					onStart={handleStart}
					onPause={handlePause}
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
									})),
							]);
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
