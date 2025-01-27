import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {Save, Search} from '../asserts/icons';
import {server} from "../utils/address.ts";
import {readCookies} from "../utils/cookies.ts";
import {popup} from "../utils/popup.ts";
import {useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import {Loading} from "../asserts/loading.tsx";
import ImageUpload from "../components/post/ImageUpload.tsx";

const postSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100, 'Your title is too long'),
    summary: z.string().min(1, 'Summary is required').max(100, 'Your summary is too long'),
    content: z.string().min(1, 'Content is required'),
    cover: z.string().url('Please upload a cover image'),
    isSeries: z.boolean(),
    seriesName: z.string().optional(),
});

type PostFormData = z.infer<typeof postSchema>;

const WritingPage = () => {
    document.title = 'Share Your Story';
    const {register, handleSubmit, watch, setValue, formState: {errors}} = useForm<PostFormData>({
        resolver: zodResolver(postSchema),
        defaultValues: {
            isSeries: false,
        },
    });

    const cover = watch('cover');

    const cookies = readCookies();
    const userId = cookies.id;
    const navigate = useNavigate();
    const [publishing, setPublishing] = useState<boolean>(false);
    const [isSeries, setIsSeries] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const [userPosts, setPost] = useState<any[]>([]);
    const [series, setSeries] = useState<any>({});
    const [seriesCover, setSeriesCover] = useState<string>("");
    const [seriesName, setSeriesName] = useState<string>("");
    const [seriesSummary, setSeriesSummary] = useState<string>("");

    useEffect(() => {
        const getArticle = async (articleId: number, user: any) => {
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
                        author: user,
                        publishTime: result.publishTime,
                        likes: result.likes.length,
                        isSeries: result.isSeries,
                        readTime: result.readTime,
                        cover: result.cover,
                    };
                }
                popup(result.error);
            } catch (error) {
                console.error(error);
                popup("Unable to Fetch Article Details, Please Try Again Later.\n\nIf the Error Persists, Please Contact Support.");
            }
        }

        const getUser = async () => {
            try {
                const response = await fetch(`${server}/v2/user/get/${userId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        requestFields: {},
                        responseFields: ["publications"],
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    return {
                        publications: result.publications,
                    };
                } else {
                    popup(result.error);
                }
            } catch (error) {
                console.error(error);
                popup("Unable to Fetch Your Details, Please Try Again Later.\n\nIf the Error Persists, Please Contact Support.");
            }
            return {"publications": []};
        }

        const init = async () => {
            try {
                const user = await getUser();
                let postsPromise: any[] = [];
                for (let post of user.publications) {
                    postsPromise.push(getArticle(post, user));
                }
                setPost(await Promise.all(postsPromise));
            } catch (ignore) {}  // already handled
        }

        init().then(() => { setLoading(false); });
    }, []);

    const filteredPosts = userPosts.filter(
        (post) =>
            post.isSeries &&
            post.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    async function uploadPost(cover: string, title: string, summary: string, content: string, indexId: number) {
        try {
            const response = await fetch(`${server}/v2/article/upload/-1`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    requestFields: {
                        session: userId,  // use userId as session for now; when replacing with the actual session, remember to update getAuthorName method in article.js in backend.
                        cover: cover,
                        title: title,
                        summary: summary,
                        content: content,
                        isSeries: false,
                        price: 0,  // some further info about the article; to be used in the future.
                        tags: [],
                        indexId: indexId,
                    },
                    responseFields: [],
                })
            });
            const result = await response.json();

            if (response.ok) {
                navigate("/profile");
                popup("Upload Successfully");
            } else {
                popup(result.error);
            }
        } catch (error) {
            console.error(error);
            popup("Unable to Post Your Article, Please Try Again Later.\n\nIf the Error Persists, Please Contact Support.")
        }
    }

    const onSubmit = async (data: PostFormData) => {
        setPublishing(true);
        if (!isSeries) {
            await uploadPost(data.cover, data.title, data.summary, data.content, -1);
        } else {
            if (series.id === undefined) {
                console.log("No Series Selected");
            } else {
                let index;
                if (series.id === null) {
                    console.log("New Series Selected");
                    try {
                        const response = await fetch(`${server}/v2/article/upload/-1`, {
                            method: "POST",
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                requestFields: {
                                    session: userId,  // use userId as session for now; when replacing with the actual session, remember to update getAuthorName method in article.js in backend.
                                    cover: seriesCover,
                                    title: seriesName,
                                    summary: seriesSummary,
                                    content: JSON.stringify([]),
                                    isSeries: true,
                                    price: 0,  // some further info about the article; to be used in the future.
                                    tags: [],
                                    indexId: -1,
                                },
                                responseFields: [],
                            })
                        });
                        const result = await response.json();

                        if (response.ok) {
                            index = {
                                id: result.id,
                                cover: seriesCover,
                                title: seriesName,
                                summary: seriesSummary,
                            }
                            console.log("New Series Created Successfully");
                        } else {
                            popup(result.error);
                        }
                    } catch (error) {
                        console.error(error);
                        popup("Unable to Create the New Series, Please Try Again Later.\n\nIf the Error Persists, Please Contact Support.")
                    }
                } else {
                    index = series;
                }
                await uploadPost(data.cover, data.title, data.summary, data.content, index.id);
            }
        }
        popup("Upload Successfully");
        setPublishing(false);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">Share your story</h1>
                <button
                    disabled={publishing}
                    onClick={handleSubmit(onSubmit)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {
                        publishing ?
                            <Loading message="Publishing" scale={0.2} color="#fff"/> :
                            <div className="flex flex-row items-center space-x-2">
                                <Save className="w-5 h-5"/>
                                <p className="text-nowrap">Publish</p>
                            </div>
                    }
                </button>
            </div>
            <form className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cover Image
                    </label>
                    <div className="flex items-center space-x-4">
                        <ImageUpload
                            onUpload={(url) => setValue('cover', url)}
                            defaultImage={cover}
                            className="w-full h-fit flex-shrink-0"
                        />
                    </div>
                    {errors.cover && (
                        <p className="mt-1 text-sm text-red-600">{errors.cover.message}</p>
                    )}
                </div>

                <div>
                    <input
                        {...register('title')}
                        type="text"
                        placeholder="Title"
                        className="w-full text-2xl font-bold rounded-lg border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 px-2 py-1"
                    />
                    {errors.title && (
                        <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                    )}
                </div>

                <div>
                    <input
                        {...register('summary')}
                        type="text"
                        placeholder="Summary"
                        className="w-full text-xl font-bold rounded-lg border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 px-2 py-1"
                    />
                    {errors.title && (
                        <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                    )}
                </div>

                <div>
                <textarea
                    {...register('content')}
                    rows={12}
                    placeholder="Your story..."
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 px-2 py-1 mt-1 resize-none"
                    onChange={(e) => {
                        const field = e.target as HTMLTextAreaElement;
                        field.style.height = "auto";
                        field.style.height = `${field.scrollHeight}px`;
                    }}
                />
                    {errors.content && (
                        <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
                    )}
                </div>

                <div className="flex items-center space-x-4">
                    <input
                        {...register('isSeries')}
                        type="checkbox"
                        id="isSeries"
                        className="rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                        onClick={(e) => {
                            setIsSeries((e.target as HTMLInputElement).checked);
                            setSeries({});
                        }}
                    />
                    <label htmlFor="isSeries" className="text-sm font-medium text-gray-700">
                        This is part of a series
                    </label>
                </div>

                {isSeries &&
                    <div>
                        <div
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 p-6 bg-white">
                            <h1 className="text-xl font-bold">Select Series</h1>
                            <div className="relative my-3">
                                <input
                                    type="text"
                                    placeholder="Search a Series..."
                                    value={searchQuery}
                                    disabled={loading}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-gray-500 focus:border-gray-500 disabled:cursor-not-allowed"
                                />
                                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5"/>
                            </div>
                            <div className="flex w-full items-center space-x-4 bg-gray-50 hover:bg-gray-100 p-4 rounded-lg cursor-pointer mt-4">
                                <input
                                    type="radio" name="selectSeries" id="new"
                                    onClick={(_) => {
                                        setSeries({ id: null, })
                                    }}
                                />
                                <label
                                    htmlFor="new"
                                    className="flex w-full items-center space-x-4 cursor-pointer"
                                >
                                    <div onClick={(e) => {
                                        (e.target as HTMLDivElement).parentElement!.click();
                                    }}>
                                        <ImageUpload
                                            onUpload={setSeriesCover}
                                            defaultImage={seriesCover}
                                            imgClassName="max-h-48 max-w-48 rounded-lg"
                                            className="flex flex-col min-w-48 h-48 justify-items-center items-center justify-center"
                                        />
                                    </div>
                                    <div className="w-full">
                                        <div className="flex flex-col space-y-2 w-full">
                                            <input
                                                className="text-lg font-semibold p-2 rounded-lg border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                                                placeholder="New Series Name"
                                                onChange={(e) => setSeriesName(e.target.value)}
                                            />
                                            <textarea
                                                rows={6}
                                                className="text-sm p-2 rounded-lg resize-none border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                                                placeholder="Summary"
                                                onChange={(e) => setSeriesSummary(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </label>
                            </div>
                            {loading ?
                                <div className="justify-items-center">
                                    <Loading scale={0.5} message="Loading Your Series" vertical={true}/>
                                </div> :
                                <div>
                                    { filteredPosts.map((post: any) => (
                                        <div
                                            key={post.id}
                                            className="flex w-full items-center space-x-4 bg-gray-50 hover:bg-gray-100 p-4 rounded-lg cursor-pointer mt-4"
                                        >
                                            <input
                                                type="radio" name="selectSeries" id={post.id.toString()}
                                                onClick={(_) => {
                                                    setSeries({
                                                        id: post.id,
                                                        cover: post.cover,
                                                        title: post.title,
                                                        summary: post.summary,
                                                    })
                                                }}
                                            />
                                            <label
                                                htmlFor={post.id.toString()}
                                                className="flex w-full items-center space-x-4 cursor-pointer h-48"
                                            >
                                                <div
                                                    className="flex flex-col w-48 h-48 justify-items-center items-center justify-center min-w-48">
                                                    <img
                                                        src={post.cover}
                                                        alt={post.title}
                                                        className="max-h-48 max-w-48 rounded-lg"
                                                    />
                                                </div>
                                                <div className="w-full">
                                                    <div className="flex flex-col space-y-2 w-full h-48">
                                                        <p className="text-lg font-semibold p-2 rounded-lg border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 bg-white">
                                                            {post.title}
                                                        </p>
                                                        <p className="text-sm p-2 rounded-lg resize-none border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 h-full bg-white proper-break-words overflow-hidden">
                                                            {post.summary}
                                                        </p>
                                                    </div>
                                                </div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            }
                        </div>
                        {errors.title && (
                            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                        )}
                    </div>
                }
            </form>
        </div>
    );
};

export default WritingPage;