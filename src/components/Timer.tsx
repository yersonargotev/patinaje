import { Clock, RefreshCw, Timer as TimerIcon } from "lucide-react";
import { formatTime } from "../utils/timing";

interface TimerProps {
	workTime: number;
	recoveryTime: number;
	isRecovery: boolean;
	totalTime: number;
}

export const Timer: React.FC<TimerProps> = ({
	workTime,
	recoveryTime,
	isRecovery,
	totalTime,
}) => {
	return (
		<div className="grid grid-cols-3 gap-4">
			<div
				className={`p-4 rounded-lg shadow-md ${
					isRecovery ? "bg-gray-100" : "bg-white ring-2 ring-blue-500"
				}`}
			>
				<div className="flex items-center justify-between mb-2">
					<div className="flex items-center">
						<TimerIcon className="w-5 h-5 text-blue-600 mr-2" />
						<h3 className="text-sm font-medium text-gray-700">
							Tiempo de Trabajo
						</h3>
					</div>
				</div>
				<p
					className={`text-3xl font-mono font-bold ${
						isRecovery ? "text-gray-400" : "text-blue-600"
					}`}
				>
					{formatTime(workTime)}
				</p>
			</div>

			<div
				className={`p-4 rounded-lg shadow-md ${
					!isRecovery ? "bg-gray-100" : "bg-white ring-2 ring-green-500"
				}`}
			>
				<div className="flex items-center justify-between mb-2">
					<div className="flex items-center">
						<RefreshCw className="w-5 h-5 text-green-600 mr-2" />
						<h3 className="text-sm font-medium text-gray-700">
							Tiempo de Recuperación
						</h3>
					</div>
				</div>
				<p
					className={`text-3xl font-mono font-bold ${
						!isRecovery ? "text-gray-400" : "text-green-600"
					}`}
				>
					{formatTime(recoveryTime)}
				</p>
			</div>

			<div className="p-4 rounded-lg shadow-md bg-white">
				<div className="flex items-center justify-between mb-2">
					<div className="flex items-center">
						<Clock className="w-5 h-5 text-purple-600 mr-2" />
						<h3 className="text-sm font-medium text-gray-700">Tiempo Total</h3>
					</div>
				</div>
				<p className="text-3xl font-mono font-bold text-purple-600">
					{formatTime(totalTime)}
				</p>
			</div>
		</div>
	);
};
