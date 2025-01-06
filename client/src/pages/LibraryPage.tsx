import {useEffect, useState} from 'react';
import PostCard from '../components/post/PostCard';
import {BookOpen, Layers} from '../asserts/icons';
import {readCookies} from "../utils/cookies.ts";
import {server} from "../utils/address.ts";
import {popup} from "../utils/popup.ts";

const LibraryPage = () => {
    const [activeTab, setActiveTab] = useState<'series' | 'single'>('single');
    const cookies = readCookies();
    const id = cookies.id;
    const [loading, setLoading] = useState<boolean>(true);
    let articles: any[] = [], series: any[] = [];

    useEffect(() => {
        const getArticle = async (articleId: number) => {
            try {
                let post: any = {};
                const response = await fetch(`${server}/v1/article/${articleId}`, {
                    method: 'GET'
                });

                const result = await response.json();

                if (response.ok) {
                    post.id = result.id;
                    post.title = result.title;
                    post.content = result.content;
                    post.author = result.author;
                    post.publishedAt = result.publishTime;
                    post.likes = result.likes;
                    post.isSeries = result.isSeries;
                    post.readTime = result.readTime;
                    post.coverImage = result.cover;

                    post.isSeries? series.push(post) : articles.push(post);
                } else {
                    popup(result.error);
                }
            } catch (error) {
                console.error('Login error:', error);
                popup("Server Unreachable, Please Try Again Later.\n\nIf the Error Persists, Please Contact Support.")
            }
        }

        const getUser = async () => {
            try {
                const response = await fetch(`${server}/v1/user/${id}`, {
                    method: 'GET'
                });

                const result = await response.json();

                if (response.ok) {
                    let postsPromise: any[] = [];
                    for (let post of result.library) {
                        postsPromise.push(getArticle(post));
                    }
                    await Promise.all(postsPromise);
                    setLoading(false);
                } else {
                    popup(result.error);
                }
            } catch (error) {
                console.error('Login error:', error);
                popup("Server Unreachable, Please Try Again Later.\n\nIf the Error Persists, Please Contact Support.")
            }
        }
        getUser().then(() => {});
    }, []);

    if (loading) {
        return <p>Loading...</p>;
    }

    return (
        <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Your Library</h1>

            <div className="flex space-x-4 mb-8">
                <button
                    onClick={() => setActiveTab('single')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                        activeTab === 'single'
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    <BookOpen className="w-5 h-5"/>
                    <span>Single Posts</span>
                </button>
                <button
                    onClick={() => setActiveTab('series')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                        activeTab === 'series'
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    <Layers className="w-5 h-5"/>
                    <span>Series</span>
                </button>
            </div>

            <div className="grid gap-8">
                {activeTab === 'single'
                    ? articles.map(post => <PostCard key={post.id} post={post}/>)
                    : series.map(series => <PostCard key={series.id} post={series}/>)
                }
            </div>
        </div>
    );
};

export default LibraryPage;