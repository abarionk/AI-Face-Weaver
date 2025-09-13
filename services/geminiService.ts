import { GoogleGenAI, Modality, Type } from "@google/genai";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a photorealistic human face based on a text description.
 * @param description - The user's general description of the face.
 * @param age - The desired age range for the person.
 * @param gender - The desired gender for the person.
 * @param ethnicity - The desired ethnicity for the person.
 * @param hairColor - The desired hair color for the person.
 * @returns A promise that resolves to an object containing the base64 URL and MIME type of the generated image.
 */
export const generateFace = async (
  description: string,
  age: string,
  gender: string,
  ethnicity: string,
  hairColor: string
): Promise<{ url: string; mimeType: string; }> => {
  const descriptionParts: string[] = [];

  // Build a structured description from the parameters
  let coreIdentity = `A`;
  const identityAttrs: string[] = [];
  if (age && age.toLowerCase() !== 'any') identityAttrs.push(age);
  if (ethnicity && ethnicity.toLowerCase() !== 'any') identityAttrs.push(ethnicity);

  if (identityAttrs.length > 0) {
    coreIdentity += ` ${identityAttrs.join(', ')}`;
  }

  if (gender && gender.toLowerCase() !== 'any') {
    coreIdentity += ` ${gender}`;
  } else {
    coreIdentity += ` person`;
  }
  descriptionParts.push(coreIdentity);

  // Add hair color
  if (hairColor && hairColor.toLowerCase() !== 'any') {
    descriptionParts.push(`with ${hairColor} hair`);
  }

  // Add the free-text description for more nuanced details
  if (description) {
    descriptionParts.push(`who is ${description}`);
  }

  const finalDescription = descriptionParts.join(' ');

  const fullPrompt = `Professional studio headshot, photorealistic masterpiece, 8K, DSLR photo of a person described as: "${finalDescription}". The composition must frame the person from the shoulders up, ensuring the entire head, hair, and neck are visible. Shot with a prime lens, focusing sharply on the eyes. The lighting is soft and natural, revealing incredibly detailed skin texture, including subtle pores and imperfections. The hair should have realistic strands and flyaways. Ensure the final image has a natural human quality and avoids any hint of digital airbrushing, plastic-like skin, or artificial smoothness. The background is a simple, out-of-focus studio gray.`;

  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: fullPrompt,
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/jpeg',
      aspectRatio: '1:1',
    },
  });

  if (!response.generatedImages || response.generatedImages.length === 0) {
    throw new Error("Image generation failed. No images were returned.");
  }
  
  const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
  const mimeType = response.generatedImages[0].image.mimeType;
  const imageUrl = `data:${mimeType};base64,${base64ImageBytes}`;

  return { url: imageUrl, mimeType };
};

const getStyleDetails = (style: string): string => {
    switch (style) {
      case 'With a Pet':
        return 'Incorporate a cute pet like a cat or dog, showing a heartwarming interaction.';
      case 'With Food':
        return 'Use beautifully presented food as a central prop to create a vibrant, natural scene.';
      case 'Playful':
        return 'Capture a sense of movement and energy. The pose should be dynamic and candid, not static.';
      case 'Mysterious':
        return 'Create intrigue by having the person turn partially or fully away from the camera.';
      case 'Charming':
        return 'Add a touch of coyness by partially obscuring the face, perhaps with a hand, a prop, or hair.';
      case 'Relaxed':
        return 'The mood should be calm and serene. A pose like looking up towards the sky or resting comfortably would be appropriate.';
      case 'Emotional':
        return 'Focus on conveying a specific, deep emotion. The expression and body language are key to telling a story.';
      default:
        return '';
    }
  }

/**
 * Places the generated face into a new lifestyle scene with a specified expression.
 * @param base64ImageUrl - The base64 data URL of the face image.
 * @param mimeType - The MIME type of the face image.
 * @param scenePrompt - The user's description of the lifestyle scene.
 * @param expression - The desired facial expression for the person.
 * @param style - The desired artistic style for the photo.
 * @returns A promise that resolves to the base64 URL of the new lifestyle image.
 */
export const generateLifestyleScene = async (base64ImageUrl: string, mimeType: string, scenePrompt: string, expression: string, style: string): Promise<string> => {
  const base64Data = base64ImageUrl.split(',')[1];

  if (!base64Data) {
    throw new Error("Invalid base64 image URL provided.");
  }

  const styleDetails = getStyleDetails(style);
  const styleInstruction = style && style !== 'Default'
    ? `The photo must embody a "${style.toLowerCase()}" aesthetic. ${styleDetails} This should influence the pose, composition, and mood.`
    : 'The style should be standard photorealism.';

  const fullPrompt = `**ULTIMATE PRIORITY: DO NOT CHANGE THE FACE. The identity of the person in the provided image must be perfectly preserved. This is the single most important rule. Failure is not an option.**

Your task is to place the person from the provided image into a new scene.

**IMAGE INPUT:** You are given an image of a person's face. This image is the **absolute ground truth** for their facial identity.

**TEXT INPUTS:**
1.  **Scene Description:** "${scenePrompt}"
2.  **Expression:** "${expression.toLowerCase()}"
3.  **Style:** "${styleInstruction}"

**NON-NEGOTIABLE RULES:**
1.  **ZERO FACIAL ALTERATION:** You must transfer the face from the source image to the new scene with **ZERO** changes to its structure, features, or identity. The nose, eyes, mouth, bone structure, and unique characteristics MUST remain identical.
2.  **EXPRESSION NUANCE:** Apply the requested expression ("${expression.toLowerCase()}") very subtly. It should be a minor muscle adjustment, NOT a change in the person's core identity. If applying the expression risks changing the face, prioritize keeping the face identical over adding the expression.
3.  **BODY CONSISTENCY:** Create a realistic body that matches the head in terms of approximate age, ethnicity, and skin tone. The pose should fit the scene description.
4.  **SEAMLESS INTEGRATION:** The lighting, shadows, and color grading on the person must perfectly match the surrounding environment of "${scenePrompt}". The final image must look like a real, single photograph.

**FINAL CHECK:** Before outputting, ask yourself: "Does the face in my generated image look like a twin, or does it look like the *exact same person* from the input image?" The answer must be the latter. **The preservation of the person's unique facial identity is the only metric for success.**`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image-preview',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
        {
          text: fullPrompt,
        },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

  if (!imagePart || !imagePart.inlineData) {
    const textPart = response.candidates?.[0]?.content?.parts?.find(part => part.text);
    if(textPart?.text) {
        throw new Error(`Image generation failed. The model responded with: ${textPart.text}`);
    }
    throw new Error("Image generation failed. The model did not return an image.");
  }
  
  const base64ImageBytes: string = imagePart.inlineData.data;
  const outputMimeType = imagePart.inlineData.mimeType;

  return `data:${outputMimeType};base64,${base64ImageBytes}`;
};

