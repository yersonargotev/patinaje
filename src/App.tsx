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

	const audioService = useRef<AudioService>(new AudioService());
	const workTimer = useRef<number>();
	const totalTimeInterval = useRef<number>();

	useEffect(() => {
		audioService.current.preloadAll().catch((error) => {
			console.error("Error loading audio files:", error);
		});

		return () => {
			if (totalTimeInterval.current) {
				clearInterval(totalTimeInterval.current);
			}
		};
	}, []);

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

		// Save data for each active athlete
		for (const athlete of athletes.filter((a) => a.active)) {
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
				});
			} catch (error) {
				console.error(`Error saving data for athlete ${athlete.name}:`, error);
			}
		}
	};

	const handleStart = () => {
		setConfig((c) => ({ ...c, isRunning: true, isPaused: false }));
		if (!isRecovery) {
			audioService.current?.announceWorkStart();
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

	const handleShowFinishModal = () => {
		if (config.isRunning) {
			handlePause();
		}
		setShowFinishModal(true);
	};

	return (
		<div className="min-h-screen bg-gray-100 p-4">
			<div className="max-w-6xl mx-auto space-y-4">
				<div className="flex justify-between items-center mb-4">
					<h1 className="text-2xl font-bold text-gray-800">
						Sports Training Test
					</h1>
					<button
						type="button"
						onClick={handleShowFinishModal}
						className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
						disabled={config.isFinished}
					>
						Finalizar Evaluación
					</button>
				</div>

				<Timer
					workTime={workTime}
					recoveryTime={recoveryTime}
					isRecovery={isRecovery}
					totalTime={totalTime}
				/>

				<ControlPanel
					config={config}
					onStart={handleStart}
					onPause={handlePause}
					onPeriodChange={(period) =>
						setConfig((c) => ({ ...c, currentPeriod: period }))
					}
					onRecoveryTimeChange={(time) =>
						setConfig((c) => ({ ...c, recoveryTime: time }))
					}
					onAthleteCountChange={(count) => {
						setConfig((c) => ({ ...c, athleteCount: count }));
						setAthletes((prev) => {
							if (count > prev.length) {
								return [
									...prev,
									...Array(count - prev.length)
										.fill(0)
										.map((_, i) => ({
											id: prev.length + i + 1,
											name: "",
											age: 0,
											weight: 0,
											height: 0,
											active: true,
											completedPeriods: [],
										})),
								];
							}
							return prev.slice(0, count);
						});
					}}
				/>

				<StatusDisplay
					period={position.period}
					lap={position.lap + 1}
					recoveryTime={config.recoveryTime}
					activeAthletes={athletes.filter((a) => a.active).length}
				/>

				<Track position={position} />

				<AthleteManager
					athletes={athletes}
					onAthleteUpdate={handleAthleteUpdate}
				/>

				<FinishModal
					isOpen={showFinishModal}
					onConfirm={handleFinish}
					onCancel={() => setShowFinishModal(false)}
				/>
			</div>
		</div>
	);
}

export default App;
