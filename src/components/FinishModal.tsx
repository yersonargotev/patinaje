interface FinishModalProps {
	show: boolean;
	onClose: () => void;
	onConfirm: () => void;
}

export const FinishModal: React.FC<FinishModalProps> = ({
	show,
	onClose,
	onConfirm,
}) => {
	if (!show) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
				<h2 className="text-xl font-bold mb-4">Confirmar Finalización</h2>
				<p className="text-gray-600 mb-6">
					¿Está seguro que desea finalizar la evaluación? Esta acción no se
					puede deshacer.
				</p>
				<div className="flex justify-end space-x-4">
					<button
						type="button"
						onClick={onClose}
						className="px-4 py-2 text-gray-600 hover:text-gray-800"
					>
						Cancelar
					</button>
					<button
						type="button"
						onClick={onConfirm}
						className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
					>
						Finalizar
					</button>
				</div>
			</div>
		</div>
	);
};
