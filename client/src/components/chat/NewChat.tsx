import { useState } from 'react';
import {X, Users} from '../../asserts/icons.tsx';
import ImageUpload from '../post/ImageUpload';
import EditMembers from './EditMembers';

interface ChatSettingsProps {
    onCancel: () => void;
    onCreate: (newChat: any) => void;
}

const NewChat = ({ onCancel, onCreate }: ChatSettingsProps) => {
    const [members, setMembers] = useState<any[]>([]);
    const [groupName, setGroupName] = useState('');
    const [avatar, setAvatar] = useState('');
    const [showEditMemberModal, setShowEditMemberModal] = useState(false);

    const handleSubmit = () => {
        onCreate({
            members: members.map((obj) => obj.id),
            groupName: groupName,
            avatar: avatar,
        });
    }

    const handleAddMembers = (newMembers: any[]) => {
        setMembers((prevMembers) => {
            const updatedMembers = [...prevMembers, ...newMembers];
            console.log('Updated members:', updatedMembers);
            return updatedMembers;
        });
    };

    return (
        <div className="flex-1 bg-gray-50 h-full flex flex-col overflow-y-scroll">
            <div className="flex flex-row w-full border-b border-gray-200 bg-white py-4 px-8 h-16">
                <h2 className="flex w-full items-center space-x-3 text-lg font-semibold">New Chat</h2>
                <button
                    onClick={onCancel}
                    className="p-2 hover:bg-gray-100 rounded-full flex flex-row items-center space-x-3"
                >
                    <X className="w-5 h-5"/>
                </button>
            </div>

            <div className="overflow-y-auto space-y-4">
                <form className="w-[80%] mx-auto flex-1 p-4 space-y-8">
                    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6 mt-4">
                        <h3 className="text-lg font-medium space-y-6">General</h3>
                        <div className="flex-1 overflow-y-auto px-4 pb-4">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Chat Avatar
                                    </label>
                                    <ImageUpload
                                        onUpload={setAvatar}
                                        defaultImage={avatar}
                                        className="w-24 h-fit"
                                        prompt={false}
                                    />
                                    {!avatar && (
                                        <p className="mt-1 text-sm text-red-600">Avatar is required</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Chat Name
                                    </label>
                                    <input
                                        type="text"
                                        value={groupName}
                                        onChange={(e) => setGroupName(e.target.value)}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 px-2 py-1"
                                        placeholder="Enter chat name"
                                    />
                                    {!groupName.trim() && (
                                        <p className="mt-1 text-sm text-red-600">Chat name is required</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium">Members</h3>
                            <button
                                onClick={() => setShowEditMemberModal(true)}
                                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                                type="button"
                            >
                                <Users className="w-5 h-5"/>
                                <span>Edit Members</span>
                            </button>
                        </div>

                        <div className="space-y-3">
                            {members.map((member: any) => (
                                <div
                                    key={member.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex items-center space-x-3">
                                        <img
                                            src={member.avatar}
                                            alt={member.username}
                                            className="w-10 h-10 rounded-full"
                                        />
                                        <div>
                                            <p className="font-medium">{member.username}</p>
                                            <p className="text-sm text-gray-500">{member.email}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {members.length < 2 && (
                                <p className="mt-1 text-sm text-red-600">At least two members are required</p>
                            )}
                        </div>
                    </div>
                </form>
            </div>
            <div className="p-4">
                <div
                    className="mt-auto border-t border-gray-200 p-6 space-y-4 bg-white w-[80%] mx-auto flex-1 rounded-lg shadow-sm">
                    <button
                        onClick={handleSubmit}
                        disabled={!groupName.trim() || !avatar || members.length < 2}
                        className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Create Chat
                    </button>
                </div>
            </div>
            <EditMembers
                isOpen={showEditMemberModal}
                onClose={() => setShowEditMemberModal(false)}
                onAddMembers={handleAddMembers}
            />
        </div>
    );
};

export default NewChat;