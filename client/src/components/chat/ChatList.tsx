import {Plus} from "../../asserts/icons.tsx";
import {Loading} from "../../asserts/loading.tsx";

interface ChatListProps {
    chats: any[];
    activeChat: any | null;
    onSelectChat: (chat: any) => void;
    newChat: () => void;
    isCreatingChat: boolean;
}

const ChatList = ({ chats, activeChat, onSelectChat, newChat, isCreatingChat}: ChatListProps) => {
    return (
        <div className="space-y-2 overflow-x-hidden">
            <button
                key="new"
                onClick={() => {
                    newChat();
                }}
                disabled={isCreatingChat}
                className={`w-full h-16 p-3 rounded-lg flex items-center space-x-3 hover:bg-gray-50 border disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500`}
            >
                {
                    isCreatingChat ?
                        <Loading message="Creating New Chat" scale={0.3} color="#444" />:
                        <div className="flex flex-row items-center space-x-2">
                            <Plus className="w-8 h-8 rounded-full object-cover" />
                            <p className="text-nowrap">New Chat</p>
                        </div>
                }
            </button>
            {chats.map((chat) => {
                return (
                    <button
                        key={chat.id}
                        onClick={() => onSelectChat(chat)}
                        className={`w-full p-3 rounded-lg flex items-center space-x-3 hover:bg-gray-50 ${
                            activeChat?.id === chat.id ? 'bg-gray-50' : ''
                        }`}
                    >
                        <img
                            src={chat.avatar}
                            alt={chat.groupName}
                            className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1 text-left">
                            <h3 className="font-medium">{chat.groupName}</h3>
                            {chat.lastMessage && (
                                <p className="text-sm text-gray-500 truncate overflow-hidden">
                                    { chat.lastMessage.body.length <= 20?
                                        chat.lastMessage.body:
                                        `${chat.lastMessage.body.slice(0, 20)}...`
                                    }
                                </p>
                            )}
                        </div>
                    </button>
                );
            })}
        </div>
    );
};

export default ChatList;