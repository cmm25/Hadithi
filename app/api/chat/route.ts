import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse} from "ai"
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = "edge";

export async function POST(req: Request) {
    const {
        tone = "witty",
        setting = "forest",
        characters = [],
        language = "en",
        temperature = 0.8
    } = await req.json();

    const systemMessage = `You are a master storyteller known for creating engaging narratives in various settings.
    Your stories should be rich in detail, capturing the essence of the setting and characters, while being easy to understand in the specified language.
    Be creative, imaginative, and tailor the story to the chosen tone and setting.
    Don't self-censor too much - push the boundaries of storytelling while avoiding extremely offensive content.
    Always strive to match the requested tone and setting, even if it means being a bit edgy or fantastical.
    
    Format your story as follows:
    1. Start with a title in the format: "# [Your Story Title]"
    2. Follow with story content, using Markdown formatting for structure:
        - Use "## " for section headers if applicable
        - Use paragraph breaks for readability
        - Use "*" for emphasis where appropriate
        - Use dialogue formatting: "Character name: 'Dialogue'"`;

    interface Character {
        name: string;
        description: string;
        personality: string;
    }

    const characterPrompts = characters.map((c: Character) => `${c.name}: ${c.description}. Personality: ${c.personality}`).join('\n');

    const userPrompt = `Generate a ${tone} story set in a ${setting} in ${language}. The story should be engaging and immersive.
    Include the following characters in your story:
    ${characterPrompts}
    Be creative and don't hold back! Remember to format the story as specified in the system message.`;

    const apiMessages: ChatCompletionMessageParam[] = [
        { role: "system", content: systemMessage },
        { role: "user", content: userPrompt }
    ];

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            stream: true,
            temperature: temperature,
            messages: apiMessages,
            max_tokens: 1000,
            presence_penalty: 0.6,
            frequency_penalty: 0.3,
        });

        // Transform stream to handle Uint8Array chunks
        const cleanStream = new TransformStream({
            async transform(chunk: Uint8Array, controller) {
                // Convert Uint8Array to string
                const chunkString = new TextDecoder().decode(chunk);
                const cleanedChunk = chunkString.replace(/\d+:"/g, '').replace(/"/g, '');
                controller.enqueue(new TextEncoder().encode(cleanedChunk));
            },
        });

        const stream = OpenAIStream(response).pipeThrough(cleanStream);
        return new StreamingTextResponse(stream);
    } catch (error) {
        console.error("Error generating story:", error);
        return new Response("Failed to generate story", { status: 500 });
    }
}