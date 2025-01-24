import { ReactNode } from 'react';
import { X } from '../../asserts/icons.tsx';
interface ModalProps {
    title: string;
    onClose: () => void;
    children: ReactNode;
}

const Modal = ({ title, onClose, children }: ModalProps) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};
export default Modal;