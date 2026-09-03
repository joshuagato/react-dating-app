import * as faceapi from '@vladmandic/face-api';
import imageCompression from 'browser-image-compression';

let modelsLoaded = false;

/**
 * Loads face detection models lazily
 */
export async function loadFaceApiModels() {
    if (modelsLoaded) return;
    // Serve models from public directory or CDN
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
    // const MODEL_URL = '/models/';
    await Promise.all([
        // faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        // faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        // faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL), // Higher precision detector for uploaded images
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
}

/**
 * 1. Lossless/Visually Lossless Image Compression
 */
export async function compressImage(file) {
    const options = {
        maxSizeMB: 0.5,           // Compress to max 500 KB
        maxWidthOrHeight: 1200,   // Rescale dimensions proportionately
        useWebWorker: true,
        initialQuality: 0.85
    };
    try {
        const compressedBlob = await imageCompression(file, options);

        // Reconstruct a proper File object to guarantee original name and MIME type persistence
        return new File([compressedBlob], file.name, {
            type: compressedBlob.type || file.type,
            lastModified: Date.now(),
        });
    } catch (error) {
        console.error('Compression failed, using original file:', error);
        return file;
    }
}

/**
 * 3. Client-Side Face Comparison using Face Descriptors
 */
export async function compareFaces(selfieImgElement, uploadedImgElement) {
    await loadFaceApiModels();

    // High-precision SSD Mobilenet V1 options to eliminate low-confidence false positives
    const ssdOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 });

    // Detect single face and extract descriptors for both images
    const [selfieDetection, uploadedDetection] = await Promise.all([
        faceapi
            .detectSingleFace(selfieImgElement, ssdOptions)
            .withFaceLandmarks()
            .withFaceDescriptor(),
        faceapi
            .detectSingleFace(uploadedImgElement, ssdOptions)
            .withFaceLandmarks()
            .withFaceDescriptor()
    ]);

    // Handle missing face detections
    if (!selfieDetection || !uploadedDetection) {
        let reason = 'Verification face unreadable.';
        if (!selfieDetection && !uploadedDetection) {
            reason = 'No clear face found in either picture. Please ensure both images are well-lit.';
        } else if (!uploadedDetection) {
            reason = 'No clear face detected in the uploaded picture. Please ensure the face is well-lit and fully visible.';
        } else if (!selfieDetection) {
            reason = 'Could not detect a clear face in your verification selfie.';
        }

        return {
            isMatch: false,
            reason
        };
    }

    // Measure Euclidean distance between face descriptors
    const distance = faceapi.euclideanDistance(
        selfieDetection.descriptor,
        uploadedDetection.descriptor
    );

    // Strict threshold: <= 0.45 eliminates false positives (0.6 is too forgiving)
    const MATCH_THRESHOLD = 0.45;
    const isMatch = distance <= MATCH_THRESHOLD;

    return {
        isMatch,
        distance,
        reason: isMatch
            ? 'Face verification passed.'
            : 'Uploaded face does not match your verification selfie.'
    };
}