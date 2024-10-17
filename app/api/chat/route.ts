import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = "edge";

const MAX_CHUNK_SIZE = 4000;
const MAX_CHUNKS_PER_BATCH = 10;

interface Character {
    name: string;
    description: string;
    personality: string;
}

export async function POST(req: Request) {
    try {
        const { document, chunkSize = 1000, chunkOverlap = 200 } = await req.json();

        if (!document || typeof document !== "string") {
            return NextResponse.json({ message: "Invalid input document" }, { status: 400 });
        }

        if (document.trim().length === 0) {
            return NextResponse.json({ message: "Empty document provided" }, { status: 400 });
        }

        console.log(`Received document of length: ${document.length}`);
        console.log(`Chunk size: ${chunkSize}, Chunk overlap: ${chunkOverlap}`);

        const systemMessage = `You are a helpful assistant that extracts character information from text.
For each character, provide their 'name', a brief 'description', and their 'personality' traits.
Return only a JSON array of objects in the following format:

[
  {
    "name": "Character Name",
    "description": "Brief description",
    "personality": "Personality traits"
  },
  // ... more characters
]

Do not include any additional text, explanations, or notes. If you find no characters, return an empty JSON array [].`;

        const chunks = splitTextIntoChunks(document, Math.min(chunkSize, MAX_CHUNK_SIZE), chunkOverlap);
        console.log(`Split document into ${chunks.length} chunks`);

        const allCharacters: Character[] = [];
        for (let i = 0; i < chunks.length; i += MAX_CHUNKS_PER_BATCH) {
            const batchChunks = chunks.slice(i, i + MAX_CHUNKS_PER_BATCH);
            const batchCharactersArrays = await processBatch(batchChunks, systemMessage, i);
            // Flatten the array of arrays
            const batchCharacters = batchCharactersArrays.flat();
            allCharacters.push(...batchCharacters);
        }

        const characters = deduplicateCharacters(allCharacters);
        console.log(`Extracted ${characters.length} unique characters`);

        return NextResponse.json(characters);

    } catch (error: unknown) {
        console.error("Error extracting characters:", error);

        let errorMessage = "An unexpected error occurred";
        if (error instanceof Error) {
            errorMessage = error.message;
        }

        return NextResponse.json(
            { message: `Failed to extract characters: ${errorMessage}` },
            { status: 500 }
        );
    }
}

async function processBatch(chunks: string[], systemMessage: string, startIndex: number) {
    return await Promise.all(
        chunks.map(async (chunk, index) => {
            if (!chunk.trim()) return [];

            try {
                console.log(`Processing chunk ${startIndex + index + 1}`);

                const response = await openai.chat.completions.create({
                    model: "gpt-4",
                    temperature: 0.1,
                    messages: [
                        { role: "system", content: systemMessage },
                        {
                            role: "user",
                            content: `Extract all characters from the following text, and provide their 'name', 'description', and 'personality' in a JSON array format.\n\nText:\n\n${chunk}`,
                        },
                    ],
                });

                const result = response.choices[0].message?.content ?? "[]";

                // Log the AI's raw response
                console.log(`AI response for chunk ${startIndex + index + 1}:\n${result}`);

                // Extract JSON portion from the response
                const jsonString = extractJSON(result);

                // Log the extracted JSON
                console.log(`Extracted JSON for chunk ${startIndex + index + 1}:\n${jsonString}`);

                // Parse the JSON string
                return JSON.parse(jsonString);
            } catch (error) {
                console.error(`Error processing chunk ${startIndex + index + 1}:`, error);
                return [];
            }
        })
    );
}

function extractJSON(input: string): string {
  // Use a regular expression to match the JSON array
  const match = input.match(/\[\s*[\s\S]*?\s*\]/m);
  if (match) {
    return match[0];
  } else {
    // Return an empty array if no JSON is found
    console.warn('No JSON array found in the AI response.');
    return '[]';
  }
}

function splitTextIntoChunks(text: string, chunkSize: number, chunkOverlap: number): string[] {
    const chunks: string[] = [];
    let startIndex = 0;

    while (startIndex < text.length) {
        const endIndex = Math.min(startIndex + chunkSize, text.length);
        chunks.push(text.slice(startIndex, endIndex));

        if (endIndex === text.length) {
            break;
        }

        startIndex = endIndex - chunkOverlap;
    }

    return chunks;
}

function deduplicateCharacters(characters: Character[]): Character[] {
    const uniqueCharacters: { [key: string]: Character } = {};

    for (const character of characters) {
        const key = character.name.toLowerCase();
        if (!uniqueCharacters[key]) {
            uniqueCharacters[key] = character;
        }
    }

    return Object.values(uniqueCharacters);
}
