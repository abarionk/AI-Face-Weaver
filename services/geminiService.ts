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

  const fullPrompt = `Photorealistic masterpiece, 8K, DSLR photo of a person described as: "${finalDescription}". Shot with a prime lens, focusing sharply on the eyes. The lighting is soft and natural, revealing incredibly detailed skin texture, including subtle pores and imperfections. The hair should have realistic strands and flyaways. Ensure the final image has a natural human quality and avoids any hint of digital airbrushing, plastic-like skin, or artificial smoothness. The background is a simple, out-of-focus studio gray.`;

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
 * @param faceDescription - The original description of the person, used for body consistency.
 * @param style - The desired artistic style for the photo.
 * @returns A promise that resolves to the base64 URL of the new lifestyle image.
 */
export const generateLifestyleScene = async (base64ImageUrl: string, mimeType: string, scenePrompt: string, expression: string, faceDescription: string, style: string): Promise<string> => {
  const base64Data = base64ImageUrl.split(',')[1];

  if (!base64Data) {
    throw new Error("Invalid base64 image URL provided.");
  }

  const styleDetails = getStyleDetails(style);
  const styleInstruction = style && style !== 'Default' 
    ? `\n6.  **Artistic Style:** The photo must embody a "${style.toLowerCase()}" aesthetic. ${styleDetails} This is a crucial instruction that must influence the person's pose, the overall composition, and the mood of the image.`
    : '';

  const fullPrompt = `Integrate the person from the provided image into the following scene: "${scenePrompt}". The original description of the person was: "${faceDescription}". The final image must be **hyper-realistic**.

Key requirements:
1.  **Identity Preservation:** Perfectly maintain the person's unique facial features and identity from the original image. Do not change their face structure.
2.  **Body Consistency:** Generate a body that is consistent with the provided face and the original description. Pay attention to plausible body type, build, and skin tone that matches the face.
3.  **Expression:** Modify their expression to be naturally "${expression.toLowerCase()}".
4.  **Natural Pose:** The person's pose and body language must be natural, relaxed, and contextually appropriate. Avoid stiff or artificial postures. The pose should perfectly complement the activity and emotional tone of the scene.
5.  **Seamless Integration:**
    -   Create a highly detailed environment with fine textures and depth.
    -   Ensure the lighting on the person (face and body) perfectly matches the ambient lighting of the scene.
    -   Blend skin tones and textures seamlessly with the environment's lighting conditions.
    -   The final composition must look like a single, authentic photograph, not a composite.${styleInstruction}`;


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