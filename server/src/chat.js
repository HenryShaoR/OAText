import {
    newId,
    updateData,
    getDataById,
    newChat,
    newMessage,
    addData
} from "./data.js";
import {Target} from "./const.js";

export async function updateParticipant(uid, chatId) {
    const user = await getDataById(Target.user, uid);
    user.activeChats.push(chatId);
    await updateData(user);
}

export async function createChat(uid, groupName) {
    let uidNum = [];
    const updatePromises = [];
    const chatId = await newId(Target.chat);
    uid.map((id) => uidNum.push(parseInt(id)));
    const chat = newChat(
        chatId,
        uidNum,
        [],
        new Date(),
        groupName,
        (await getDataById(Target.user, uidNum[0])).avatar,
    );
    await addData(chat);
    uidNum.map((id) => updatePromises.push(updateParticipant(id, chatId)));
    await Promise.all(updatePromises);
    return chat;
}

export async function sendMessage(chatId, author, message) {
    let chat = await getDataById(Target.chat, chatId);

    if (author in chat.members) {
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
