
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

async function extractResumeText(file) {
  const extension = file.originalname
    .split(".")
    .pop()
    .toLowerCase();

  let text;

  if (extension === "pdf" && file.mimetype === "application/pdf") {
    const result = await pdfParse(file.buffer);
    text = result.text;
  } else if (
    extension === "docx" &&
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({
      buffer: file.buffer,
    });
    text = result.value;
  } else {
    const error = new Error("Only PDF and DOCX files are supported.");
    error.statusCode = 400;
    throw error;
  }

  text = text.replace(/\r/g, "").trim();

  if (!text) {
    const error = new Error(
      "No readable text found. Scanned PDFs may require OCR."
    );
    error.statusCode = 422;
    throw error;
  }

  if (text.length > 100000) {
    const error = new Error("Extracted resume text is too long.");
    error.statusCode = 413;
    throw error;
  }

  return text;
}

module.exports = { extractResumeText };