/**
 * Removes facial descriptions from a scene prompt to prevent conflicts with the source image.
 * @param scenePrompt - The original user prompt for the scene.
 * @returns A promise that resolves to the cleaned prompt.
 */
export const cleanScenePrompt = async (scenePrompt: string): Promise<string> => {
    const systemInstruction = `You are a prompt sanitization AI. Your task is to process a user's prompt for an image generation tool. This tool places a person from a reference IMAGE into a scene described by the prompt. Therefore, any description of the person's face, hair, gender, age, or identity in the text prompt is HARMFUL and must be removed.

**Your Goal:**
Rewrite the user's prompt to remove ALL personal descriptors, but KEEP the action, setting, objects, and mood.

**Examples:**
-   **Original:** "A happy woman with brown hair drinking coffee at a cafe."
-   **Sanitized:** "Drinking coffee at a cozy cafe."
-   **Original:** "A man with glasses reading a book in a library."
-   **Sanitized:** "Reading a book in a library."
-   **Original:** "Photo of a smiling person hiking on a sunny mountain trail."
-   **Sanitized:** "Hiking on a sunny mountain trail."

Return ONLY the sanitized prompt in the JSON format.`;
  
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Sanitize the following prompt: "${scenePrompt}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cleanedPrompt: {
              type: Type.STRING,
              description: 'The sanitized prompt with all personal and facial descriptions removed, focusing only on the action, setting, and mood.'
            }
          },
          required: ['cleanedPrompt']
        },
        temperature: 0.1,
      },
    });
  
    try {
      const jsonText = response.text.trim();
      const result = JSON.parse(jsonText);
      if (result.cleanedPrompt && typeof result.cleanedPrompt === 'string' && result.cleanedPrompt.trim() !== '') {
        return result.cleanedPrompt;
      }
      // Fallback if cleaned prompt is empty or invalid
      return scenePrompt;
    } catch (e) {
      console.error("Failed to parse cleaned prompt JSON:", e);
      // Fallback to original prompt on error
      return scenePrompt;
    }
  };

/**
 * Generates lifestyle photo suggestions based on a face description and a topic.
 * @param faceDescription - The user's description of the face.
 * @param topic - The user-provided topic for the suggestions.
 * @returns A promise that resolves to an array of suggestion strings.
 */
export const generateLifestyleSuggestions = async (faceDescription: string, topic: string): Promise<string[]> => {
    const prompt = `Based on the description of a person: "${faceDescription}", and the topic "${topic}", suggest 3 highly detailed, creative, and 'aesthetic' social media photo ideas.

The suggestions must be diverse, directly related to the provided topic, and embody different popular photographic styles. For each suggestion, provide a rich and inspiring scenario that incorporates:

1.  **Core Concept & Style:** Clearly define the style. Is it playful and energetic, mysterious, emotional and thoughtful, or cute with a prop like food or a pet?
2.  **Specific Activity:** A descriptive action (e.g., "arranging a bouquet of fresh tulips," not just "with flowers").
3.  **Pose & Mood:** A description of the pose and emotional tone (e.g., "captured mid-laugh while turning away," "a quiet moment of contemplation looking out a window," "gently holding a puppy").
4.  **Setting & Lighting:** The environment and lighting conditions (e.g., "at a bustling night market under neon lights," "in a cozy cafe during golden hour," "on a misty morning in a park").

Consider these styles:
- **With Props:** Using eye-catching food or a cute pet.
- **Playful & Dynamic:** Capturing movement and energy. Poses could include turning away, partially hiding the face, or looking up at the sky.
- **"Deep" & Emotional:** Creating a moody, story-driven image that conveys a feeling.

The final suggestions should be concise enough to be used as prompts but detailed enough to be inspiring.`;
  
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
                description: 'A single, detailed lifestyle photo suggestion incorporating activity, lighting, and mood.'
              },
              description: 'A list of 3 detailed lifestyle photo suggestions.'
            }
          },
          required: ['suggestions']
        },
      },
    });
  
    try {
      const jsonText = response.text.trim();
      const result = JSON.parse(jsonText);
      if (result.suggestions && Array.isArray(result.suggestions)) {
        return result.suggestions;
      }
      return [];
    } catch (e) {
      console.error("Failed to parse lifestyle suggestions JSON:", e);
      console.error("Received text:", response.text);
      throw new Error("Could not understand the suggestions from the AI.");
    }
  };