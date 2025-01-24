import {Dispatch, SetStateAction, useState} from 'react';
import { X, Users, Trash } from '../../asserts/icons.tsx';
import ImageUpload from '../post/ImageUpload';
import {Link} from "react-router-dom";
import {readCookies} from "../../utils/cookies.ts";
import EditMembers from './EditMembers';
import {Loading} from "../../asserts/loading.tsx";

interface ChatSettingsProps {
    chat: any;
    onClose: () => void;
    onUpdate: (updatedChat: any, setSaving: Dispatch<SetStateAction<boolean>>) => void;
    onDelete: (deletingChat: any, setDeleting: Dispatch<SetStateAction<boolean>>) => void;
}

const ChatSettings = ({ chat, onClose, onUpdate, onDelete }: ChatSettingsProps) => {
    const [groupName, setGroupName] = useState<string>(chat.groupName || '');
    const [avatar, setAvatar] = useState<string>(chat.avatar || '');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
    const [showEditMemberModal, setShowEditMemberModal] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [deleting, setDeleting] = useState<boolean>(false);

    const cookies = readCookies();
    const id = cookies.id;

    const handleUpdateSettings = () => {
        onUpdate({
            ...chat,
            groupName: groupName,
            avatar,
        }, setSaving);
    };

    const handleEditMembers = (newMembers: any[]) => {
        chat.members = newMembers;
    };

    return (
        <div className="flex-1 bg-gray-50 h-full flex flex-col">
            <div className="flex flex-row w-full border-b border-gray-200 bg-white py-4 px-8 h-16">
                <h2 className="flex w-full items-center space-x-3 text-lg font-semibold">Chat Settings</h2>
                <button
                    onClick={onClose}
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
                            {chat.members.map((member: any) => (
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
                                            <p className="font-medium hover:text-blue-600 hover:font-semibold">{member.username}{member.id === id && " (You)"}</p>
                                            <p className="text-sm text-gray-500 hover:underline">{member.email}</p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                            {chat.members.length < 2 && (
                                <p className="mt-1 text-sm text-red-600">At least two members are required</p>
                            )}
                        </div>
                    </div>
                </form>
            </div>

            <div className="px-4 py-2">
                <div className="mt-auto border-t border-gray-200 p-6 space-y-4 bg-white w-[80%] mx-auto flex-1 rounded-lg shadow-sm">
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center space-x-2 text-red-600 hover:text-red-700 w-full justify-center py-2 px-4 border border-red-600 rounded-lg hover:bg-red-50"
                    >
                        { deleting?
                            <Loading scale={0.2} color="#f00" message="Deleting" />:
                            <>
                                <Trash className="w-5 h-5"/>
                                <span>Delete Chat</span>
                            </>
                        }
                    </button>

                    <button
                        onClick={handleUpdateSettings}
                        disabled={!groupName.trim() || !avatar || chat.members.length < 2 || saving}
                        className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed justify-items-center"
                    >
                        { saving?
                            <Loading scale={0.2} color="#fff" message="Saving" />:
                            <span>Save Changes</span>
                        }
                    </button>
                </div>
            </div>

            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                        <h3 className="text-lg font-semibold mb-4">Delete Chat</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete this chat? This action cannot be undone.
                        </p>
                        <div className="flex space-x-4">
                            <button
                                onClick={() => onDelete(chat, setDeleting)}
                                disabled={deleting}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed justify-items-center"
                            >
                                { deleting?
                                    <Loading scale={0.2} color="#fff" message="Deleting" />:
                                    <span>Delete</span>
                                }
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={deleting}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
            { showEditMemberModal &&
                <EditMembers
                    initialMembers={chat.members}
                    onClose={() => setShowEditMemberModal(false)}
                    onEditMember={handleEditMembers}
                />
            }
        </div>
    );
};

export default ChatSettings;