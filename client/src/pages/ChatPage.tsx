import {Dispatch, SetStateAction, useEffect, useState} from 'react';
import {Search, User, Users} from '../asserts/icons';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';
import {readCookies} from "../utils/cookies.ts";
import {useNavigate} from "react-router-dom";
import {server} from "../utils/address.ts";
import {popup} from "../utils/popup.ts";
import {Loading} from "../asserts/loading.tsx";
import NewChat from "../components/chat/NewChat.tsx";

/**
 * @TODO
 * 1. Order all chats in the order of (lastMessage.sendTime || chat.createTime)     OK
 * 2. Invite other user(s) to join the chat                                         OK
 * 3. Sync the last message on the ChatList when a user sent a new message          OK
 * 4. Monitoring new messages from other users                                      Matthew
 * 5. Delete chat function                                                          OK
 */

const ChatPage = () => {
    document.title = 'Chat';
    const cookies = readCookies();
    const id = cookies.id;
    const navigate = useNavigate();

    const [activeChat, setActiveChat] = useState<any | null>(null);
    const [chatType, setChatType] = useState<'private' | 'group'>('private');
    const [chats, setChats] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<any>();
    const [loading, setLoading] = useState<boolean>(true);
    const [loadingChat, setLoadingChat] = useState<boolean>(false);
    const [isCreatingChat, setIsCreatingChat] = useState<boolean>(false);

    async function getMessages(id: number) {
        try {
            const response = await fetch(`${server}/v2/chat/messageGet/${id}`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    requestFields: {},
                    responseFields: [],
                })
            });

            const result = await response.json();

            if (response.ok) {
                return {
                    id: result.id,
                    sender: result.sender,
                    sendTime: new Date(result.sendTime),
                    body: result.body,
                };
            } else {
                popup(result.error);
            }
        } catch (error) {
            console.error(error);
            popup("Unable to Fetch Chat Details, Please Try Again Later.\n\nIf the Error Persists, Please Contact Support.");
        }
    }

    async function getMember(id: number) {
        try {
            const response = await fetch(`${server}/v2/user/get/${id}`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    requestFields: {},
                    responseFields: ["avatar", "username", "id", "email"],
                })
            });

            const result = await response.json();

            if (response.ok) {
                return {
                    id: result.id,
                    avatar: result.avatar,
                    username: result.username,
                    email: result.email,
                };
            } else {
                popup(result.error);
            }
        } catch (error) {
            console.error(error);
            popup("Unable to Fetch Chat Details, Please Try Again Later.\n\nIf the Error Persists, Please Contact Support.");
        }
    }

    async function onSelect(chat: any) {
        setIsCreatingChat(false);
        setLoadingChat(true);
        setActiveChat(null);
        const messagesPromise = [];
        for (let message of chat.messages) {
            messagesPromise.push(message.id === undefined ?
                getMessages(message) :
                (async () => {return message;})());  // The message object has already being fetched
        }

        const membersPromise = [];
        for (let member of chat.members) {
            membersPromise.push(member.id === undefined ?
                getMember(member) :
                (async () => {return member;})());  // The message object has already being fetched
        }
        [chat.messages, chat.members] = await Promise.all([Promise.all(messagesPromise), Promise.all(membersPromise)]);
        setActiveChat(chat);
        setLoadingChat(false);
    }

    async function onCreate(newChat: any, setCreating: Dispatch<SetStateAction<boolean>>) {
        setCreating(true);
        try {
            const response = await fetch(`${server}/v2/chat/new/-1`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    requestFields: {
                        groupName: newChat.groupName,
                        members: newChat.members,
                        avatar: newChat.avatar,
                    },
                    responseFields: [],
                })
            });

            const result = await response.json();

            if (response.ok) {
                const chat = {
                    id: result.id,
                    messages: result.messages,
                    members: newChat.members,  // save time as no need fetch members' details again
                    groupName: result.groupName,
                    avatar: result.avatar,
                    lastMessage: null,
                };
                console.log(chat)
                setChats(chats.concat(chat));
                setChatType(chat.members.length > 2? "group" : "private");
                await onSelect(chat);
                setIsCreatingChat(false);
            } else {
                popup(result.error);
            }
        } catch (error) {
            console.error(error);
            popup("Unable to Create a New Chat, Please Try Again Later.\n\nIf the Error Persists, Please Contact Support.");
        } finally {
            setCreating(false);
        }
    }

    async function getChat(chatId: number) {
        try {
            const response = await fetch(`${server}/v2/chat/get/${chatId}`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    requestFields: {},
                    responseFields: [],
                })
            });

            const result = await response.json();

            if (response.ok) {
                return {
                    id: result.id,
                    messages: result.messages,
                    members: result.members,
                    groupName: result.groupName,
                    avatar: result.avatar,
                    createTime: new Date(result.createTime),

                    lastMessage: result.messages.length > 0 ? await getMessages(result.messages[result.messages.length - 1]) : null,
                };
            } else {
                popup(result.error);
            }
        } catch (error) {
            console.error(error);
            popup("Unable to Fetch Chat List, Please Try Again Later.\n\nIf the Error Persists, Please Contact Support.");
        }
    }

    function refreshList(updatedChat: any, action: number) {
        const Action = {
            "Send": 0,
            "Update": 1,
            "Delete": 2,
        }

        let updatedChats;
        if (action === Action.Send) {
            updatedChats = [updatedChat];
            updatedChats = updatedChats.concat(chats.filter(chat => chat.id !== updatedChat.id));
        } else if (action === Action.Update) {
            updatedChats = chats.map(chat =>
                chat.id === updatedChat.id ? updatedChat : chat
            );
        } else {
            updatedChats = chats.filter(chat => chat.id !== updatedChat.id);
            updatedChat = null;
        }
        setChats(updatedChats);
        setActiveChat(updatedChat);
    }

    useEffect(() => {

        const getUser = async () => {
            try {
                const response = await fetch(`${server}/v2/user/get/${id}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        requestFields: {},
                        responseFields: ["activeChats", "id", "avatar", "username", "email"],
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    return {
                        activeChats: result.activeChats,
                        id: result.id,
                        avatar: result.avatar,
                        username: result.username,
                        email: result.email,
                    };
                }
                popup(result.error);
            } catch (error) {
                console.error(error);
                navigate("/login");
                popup("Unable to Fetch Your Details, Please Try Again Later.\n\nIf the Error Persists, Please Contact Support.");
            }
            return {};
        }

        const init = async () => {
            try {
                const user = await getUser();
                setCurrentUser(user);
                let chatsPromise: any[] = [];
                for (let chat of user.activeChats) {
                    chatsPromise.push(getChat(chat));
                }
                setChats(
                    (await Promise.all(chatsPromise)).sort(
                        (b, a) =>
                            (a.lastMessage || {sendTime: a.createTime}).sendTime
                            -
                            (b.lastMessage || {sendTime: b.createTime}).sendTime
                    )
                );
            } catch (ignore) {}  // already handled
        }

        init().then(() => { setLoading(false); });
    }, []);

    if (loading) {
        return (
            <div className="flex w-full h-full justify-center items-center">
                <Loading vertical={true} />
            </div>
        );
    }

    return (
        <div className="flex h-screen -m-8 ">
            <div className="w-80 max-h-full border-r border-gray-200 bg-white overflow-y-auto space-y-4">
                <div className="p-4">
                    <div className="flex space-x-2 mb-4">
                        <button
                            onClick={() => setChatType('private')}
                            className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center space-x-2 ${
                                chatType === 'private'
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            <User className="w-4 h-4"/>
                            <span>Private</span>
                        </button>

                        <button
                            onClick={() => setChatType('group')}
                            className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center space-x-2 ${
                                chatType === 'group'
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            <Users className="w-4 h-4"/>
                            <span>Groups</span>
                        </button>
                    </div>

                    <div className="relative mb-4">
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-gray-500 focus:border-gray-500"
                        />
                        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5"/>
                    </div>

                    <ChatList
                        chats={chats.filter((chat) => (chat.members.length > 2) === (chatType === 'group'))}
                        activeChat={activeChat}
                        onSelectChat={onSelect}
                        newChat={() => setIsCreatingChat(true)}
                        isCreatingChat={isCreatingChat}
                    />
                </div>
            </div>

            <div className="flex-1 bg-gray-50">
                { isCreatingChat ?
                    <NewChat onCreate={onCreate} onCancel={async () => setIsCreatingChat(false)} currentUser={currentUser} />
                    :
                    activeChat ?
                        <ChatWindow
                            chat={activeChat}
                            refreshList={refreshList}
                        />
                        :
                        loadingChat ?
                            <div className="flex w-full h-full justify-center items-center">
                                <Loading vertical={true}/>
                            </div>
                            :
                            <div className="h-full flex items-center justify-center text-gray-500">
                                Select a conversation to start chatting
                            </div>
                }
            </div>
        </div>
    );
};

export default ChatPage;