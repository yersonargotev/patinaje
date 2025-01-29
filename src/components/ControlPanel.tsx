import { Pause, Play } from "lucide-react";
import type { TestConfig } from "../types";

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
	return (
		<div className="bg-white p-4 rounded-lg shadow-md">
			<div className="flex items-center justify-between mb-4">
				<button
					onClick={config.isRunning ? onPause : onStart}
					className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
				>
					{config.isRunning ? (
						<>
							<Pause className="w-4 h-4 mr-2" />
							Pause
						</>
					) : (
						<>
							<Play className="w-4 h-4 mr-2" />
							Start
						</>
					)}
				</button>

				<div className="flex items-center space-x-4">
					<div>
						<label className="block text-sm font-medium text-gray-700">
							Period
						</label>
						<select
							value={config.currentPeriod}
							onChange={(e) => onPeriodChange(Number(e.target.value))}
							className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
						>
							{Array(21)
								.fill(0)
								.map((_, idx) => (
									<option key={idx + 2} value={idx + 2}>
										{idx + 2}
									</option>
								))}
						</select>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700">
							Recovery (s)
						</label>
						<input
							type="number"
							value={config.recoveryTime}
							onChange={(e) => onRecoveryTimeChange(Number(e.target.value))}
							min={15}
							max={120}
							className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700">
							Athletes
						</label>
						<input
							type="number"
							value={config.athleteCount}
							onChange={(e) => onAthleteCountChange(Number(e.target.value))}
							min={1}
							max={9}
							className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
						/>
					</div>
				</div>
			</div>
		</div>
	);
};
