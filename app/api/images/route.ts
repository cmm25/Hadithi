import { NextResponse } from 'next/server';
import { generateImages } from '@/utils/generateImages';

export async function POST(request: Request) {
    try {
        const { sections } = await request.json();

        if (!sections || !Array.isArray(sections)) {
            return NextResponse.json({ error: 'Invalid sections' }, { status: 400 });
        }

        // Generate images for the sections
        const imageUrls = await generateImages(sections);

        return NextResponse.json({ imageUrls });

    } catch (error) {
        console.error('Error generating images:', error);

        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
