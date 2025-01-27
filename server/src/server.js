import express from "express";
import {
    SUCCESS,
    BAD,
    NOT_FOUND
} from "./utils/statusCode.js";

import {
    userSignup,
    userSignIn,
    userSignOut,
    userDetailUpdate,
    userDelete,
    follow,
    updatePassword,
    verifyPassword,
} from "./user.js";

import {
    articleUpdate,
    articleUpload,
    addComment,
    bookmark,
    like,
} from "./article.js";

import cors from "cors";
import {sendCode, verifyCode} from "./email.js";
import {getDataById, getPartialDataById, search, searchLegacy} from "./data.js";
import {Target} from "./const.js";
import bodyParser from "body-parser";
import {createChat, deleteChat, sendMessage, updateChat} from "./chat.js";

export const app = express();

app.use(bodyParser.json({ limit: "2mb" }));
app.use(bodyParser.urlencoded({ limit: "2mb", extended: true }));
app.use(express.json());
app.use(cors()); // use cors to allow cross-origin

app.post('/v2/:type/:action/:id', async (req, res) => {
    const type = req.params.type;
    const action = req.params.action;
    const id = parseInt(req.params.id);
    const { requestFields, responseFields } = req.body;
    let NotFound = false;
    try {
        const responseBody = await (async () => {
            switch (type) {
                case "article":
                    switch (action) {
                        case "get":
                            return await requestFields.length > 0? await getPartialDataById(Target.article, id, responseFields) : await getDataById(Target.article, id);
                        case "comment":
                            return await addComment(requestFields.id /* parent IDs */, requestFields.author, requestFields.content);
                        case "bookmark":
                            return await bookmark(id, requestFields.id);
                        case "upload":
                            return await articleUpload(
                                requestFields.session,
                                requestFields.cover,
                                requestFields.title,
                                requestFields.summary,
                                requestFields.content,
                                JSON.parse(requestFields.isSeries),
                                parseFloat(requestFields.price),
                                requestFields.tags,
                                parseInt(requestFields.indexId));
                        case "update":
                            return await articleUpdate(
                                requestFields.session,
                                requestFields.cover,
                                requestFields.title,
                                requestFields.summary,
                                requestFields.content,
                                JSON.parse(requestFields.long),
                                parseFloat(requestFields.price),
                                requestFields.tags,
                                id,
                                requestFields.next);
                        case "like":
                            return await like(id, requestFields.id);
                        default:
                            NotFound = true;
                            throw new Error(`Invalid action "${action}" for article`);
                    }
                case "user":
                    switch (action) {
                        case "get":
                            return requestFields.length > 0? await getPartialDataById(Target.user, id, responseFields) : await getDataById(Target.user, id);
                        case "update":
                            return await userDetailUpdate(
                                id,
                                requestFields.avatar,
                                requestFields.username,
                                requestFields.bio,
                                requestFields.email,
                                requestFields.preference);
                        case "delete":
                            return await userDelete(id);
                        case "follow":
                            return await follow(id, requestFields.id);
                        case "passwordVerify":
                            return await verifyPassword(id, requestFields.password);
                        case "passwordUpdate":
                            return await updatePassword(id, requestFields.password);
                        default:
                            NotFound = true;
                            throw new Error(`Invalid action "${action}" for user`);
                    }
                case "chat":
                    switch (action) {
                        case "get":
                            return requestFields.length > 0? await getPartialDataById(Target.chat, id, responseFields) : await getDataById(Target.chat, id);
                        case "new":
                            return await createChat(requestFields.members.map(Number), requestFields.groupName, requestFields.avatar);
                        case "update":
                            return await updateChat(id, requestFields.members.map(Number), requestFields.groupName, requestFields.avatar);
                        case "delete":
                            return await deleteChat(id);
                        case "messageGet":
                            return requestFields.length > 0? await getPartialDataById(Target.message, id, responseFields) : await getDataById(Target.message, id);
                        case "messageSend":
                            return await sendMessage(id, parseInt(requestFields.id), requestFields.body);
                        default:
                            NotFound = true;
                            throw new Error(`Invalid action "${action}" for chat`);
                    }
                case "auth":
                    switch (action) {
                        case "register":
                            return await userSignup(
                                requestFields.email,
                                requestFields.password,
                                requestFields.username);
                        case "login":
                            return await userSignIn(requestFields.email, requestFields.password);
                        case "logout":
                            return await userSignOut(
                                id,
                                parseInt(requestFields.session));
                        case "sendCode":
                            return await sendCode(requestFields.email);
                        case "verifyCode":
                            return await verifyCode(requestFields.email, requestFields.code);
                        default:
                            NotFound = true;
                            throw new Error(`Invalid action "${action}" for auth`);
                    }
                case "search":
                    switch (action) {
                        case "search":
                            return await searchLegacy(requestFields.searchTerm);
                        case "user":
                            return await search(Target.user, requestFields.value, requestFields.fields, responseFields);
                        case "article":
                            return await search(Target.article, requestFields.value, requestFields.fields, responseFields);
                        default:
                            NotFound = true;
                            throw new Error(`Invalid action "${action}" for search`);
                    }
                default:
                    NotFound = true;
                    throw new Error("Unknown API type");
            }
        })();
        res.status(SUCCESS).json(responseBody);
    } catch (error) {
        if (NotFound) {
            res.status(NOT_FOUND).json({ error: error.message });
        } else {
            res.status(BAD).json({error: error.message});
        }
    }
})