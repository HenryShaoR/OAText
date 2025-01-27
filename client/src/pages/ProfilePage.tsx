import {Link, useNavigate, useParams} from 'react-router-dom';
import {Edit, Follow, Following, Users} from '../asserts/icons';
import PostCard from '../components/post/PostCard';
import {useEffect, useState} from "react";
import {server} from "../utils/address.ts";
import {readCookies} from "../utils/cookies.ts";
import {popup} from "../utils/popup.ts";
import {Loading} from "../asserts/loading.tsx";
import {follow} from "../hooks/Interaction.ts";

const ProfilePage = () => {
    const cookies = readCookies();
    const loginUserId = cookies.id;
    let profileUserId = parseInt(useParams().id || loginUserId);
    const navigate = useNavigate();
    const [user, setUser] = useState<any>();
    const [userPosts, setPost] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [following, setFollowing] = useState<boolean>(false);

    useEffect(() => {
        const getArticle = async (articleId: number, profileUser: any, loginUser: any) => {
            try {
                const response = await fetch(`${server}/v2/article/get/${articleId}`, {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        requestFields: {},
                        responseFields: ["title", "summary", "content", "publishTime", "likes", "isSeries", "readTime", "cover"],
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    return {
                        id: articleId,
                        title: result.title,
                        summary: result.summary,
                        content: result.content,
                        author: profileUser,
                        publishTime: result.publishTime,
                        likes: result.likes.length,
                        isSeries: result.isSeries,
                        readTime: result.readTime,
                        cover: result.cover,

                        bookmarkState: loginUser.library.indexOf(articleId) > -1,
                        likedState: result.likes.indexOf(loginUserId) > -1,
                    };
                } else {
                    navigate("/");
                    popup(result.error);
                }
            } catch (error) {
                console.error(error);
                navigate("/");
                popup("Unable to Fetch Article Details, Please Try Again Later.\n\nIf the Error Persists, Please Contact Support.");
            }
        }

        const getProfileUser = async () => {
            try {
                const response = await fetch(`${server}/v2/user/get/${profileUserId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        requestFields: {},
                        responseFields: ["username", "followers", "following", "avatar", "bio", "publications"],
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    let user: any = {
                        id: profileUserId,
                        username: result.username,
                        followers: result.followers.length,
                        following: result.following.length,
                        avatar: result.avatar,
                        bio: result.bio,
                        publications: result.publications,
                    }

                    if (profileUserId !== loginUserId && result.followers.indexOf(loginUserId) !== -1) {
                        setFollowing(true);
                    }

                    setUser(user);
                    return user;
                }
                navigate("/login");
                popup(result.error);
            } catch (error) {
                console.error(error);
                navigate("/login");
                popup("Unable to Fetch the User's Details, Please Try Again Later.\n\nIf the Error Persists, Please Contact Support.");
            }
        }

        const getLoginUser = async () => {
            try {
                const response = await fetch(`${server}/v2/user/get/${loginUserId}`, {
                    method: 'POST',
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
                    return {
                        library: result.library,
                    };
                } else {
                    navigate("/login");
                    popup(result.error);
                }
            } catch (error) {
                console.error(error);
                navigate("/login");
                popup("Unable to Fetch Your Details, Please Try Again Later.\n\nIf the Error Persists, Please Contact Support.");
            }
        }

        const init = async () => {
            document.title = 'Profile';
            try {
                const [profileUser, loginUser] = await Promise.all([getProfileUser(), getLoginUser()]);
                document.title = profileUserId === loginUserId? "Your Profile" : `${profileUser.username}'${profileUser.username[profileUser.username.length-1] === 's'? '' : 's'} Profile`;
                let postsPromise: any[] = [];
                for (let post of profileUser.publications) {
                    postsPromise.push(getArticle(post, profileUser, loginUser));
                }
                setPost(await Promise.all(postsPromise));
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
        <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                <div className="flex items-center space-x-8 mb-2">
                    <img
                        src={user.avatar}
                        alt={user.username}
                        className="w-32 h-32 rounded-full object-cover"
                    />
                    <div className="flex-col items-start justify-between w-full">
                        <div className="flex items-center justify-between space-x-2 w-full h-full">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">{user.username}</h1>
                                <div className="flex items-center space-x-6">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm text-gray-600 border rounded-md px-1.5 py-0.5 whitespace-nowrap">
                                            <strong>ID</strong> {user.id}
                                        </span>
                                        <span className="text-sm text-gray-600">·</span>
                                        <Users className="w-5 h-5 text-gray-500"/>
                                        <span className="text-sm text-gray-600 whitespace-nowrap">
                                            <strong>{user.followers}</strong> followers
                                        </span>
                                        <span className="text-sm text-gray-600">·</span>
                                        <span className="text-sm text-gray-600 whitespace-nowrap">
                                            <strong>{user.following}</strong> following
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                {
                                    profileUserId === loginUserId ?
                                        <Link
                                            to="/settings"
                                            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                        >
                                            <Edit className="w-5 h-5"/>
                                            <span className="whitespace-nowrap">Edit Profile</span>
                                        </Link>
                                        :
                                        <button
                                            onClick={async () => await follow(following, setFollowing, user, loginUserId)}
                                            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                        >
                                            {
                                                following
                                                    ? <Following className="w-5 h-5"/>
                                                    : <Follow className="w-5 h-5"/>
                                            }
                                            <span>{following ? "Following" : "Follow"}</span>
                                        </button>
                                }
                            </div>
                        </div>
                        {user.bio && <p className="text-gray-600 mt-4 bg-gray-100 p-2 rounded-lg">{user.bio}</p>}
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                <h2 className="text-2xl font-bold">Published Stories</h2>
                {userPosts.map(post => (
                    <PostCard key={post.id} post={post} userId={loginUserId} bookmarkState={post.bookmarkState}
                              likedState={post.likedState}/>
                ))}
            </div>
        </div>
    );
};

export default ProfilePage;