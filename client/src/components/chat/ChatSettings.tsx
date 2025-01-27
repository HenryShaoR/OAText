import {Dispatch, SetStateAction, useState} from 'react';
import {X, Users, Trash, Search, Save} from '../../asserts/icons.tsx';
import ImageUpload from '../post/ImageUpload';
import {Link} from "react-router-dom";
import {readCookies} from "../../utils/cookies.ts";
import {Loading} from "../../asserts/loading.tsx";
import {server} from "../../utils/address.ts";
import {popup} from "../../utils/popup.ts";

interface ChatSettingsProps {
    chat: any;
    onCancel: () => void;
    onUpdate: (updatedChat: any, setSaving: Dispatch<SetStateAction<boolean>>) => void;
    onDelete: (deletingChat: any, setDeleting: Dispatch<SetStateAction<boolean>>) => void;
}

const ChatSettings = ({ chat, onCancel, onUpdate, onDelete }: ChatSettingsProps) => {
    const creating = chat.id === undefined;
    const [tempMembers, setTempMembers] = useState<any[]>(chat.members.map((member: any) => {return {
        id: member.id,
        username: member.username,
        email: member.email,
        avatar: member.avatar,
    };}));
    const [membersList, setMembersList] = useState<any[]>(chat.members.map((member: any) => {return {
        id: member.id,
        username: member.username,
        email: member.email,
        avatar: member.avatar,
    };}));

    const [groupName, setGroupName] = useState<string>(chat.groupName || '');
    const [avatar, setAvatar] = useState<string>(chat.avatar || '');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
    const [isEditingMembers, setIsEditingMembers] = useState<boolean>(false);
    const [deleting, setDeleting] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [searching, setSearching] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);

    const cookies = readCookies();
    const uid = cookies.id;

    const handleUpdateSettings = () => {
        chat.members = membersList;
        onUpdate({
            ...chat,
            groupName: groupName,
            avatar,
        }, setSaving);
    };

    const handleSearchMember = async () => {
        if (searchTerm === '') return;
        setSearching(true);
        try {
            const response = await fetch(`${server}/v2/search/user/-1`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    requestFields: {
                        value: searchTerm,
                        fields: ["username", "email", "id"],
                    },
                    responseFields: ["id", "username", "avatar", "email"],
                })
            });
            const result = await response.json();

            if (tempMembers.map((member: any) => member.id).includes(result.id)) return popup("The user is already in the list");

            if (response.ok) {
                setTempMembers([...tempMembers, {
                    id: result.id,
                    username: result.username,
                    avatar: result.avatar,
                    email: result.email,
                }]);
                setSearchTerm('');
            } else {
                popup(result.error);
            }
        } catch (error) {
            console.error(error);
            popup("User Not Found. Please Try Again Later.\n\nIf the Error Persists, Please Contact Support.");
        } finally {
            setSearching(false);
        }
    };

    const handleRemoveMember = async (id: number) => {
        if (tempMembers.length === 3 && !creating) {
            return popup("At Least 3 Members are Required for a Group Chat.");
        }
        if (tempMembers.length < 3 && !creating) {
            return popup("At Least 2 Members are Required for a Private Chat.");
        }
        if (creating && id === uid) {
            return popup("You Must be in the Chat When Creating One.")
        }
        setTempMembers(tempMembers.filter((member) => member.id !== id));
    }

    return (
        <div className="flex-1 bg-gray-50 h-full flex flex-col">
            <div className="flex flex-row w-full border-b border-gray-200 bg-white py-4 px-8 h-16">
                <h2 className="flex w-full items-center space-x-3 text-lg font-semibold">{creating? "New Chat" : "Chat Settings"}</h2>
                <button
                    onClick={() => {
                        onCancel();
                    }}
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
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 px-2 py-1 bg-gray-50 focus:bg-white"
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
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium my-2">Members</h3>
                            { isEditingMembers ?
                                <button
                                    onClick={() => {
                                        setMembersList(tempMembers);
                                        setIsEditingMembers(false);
                                    }}
                                    className="flex items-center space-x-2 hover:text-gray-900 border bg-black rounded-lg disabled:opacity-50 disabled:cursor-not-allowed py-1.5 px-3 hover:bg-gray-800"
                                    type="button"
                                    disabled={tempMembers.length < 2}
                                >
                                    <Save className="w-5 h-5 text-white"/>
                                    <span className="text-white">Save Changes</span>
                                </button>
                                :
                                <button
                                    onClick={() => {
                                        setTempMembers(membersList);
                                        setIsEditingMembers(true);
                                    }}
                                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                                    type="button"
                                >
                                    <Users className="w-5 h-5"/>
                                    <span>Edit Members</span>
                                </button>
                            }
                        </div>
                        {isEditingMembers && (
                            <div className="mt-4 p-4 border border-gray-200 rounded-lg h-fit">
                                <div className="flex space-x-2 items-center justify-between mb-3">
                                    <h4 className="font-medium">Add New Member</h4>
                                    <button
                                        onClick={() => setIsEditingMembers(false)}
                                        className="flex items-center space-x-2 text-red-500 hover:bg-red-50 py-1 px-2 rounded-lg border border-red-600"
                                        type="button"
                                    >
                                        <span className="">Discard Changes</span>
                                        <X className="w-5 h-5"/>
                                    </button>
                                </div>
                                <div className="flex space-x-2">
                                <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 px-2 py-1 bg-gray-50 focus:bg-white"
                                        placeholder="Username/Email/ID"
                                    />
                                    <button
                                        onClick={handleSearchMember}
                                        disabled={searching}
                                        type="button"
                                        className="px-4 py-1 bg-gray-900 text-white rounded-lg hover:bg-gray-800 w-fit disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {searching ?
                                            <Loading message="" scale={0.2} color="#fff"/> :
                                            <Search className="w-5 h-5"/>
                                        }
                                    </button>
                                </div>
                            </div>
                        )}
                        <div className="space-y-3">
                            {(isEditingMembers ? tempMembers : membersList).map((member: any) => (
                                <li
                                    key={member.id}
                                    className="flex p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                                >
                                    <Link
                                        to={`/profile/${member.id}`}
                                        target="_blank"  // open in new tab to prevent interrupting editing members
                                        className="flex items-center space-x-4 w-full"
                                    >
                                        <img
                                            src={member.avatar}
                                            alt={member.username}
                                            className="w-12 h-12 rounded-full min-w-12"
                                        />
                                        <div>
                                            <p className="font-medium hover:text-blue-600 hover:font-semibold">{member.username}{member.id === uid && " (You)"}</p>
                                            <p className="text-sm text-gray-500 hover:underline">{member.email}</p>
                                        </div>
                                    </Link>
                                    { isEditingMembers &&
                                        <button
                                            className="m-3 hover:bg-gray-200 rounded-full"
                                            type="button"
                                            onClick={() => handleRemoveMember(member.id)}
                                        >
                                            <X className="text-red-500 w-6 h-6 m-1"/>
                                        </button>
                                    }
                                </li>
                            ))}
                            {(isEditingMembers? tempMembers:membersList).length < 2 && (
                                <p className="mt-1 text-sm text-red-600">At least two members are required</p>
                            )}
                        </div>
                    </div>
                </form>
            </div>

            <div className="px-4 py-2">
                <div
                    className="mt-auto border-t border-gray-200 p-6 space-y-4 bg-white w-[80%] mx-auto flex-1 rounded-lg shadow-sm">
                    {!creating &&
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="flex items-center space-x-2 text-red-600 hover:text-red-700 w-full justify-center py-2 px-4 border border-red-600 rounded-lg hover:bg-red-50"
                        >
                            {deleting ?
                                <Loading scale={0.2} color="#f00" message="Deleting"/> :
                                <>
                                    <Trash className="w-5 h-5"/>
                                    <span>Delete Chat</span>
                                </>
                            }
                        </button>
                    }

                    <button
                        onClick={
                        isEditingMembers?
                            () => {
                                setMembersList(tempMembers);
                                setIsEditingMembers(false);
                            }
                            :
                            handleUpdateSettings}
                        disabled={(!isEditingMembers && (!groupName.trim() || !avatar || membersList.length < 2 || saving)) || (isEditingMembers && tempMembers.length < 2)}
                        className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed justify-items-center"
                    >
                        { saving?
                            <Loading scale={0.2} color="#fff" message={creating? "Creating" : "Saving"} />:
                            <span>{isEditingMembers? "Save Members Changes" : (creating? "Create Chat" : `Save Changes`)}</span>
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
        </div>
    );
};

export default ChatSettings;