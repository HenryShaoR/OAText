import React, { useRef, useState } from 'react';
import {Loading} from "../../asserts/loading.tsx";
import {Upload} from "../../asserts/icons.tsx";
import imageCompression from "browser-image-compression";

interface ImageUploadProps {
    onUpload: (url: string) => void;
    defaultImage?: string;
    className?: string;
    imgClassName? : string;
    prompt?: boolean;
}

export const compressImage = async (file: File) => {
    const options = {
        maxSizeMB: 1,
        useWebWorker: true,
        initialQuality: 0.5,
    };

    try {
        return await imageCompression(file, options);
    } catch (error) {
        console.error('Error compressing image:', error);
        throw error;
    }
};

const ImageUpload = ({ onUpload, defaultImage, className = '', imgClassName = "w-full h-full object-cover rounded-lg", prompt = true }: ImageUploadProps) => {
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(defaultImage);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file: File) => {
        if (!file.type.startsWith('image/')) return;

        try {
            setIsUploading(true);

            const reader = new FileReader();
            const compressedFile = await compressImage(file);
            reader.readAsDataURL(compressedFile);
            reader.onloadend = () => {
                const url = reader.result as string;
                setPreviewUrl(url);
                onUpload(url);
            };

        } catch (error) {
            console.error('Error uploading image:', error);
            // Here you might want to show an error toast
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        await handleFile(file);
    };

    const handleButtonClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        fileInputRef.current?.click();
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (!file) return;
        await handleFile(file);
    };

    return (
        <div
            className={`relative ${className}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {previewUrl ? (
                <div className="relative group">
                    <img
                        src={previewUrl}
                        alt="Preview"
                        className={imgClassName}
                    />
                    <button
                        type="button"
                        onClick={handleButtonClick}
                        className={"absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg"}
                        disabled={isUploading}
                    >
                        {isUploading ?
                            <Loading scale={0.5} message="" color="#888"/> :
                            <div className="flex-col justify-items-center">
                                <Upload className="w-5 h-5 text-white" />
                                <span className="text-white">Change</span>
                            </div>
                        }
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={handleButtonClick}
                    className={`w-full h-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-6 transition-colors ${
                        isDragging
                            ? 'border-gray-400 bg-gray-50'
                            : 'border-gray-300 hover:border-gray-400'
                    } ${prompt && "min-h-[150px]"}`}
                    disabled={isUploading}
                >
                    {isUploading ?
                        <Loading scale={0.5} message="" color="#888"/> :
                        <>
                            <Upload className="w-8 h-8 text-gray-400" />
                            { prompt &&
                                <span className="mt-2 text-sm text-gray-500">
                                    Drop or click to select an image
                                </span>
                            }
                        </>
                    }
                </button>
            )}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
            />
        </div>
    );
};

export default ImageUpload;