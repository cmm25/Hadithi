import { Livepeer } from "@livepeer/ai";


export const generateImages = async (prompts: string[]): Promise<string[]> => {
    const livepeer = new Livepeer({
        httpBearer: process.env.LIVEPEER_API_KEY,
    });

    try {
        const imageUrls: string[] = [];

        for (const prompt of prompts) {
            const imageResult = await livepeer.generate.textToImage({
                prompt,
                width: 1280,
                height: 720,
                modelId: process.env.LIVEPEER_SD_MODEL_ID,
            });

            if ("error" in imageResult) {
                throw new Error(
                    `Error generating image for prompt "${prompt}": ${imageResult.error}`
                );
            } else {
                // Access images from imageResponse.images
                const images = imageResult.imageResponse?.images;

                if (!images || images.length === 0) {
                    throw new Error(`No image generated for prompt: "${prompt}"`);
                }

                imageUrls.push(images[0].url);
            }
        }

        return imageUrls;
    } catch (error) {
        console.error("Image generation error:", error);
        throw error;
    }
};