import {Dispatch, SetStateAction, useState} from 'react';
import {X, Users} from '../../asserts/icons.tsx';
import ImageUpload from '../post/ImageUpload';
import EditMembers from './EditMembers';
import {Link} from "react-router-dom";
import {Loading} from "../../asserts/loading.tsx";

interface ChatSettingsProps {
    onCancel: () => void;
    onCreate: (newChat: any, setCreating: Dispatch<SetStateAction<boolean>>) => void;
    currentUser: any;
}

const NewChat = ({ onCancel, onCreate, currentUser }: ChatSettingsProps) => {
    const [members, setMembers] = useState<any[]>([currentUser]);
    const [groupName, setGroupName] = useState<string>('');
    const [avatar, setAvatar] = useState<string>('');
    const [showEditMemberModal, setShowEditMemberModal] = useState<boolean>(false);
    const [creating, setCreating] = useState<boolean>(false);

    const handleSubmit = () => {
        onCreate({
            members: members.map((obj) => obj.id),
            groupName: groupName,
            avatar: avatar,
        }, setCreating);
    }

    const handleAddMembers = (newMembers: any[]) => {
        setMembers(newMembers);
    };

    return (
        <div className="flex-1 bg-gray-50 h-full flex flex-col">
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
                                <Link
                                    to={`/profile/${member.id}`}
                                    key={member.id}
                                >
                                    <div
                                        className="w-full rounded-lg bg-gray-50 hover:bg-gray-100 flex space-x-3 p-3 mt-3">
                                        <img
                                            src={member.avatar}
                                            alt={member.username}
                                            className="w-10 h-10 rounded-full"
                                        />
                                        <div className="justify-items-start">
                                            <p className="font-medium hover:text-blue-600 hover:font-semibold">{member.username}{member.id === currentUser.id && " (You)"}</p>
                                            <p className="text-sm text-gray-500 hover:underline">{member.email}</p>
                                        </div>
                                    </div>
                                </Link>
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
                        disabled={!groupName.trim() || !avatar || members.length < 2 || creating}
                        className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg items-center justify-items-center hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {creating?
                            <Loading scale={0.2} color="#fff" message="Creating" />:
                            <span>Create Chat</span>
                        }
                    </button>
                </div>
            </div>
            { showEditMemberModal &&
                <EditMembers
                    initialMembers={members}
                    onClose={() => setShowEditMemberModal(false)}
                    onEditMember={handleAddMembers}
                />
            }
        </div>
    );
};

export default NewChat;