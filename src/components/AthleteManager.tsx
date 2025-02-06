import { User } from "lucide-react";
import type { Athlete } from "../types";
import { EvaluationHistory } from "./EvaluationHistory";
import { ExportEvaluations } from "./ExportEvaluations";

interface AthleteManagerProps {
	athletes: Athlete[];
	onAthleteUpdate: (athlete: Athlete) => void;
	onFinishAthlete: (athleteId: number) => void;
	isRunning: boolean;
}

export const AthleteManager: React.FC<AthleteManagerProps> = ({
	athletes,
	onAthleteUpdate,
	onFinishAthlete,
	isRunning,
}) => {
	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8 flex justify-between items-center">
				<h1 className="text-2xl font-bold text-gray-800">Gestión de Atletas</h1>
				<ExportEvaluations />
			</div>

			<div className="grid gap-8">
				<div className="bg-white p-4 rounded-lg shadow-md">
					<h2 className="text-lg font-semibold mb-4">Atletas</h2>
					<div className="space-y-4">
						{athletes.map((athlete) => (
							<div key={athlete.id} className="space-y-4">
								<div className="flex flex-col space-y-2 p-4 bg-gray-50 rounded-md">
									<div className="flex items-center">
										<User className="w-5 h-5 mr-2 text-gray-500" />
										<div className="flex-1">
											<input
												type="text"
												value={athlete.name}
												onChange={(e) =>
													onAthleteUpdate({ ...athlete, name: e.target.value })
												}
												placeholder={`Nombre del deportista ${athlete.id} *`}
												className={`w-full bg-transparent focus:ring-0 border-1 ${
													athlete.active && !athlete.name.trim()
														? "border-red-300 focus:border-red-500"
														: "border-gray-300"
												} rounded-md px-2 py-1`}
												required={athlete.active}
											/>
											{athlete.active && !athlete.name.trim() && (
												<p className="text-red-500 text-xs mt-1">
													El nombre es requerido para deportistas activos
												</p>
											)}
										</div>
									</div>

									<div className="grid grid-cols-3 gap-2">
										<div>
											<label
												className="block text-sm text-gray-500"
												htmlFor="age"
											>
												Edad
											</label>
											<input
												type="number"
												value={athlete.age || ""}
												onChange={(e) =>
													onAthleteUpdate({
														...athlete,
														age: Number.parseInt(e.target.value),
													})
												}
												className="w-full rounded-md border-1 border-gray-300"
											/>
										</div>

										<div>
											<label
												className="block text-sm text-gray-500"
												htmlFor="weight"
											>
												Peso (kg)
											</label>
											<input
												type="number"
												step="0.1"
												value={athlete.weight || ""}
												onChange={(e) =>
													onAthleteUpdate({
														...athlete,
														weight: Number.parseFloat(e.target.value),
													})
												}
												className="w-full rounded-md border-1 border-gray-300"
											/>
										</div>

										<div>
											<label
												className="block text-sm text-gray-500"
												htmlFor="height"
											>
												Altura (cm)
											</label>
											<input
												type="number"
												value={athlete.height || ""}
												onChange={(e) =>
													onAthleteUpdate({
														...athlete,
														height: Number.parseFloat(e.target.value),
													})
												}
												className="w-full rounded-md border-1 border-gray-300"
											/>
										</div>
									</div>

									<div className="flex justify-between items-center mt-2">
										<div className="flex items-center">
											<span className="text-sm text-gray-500">
												Completado: {athlete.completedPeriods.length}
											</span>
										</div>
										<button
											type="button"
											onClick={() =>
												onAthleteUpdate({ ...athlete, active: !athlete.active })
											}
											className={`px-2 py-1 rounded ${
												athlete.active
													? "bg-green-100 text-green-800"
													: "bg-gray-100 text-gray-800"
											}`}
										>
											{athlete.active ? "Activo" : "Inactivo"}
										</button>
									</div>
								</div>

								<div className="flex items-end">
									{athlete.active && isRunning && (
										<button
											type="button"
											onClick={() => athlete.id && onFinishAthlete(athlete.id)}
											className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
										>
											Finalizar
										</button>
									)}
									{!athlete.active && (
										<div className="w-full px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-center">
											Finalizado
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Historial de evaluaciones centralizado */}
				<div className="bg-white p-4 rounded-lg shadow-md">
					<EvaluationHistory />
				</div>
			</div>
		</div>
	);
};
