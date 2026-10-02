"use server";

// Fix for pdf-parse DOMMatrix error in Node.js
if (typeof global !== 'undefined') {
  if (!global.DOMMatrix) {
    (global as any).DOMMatrix = class DOMMatrix {
      constructor() {}
    };
  }
}

const pdfParse = require("pdf-parse");

export async function extractPDFText(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) {
      throw new Error("No file uploaded");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Parse PDF buffer to text
    const data = await pdfParse(buffer);
    
    return data.text;
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw new Error("Failed to extract text from PDF");
  }
}
