import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useState } from "react";
import { toast } from "sonner";

interface ExportEvaluationsProps {
	athleteId?: number;
	athleteName?: string;
}

export function ExportEvaluations({
	athleteId,
	athleteName,
}: ExportEvaluationsProps) {
	const [exporting, setExporting] = useState(false);

	const handleExport = async () => {
		try {
			setExporting(true);

			const defaultPath = athleteId
				? `evaluacion_${athleteName?.toLowerCase().replace(/\s+/g, "_")}.csv`
				: "evaluaciones.csv";

			const filePath = await open({
				directory: false,
				multiple: false,
				defaultPath,
				filters: [
					{
						name: "CSV",
						extensions: ["csv"],
					},
				],
			});

			if (!filePath) {
				return; // User cancelled
			}

			await invoke(
				athleteId ? "export_athlete_evaluations" : "export_all_evaluations",
				{
					...(athleteId && { athleteId }),
					path: filePath,
				},
			);

			toast.success(
				athleteId
					? `Evaluaciones de ${athleteName} exportadas exitosamente`
					: "Todas las evaluaciones exportadas exitosamente",
			);
		} catch (error) {
			console.error("Error exporting evaluations:", error);
			toast.error(
				athleteId
					? `Error al exportar las evaluaciones de ${athleteName}`
					: "Error al exportar las evaluaciones",
			);
		} finally {
			setExporting(false);
		}
	};

	return (
		<button
			type="button"
			onClick={handleExport}
			disabled={exporting}
			className={`
				inline-flex items-center px-4 py-2 rounded-lg
				${
					exporting
						? "bg-gray-300 cursor-not-allowed"
						: "bg-blue-600 hover:bg-blue-700"
				}
				text-white font-medium text-sm
				transition-colors duration-200
				focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
			`}
		>
			{exporting ? (
				<>
					<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
					Exportando...
				</>
			) : (
				<>
					<svg
						className="w-4 h-4 mr-2"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
						aria-hidden="true"
						role="img"
						aria-label="Icono de exportar"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
						/>
					</svg>
					{athleteId
						? `Exportar evaluaciones de ${athleteName}`
						: "Exportar todas las evaluaciones"}
				</>
			)}
		</button>
	);
}
