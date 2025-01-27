import {
    updateData,
    newId,
    addComments,
    getDataById,
    newArticle,
    addData
} from "./data.js";

import {
    isValidArticle,
    isValidArticleName,
    isValidContent,
    isValidSession,
    isValidSummary
} from "./utils/validations.js";

import {Target} from "./const.js";
import {solve} from "./utils/asyncUtils.js";


function validate(session, name, summary, content) {
    if (!isValidSession(session)) {
        throw new Error('Invalid user session.');
    }

    if (!isValidArticleName(name)) {
        throw new Error('Invalid article name.');
    }

    if (!isValidSummary(summary)) {
        throw new Error("Invalid article summary.");
    }

    if (!isValidContent(content)) {
        throw new Error("Invalid article content.");
    }
    return true;
}

function calculateReadTime(content) {  // STUB!!
    return Math.ceil(content.length / 100)/10;
}

async function getAuthorId(session) {  // to be replaced in future
    return parseInt(session);  // STUB!
}

/**
 * Add new article from user to database
 *
 * @param {Session} session - User's session used to add new article
 * @param {string} cover - Cover image URL
 * @param {string} title - The new article's name
 * @param {string} summary - The new article's summary
 * @param {string} content - The new article's text content
 * @param {boolean} isSeries - If this article is the index of a series
 * @param {number} price
 * @param {string[]} tags
 * @param {number} indexId - the id of the series index
 * @returns return empty object if upload success
 */
export async function articleUpload(session, cover, title, summary, content, isSeries, price, tags, indexId) {
    validate(session, title, summary, content);
    const [articleId, authorId] = await solve(newId(Target.article), getAuthorId(session));
    const authorPromise = getDataById(Target.user, authorId);
    const date = new Date();
    const readTime = calculateReadTime(content);
    let seriesIndex = [];
    let index = {id: isSeries? articleId : indexId, title: isSeries? title : ""};
    if (indexId >= 0) {
        index = await getDataById(Target.article, indexId);
        seriesIndex = JSON.parse(index.content);
        if (seriesIndex.length > 0) {
            index.lastEdit = date;
            const previous = await getDataById(Target.article, seriesIndex[seriesIndex.length - 1].id);
            previous.next = {id: articleId, title: title};
            seriesIndex.push({id: articleId, title: title});
            index.content = JSON.stringify(seriesIndex);
            index.readTime = Math.round((index.readTime + readTime)*10)/10;
            await solve(updateData(index), updateData(previous), updateData({...index, content: JSON.stringify(seriesIndex)}));
        } else {
            index.next = {id: articleId, title: title};
            seriesIndex.push({id: articleId, title: title});
            index.content = JSON.stringify(seriesIndex);
            index.readTime = Math.round((index.readTime + readTime)*10)/10;
            await solve(updateData(index), updateData({...index, content: JSON.stringify(seriesIndex)}));
        }
    }

    await addData(newArticle(
        articleId,
        authorId,
        cover,
        title,
        summary,
        content,
        isSeries,
        date,
        date,
        [],
        [],
        readTime,
        [],
        seriesIndex.length > 1 ? seriesIndex[seriesIndex.length - 2] : (indexId < 0 ? {id: -1, title: ""} : {id: indexId, title: index.title}),
        {id: -1, title: ""},
        indexId > 0 || isSeries? index : -1,
        price,
        tags,
    ));
    if (indexId === -1) {
        // only add series and single posts into publications; chapters within a series is only shown in series index
        const author = await authorPromise;
        author.publications.push(articleId);
        await updateData(author);
    }
    return {id: articleId};
}

/**
 * Add new article from user to database
 *
 * @param {Session} session - User's session used to add new article
 * @param {string} cover - Cover image URL
 * @param {string} title - The new article's name
 * @param {string} summary - The new article's summary
 * @param {string} content - The new article's text content
 * @param {boolean} isSeries
 * @param {number} price
 * @param {string[]} tags
 * @param {number} targetArticleId
 * @param {{id: number, title: string,}} nextArticle - the id of the next article
 */
export async function articleUpdate(session, cover, title, summary, content, isSeries, price, tags, targetArticleId, nextArticle) {
    validate(session, title, summary, content);

    const [validNextArticle, article] = await solve(isValidArticle(nextArticle), getDataById(Target.article, targetArticleId));

    if ((!validNextArticle && nextArticle >= 0) || article === null) {
        throw new Error("Invalid article Id.");
    }

    await updateData(newArticle(
        targetArticleId,
        article.author,
        cover,
        title,
        summary,
        content,
        isSeries,
        article.publishTime,
        new Date(),
        article.likes,
        article.dislikes,
        calculateReadTime(content),
        article.comments,
        article.previous,
        nextArticle,
        article.indexId,
        price,
        tags
    ));
    return {};
}

/**
 *
 * @param {number[]} articleId the parent ids
 * @param {number} userId
 * @param {string} commentContent
 * @returns {Object} the comment
 */
export async function addComment(articleId, userId, commentContent) {
    return await addComments(articleId, userId, commentContent);
}

export async function bookmark(articleId, userId) {
    const [article, user] = await solve(getDataById(Target.article, articleId), getDataById(Target.user, userId));
    if (!article) {
        throw new Error('Invalid article ID.');
    }
    if (!user) {
        throw new Error('Invalid user ID.');
    }

    const index = user.library.indexOf(articleId);
    if (index > -1) {
        user.library.splice(index, 1);
    } else {
        user.library.push(articleId);
    }
    await updateData(user);
    return {};
}

export async function like(articleId, likerId) {
    const article = await getDataById(Target.article, articleId);
    if (article.likes.indexOf(likerId) === -1) {
        article.likes.push(likerId);
    } else {
        article.likes.splice(article.likes.indexOf(likerId), 1);
    }
    await updateData(article);
    return {};
}