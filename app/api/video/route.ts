import { NextRequest, NextResponse } from 'next/server';
import { generateVideo } from '@/utils/generateVideo';
import { uploadVideoToLivepeer } from '@/utils/uploadToLivepeer';
import fs from 'fs';

export async function POST(req: NextRequest) {
    try {
        const { sections } = await req.json();

        if (!Array.isArray(sections) || sections.length === 0) {
            return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
        }

        const playbackUrls: string[] = [];

        for (let i = 0; i < sections.length; i++) {
            const text = sections[i];

            // Generate video for the section
            const videoPath = await generateVideo(text, i);

            // Upload video to Livepeer
            const assetId = await uploadVideoToLivepeer(videoPath, `story-section-${i}.mp4`);

            // Optionally, you may need to poll Livepeer API to check asset status or directly get playback URL
            const playbackUrl = `https://livepeercdn.com/asset/${assetId}/video`; // Adjust based on Livepeer's API

            playbackUrls.push(playbackUrl);

            // Clean up local video file
            fs.unlinkSync(videoPath);
        }

        return NextResponse.json({ playbackUrls }, { status: 200 });
    } catch (error) {
        console.error('Error generating or uploading video:', error);
        return NextResponse.json({ error: 'Error generating or uploading video' }, { status: 500 });
    }
}