import 'dotenv/config';
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const fileManager = new GoogleAIFileManager(process.env.API_KEY);

export async function describeImage(img) {
    if (!img || !img.path) throw new Error("Image file name required.");

    const uploadResult = await fileManager.uploadFile(img.path, {
        mimeType: img.mimetype,
        displayName: "Image",
    });

    const result = await model.generateContent([
        {
            fileData: {
                mimeType: uploadResult.file.mimeType,
                fileUri: uploadResult.file.uri,
            }
        },
        { text: "Describe the image with a general description, if the image contains face of someone popular do not mention its name, just describe what they look like to the person the look alike, and last if the image contains something controversial completely ignore or make a pun out of it to avoid controversies." },
    ]);

    await fileManager.deleteFile(uploadResult.file.name);
    fs.unlinkSync(img.path);

    const response = await result.response;
    const imageDesc = response.text();

    return imageDesc;
    
}

export async function getRoast(img = '') {
    try {
        const imageDesc = await describeImage(img);
        const prompt = `${imageDesc}
        I want you to act like the nicest person in the world that people like because what you say is so true.
        Make a compliment for the description of this image, you can also use Indonesian words that are slight, light, safe and not at all offensive or light profanity, using data make a very detailed and very complimentary compliment, you should also use the words of young people. You can search for relevant topics or recent news for the description, so use that to spice up your compliments, also make the compliments in Indonesian by using simple and tense language like a typical Indonesian. Remember!!! use Indonesian Oh and you can also add some emojis to spice it up. Give your best compliment. Answers should be less than 500 words, make the answer in markdown, oh and if you can mention to support the website owner which is me by visiting the saweriaku page, it doesn't need to be too subtle so it doesn't feel like a blatant advertisement.
        
        my saweria link: https://saweria.co/adinshobirin
        my instagram link: https://instagram.com/adin_shobirin
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return text;
    } catch (error) {
        if (fs.existsSync(img.path)) {
            fs.unlinkSync(img.path);
        }
        throw error;
    }
}
    