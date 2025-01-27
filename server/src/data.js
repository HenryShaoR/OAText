import {Target} from './const.js';
import {DBConnection} from "./utils/db.js";
import {exit} from "process";
import {solve} from "./utils/asyncUtils.js";


console.warn("DB Connection in Progress...");
console.time("DB Connection")
const db = new DBConnection();
await db.connect();
console.log("DB Connected");
console.timeEnd("DB Connection");

process.on("SIGINT", async () => {
    await db.disconnect();
    console.log("DB Disconnected");
    exit(-1073741510);  // 0xC000013A: interrupted by Ctrl+C
});

/**
 * @param {number} id
 * @param {string} username
 * @param {string} email
 * @param {string} password
 * @param {number[]} library
 * @param {string} avatar
 * @param {number[]} publications
 * @param {number[]} followers
 * @param {number[]} following
 * @param {any} emailPreference
 * @param {string} bio
 * @param {number} likes
 * @param {number} balance
 * @param {number[]} activeChats
 * @param {number[]} activeSessions
 */
export function newUser(id, username, email, password, library, avatar, publications, followers, following,
                        emailPreference, bio, likes, balance, activeChats, activeSessions) {
    return {
        _type: 'user',
        id: id,
        username: username,
        email: email,
        password: password,
        library: library,
        avatar: avatar,
        publications: publications,
        followers: followers,
        following: following,
        emailPreference: emailPreference,
        bio: bio,
        likes: likes,
        balance: balance,
        activeChats: activeChats,
        activeSessions: activeSessions
    };
}

/**
 * @param {number[]} id
 * @param {number} author
 * @param {string} body
 * @param {Comment[]} replies
 * @param {number} likes
 * @param {number} dislikes
 * @param {Date} commentTime
 */
export async function newComment(id, author, body, replies, likes, dislikes, commentTime) {
    const [user, article] = await solve([getDataById(Target.user, author), getDataById(Target.article, id[0])]);
    return {
        _type: 'comment',
        id: id,
        author: author,
        isArticleAuthor: user.id === article.author,
        isRootAuthor: id.length < 3 ? true : user.id === article.comments[id[1]].author,
        body: body,
        likes: likes,
        dislikes: dislikes,
        commentTime: commentTime,
    };
}

/**
 * Creates a new chapter.
 *
 * @param {number} id
 * @param {number} author
 * @param {string} cover
 * @param {string} title
 * @param {string} summary
 * @param {string} content
 * @param {boolean} isSeries
 * @param {Date} publishTime
 * @param {Date} lastEdit
 * @param {number[]} likes
 * @param {number[]} dislikes
 * @param {number} readTime
 * @param {Comment[]} comments
 * @param {{id: number, title: string,}} previous
 * @param {{id: number, title: string,}} next
 * @param {{id: number, title: string,}} index
 * @param {number} price
 * @param {string[]} tags
 */
export function newArticle(id, author, cover, title, summary, content, isSeries, publishTime, lastEdit, likes, dislikes,
                           readTime, comments, previous, next, index, price, tags) {
    return {
        _type: 'article',
        id: id,
        author: author,
        cover: cover,
        title: title,
        summary: summary,
        content: content,
        isSeries: isSeries,
        publishTime: publishTime,
        lastEdit: lastEdit,
        likes: likes,
        dislikes: dislikes,
        readTime: readTime,
        comments: comments,
        previous: previous,
        next: next,
        index: index,
        price: price,
        tags: tags,
    };
}

/**
 * @param {number} id
 * @param {number} sender
 * @param {Date} sendTime
 * @param {string} body
 */
export function newMessage(id, sender, sendTime, body) {
    return {
        _type: 'message',
        id: id,
        sender: sender,
        sendTime: sendTime,
        body: body,
    };
}

/**
 *
 * @param {number} id
 * @param {number[]} members
 * @param {Message[]} messages
 * @param {Date} createTime
 * @param {string} groupName
 * @param {string} avatar
 */
