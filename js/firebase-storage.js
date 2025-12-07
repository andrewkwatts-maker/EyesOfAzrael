/**
 * Firebase Storage Image Upload Module
 * Handles uploading, deleting, and managing images in Firebase Storage
 */

const FirebaseStorage = (function() {
    'use strict';

    // Configuration
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const STORAGE_PATH = 'theory-images';

    /**
     * Validate image file
     * @param {File} file - The file to validate
     * @returns {Object} - { valid: boolean, error?: string }
     */
    function validateFile(file) {
        if (!file) {
            return { valid: false, error: 'No file provided' };
        }

        // Check file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return {
                valid: false,
                error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}`
            };
        }

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            const sizeMB = (MAX_FILE_SIZE / 1024 / 1024).toFixed(1);
            return {
                valid: false,
                error: `File too large. Maximum size: ${sizeMB}MB`
            };
        }

        return { valid: true };
    }

    /**
     * Generate unique filename
     * @param {string} originalName - Original filename
     * @returns {string} - Unique filename
     */
    function generateUniqueFilename(originalName) {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const extension = originalName.split('.').pop();
        return `${timestamp}_${randomString}.${extension}`;
    }

    /**
     * Get storage path for user's theory image
     * @param {string} userId - User ID
     * @param {string} theoryId - Theory ID (optional, uses 'draft' if not provided)
     * @param {string} filename - Filename
     * @returns {string} - Full storage path
     */
    function getStoragePath(userId, theoryId, filename) {
        const theoryFolder = theoryId || 'draft';
        return `${STORAGE_PATH}/${userId}/${theoryFolder}/${filename}`;
    }

    /**
     * Upload image to Firebase Storage
     * @param {File} file - The image file to upload
     * @param {Object} options - Upload options
     * @param {string} options.userId - User ID
     * @param {string} options.theoryId - Theory ID (optional)
     * @param {Function} options.onProgress - Progress callback (percent: number) => void
     * @returns {Promise<Object>} - { success: boolean, url?: string, path?: string, error?: string }
     */
    async function uploadImage(file, options = {}) {
        // Validate file
        const validation = validateFile(file);
        if (!validation.valid) {
            return {
                success: false,
                error: validation.error
            };
        }

        // Check if user is authenticated
        if (!options.userId) {
            return {
                success: false,
                error: 'User must be logged in to upload images'
            };
        }

        // Check if Firebase is initialized
        if (!window.firebase || !window.firebase.storage) {
            return {
                success: false,
                error: 'Firebase Storage not initialized. Please ensure Firebase is configured.'
            };
        }

        try {
            // Generate unique filename
            const filename = generateUniqueFilename(file.name);
            const path = getStoragePath(options.userId, options.theoryId, filename);

            // Get storage reference
            const storageRef = window.firebase.storage().ref();
            const fileRef = storageRef.child(path);

            // Upload file
            const uploadTask = fileRef.put(file, {
                contentType: file.type,
                customMetadata: {
                    originalName: file.name,
                    uploadedBy: options.userId,
                    uploadedAt: new Date().toISOString()
                }
            });

            // Return promise that resolves with download URL
            return new Promise((resolve, reject) => {
                uploadTask.on(
                    'state_changed',
                    (snapshot) => {
                        // Progress tracking
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        if (options.onProgress && typeof options.onProgress === 'function') {
                            options.onProgress(progress);
                        }
                    },
                    (error) => {
                        // Error handling
                        let errorMessage = 'Upload failed';

                        if (error.code === 'storage/unauthorized') {
                            errorMessage = 'You do not have permission to upload images';
                        } else if (error.code === 'storage/canceled') {
                            errorMessage = 'Upload canceled';
                        } else if (error.code === 'storage/quota-exceeded') {
                            errorMessage = 'Storage quota exceeded';
                        } else if (error.code === 'storage/unknown') {
                            errorMessage = 'Network error occurred';
                        }

                        resolve({
                            success: false,
                            error: errorMessage
                        });
                    },
                    async () => {
                        // Upload completed successfully
                        try {
                            const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                            resolve({
                                success: true,
                                url: downloadURL,
                                path: path,
                                filename: filename
                            });
                        } catch (error) {
                            resolve({
                                success: false,
                                error: 'Failed to get download URL'
                            });
                        }
                    }
                );
            });
        } catch (error) {
            return {
                success: false,
                error: error.message || 'Upload failed'
            };
        }
    }

    /**
     * Delete image from Firebase Storage
     * @param {string} pathOrUrl - Storage path or download URL
     * @returns {Promise<Object>} - { success: boolean, error?: string }
     */
    async function deleteImage(pathOrUrl) {
        if (!pathOrUrl) {
            return {
                success: false,
                error: 'No path or URL provided'
            };
        }

        // Check if Firebase is initialized
        if (!window.firebase || !window.firebase.storage) {
            return {
                success: false,
                error: 'Firebase Storage not initialized'
            };
        }

        try {
            const storageRef = window.firebase.storage().ref();
            let fileRef;

            // Check if it's a URL or path
            if (pathOrUrl.startsWith('http')) {
                // It's a download URL, create reference from URL
                fileRef = window.firebase.storage().refFromURL(pathOrUrl);
            } else {
                // It's a path, create reference from path
                fileRef = storageRef.child(pathOrUrl);
            }

            // Delete the file
            await fileRef.delete();

            return { success: true };
        } catch (error) {
            let errorMessage = 'Delete failed';

            if (error.code === 'storage/object-not-found') {
                errorMessage = 'Image not found';
            } else if (error.code === 'storage/unauthorized') {
                errorMessage = 'You do not have permission to delete this image';
            }

            return {
                success: false,
                error: errorMessage
            };
        }
    }

    /**
     * Get download URL from storage path
     * @param {string} path - Storage path
     * @returns {Promise<Object>} - { success: boolean, url?: string, error?: string }
     */
    async function getImageUrl(path) {
        if (!path) {
            return {
                success: false,
                error: 'No path provided'
            };
        }

        // Check if Firebase is initialized
        if (!window.firebase || !window.firebase.storage) {
            return {
                success: false,
                error: 'Firebase Storage not initialized'
            };
        }

        try {
            const storageRef = window.firebase.storage().ref();
            const fileRef = storageRef.child(path);
            const url = await fileRef.getDownloadURL();

            return {
                success: true,
                url: url
            };
        } catch (error) {
            return {
                success: false,
                error: 'Failed to get download URL'
            };
        }
    }

    /**
     * Get file metadata
     * @param {string} pathOrUrl - Storage path or download URL
     * @returns {Promise<Object>} - { success: boolean, metadata?: Object, error?: string }
     */
    async function getMetadata(pathOrUrl) {
        if (!pathOrUrl) {
            return {
                success: false,
                error: 'No path or URL provided'
            };
        }

        // Check if Firebase is initialized
        if (!window.firebase || !window.firebase.storage) {
            return {
                success: false,
                error: 'Firebase Storage not initialized'
            };
        }

        try {
            const storageRef = window.firebase.storage().ref();
            let fileRef;

            // Check if it's a URL or path
            if (pathOrUrl.startsWith('http')) {
                fileRef = window.firebase.storage().refFromURL(pathOrUrl);
            } else {
                fileRef = storageRef.child(pathOrUrl);
            }

            const metadata = await fileRef.getMetadata();

            return {
                success: true,
                metadata: metadata
            };
        } catch (error) {
            return {
                success: false,
                error: 'Failed to get metadata'
            };
        }
    }

    /**
     * Compress image before upload (client-side)
     * @param {File} file - The image file to compress
     * @param {Object} options - Compression options
     * @param {number} options.maxWidth - Maximum width (default: 1920)
     * @param {number} options.maxHeight - Maximum height (default: 1080)
     * @param {number} options.quality - JPEG quality 0-1 (default: 0.8)
     * @returns {Promise<Blob>} - Compressed image blob
     */
    function compressImage(file, options = {}) {
        const maxWidth = options.maxWidth || 1920;
        const maxHeight = options.maxHeight || 1080;
        const quality = options.quality || 0.8;

        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const img = new Image();

                img.onload = () => {
                    // Calculate new dimensions
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }

                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }

                    // Create canvas and draw resized image
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Convert to blob
                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                resolve(blob);
                            } else {
                                reject(new Error('Compression failed'));
                            }
                        },
                        file.type,
                        quality
                    );
                };

                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = e.target.result;
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    // Public API
    return {
        uploadImage,
        deleteImage,
        getImageUrl,
        getMetadata,
        compressImage,
        validateFile,
        MAX_FILE_SIZE,
        ALLOWED_TYPES
    };
})();

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.FirebaseStorage = FirebaseStorage;
}
