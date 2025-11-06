
import React from 'react';

type SessionType = 'vibe' | 'seek' | 'cookie' | 'borrow';

interface SessionTypeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectType: (type: SessionType) => void;
}

const sessionOptions = [
    { type: 'vibe' as const, emoji: '🎉', title: 'Vibe', description: 'Hang out with others' },
    { type: 'seek' as const, emoji: '🙋', title: 'Seek', description: 'Get help or learn something' },
    { type: 'cookie' as const, emoji: '🍪', title: 'Cookie', description: 'Teach or share a skill' },
    { type: 'borrow' as const, emoji: '📦', title: 'Borrow', description: 'Request or lend an item' },
];


const SessionTypeModal: React.FC<SessionTypeModalProps> = ({ isOpen, onClose, onSelectType }) => {
    if (!isOpen) return null;

    const handleSelect = (type: SessionType) => {
        onSelectType(type);
    };

    return (
        <>
            <div 
                onClick={onClose}
                className="fixed inset-0 bg-black/50 z-[2000] transition-opacity duration-300 opacity-100" 
                aria-hidden="true"
            />
            <div 
                className="fixed inset-0 z-[2010] flex items-center justify-center p-4"
                role="dialog"
                aria-modal="true"
                aria-labelledby="session-type-title"
            >
                <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-6 transform transition-all duration-300 scale-100">
                    <h2 id="session-type-title" className="text-2xl font-bold text-center text-gray-800">What do you want to do?</h2>
                    
                    <div className="grid grid-cols-2 gap-4">
                        {sessionOptions.map(option => (
                            <button 
                                key={option.type}
                                onClick={() => handleSelect(option.type)}
                                className="text-left bg-white border-2 border-gray-300 hover:border-purple-500 hover:shadow-md rounded-xl p-6 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                            >
                                <div className="text-3xl mb-2">{option.emoji} {option.title}</div>
                                <p className="text-sm text-gray-600">{option.description}</p>
                            </button>
                        ))}
                    </div>

                </div>
            </div>
        </>
    );
};

export default SessionTypeModal;