export function newChat(id, members, messages, createTime, groupName, avatar) {
    return {
        _type: 'chat',
        id: id,
        members: members,
        messages: messages,
        createTime: createTime,
        groupName: groupName,
        avatar: avatar,
    };
}


/**
 *
 * @param {string} target what data is getting (users/articles/chats)
 * @param {number} id the value of id
 * @return {Object}
 */
export async function getDataById(target, id) {
    return await db.get(target, {id: id});
}

export async function getData(target, query) {
    return await db.get(target, query);
}

/**
 *
 * @param {string} target what data is getting (users/articles/chats)
 * @param {number} id the value of id
 * @param {string[]} elements the elements required
 */
export async function getPartialDataById(target, id, elements) {
    let obj = {};
    const variable = await db.get(target, {id: id});
    elements.forEach(param => obj[param] = variable[param]);
    return obj;
}

export async function getPartialData(target, query, elements) {
    let obj = {};
    const variable = await db.get(target, query);
    elements.forEach(param => obj[param] = variable[param]);
    return obj;
}

/**
 *
 * @param {Object} newValue the new value
 */
export async function updateData(newValue) {
    await db.put(Target[newValue._type], {id: newValue.id}, newValue);
}

export async function newId(target) {
    return await db.count(target);
}

export async function addData(newValue) {
    return await db.post(Target[newValue._type], newValue);
}

async function newCommentId(parentIds) {
    let comment = await getDataById(Target.article, parentIds[0]).comments;
    for (let i = 1; i < parentIds.length; i++) {
        comment = comment[parentIds[i]].replies;
    }
    return comment.length;
}

export async function addComments(parentIds, userId, content) {
    let [commentId, parent] = await solve([newCommentId(parentIds), getDataById(Target.articles, parentIds[0])]);
    const comment = await newComment(
        parentIds.concat(commentId),
        userId,
        content,
        [],
        0,
        0,
        new Date(),
    );  // create the comment object

    const newValue = parent;
    if (parentIds.length === 1) {  // if the article is the only parent
        parent.comments.push(comment);  // push this comment to the article's comment list
        await db.put(Target.article, {id: parentIds[0]}, newValue);
        return comment;
    }

    parent = parent.comments;  // if this comment is a reply
    for (let i=1; i<parentIds.length; i++) {
        parent = parent[parentIds[i]].replies;  // find the parent of this reply
    }
    parent.push(comment);  // add this reply to the parent
    await db.put(Target.article, {id: parentIds[0]}, newValue);
    return comment;
}

export async function getUserBy(type, value) {
    let query = {};
    query[type] = value;
    return await db.get(Target.user, query);
}

export function getSessionIndex(user, sessionId) {
    return user.activeSessions.indexOf(sessionId);
}

export function appendSession(user) {
    const sessionId = user.activeSessions.length > 0?
        user.activeSessions[user.activeSessions.length-1]+1 : 0;
    user.activeSessions.push(sessionId);
    return sessionId;
}

export async function removeSession(user, sessionIndex) {
    user.activeSessions.splice(sessionIndex, 1);
    await updateData(user);
}

export async function searchLegacy(searchTerm) {
    return await db.search(searchTerm).filter((e) => e.content.includes(searchTerm) | e.title.includes(searchTerm)).map(e => ({
        id: e.id,
        author: e.author,
        title: e.title,
        content: e.content,
        publishTime: e.publishTime}));
}

export async function search(type, value, targetFields, elements) {
    const obj = {};
    const searchPromises = targetFields.map(async (field) => {
        const query = {};
        if (field === "id") {
            if (isNaN(query[field] = parseInt(value))) {
                return null;
            }
        } else {
            query[field] = value;
        }
        const searchResult = await getData(type, query);
        if (searchResult) {
            elements.forEach(param => obj[param] = searchResult[param]);
            return obj;
        }
    });
    for (const result of await Promise.all(searchPromises)) {
        if (result) {
            return result;
        }
    }
    throw new Error(`No ${type} Matches the Search Inputs`)
}

export async function removeRecord(type, query) {
    return await db.remove(type, query);
}
