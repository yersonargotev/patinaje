import { Toaster } from "sonner";
import "./App.css";
import { AthleteManager } from "./components/AthleteManager";
import { ControlPanel } from "./components/ControlPanel";
import { FinishModal } from "./components/FinishModal";
import { StatusDisplay } from "./components/StatusDisplay";
import { Timer } from "./components/Timer";
import { Track } from "./components/Track";
import { useRecoveryTimer } from "./hooks/useRecoveryTimer";
import { useTotalTimer } from "./hooks/useTotalTimer";
import { useWorkTimer } from "./hooks/useWorkTimer";
import { useStore } from "./store";

function App() {
	// Get state from the store
	const {
		config,
		position,
		athletes,
		workTime,
		currentRecoveryTime,
		totalTime,
		prepCountdown,
		showFinishModal,
		setShowFinishModal,
		finishTest,
		updatePeriod,
		updateRecoveryTime,
		updateAthleteCount,
		startTest,
		pauseTest,
		resetApp,
		updateAthlete,
		finishAthlete,
	} = useStore();

	// Use the custom hooks for timers
	useWorkTimer();
	useRecoveryTimer();
	useTotalTimer();

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
					recoveryTime={config.recoveryTime}
					activeAthletes={athletes.filter((a) => a.active).length}
					totalDistance={athletes[0]?.totalDistance || 0}
				/>

				<Track position={position} />

				<ControlPanel
					config={config}
					onStart={startTest}
					onPause={pauseTest}
					onReset={resetApp}
					onPeriodChange={updatePeriod}
					onRecoveryTimeChange={updateRecoveryTime}
					onAthleteCountChange={updateAthleteCount}
				/>

				<AthleteManager
					athletes={athletes}
					onAthleteUpdate={updateAthlete}
					onFinishAthlete={finishAthlete}
					isRunning={config.isRunning}
				/>
			</div>

			<FinishModal
				show={showFinishModal}
				onClose={() => setShowFinishModal(false)}
				onConfirm={finishTest}
			/>

			<Toaster position="top-center" richColors />
		</div>
	);
}

export default App;
