import {
    newId,
    updateData,
    getDataById,
    newChat,
    newMessage,
    addData
} from "./data.js";
import {Target} from "./const.js";
import {clients} from "./index.js";


export async function sendSocketMessage(chat, author, message) {
    for (const [userId, connection] of clients.entries()) {
        if (userId !== author && chat.members.includes(userId)) {
            connection.send(JSON.stringify({ id: chat.id, message: message }));
        }
    }
}

async function addMember(uid, chatId) {
    const user = await getDataById(Target.user, uid);
    user.activeChats.push(chatId);
    await updateData(user);
}

async function removeMember(uid, chatId) {
    const user = await getDataById(Target.user, uid);
    user.activeChats = user.activeChats.filter(chat => chat !== chatId);
    await updateData(user);
}

export async function createChat(uid, groupName, avatar) {
    const updatePromises = [];
    const chatId = await newId(Target.chat);
    const chat = newChat(
        chatId,
        uid,
        [],
        new Date(),
        groupName,
        avatar,
    );
    await addData(chat);
    uid.map((id) => updatePromises.push(addMember(id, chatId)));
    await Promise.all(updatePromises);
    return chat;
}

export async function sendMessage(chatId, author, message) {
    let chat = await getDataById(Target.chat, chatId);
    if (chat.members.includes(author)) {
        const messageObj = newMessage(
            await newId(Target.message),
            author,
            new Date(),
            message);
        chat.messages.push(messageObj.id);
        await Promise.all([sendSocketMessage(chat, author, messageObj), addData(messageObj), updateData(chat)]);
        return messageObj;
    }
    throw new Error(`uid ${author} should not be in this chat`);
}

export async function updateChat(chatId, members, groupName, avatar) {
    let chat = await getDataById(Target.chat, chatId);
    await updateChatMember(chat.members, members, chatId);
    chat.members = members;
    chat.groupName = groupName;
    chat.avatar = avatar;
    await updateData(chat);
    return chat;
}

async function updateChatMember(original, updated, chatId) {
    let onlyOriginal = original.filter((e) => !updated.includes(e));
    let onlyUpdated = updated.filter((e) => !original.includes(e));
    const updatePromises = [];
    onlyOriginal.map((id) => updatePromises.push(removeMember(id, chatId)));
    onlyUpdated.map((id) => updatePromises.push(addMember(id, chatId)));
    await Promise.all(updatePromises);
}

export async function deleteChat(chatId) {
    let chat = await getDataById(Target.chat, chatId);
    const updatePromises = [];
    chat.members.map((id) => updatePromises.push(removeMember(id, chatId)));
    chat.groupName = "##Deleted Chat##"
    await Promise.all([Promise.all(updatePromises), updateData(chat)]);
    return {}
}