import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { generateImages } from '@/utils/generateImage';

export async function POST(request: NextRequest) {
    try {
        const { sections } = await request.json();

        // Validate that sections is an array
        if (!Array.isArray(sections)) {
            return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
        }

        // Generate images for each section using the generateImages function
        const images = await generateImagesForSections(sections);

        return NextResponse.json({ images });
    } catch (error) {
        console.error('Error in /api/image:', error);
        return NextResponse.json({ error: 'Error generating images' }, { status: 500 });
    }
}

// Function to generate images for sections
async function generateImagesForSections(sections: string[]) {
    // Use Promise.all to generate images concurrently
    const imagePromises = sections.map(async (section) => {
        // Generate images using the imported generateImages function
        const urls = await generateImages(section);
        // Return the first image URL
        return urls[0];
    });

    const images = await Promise.all(imagePromises);
    return images;
}