import {Link, useNavigate, useParams} from 'react-router-dom';
import {Bookmark, Left, Like, List, MessageCircle, Right, Share2} from '../asserts/icons';
import {client, server} from "../utils/address.ts";
import {useEffect, useState} from "react";
import {popup} from "../utils/popup.ts";
import {bookmark, like} from "../hooks/Interaction.ts";
import {readCookies} from "../utils/cookies.ts";
import {Loading} from "../asserts/loading.tsx";

const ReadingPage = () => {
    const {id} = useParams();
    const cookies = readCookies();
    const navigate = useNavigate();
    const userId = cookies.id;
    const [loadingUser, setLoadingUser] = useState<boolean>(true);
    const [loadingArticle, setLoadingArticle] = useState<boolean>(true);
    const [post, setPost] = useState<any>({
        id,
        title: '',
        content: '',
        cover: '',
        author: {
            name: '',
            avatar: '',
            bio: ''
        },
        publishTime: new Date(),
        lastEdit: new Date(),
        readTime: 0,
        likes: 0,
        previous: {id: -1, title: ""},
        next: {id: -1, title: ""},
        index: {id: -1, title: ""},
    });
    const [bookmarked, setBookmarked] = useState<boolean>(false);
    const [liked, setLiked] = useState<boolean>(false);

    useEffect(() => {
        const getInitialState = async (): Promise<boolean> => {
            try {
                const response = await fetch(`${server}/v2/user/get/${userId}`, {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        requestFields: {},
                        responseFields: ["library"],
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    setLoadingUser(false);
                    return result.library.indexOf(parseInt(`${id}`)) > -1;
                }
                navigate("/login");
                popup(result.error);
            } catch (error) {
                console.error('Login error:', error);
                navigate("/login");
                popup("Unable to Fetch Your Details, Please Try Again Later.\n\nIf the Error Persists, Please Contact Support.");
            }
            return false;
        }

        const getAuthor = async (uid: number) => {
            try {
                const response = await fetch(`${server}/v2/user/get/${uid}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        requestFields: {},
                        responseFields: ["username", "avatar", "bio"],
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    return {
                        id: uid,
                        username: result.username,
                        avatar: result.avatar,
                        bio: result.bio,
                    };
                } else {
                    navigate("/");
                    popup(result.error);
                }
            } catch (error) {
                console.error('Login error:', error);
                navigate("/");
                popup("Unable to Fetch Author's Details, Please Try Again Later.\n\nIf the Error Persists, Please Contact Support.");
            }
        }

        const getArticle = async () => {
            try {
                const response = await fetch(`${server}/v2/article/get/${id}`, {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        requestFields: {},
                        responseFields: ["title", "content", "summary", "publishTime", "lastEdit", "readTime", "likes", "author", "cover", "isSeries", "previous", "next", "index"],
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    setLiked(result.likes.indexOf(userId) !== -1);
                    return {
                        id: id,
                        title: result.title,
                        summary: result.summary,
                        content: result.content,
                        publishTime: new Date(result.publishTime),
                        lastEdit: new Date(result.lastEdit),
                        readTime: result.readTime,
                        likes: result.likes.length,
                        author: await getAuthor(result.author),
                        cover: result.cover,
                        isSeries: result.isSeries,
                        previous: result.previous,
                        next: result.next,
                        index: result.index,
                    };
                }
                navigate("/");
                popup(result.error);
            } catch (error) {
                console.error(error);
                navigate("/");
                popup("Unable to Access the Article, Please Try Again Later.\n\nIf the Error Persists, Please Contact Support.");
            }
            return {}
        }

        const init = async () => {
            document.title = 'Reading';
            const [bookmark, post] = await Promise.all([getInitialState(), getArticle()]);
            document.title = post.title;
            setBookmarked(bookmark);
            setPost(post);
            setLoadingArticle(false);
        }

        init().then();
    }, []);

    if (loadingUser || loadingArticle) {
        console.time("Loading...");

        return (
            <div className="flex w-full h-full justify-center items-center">
                <Loading vertical={true} />
            </div>
        );
    }

    return (
        <div>
            { (post.index.id > -1 || post.isSeries) &&
                <div className="max-w-3xl mx-auto bg-white rounded-lg p-4 flex flex-row justify-between space-x-4 mb-4">
                    {post.previous.id > 0 ?
                        <div
                            className="border-2 border-gray-800 hover:bg-gray-100 hover:border-black p-2 rounded-lg max-w-40 min-w-40 h-15 space-x-2">
                            <Link
                                to={`/post/${post.previous.id}`}
                                target="_parent"
                            >
                                <div className="flex flex-row justify-start text-sm text-gray-600">
                                    <Left className="w-5 h-5"/>
                                    <p>{post.previous.id === post.index.id ? "Index" : "Previous"}</p>
                                </div>
                                <p className="flex justify-start overflow-hidden pl-5">{post.previous.title}</p>
                            </Link>
                        </div>
                        :
                        <div className="border-2 border-gray-400  p-2 rounded-lg max-w-40 min-w-40 h-15 space-x-2 cursor-not-allowed">
                            <p className="flex italic items-center justify-center w-full h-full text-gray-600">Index Page</p>
                        </div>
                    }
                    <div className="bg-gray-50 hover:bg-gray-100 p-2 rounded-lg w-full h-15 space-x-2">
                        <Link
                            to={`/post/${post.index.id}`}
                            target="_parent"
                            className="h-full"
                        >
                            <div
                                className="flex flex-row justify-center text-sm text-gray-600 items-center space-x-1">
                                <List className="w-4 h-4"/>
                                <p>Index</p>
                            </div>
                            <p className="flex justify-center overflow-hidden">{post.index.title}</p>
                        </Link>
                    </div>
                    {post.next.id > 0 ?
                        <div className="bg-black text-white hover:bg-gray-800 p-2 rounded-lg max-w-40 min-w-40 h-15 space-x-2">
                            <Link
                                to={`/post/${post.next.id}`}
                                target="_parent"
                            >
                                <div className="flex flex-row justify-end text-sm text-gray-300">
                                    <p>Next</p>
                                    <Right className="w-5 h-5"/>
                                </div>
                                <p className="flex justify-end overflow-hidden pr-5">{post.next.title}</p>
                            </Link>
                        </div>
                        :
                        <div className="bg-black text-white  rounded-lg max-w-40 min-w-40 h-15 space-x-2 cursor-not-allowed">
                            <p className="flex italic items-center justify-center w-full h-full text-gray-300">Last Page</p>
                        </div>
                    }
                </div>
            }
            <div className="max-w-3xl mx-auto bg-white rounded-lg p-4">
                <img
                    src={post.cover}
                    alt={post.title}
                    className={`w-full ${post.index.id > 0? "h-fit" : "h-96"} object-cover rounded-lg mb-8`}
                />

                <h1 className="text-4xl font-bold mb-3 px-2">{post.title}</h1>

                <div className="prose max-w-none mb-3 italic px-2">{post.summary}</div>

                <Link
                    to={`/profile/${post.author.id}`}
                    className="flex items-center justify-between space-x-4 mb-2"
                >
                    <div className="flex w-full items-center space-x-4 bg-gray-50 rounded-lg p-2 hover:bg-gray-100">
                        <img
                            src={post.author.avatar}
                            alt={post.author.username}
                            className="w-12 h-12 rounded-full"
                        />
                        <div>
                            <h3 className="font-medium hover:font-semibold hover:text-blue-600">{post.author.username}</h3>
                            <p className="text-sm text-gray-500 hover:underline">{post.author.bio}</p>
                        </div>
                    </div>
                </Link>

                <div className="flex justify-between w-full h-fit text-gray-800 text-xs px-2 mb-8">
                    <p className="w-fit">{`Publish Time: ${post.publishTime.toLocaleString()}`}</p>
                    {post.publishTime.toLocaleString() !== post.lastEdit.toLocaleString() && <p className="w-fit">{`Last Edit Time: ${post.lastEdit.toLocaleString()}`}</p>}
                </div>

                {post.isSeries ?
                    <div className="flex flex-col mb-8">
                        <h1 className="flex text-2xl font-bold italic w-full justify-center mb-2 -mt-6 border-t pt-2">Index</h1>
                        {JSON.parse(post.content).map((chapter: {id: number, title: string}, index:number) => (
                            <Link
                                to={`/post/${chapter.id}`}
                                key={index}
                                target="_parent"
                                className="mb-4 text-gray-800 bg-gray-50 px-4 py-2 rounded-lg leading-relaxed hover:text-blue-600 hover:font-semibold hover:bg-gray-100"
                            >
                                <p className="text-xs text-gray-600 mb-1">Chapter {index+1}: </p>
                                {chapter.title}
                            </Link>
                        ))}
                    </div>
                    :
                    <div className="prose max-w-none mb-8 px-2">
                        {post.content.split('\n').map((paragraph: string, index: number) => (
                            <p key={index} className="mb-4 text-gray-800 leading-relaxed">
                                {paragraph}
                            </p>
                        ))}
                    </div>
                }

                <div className="flex items-center justify-between border-t pt-6">
                    <div className="flex items-center space-x-1">
                        <button
                            onClick={async () => await like(liked, setLiked, post, userId)}
                            className="flex items-center space-x-2 text-gray-500 hover:bg-gray-50 rounded-full p-2"
                        >
                            <Like className={"w-5 h-5" + (liked ? "  text-red-500" : "")}/>
                            <span>{post.likes}</span>
                        </button>
                        <button className="flex items-center space-x-2 text-gray-500 hover:bg-gray-50 rounded-full p-2"
                                onClick={async () => {console.log(post);await bookmark(bookmarked, setBookmarked, post.id, userId)}}>
                            <Bookmark className={"w-5 h-5" + (bookmarked ? " text-yellow-400" : "")}/>
                        </button>
                        <button className="flex items-center space-x-2 text-gray-500 hover:bg-gray-50 rounded-full p-2">
                            <MessageCircle className="w-5 h-5"/>
                            <span>Comments</span>
                        </button>
                    </div>
                    <div className="flex items-center">
                        <button
                            className="flex items-center space-x-2 text-gray-500 hover:bg-gray-50 rounded-full p-2"
                            onClick={async () => {
                                await navigator.clipboard.writeText(`${client}/post/${post.id}/?share=${userId}`);
                                popup("Shareable Link Copied to Clipboard");
                            }}
                        >
                            <Share2 className="w-5 h-5"/>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReadingPage;