import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import type { Athlete, TestConfig, TrackPosition } from "../types";
import { AudioService } from "../utils/audio";
import { TimerService } from "../services/TimerService";

// Singleton instances for services
let audioServiceInstance: AudioService | null = null;
let timerServiceInstance: TimerService | null = null;

// Get services without React hooks
export function getServices() {
	if (!audioServiceInstance) {
		audioServiceInstance = new AudioService();
		audioServiceInstance.preloadAll().catch((error) => {
			console.error("Error loading audio files:", error);
		});
	}

	if (!timerServiceInstance) {
		timerServiceInstance = new TimerService();
	}

	return {
		audioService: audioServiceInstance,
		timerService: timerServiceInstance,
	};
}

// Initial state values
const initialConfig: TestConfig = {
	recoveryTime: 45,
	currentPeriod: 2,
	athleteCount: 1,
	isRunning: false,
	isPaused: false,
	isFinished: false,
};

const initialPosition: TrackPosition = {
	period: 2,
	lap: 0,
	segment: 0,
	elapsedTime: 0,
	expectedSegment: 0,
};

const initialAthlete: Athlete = {
	id: 1,
	name: "",
	age: 0,
	weight: 0,
	height: 0,
	active: true,
	completedPeriods: [],
	totalDistance: 0,
};

// Define store interface
interface AppState {
	// State
	config: TestConfig;
	position: TrackPosition;
	athletes: Athlete[];
	isRecovery: boolean;
	workTime: number;
	currentRecoveryTime: number;
	totalTime: number;
	prepCountdown: number | null;
	showFinishModal: boolean;
	isStarting: boolean;

	// Actions
	setConfig: (config: Partial<TestConfig>) => void;
	setPosition: (position: Partial<TrackPosition>) => void;
	setAthletes: (
		athletes: Athlete[] | ((current: Athlete[]) => Athlete[]),
	) => void;
	updateAthlete: (updatedAthlete: Athlete) => void;
	setIsRecovery: (isRecovery: boolean) => void;
	setWorkTime: (workTime: number) => void;
	setCurrentRecoveryTime: (time: number) => void;
	setTotalTime: (time: number) => void;
	setPrepCountdown: (countdown: number | null) => void;
	setShowFinishModal: (show: boolean) => void;

	// Business logic
	startTest: () => Promise<void>;
	pauseTest: () => void;
	resetApp: () => void;
	finishTest: () => Promise<void>;
	finishAthlete: (athleteId: number) => Promise<void>;
	updatePeriod: (period: number) => void;
	updateRecoveryTime: (time: number) => void;
	updateAthleteCount: (count: number) => void;
}

