import { useState } from 'react';
import Modal from './Modal';
import {server} from "../../utils/address.ts";
import {popup} from "../../utils/popup.ts";
interface Member {
    id: string;
    username: string;
    email: string;
    avatar: string;
}
interface EditMembersProps {
    isOpen: boolean;
    onClose: () => void;
    onAddMembers: (members: Member[]) => void;
}

/**
 * @TODO
 * 1. Load users from setting page
 * 2. Remove button
 * 3. Scroll
 * 4. Prevent duplicated users
 */

const EditMembers = ({ isOpen, onClose, onAddMembers }: EditMembersProps) => {
    const [searchId, setSearchId] = useState('');
    const [tempMembers, setTempMembers] = useState<Member[]>([]);
    const handleSearchMember = async () => {
        if (searchId.trim() === '') return;
        let user: any = { id: searchId };
        try {
            const response = await fetch(`${server}/v2/user/get/${searchId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    requestFields: {},
                    responseFields: ["username", "avatar"],
                })
            });
            const result = await response.json();
            if (response.ok) {
                user.username = result.username;
                user.avatar = result.avatar;
                setTempMembers([...tempMembers, user]);
                setSearchId('');
            } else {
                popup(result.error);
            }
        } catch (error) {
            console.error(error);
            popup("Fail to search. Please Try Again Later.\n\nIf the Error Persists, Please Contact Support.");
        }
    };
    const handleSave = () => {
        onAddMembers(tempMembers);
        setTempMembers([]);
        onClose();
    };
    return (
        <Modal title="Edit Members" isOpen={isOpen} onClose={onClose}>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search by ID
                </label>
                <div className="flex space-x-2">
                    <input
                        type="number"
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                        className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 px-2 py-1"
                        placeholder="Enter member ID"
                    />
                    <button
                        onClick={handleSearchMember}
                        className="px-4 py-1 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                    >
                        Search
                    </button>
                </div>
            </div>
            <div className="mt-4">
                <h4 className="text-md font-medium mb-2">Temporary Members</h4>
                {tempMembers.length > 0 ? (
                    <ul className="space-y-2">
                        {tempMembers.map((member) => (
                            <li
                                key={member.id}
                                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                            >
                                <img
                                    src={member.avatar}
                                    alt={member.username}
                                    className="w-8 h-8 rounded-full"
                                />
                                <div>
                                    <p className="font-medium">{member.username}</p>
                                    <p className="text-sm text-gray-500">{member.email}</p>
                                </div>
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