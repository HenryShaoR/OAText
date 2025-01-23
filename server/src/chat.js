import {
    newId,
    updateData,
    getDataById,
    newChat,
    newMessage,
    addData
} from "./data.js";
import {Target} from "./const.js";

export async function addMember(uid, chatId) {
    const user = await getDataById(Target.user, uid);
    user.activeChats.push(chatId);
    await updateData(user);
}

export async function removeMember(uid, chatId) {
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
    console.log(chat.members);
    if (chat.members.includes(author)) {
        const messageObj = newMessage(
            await newId(Target.message),
            author,
            new Date(),
            message);
        await addData(messageObj);
        chat.messages.push(messageObj.id);
        await updateData(chat);
        return messageObj;
    }
    throw new Error(`uid ${author} should not be in this chat`);
}

export async function updateChat(chatId, userId, members, groupName, avatar) {
    let chat = await getDataById(Target.chat, chatId);
    await updateChatMember(chat.members, members, chatId);
    if (!chat.members.includes(userId)) {
        chat.members = members;
        chat.groupName = groupName;
        chat.avatar = avatar;
        await updateData(chat);
        return chat;
    }
    throw new Error(`Invite failed as user is not part of group`);
}

export async function updateChatMember(original, updated, chatId) {
    console.log(original)
    console.log(updated)
    let onlyOriginal = original.filter((e) => !updated.includes(e));
    let onlyUpdated = updated.filter((e) => !original.includes(e));
    const updatePromises = [];
    onlyOriginal.map((id) => updatePromises.push(removeMember(id, chatId)));
    onlyUpdated.map((id) => updatePromises.push(addMember(id, chatId)));
    await Promise.all(updatePromises);
}