export const useStore = create<AppState>((set, get) => ({
	// Initial state
	config: initialConfig,
	position: initialPosition,
	athletes: [initialAthlete],
	isRecovery: false,
	workTime: 0,
	currentRecoveryTime: 0,
	totalTime: 0,
	prepCountdown: null,
	showFinishModal: false,
	isStarting: false,

	// Basic state setters
	setConfig: (configUpdate) =>
		set((state) => ({
			config: { ...state.config, ...configUpdate },
		})),

	setPosition: (positionUpdate) =>
		set((state) => ({
			position: { ...state.position, ...positionUpdate },
		})),

	setAthletes: (athletesOrFn) =>
		set((state) => ({
			athletes:
				typeof athletesOrFn === "function"
					? athletesOrFn(state.athletes)
					: athletesOrFn,
		})),

	updateAthlete: (updatedAthlete) =>
		set((state) => ({
			athletes: state.athletes.map((a) =>
				a.id === updatedAthlete.id ? updatedAthlete : a,
			),
		})),

	setIsRecovery: (isRecovery) => set({ isRecovery }),
	setWorkTime: (workTime) => set({ workTime }),
	setCurrentRecoveryTime: (currentRecoveryTime) => set({ currentRecoveryTime }),
	setTotalTime: (totalTime) => set({ totalTime }),
	setPrepCountdown: (prepCountdown) => set({ prepCountdown }),
	setShowFinishModal: (showFinishModal) => set({ showFinishModal }),

	// Business logic
	startTest: async () => {
		const state = get();
		const { audioService, timerService } = getServices();

		if (state.isStarting) return;
		set({ isStarting: true });

		// Verificar datos de atletas
		const invalidAthletes = state.athletes
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
			set({ isStarting: false });
			return;
		}

		try {
			if (state.config.isPaused) {
				set((state) => ({
					config: { ...state.config, isRunning: true, isPaused: false },
				}));
				timerService?.start();
			} else {
				// Inicio nuevo
				if (!state.isRecovery) {
					// Secuencia de inicio normal
					set({ prepCountdown: 15 });
					await audioService?.playCountdown();

					// Cuenta regresiva visual
					for (let i = 15; i > 0; i--) {
						await new Promise((resolve) => setTimeout(resolve, 1000));
						set({ prepCountdown: i - 1 });
					}

					set({ prepCountdown: null });
					await audioService?.announceWorkStartPeriod(state.position.period);
				}

				set((state) => ({
					config: { ...state.config, isRunning: true, isPaused: false },
				}));
				timerService?.start();
			}
		} catch (error) {
			console.error("Error al iniciar la prueba:", error);
			toast.error("Error al iniciar la prueba");
		} finally {
			set({ isStarting: false });
		}
	},

	pauseTest: () => {
		const { audioService, timerService } = getServices();

		set((state) => ({
			config: { ...state.config, isRunning: false, isPaused: true },
		}));
		timerService?.pause();
		audioService?.announceTestPaused();
	},

	resetApp: () => {
		const { timerService } = getServices();
		timerService?.reset();

		set({
			config: initialConfig,
			position: initialPosition,
			athletes: [initialAthlete],
			isRecovery: false,
			workTime: 0,
			totalTime: 0,
			currentRecoveryTime: 0,
			prepCountdown: null,
		});

		toast.success("Test reiniciado correctamente");
	},

	finishTest: async () => {
		const state = get();

		set((state) => ({
			config: { ...state.config, isFinished: true, isRunning: false },
			showFinishModal: false,
		}));

		try {
			// Prepare all data in a single batch
			const activeAthletes = state.athletes.filter((a) => a.active);

			// Validate all athletes first
			const invalidAthletes = activeAthletes.filter(
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

			// Prepare batch data
			const evaluationsData = activeAthletes.map((athlete) => [
				athlete,
				JSON.stringify(athlete.completedPeriods),
				Math.floor(state.totalTime),
				athlete.totalDistance,
				"completed",
			]);

			// Single batch save
			await invoke("save_batch_evaluations", {
				evaluations: evaluationsData,
			});

			toast.success("Evaluaciones guardadas correctamente");
		} catch (error) {
			console.error("Error saving evaluations:", error);
			toast.error(
				error instanceof Error
					? error.message
					: "Error al guardar las evaluaciones",
			);
		}
	},

	finishAthlete: async (athleteId) => {
		const state = get();
		const athlete = state.athletes.find((a) => a.id === athleteId);
		if (!athlete) return;

		try {
			// Redondear totalTime a un número entero
			const roundedTotalTime = Math.floor(state.totalTime);

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
			set((state) => ({
				athletes: state.athletes.map((a) =>
					a.id === athleteId ? { ...a, active: false } : a,
				),
			}));

			toast.success(`Evaluación de ${athlete.name} guardada correctamente`);

			// Check if all athletes are finished
			const remainingActiveAthletes = state.athletes.filter(
				(a) => a.id !== athleteId && a.active,
			).length;
			if (remainingActiveAthletes === 0) {
				set((state) => ({
					config: { ...state.config, isFinished: true, isRunning: false },
				}));
			}
		} catch (error) {
			console.error(`Error saving evaluation for ${athlete.name}:`, error);
			toast.error(`Error al guardar la evaluación de ${athlete.name}`);
		}
	},

	updatePeriod: (period) => {
		set((state) => ({
			config: { ...state.config, currentPeriod: period },
			position: { ...state.position, period },
		}));
	},

	updateRecoveryTime: (time) => {
		set((state) => ({
			config: { ...state.config, recoveryTime: time },
		}));
	},

	updateAthleteCount: (count) => {
		const state = get();

		set((state) => ({
			config: { ...state.config, athleteCount: count },
		}));

		if (count > state.athletes.length) {
			set((state) => ({
				athletes: [
					...state.athletes,
					...Array(count - state.athletes.length)
						.fill(0)
						.map((_, i) => ({
							id: state.athletes.length + i + 1,
							name: "",
							age: 0,
							weight: 0,
							height: 0,
							active: true,
							completedPeriods: [],
							totalDistance: 0,
						})),
				],
			}));
		} else if (count < state.athletes.length) {
			set((state) => ({
				athletes: state.athletes.slice(0, count),
			}));
		}
	},
}));
