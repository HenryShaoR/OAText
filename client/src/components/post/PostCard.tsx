import {Like, Bookmark, BookOpen} from '../../asserts/icons';
import { Link } from 'react-router-dom';
import type { Article } from '../../types';
import {useState} from "react";
import {bookmark, like} from "../../hooks/Interaction.ts";


interface PostCardProps {
    post: Article;
    userId: number;
    bookmarkState: boolean;
    likedState: boolean;
}

const PostCard = ({ post, userId, bookmarkState, likedState }: PostCardProps) => {
    const [bookmarked, setBookmarked] = useState<boolean>(bookmarkState);
    const [liked, setLiked] = useState<boolean>(likedState);
    return (
        <article className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <Link to={`/post/${post.id}`}>
                <img
                    src={post.cover}
                    alt={post.title}
                    className="w-full h-64 object-cover"
                />
            </Link>
            <div className="p-6 pb-4">
                <Link to={`/post/${post.id}`}>
                    <h2 className="text-2xl font-bold mb-2 hover:text-blue-600 px-2">{post.title}</h2>
                </Link>
                <Link to={`/profile/${post.author.id}`}>
                    <div className="flex items-center space-x-3 mb-4 bg-gray-50 rounded-lg p-2 hover:bg-gray-100">
                        <img
                            src={post.author.avatar}
                            alt={post.author.username}
                            className="w-12 h-12 rounded-full min-w-12"
                        />
                        <div className="flex flex-col space-y-1 py-1">
                            <span className="text-gray-800 hover:text-blue-600 hover:font-semibold text-lg">{post.author.username}</span>
                            <div className="flex space-x-2 text-sm text-gray-600">
                                <span className="hover:underline">
                                    {post.author.publications.length}
                                    <strong> Posts</strong>
                                </span>
                                <span>·</span>
                                <span className="hover:underline">
                                    {post.author.followers}
                                    <strong> Followers</strong>
                                </span>
                            </div>
                        </div>
                    </div>
                </Link>
                <Link to={`/post/${post.id}`}>
                    <p className="text-gray-600 mb-4 px-2">
                        {post.summary.length <= 150 ? post.summary : `${post.summary.slice(0, 150)}...`}
                    </p>
                </Link>

                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 px-2">
                        <span className="flex items-center text-gray-500">
                            <BookOpen className="w-4 h-4 mr-1"  />
                            {post.readTime} min read
                        </span>
                        <button
                            onClick={async () => await like(liked, setLiked, post, userId)}
                            className="flex items-center text-gray-500 hover:bg-gray-50 rounded-full p-2"
                        >
                            <Like className={"w-4 h-4 mr-1" + (liked? " text-red-500" : "")}/>
                            {post.likes}
                        </button>
                    </div>
                    <button
                        onClick={async () => await bookmark(bookmarked, setBookmarked, post.id, userId)}
                        className="text-gray-500  hover:bg-gray-50 rounded-full p-2">
                        <Bookmark className={"w-5 h-5" + (bookmarked ? " text-yellow-400" : "")} />
                    </button>
                </div>
            </div>
        </article>
    );
};

export default PostCard;