import {
    updateData,
    getData,
    newId,
    newUser,
    getUserBy,
    addData
} from "./data.js";

import {
    getSessionIndex,
    removeSession,
    appendSession
} from "./data.js";

import {
    isValidEmail,
    isValidName,
    isValidPassword, isValidUserId,
    isValidUsername
} from "./utils/validations.js";

import {Status, Target} from "./const.js";

/**
 * Register a user with an email, password, and names,
 * then returns their authUserId value.
 *
 * @param {string} email - The new user's Email
 * @param {string} password - The new user's password
 * @param {string} username - The new user's username
 * @returns {number} Return a unique ID for the new user
 * if the registration is successful
 */
export async function userSignup(email, password, username) {

    if (!isValidEmail(email)) {
        throw new Error('Invalid email format.');
    }

    if (!isValidPassword(password)) {
        throw new Error('Password too weak, you must have at least 6 characters with at least 1 number or 1 letter.');
    }

    if (!isValidUsername(username)) {
        throw new Error("The username is invalid, username must be at least 3 characters long with only letters, numbers and hyphen.");
    }

    const usrPromise = getUserBy('username', username), emailPromise = getUserBy('email', email), idPromise = newId(Target.user);
    const [usernameExists, emailExists, id] = await Promise.all([usrPromise, emailPromise, idPromise]);

    if (usernameExists) {
        throw new Error("The username already been used.");
    }

    if (emailExists) {
        throw new Error('This email has already being used.');
    }

    await addData(newUser(
        id,
        Status.public,
        [],
        [],
        {},  // to be added in future
        0,
        [],
        [],
        username,
        'firstname', // missing firstname
        'lastname', // missing lastname
        email,
        password,
        0,
        new Date(),
        [],
        [],  // missing session id
        0,
        0,
        0,
        [],
        [],
        [],
        [],
        []
    ));
    return id;
}

/**
 * Given a registered user's email and password
 * returns their authUserId value.
 *
 * @param {string} email - The registered user's Email
 * @param {string} password - The registered user's password
 * @returns - Return the registered user's ID
 */
export async function userSignIn(email, password) {
    if (!email) {
        throw new Error('Empty email.');
    }
    else if (!password) {
        throw new Error('Empty password.');
    }
    const user = await getUserBy('email', email);

    if (!user) {
        throw new Error('The email and password combination does not exist.');
    }
    if (user.password !== password){
        throw new Error('The email and password combination does not exist.');
    }

    return { sessionId: appendSession(user), id: user.id };
}

/**
 * Register a user with an email, password, and names,
 * then returns their authUserId value.
 *
 * @param {number} userId
 * @param {number} sessionId - The unique ID for the current session
 * @returns Return a unique ID for the new user
 * if the registration is successful
 */
export async function userSignOut(userId, sessionId) {
    if (!await isValidUserId(userId)) {
        throw new Error("This user is not signed in.");
    }

    const user = await getData(Target.user, userId);

    const sessionIndex = getSessionIndex(user, sessionId);

    if (sessionIndex === -1) {
        throw new Error("This session has already been signed out.");
    }

    removeSession(user, sessionIndex);
    return {};
}

export async function userDetail(id) {
    const user = await getData(Target.user, id);
    if (user == null) {
        throw new Error("The user doesn't exist.");
    }
    return user;
}

export async function userDetailUpdate(userId, username, nameFirst, nameLast) {
    if (!isValidName(nameFirst)) {
        throw new Error('Invalid first name, you must enter at lease 3 characters.');
    }
    if (!isValidName(nameLast)) {
        throw new Error('Invalid last name, you must enter at lease 3 characters');
    }

    if (userId >= await newId(Target.user)) {
        throw new Error("The user doesn't exist.");
    }

    const user = await getData(Target.user, userId);

    user.username = username;
    user.nameFirst = nameFirst;
    user.nameLast = nameLast;

    await updateData(user);
    return {};
}

export async function userEmailUpdate(userId, newEmail) {
    if (!isValidEmail(newEmail)) {
        throw new Error('Invalid email format.');
    }

    if (!await isValidUserId(userId)) {
        throw new Error("The user doesn't exist.");
    }

    if (await getUserBy('email', newEmail)) {
        throw new Error('This email has already being used.');
    }

    let user = await getData(Target.user, userId);
    user.email = newEmail;
    await updateData(user);
    return {};
}

export async function userPasswordUpdate(userId, oldPassword, newPassword) {
    if (!isValidPassword(newPassword)) {
        throw new Error('Password too weak, you must have at least 6 characters with at least 1 number or 1 letter.');
    }

    let user = await getData(Target.user, userId);

    if (user.password !== oldPassword) {
        throw new Error("The password doesn't match the existing password.");
    }

    if (user.password === newPassword) {
        throw new Error("New password cannot match the old password.");
    }

    if (!await isValidUserId(userId)) {
        throw new Error("The user doesn't exist.");
    }

    user.password = newPassword;
    await updateData(user);
    return {};
}

export async function userDelete(userId, password) {
    let user = await getData(Target.user, userId);

    if (user.password !== password) {
        throw new Error("The password doesn't match the existing password.");
    }

    if (!await isValidUserId(userId)) {
        throw new Error("The user doesn't exist.");
    }

    user.status = Status.deletedByUser; // change in future to allow more deletion reasons.

    await updateData(user);
    return {};
}
