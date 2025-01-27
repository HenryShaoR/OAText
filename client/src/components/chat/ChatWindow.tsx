import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import {Info, Send, Settings} from '../../asserts/icons';
import {server} from "../../utils/address.ts";
import {popup} from "../../utils/popup.ts";
import {readCookies} from "../../utils/cookies.ts";
import {Loading} from "../../asserts/loading.tsx";
import ChatSettings from "./ChatSettings.tsx";
import { useWebSocket } from '../../WebSocketContext.tsx';

const Action = {
    Send: 0,
    Update: 1,
    Delete: 2,
}

const ChatWindow = ({ chat, refreshList }: { chat: any; refreshList: (updatedChat: any, action: number) => void; }) => {
    const cookies = readCookies();
    const uid = cookies.id;
    const [message, setMessage] = useState<string>('');
    const [sending, setSending] = useState<boolean>(false);
    const [showSettings, setShowSettings] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chat.messages]);

    const { lastMessage } = useWebSocket();
    useEffect(() => {
        if (lastMessage && chat.messages.map((message: any) => message.id).includes(lastMessage.message.id)) {
            return;  // duplicated message
        }
        if (lastMessage && lastMessage.id === chat.id) {
            lastMessage.message.sendTime = new Date(lastMessage.message.sendTime);
            chat.messages.push(lastMessage.message);
            chat.lastMessage = lastMessage.message;
            refreshList(chat, Action.Send);
            setTimeout(() => scrollToBottom(), 100);
        } else if (lastMessage) {
            refreshList(chat, -1);
        }
    }, [lastMessage]);

    const handleSend = async () => {
        if (message.trim()) {
            setSending(true);
            try {
                const response = await fetch(`${server}/v2/chat/messageSend/${chat.id}`, {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        requestFields: {
                            id: uid,
                            body: message,
                        },
                        responseFields: [],
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    const message: any = {
                        id: result.id,
                        body: result.body,
                        sender: result.sender,
                        sendTime: new Date(result.sendTime),
                    };
                    chat.messages.push(message);
                    chat.lastMessage = message;
                    refreshList(chat, Action.Send);
                    setTimeout(() => scrollToBottom(), 100);  // add time out to prevent scrolling from starting before the message bubble was created.
                    setMessage('');
                    document.getElementsByTagName('textarea')[0].style.height = "auto";
                } else {
                    popup(result.error);
                }
            } catch (error) {
                console.error(error);
                popup("Unable to Create a New Chat, Please Try Again Later.\n\nIf the Error Persists, Please Contact Support.");
            } finally {
                setSending(false);
            }
        }
    };

    const handleUpdateChat = async (updatedChat: any, setSaving: Dispatch<SetStateAction<boolean>>) => {
        setSaving(true);
        try {
            const response = await fetch(`${server}/v2/chat/update/${updatedChat.id}`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    requestFields: {
                        groupName: updatedChat.groupName,
                        avatar: updatedChat.avatar,
                        members: updatedChat.members.map((obj: { id: number }) => obj.id)
                    },
                    responseFields: [],
                })
            });
            const result = await response.json();
            if (response.ok) {
                chat = updatedChat;
                refreshList(chat, Action.Update);
            } else {
                popup(result.error);
            }
        } catch (error) {
            console.error(error);
            popup("Fail to update Chat, Please Try Again Later.\n\nIf the Error Persists, Please Contact Support.");
        } finally {
            setShowSettings(false);
            setSaving(false);
        }
    };

    const handleDeleteChat = async (updatedChat: any, setDeleting: Dispatch<SetStateAction<boolean>>) => {
        // Here you would typically delete the chat in your backend
        setDeleting(true);
        try {
            const response = await fetch(`${server}/v2/chat/delete/${updatedChat.id}`, {
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
                refreshList(chat, Action.Delete);
            } else {
                popup(result.error);
            }
        } catch (error) {
            console.error(error);
            popup("Fail to update Chat, Please Try Again Later.\n\nIf the Error Persists, Please Contact Support.");
        } finally {
            setShowSettings(false);
            setDeleting(false);
        }
    };

    return (
        <div className="h-full flex flex-col">
            {showSettings ?
                <ChatSettings
                    chat={chat}
                    onCancel={() => setShowSettings(false)}
                    onUpdate={handleUpdateChat}
                    onDelete={handleDeleteChat}
                />
                :
                <>
                    <div className="flex flex-row w-full border-b border-gray-200 bg-white py-4 px-8 h-16">
                        <div className="flex w-full items-center space-x-3">
                            <img
                                src={chat.members.length > 2 ? chat.avatar : (chat.members[0].id !== uid? chat.members[0].avatar : (chat.members[1] || {}).avatar)}
                                alt={chat.groupName}
                                className="w-10 h-10 rounded-full object-cover min-w-10"
                            />
                            <div>
                                <h2 className="font-medium">
                                    {chat.members.length > 2 ? chat.groupName : (chat.members[0].id !== uid? chat.members[0].username : (chat.members[1] || {}).username)}
                                </h2>
                                <p className="text-sm text-gray-500">
                                    {chat.members.length > 2 ? 'Group Chat' : chat.groupName}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-row items-center space-x-3">
                            <button>
                                <Info className="w-5 h-5 text-gray-600"/>
                            </button>
                            <button
                                onClick={() => setShowSettings(true)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <Settings className="w-5 h-5 text-gray-600"/>
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto space-y-4">
                        {chat.messages.map((msg: any) => {
                            const sender = {username: "Ex-Member", avatar:""};
                            for (const member of chat.members) {
                                if (member.id === msg.sender) {
                                    sender.username = member.username;
                                    sender.avatar = member.avatar
                                }
                            }
                            return (
                                <div
                                    key={msg.id}
                                    className={`flex ${ msg.sender === uid ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className="flex max-w-[80%] items-center space-x-2">
                                        {msg.sender !== uid &&
                                            <img
                                                src={sender.avatar}
                                                alt={sender.username}
                                                className="w-12 h-12 rounded-full object-cover min-w-12"
                                            />
                                        }
                                        <div className={`rounded-lg p-3 ${
                                            msg.sender === uid
                                                ? 'bg-gray-900 text-white'
                                                : 'bg-white border border-gray-200'
                                        }`}>
                                            {msg.sender !== uid && <p className="text-xs text-gray-600 border-b pb-0.5">{sender.username}</p>}
                                            <p className="proper-break-words whitespace-pre-wrap pt-0.5">{msg.body}</p>
                                            <span className={`flex text-xs text-gray-400 mt-1 ${msg.sender === uid ? 'justify-end' : 'justify-start'}`}>
                                                {msg.sendTime.toLocaleString()}
                                            </span>
                                        </div>
                                        {msg.sender === uid &&
                                            <img
                                                src={sender.avatar}
                                                alt={sender.username}
                                                className="w-12 h-12 rounded-full object-cover min-w-12"
                                            />
                                        }
                                    </div>
                                </div>
                            )
                        })}
                        <div ref={messagesEndRef}/>
                    </div>
                    <div className="border-t border-gray-200 bg-white p-4">
                        <div className="flex items-center space-x-4">
                            <textarea
                                value={message}
                                rows={1}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 rounded-lg border-gray-300 focus:ring-gray-500 focus:border-gray-500 p-2 min-h-fit resize-none max-h-[50%]"
                                onInput={(e) => {
                                    const field = e.target as HTMLInputElement;
                                    field.style.height = "auto";
                                    field.style.height = `${Math.min(field.scrollHeight, window.innerHeight * 0.5)}px`;
                                }}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!message.trim() || sending}
                                className="p-2 w-10 h-10 justify-items-center rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-75 disabled:cursor-not-allowed"
                            >
                                { sending ?
                                    <Loading scale={0.25} color="#fff" message=""/> :
                                    <Send className="w-5 h-5"/>
                                }
                            </button>
                        </div>
                    </div>
                </>
            }
        </div>
    );
};

export default ChatWindow;