import { Pause, Play } from "lucide-react";
import type { TestConfig } from "../types";
import { getPeriodData } from "../utils/testData";

interface ControlPanelProps {
	config: TestConfig;
	onStart: () => void;
	onPause: () => void;
	onPeriodChange: (period: number) => void;
	onRecoveryTimeChange: (time: number) => void;
	onAthleteCountChange: (count: number) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
	config,
	onStart,
	onPause,
	onPeriodChange,
	onRecoveryTimeChange,
	onAthleteCountChange,
}) => {
	getPeriodData(config.currentPeriod);

	return (
		<div className="bg-white p-4 rounded-lg shadow-md">
			<div className="flex items-center justify-between mb-4">
				<button
					type="button"
					onClick={config.isRunning ? onPause : onStart}
					className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
				>
					{config.isRunning ? (
						<>
							<Pause className="w-4 h-4 mr-2" />
							Pausar
						</>
					) : (
						<>
							<Play className="w-4 h-4 mr-2" />
							{config.isPaused ? "Reanudar" : "Empezar"}
						</>
					)}
				</button>

				<div className="flex items-center space-x-4">
					<div>
						<label
							htmlFor="athleteCount"
							className="block text-sm font-medium text-gray-700"
						>
							Deportistas
						</label>
						<input
							type="number"
							value={config.athleteCount}
							onChange={(e) => onAthleteCountChange(Number(e.target.value))}
							min={1}
							max={9}
							className="py-1 px-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-500"
						/>
					</div>

					<div>
						<label
							htmlFor="period"
							className="block text-sm font-medium text-gray-700"
						>
							Periodo
						</label>
						<select
							value={config.currentPeriod}
							onChange={(e) => onPeriodChange(Number(e.target.value))}
							className="mt-1 block w-full border-1 rounded-md border-gray-300 py-1 px-3 bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						>
							{Array(21)
								.fill(0)
								.map((_, idx) => {
									const period = idx + 2;
									return (
										<option key={`period-${period}`} value={period}>
											{period} - {getPeriodData(period)?.speed} km/h
										</option>
									);
								})}
						</select>
					</div>

					<div>
						<label
							htmlFor="recoveryTime"
							className="block text-sm font-medium text-gray-700"
						>
							Tiempo de Recuperación
						</label>
						<input
							type="number"
							value={config.recoveryTime}
							onChange={(e) => onRecoveryTimeChange(Number(e.target.value))}
							min={15}
							max={120}
							className="mt-1 block w-full border-1 rounded-md border-gray-300 py-1 px-3 bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						/>
					</div>
				</div>
			</div>
		</div>
	);
};
