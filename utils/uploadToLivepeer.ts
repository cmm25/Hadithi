// utils/uploadToLivepeer.ts
import axios from 'axios';
import fs from 'fs';

export const uploadVideoToLivepeer = async (videoPath: string, videoFileName: string): Promise<string> => {
    const apiKey = process.env.LIVEPEER_API_KEY;
    if (!apiKey) {
        throw new Error('Missing Livepeer API key');
    }

    // Step 1: Request upload URL from Livepeer
    const assetResponse = await axios.post(
        'https://livepeer.studio/api/asset/request-upload',
        { name: videoFileName },
        {
            headers: { Authorization: `Bearer ${apiKey}` },
        }
    );

    const uploadUrl: string = assetResponse.data.url;
    const assetId: string = assetResponse.data.asset.id;

    // Step 2: Upload video to Livepeer
    const videoStream = fs.createReadStream(videoPath);
    await axios.put(uploadUrl, videoStream, {
        headers: {
            'Content-Type': 'video/mp4',
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
    });

    // Step 3: Wait for the asset to be ready (polling or webhook)
    const playbackUrl = await waitForAssetPlaybackUrl(assetId, apiKey);

    return playbackUrl;
};

// Helper function to wait for the asset to be ready and get the playback URL
async function waitForAssetPlaybackUrl(assetId: string, apiKey: string): Promise<string> {
    let playbackUrl = '';
    const maxAttempts = 10;
    let attempts = 0;

    while (attempts < maxAttempts) {
        attempts++;
        await new Promise(res => setTimeout(res, 5000)); // Wait for 5 seconds

        // Get asset status
        const assetStatusResponse = await axios.get(
            `https://livepeer.studio/api/asset/${assetId}`,
            {
                headers: { Authorization: `Bearer ${apiKey}` },
            }
        );

        const asset = assetStatusResponse.data;

        if (asset.status.phase === 'ready' && asset.playbackId) {
            playbackUrl = `https://lp-playback.com/hls/${asset.playbackId}/index.m3u8`;
            break;
        }
    }

    if (!playbackUrl) {
        throw new Error('Timed out waiting for asset to be ready');
    }

    return playbackUrl;
}
