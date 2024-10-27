# Hadithi: AI-Powered Story Generation Platform

Hadithi is an AI-powered web application that allows users to create engaging stories enriched with images and audio. Leveraging advanced technologies like OpenAI's GPT-4 for story generation and [Livepeer's AI](https://docs.livepeer.org/ai/introduction) for image creation, Hadithi offers an immersive storytelling experience. Users can generate textual stories, slideshows with images, and even audio narratives, making storytelling interactive and accessible.

## Table of Contents

- [Features](#features)
- [Demo](#demo)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Contributing](#contributing)
- [License](#license)
- [Future Enhancements](#future-enhancements)
- [Contact](#contact)

## Features

- **Story Generation**: Create unique stories using OpenAI's GPT-4 model.
- **Character Customization**: Define characters with names, descriptions, and personalities to personalize stories.
- **Tone and Setting Selection**: Choose the tone and setting of the story for a tailored narrative.
- **Image Generation with Livepeer AI**: Generate images for story sections using Livepeer's [text-to-image AI pipeline](https://docs.livepeer.org/ai/pipelines/text-to-image).
- **Slideshow Mode**: View stories as a slideshow, with synchronized images and text.
- **Audio Generation**: Convert stories into audio formats for listening experiences.
- **Responsive UI**: User-friendly interface built with React and Tailwind CSS.


## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Git

### Clone the Repository

```bash
git clone https://github.com/yourusername/hadithi.git
cd hadithi
```

### Install Dependencies

Using npm:

```bash
npm install
```

Or using yarn:

```bash
yarn install
```

## Usage

### Running the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Generating a Story

1. **Define Characters**: Add characters by specifying their names, descriptions, and personalities.
2. **Select Tone and Setting**: Choose the desired tone (e.g., witty, dark, romantic) and setting (e.g., forest, city, space).
3. **Generate Story**: Click on the "Generate Story" button to create a story based on your inputs.
4. **View the Story**: The generated story will appear in the "Generated Story" section.

### Viewing as Slideshow

1. **Generate Images**: After creating a story, click on "Generate Images" to produce images for each story section.
2. **Slideshow Mode**: Switch to the slideshow mode to view the story with images.
3. **Navigation**: Use the "Previous" and "Next" buttons to navigate through the slides.

### Generating Audio

- Click on the "Generate Audio" button to convert the story into an audio format.
- An audio player will appear, allowing you to play, pause, or download the audio.

## Configuration

### Environment Variables

Create a `.env.local` file in the root directory and add the following environment variables:

```env
OPENAI_API_KEY=your_openai_api_key
LIVEPEER_API_KEY=your_livepeer_api_key
LIVEPEER_SD_MODEL_ID=your_livepeer_model_id
```

- **OPENAI_API_KEY**: Your OpenAI API key for accessing GPT-4.
- **LIVEPEER_API_KEY**: Your Livepeer API key for image generation.
- **LIVEPEER_SD_MODEL_ID**: The model ID from Livepeer for text-to-image generation (e.g., `SG161222/RealVisXL_V4.0_Lightning`).

**Note**: Do not share your API keys publicly. Ensure that `.env.local` is added to your `.gitignore` file.

### Next.js Configuration

Ensure that your `next.config.js` allows images from Livepeer's domain:

```js
// next.config.js

module.exports = {
  images: {
    domains: ['obj-store.livepeer.cloud'],
  },
};
```

## Project Structure

```
frontend/hadithi/
├── app/
│   ├── api/
│   │   ├── chat/route.ts
│   │   ├── images/route.ts
│   │   └── split/route.ts
│   ├── page.tsx
│   └── ...
├── components/
│   ├── story-generator.tsx
│   └── ...
├── utils/
│   ├── generateImages.ts
│   └── ...
├── public/
├── styles/
├── .env.local
├── package.json
└── ...
```

### Key Files and Directories

- **app/api/**: Contains API routes used by the application.
  - **chat/route.ts**: Handles story generation using GPT-4.
  - **images/route.ts**: Handles image generation requests via Livepeer's API.
  - **split/route.ts**: Splits the story into sections for processing.
- **components/story-generator.tsx**: Main component for the story generation interface.
- **utils/generateImages.ts**: Utility function for generating images via Livepeer's text-to-image AI pipeline.

## Technology Stack

- **Frontend**: React, Next.js, TypeScript, Tailwind CSS.
- **Backend**: Node.js, Next.js API Routes.
- **AI Services**:
  - **OpenAI GPT-4**: For generating story content based on user inputs.
  - **Livepeer AI**: For generating images from text descriptions using their [text-to-image pipeline](https://docs.livepeer.org/ai/pipelines/text-to-image).

## How Livepeer Image Generation is Utilized

Hadithi leverages Livepeer's [text-to-image AI pipeline](https://docs.livepeer.org/ai/pipelines/text-to-image) to generate images that correspond to different sections of the generated story. Here's how it's integrated into the application:

1. **Story Splitting**: After generating a story using GPT-4, the story is split into sections for image generation.

   ```typescript
   // Split story into sections
   function splitStoryIntoSections(story: string): string[] {
     return story.split('\n\n').filter((section) => section.trim() !== '');
   }
   ```

2. **Generating Images**: For each story section, a corresponding image is generated using the Livepeer API.

   ```typescript
   // utils/generateImages.ts

   import { Livepeer } from "@livepeer/ai";

   export const generateImages = async (prompts: string[]): Promise<string[]> => {
     const livepeer = new Livepeer({
       httpBearer: process.env.LIVEPEER_API_KEY,
     });

     const imageUrls: string[] = [];

     for (const prompt of prompts) {
       const imageResult = await livepeer.generate.textToImage({
         prompt,
         width: 1280,
         height: 720,
         modelId: process.env.LIVEPEER_SD_MODEL_ID,
       });

       // Handle imageResult and extract URL
       const images = imageResult.imageResponse?.images;
       if (images && images.length > 0) {
         imageUrls.push(images[0].url);
       }
     }

     return imageUrls;
   };
   ```

3. **Displaying Images**: The generated images are displayed in the slideshow mode, synchronized with the corresponding story sections.

   ```tsx
   // components/story-generator.tsx

   <div className="relative w-full h-[720px]">
     <Image
       src={imageUrls[currentSlideIndex]}
       alt={`Slide ${currentSlideIndex + 1}`}
       fill
       style={{ objectFit: 'cover' }}
     />
     <div className="absolute bottom-0 w-full bg-black bg-opacity-50 text-white p-4">
       <p>{storySections[currentSlideIndex]}</p>
     </div>
   </div>
   ```

4. **Model Selection**: The application uses specific models provided by Livepeer, like `SG161222/RealVisXL_V4.0_Lightning`, to ensure high-quality image generation.

   - **Reference**: [Livepeer Text-to-Image Pipeline Models](https://docs.livepeer.org/ai/pipelines/text-to-image#models)

By integrating Livepeer's AI capabilities, Hadithi enriches the storytelling experience by providing visual representations of the narrative, enhancing user engagement and immersion.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create your feature branch: `git checkout -b feature/YourFeature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/YourFeature`
5. Open a pull request.

## License

[MIT License](LICENSE)

## Future Enhancements

### Audio Download and Integration with SwarmZero Agents

One of the primary goals is to enable the download of generated audio files directly from the application. This feature will allow users to:

- **Download Audio**: Provide a download button for users to save the generated audio narratives.
- **Integration with SwarmZero Agents**: Utilize SwarmZero agents to automate the uploading of stories to platforms like Spotify and Amazon Kindle.
  - **Spotify Uploads**: Format and upload audio stories as podcasts or audiobooks to Spotify.
  - **Amazon Kindle**: Convert stories into e-book formats compatible with Kindle devices and upload them to the Amazon Kindle store.

### Implementation Plan

- **Audio Download Feature**:
  - Update the audio generation process to store audio files securely.
  - Implement a download button in the UI that links to the generated audio file.
  - Ensure compliance with any licensing or distribution policies.

- **SwarmZero Integration**:
  - Research and develop SwarmZero agents capable of interfacing with Spotify and Amazon Kindle APIs.
  - Establish authentication processes for uploading content to these platforms.
  - Create a user interface for managing uploads and tracking the status of submitted stories.

### Additional Features

- **User Authentication**: Implement user accounts to manage stories and uploads.
- **Story Editing**: Allow users to edit generated stories before finalizing.
- **Multi-language Support**: Expand language options for story generation and UI localization.
- **Analytics Dashboard**: Provide users with insights into their stories' performance on external platforms.

## Contact

For questions or support, please open an issue. 

---

**References**:

- [Livepeer AI Introduction](https://docs.livepeer.org/ai/introduction)
- [Livepeer Text-to-Image Pipeline](https://docs.livepeer.org/ai/pipelines/text-to-image)
- [Livepeer AI API Reference](https://docs.livepeer.org/ai/api-reference)
