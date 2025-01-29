import { useEffect, useRef, useState } from "react";
import "./App.css";
import { AthleteManager } from "./components/AthleteManager";
import { ControlPanel } from "./components/ControlPanel";
import { StatusDisplay } from "./components/StatusDisplay";
import { Timer } from "./components/Timer";
import { Track } from "./components/Track";
import type { Athlete, TestConfig, TrackPosition } from "./types";
import { calculateIntervalTime } from "./utils/timing";

function App() {
	const [config, setConfig] = useState<TestConfig>({
		recoveryTime: 45,
		currentPeriod: 2,
		athleteCount: 1,
		isRunning: false,
		isPaused: false,
	});

	const [position, setPosition] = useState<TrackPosition>({
		period: 2,
		lap: 0,
		segment: 0,
	});

	const [athletes, setAthletes] = useState<Athlete[]>([
		{ id: 1, name: "", active: true, completedPeriods: [] },
	]);

	const [isRecovery, setIsRecovery] = useState(false);
	const [workTime, setWorkTime] = useState(0);
	const [recoveryTime, setRecoveryTime] = useState(0);
	// const audioService = useRef<AudioService>();
	const recoveryTimer = useRef<number>();
	const workTimer = useRef<number>();
	const recoveryCountdown = useRef<number>();

	// useEffect(() => {
	// 	audioService.current = new AudioService();
	// }, []);

	useEffect(() => {
		let timer: number;

		if (config.isRunning && !config.isPaused && !isRecovery) {
			// Reset work timer when starting new period
			setWorkTime(0);

			// Start work timer
			workTimer.current = window.setInterval(() => {
				setWorkTime((t) => t + 1);
			}, 1000);

			const interval = calculateIntervalTime(config.currentPeriod);
			timer = window.setInterval(() => {
				setPosition((prev) => {
					const newSegment = (prev.segment + 1) % 8;
					const newLap = newSegment === 0 ? (prev.lap + 1) % 4 : prev.lap;

					if (newLap === 0 && newSegment === 0) {
						// Period completed
						// audioService.current?.announceWorkComplete();
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
	}, [config.isRunning, config.isPaused, config.currentPeriod, isRecovery]);

	useEffect(() => {
		if (isRecovery && config.isRunning && !config.isPaused) {
			// Reset recovery timer
			setRecoveryTime(config.recoveryTime);

			// Start recovery countdown
			// audioService.current?.announceRecoveryStart();

			recoveryCountdown.current = window.setInterval(() => {
				setRecoveryTime((t) => {
					if (t <= 1) {
						clearInterval(recoveryCountdown.current);
						return 0;
					}
					return t - 1;
				});
			}, 1000);

			recoveryTimer.current = window.setTimeout(() => {
				// audioService.current?.announceRecoveryComplete();
				setIsRecovery(false);
				// audioService.current?.announceWorkStart(position.period);
				if (recoveryCountdown.current) clearInterval(recoveryCountdown.current);
			}, config.recoveryTime * 1000);

			return () => {
				if (recoveryTimer.current) clearTimeout(recoveryTimer.current);
				if (recoveryCountdown.current) clearInterval(recoveryCountdown.current);
			};
		}
	}, [
		isRecovery,
		config.isRunning,
		config.isPaused,
		config.recoveryTime,
		// position.period,
	]);

	const handleStart = () => {
		setConfig((c) => ({ ...c, isRunning: true, isPaused: false }));
		if (!isRecovery) {
			// audioService.current?.announceWorkStart(position.period);
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
		<div className="min-h-screen bg-gray-100 p-4">
			<div className="max-w-6xl mx-auto space-y-4">
				<h1 className="text-2xl font-bold text-gray-800 mb-4">
					Sports Training Test
				</h1>

				<Timer
					workTime={workTime}
					recoveryTime={recoveryTime}
					isRecovery={isRecovery}
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

				<Track position={position} athletes={config.athleteCount} />

				<AthleteManager
					athletes={athletes}
					onAthleteUpdate={handleAthleteUpdate}
				/>
			</div>
		</div>
	);
}

export default App;
