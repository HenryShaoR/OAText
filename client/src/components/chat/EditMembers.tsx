import { useState } from 'react';
import Modal from './Modal';
import {server} from "../../utils/address.ts";
import {popup} from "../../utils/popup.ts";
import {Search, X} from "../../asserts/icons.tsx";
import {Loading} from "../../asserts/loading.tsx";
interface Member {
    id: number;
    username: string;
    email: string;
    avatar: string;
}
interface EditMembersProps {
    initialMembers: any[];
    onClose: () => void;
    onEditMember: (members: Member[]) => void;
}

const EditMembers = ({ initialMembers, onClose, onEditMember }: EditMembersProps) => {
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [searching, setSearching] = useState<boolean>(false);

    const [tempMembers, setTempMembers] = useState<Member[]>(initialMembers.map((member): Member => {return {
        id: member.id,
        username: member.username,
        email: member.email,
        avatar: member.avatar,
    };}));

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

            if (tempMembers.map((member) => member.id).includes(result.id)) return popup("The user is already in the list");

            if (response.ok) {
                console.log(result);
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
        const newList = tempMembers.filter((member) => member.id !== id);
        setTempMembers(newList);
    }

    const handleSave = () => {
        onEditMember(tempMembers);
        setTempMembers([]);
        onClose();
    };
    return (
        <Modal title="Edit Members" onClose={onClose}>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search by Username/Email/ID
                </label>
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 px-2 py-1"
                        placeholder="Username/Email/ID"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleSearchMember().then();
                            }
                        }}
                    />
                    <button
                        onClick={handleSearchMember}
                        disabled={searching}
                        className="px-4 py-1 bg-gray-900 text-white rounded-lg hover:bg-gray-800 w-fit disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        { searching?
                            <Loading message="" scale={0.2} color="#fff"/>:
                            <Search className="w-5 h-5"/>
                        }
                    </button>
                </div>
            </div>
            <div className="mt-4 max-h-64 overflow-y-auto space-y-4">
                {tempMembers.length > 0 ? (
                    <ul className="space-y-2">
                        {tempMembers.map((member) => (
                            <li
                                key={member.id}
                                className="flex p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                            >
                                <div className="flex items-center space-x-3 w-full">
                                    <img
                                        src={member.avatar}
                                        alt={member.username}
                                        className="w-8 h-8 rounded-full"
                                    />
                                    <div>
                                        <p className="font-medium">{member.username}</p>
                                        <p className="text-sm text-gray-500">{member.email}</p>
                                    </div>
                                </div>
                                <button
                                    className="m-3 hover:bg-gray-200 rounded-full"
                                    onClick={() => handleRemoveMember(member.id)}
                                >
                                    <X className="text-red-500 w-6 h-6 m-1"/>
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-500">No members added yet</p>
                )}
            </div>
            <div className="flex justify-end mt-4 space-x-4">
                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                >
                    Save
                </button>
            </div>
        </Modal>
    );
};
export default EditMembers;