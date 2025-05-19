const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const { Pinecone } = require('@pinecone-database/pinecone');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pdfParse = require('pdf-parse');
require('dotenv').config();

const app = express();
const indexName = 'quickstart';
const namespace = 'ns1';
const model = 'multilingual-e5-large';

// Pinecone setup with environment variable
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

// Gemini setup with environment variable
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Enhanced retry logic with exponential backoff
const retryOperation = async (operation, maxAttempts = 3, baseDelayMs = 1000) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await operation();
      return result;
    } catch (error) {
      const isRetryable = !error.message.includes('404') && !error.message.includes('index not found');
      if (attempt === maxAttempts || !isRetryable) {
        throw error;
      }
      const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
      console.warn(`Attempt ${attempt} failed: ${error.message}. Retrying in ${delayMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
};

// Wait for index to be ready
const waitForIndexReady = async (indexName, maxAttempts = 30, delayMs = 10000) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const index = pc.index(indexName);
      const stats = await retryOperation(() => index.describeIndexStats());
      if (stats) {
        console.log(`Index ${indexName} is ready`);
        return true;
      }
    } catch (error) {
      console.warn(`Index ${indexName} not ready (attempt ${attempt}): ${error.message}`);
      if (attempt === maxAttempts) {
        throw new Error(`Index ${indexName} not ready after ${maxAttempts} attempts`);
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
};

// Check if namespace has vectors
const namespaceHasVectors = async (indexName, namespace, maxAttempts = 5, delayMs = 5000) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const index = pc.index(indexName);
      const stats = await retryOperation(() => index.describeIndexStats());
      const namespaceStats = stats.namespaces?.[namespace];
      const vectorCount = namespaceStats?.recordCount || 0;
      console.log(`Namespace ${namespace} has ${vectorCount} vectors (attempt ${attempt})`);
      return vectorCount > 0;
    } catch (error) {
      console.error(`Error checking namespace vectors (attempt ${attempt}):`, error.message);
      if (attempt === maxAttempts) return false;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return false;
};

// Clear namespace
const clearNamespace = async (indexName, namespace) => {
  try {
    const index = pc.index(indexName);
    console.log(`Attempting to clear namespace ${namespace}...`);
    await retryOperation(() => index.namespace(namespace).deleteAll());
    console.log(`Namespace ${namespace} cleared successfully`);

    let attempts = 0;
    while (attempts < 3) {
      attempts++;
      const hasVectors = await namespaceHasVectors(indexName, namespace);
      if (!hasVectors) {
        console.log(`Verified namespace ${namespace} is cleared`);
        return;
      }
      console.log(`Namespace ${namespace} not cleared yet, retrying verification (attempt ${attempts})...`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    console.warn(`Failed to verify namespace ${namespace} was cleared, proceeding anyway...`);
  } catch (error) {
    if (error.message.includes('404') || error.message.includes('index not found')) {
      console.log(`Namespace ${namespace} is already empty or does not exist. Proceeding...`);
      return;
    }
    console.error(`Error clearing namespace ${namespace}:`, error.message);
    throw error;
  }
};

// Improved index creation/verification
const ensureIndex = async () => {
  try {
    const response = await retryOperation(() => pc.listIndexes());
    let indexes = [];

    if (Array.isArray(response)) {
      indexes = response;
    } else if (response?.indexes) {
      indexes = response.indexes;
    } else if (response?.data) {
      indexes = response.data;
    }

    const indexExists = indexes.some(index => index?.name === indexName);

    if (!indexExists) {
      console.log(`Creating index "${indexName}"...`);
      await retryOperation(() =>
        pc.createIndex({
          name: indexName,
          dimension: 1024,
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1',
            },
          },
        })
      );
      console.log(`Index "${indexName}" created. Waiting for it to be ready...`);
      await waitForIndexReady(indexName);
    } else {
      console.log(`Index "${indexName}" already exists. Verifying readiness...`);
      await waitForIndexReady(indexName);
    }
  } catch (error) {
    console.error('Error ensuring index:', error.message);
    throw error;
  }
};

// Initialize Pinecone index
ensureIndex().catch(err => {
  console.error('Failed to initialize Pinecone index:', err.message);
  process.exit(1);
});

// Express middleware setup
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// File upload configuration
const uploadsDir = path.join(__dirname, 'Uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('Creating directory:', uploadsDir);
    fs.mkdir(uploadsDir, { recursive: true }, (err) => {
      if (err) {
        console.error('Error creating uploads directory:', err);
        return cb(err);
      }
      cb(null, uploadsDir);
    });
  },
  filename: (req, file, cb) => {
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${sanitizedFilename}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || path.extname(file.originalname).toLowerCase() === '.pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Clear uploads folder
const clearUploadsFolder = (directory) => {
  try {
    if (fs.existsSync(directory)) {
      fs.readdirSync(directory).forEach(file => {
        fs.unlinkSync(path.join(directory, file));
      });
      console.log('Uploads folder cleared.');
    }
  } catch (err) {
    console.error('Error clearing uploads:', err);
    throw err;
  }
};

// Process PDF
const processPDF = async (filePath, startPage = 1, endPage = null) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer, {
      max: 0, // No page limit
      pagerender: renderPage, // Custom page renderer
      version: 'v2.0.550', // Use newer version for better compatibility
    });
    
    if (!data || !data.text) {
      throw new Error('No text content extracted from PDF');
    }

    console.log(`Total pages in PDF: ${data.numpages}`);
    
    // Split text into pages first
    const pages = data.text.split(/\f/).filter(page => page.trim().length > 0);
    console.log(`Extracted ${pages.length} pages with content`);
    
    // If page range is specified, filter pages
    const selectedPages = endPage 
      ? pages.slice(startPage - 1, endPage)
      : pages.slice(startPage - 1);
    
    console.log(`Processing ${selectedPages.length} pages`);
    
    // Process each page and chunk into manageable paragraphs
    const paragraphs = [];
    for (const page of selectedPages) {
      // Split page into sections (by double newlines or other delimiters)
      const sections = page
        .split(/(?:\n\s*\n|\r\n\s*\r\n|\r\s*\r)/)
        .filter(section => section.trim().length > 0);
      
      for (const section of sections) {
        // Clean the section text
        const cleanedSection = cleanText(section);
        
        // If section is too long, split it into smaller chunks
        if (cleanedSection.length > 1000) {
          const chunks = splitIntoChunks(cleanedSection, 1000);
          paragraphs.push(...chunks);
        } else if (cleanedSection.length > 50) { // Only add if it's long enough
          paragraphs.push(cleanedSection);
        }
      }
    }

    console.log(`Extracted ${paragraphs.length} paragraphs`);
    
    if (paragraphs.length === 0) {
      throw new Error('No valid paragraphs extracted from PDF');
    }

    return paragraphs;
  } catch (error) {
    console.error('PDF processing error:', error);
    throw new Error(`Failed to process PDF file: ${error.message}`);
  }
};

// Custom page renderer to handle complex PDFs
const renderPage = async (pageData) => {
  try {
    const renderOptions = {
      normalizeWhitespace: true,
      disableCombineTextItems: false,
      verbosity: 0 // Reduce verbosity to avoid warnings
    };
    
    const textContent = await pageData.getTextContent(renderOptions);
    const text = textContent.items
      .map(item => item.str)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
      
    return text;
  } catch (error) {
    console.error('Error rendering page:', error);
    return '';
  }
};

// Split long text into chunks
const splitIntoChunks = (text, maxLength) => {
  const chunks = [];
  let currentChunk = '';
  
  // Split by sentences first (including various sentence endings)
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;
    
    if ((currentChunk + trimmedSentence).length <= maxLength) {
      currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
    } else {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = trimmedSentence;
    }
  }
  
  if (currentChunk) chunks.push(currentChunk);
  return chunks;
};

// Clean and normalize text
const cleanText = (text) => {
  return text
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[^\S\r\n]+/g, ' ') // Replace multiple whitespace with single space
    .replace(/\n+/g, ' ') // Replace newlines with space
    .replace(/\r+/g, ' ') // Replace carriage returns with space
    .replace(/\t+/g, ' ') // Replace tabs with space
    .replace(/[^\w\s.,!?-]/g, '') // Keep only basic punctuation and alphanumeric
    .trim();
};

// Get page count endpoint
app.post('/get-page-count', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    const dataBuffer = fs.readFileSync(req.file.path);
    const data = await pdfParse(dataBuffer);
    res.json({ totalPages: data.numpages });
  } catch (error) {
    console.error('Error getting page count:', error);
    res.status(500).json({ message: 'Error processing PDF file' });
  } finally {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
});

// PDF upload endpoint
app.post('/upload', (req, res, next) => {
  try {
    clearUploadsFolder(uploadsDir);
    next();
  } catch (err) {
    return res.status(500).json({ message: 'Error clearing the uploads folder', error: err.message });
  }
}, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const pdfPath = req.file.path;
  console.log('File saved at:', pdfPath);

  if (!fs.existsSync(pdfPath)) {
    console.error('Uploaded file not found at:', pdfPath);
    return res.status(500).json({ message: 'Uploaded file not found on server. Please try again.' });
  }

  const startPage = parseInt(req.query.startPage) || 1;
  const endPage = parseInt(req.query.endPage) || null;

  try {
    const paragraphs = await processPDF(pdfPath, startPage, endPage);
    console.log(`Parsed ${paragraphs.length} paragraphs from PDF`);

    console.log('Generating embeddings for', paragraphs.length, 'paragraphs');
    const embeddings = await generateEmbeddings(paragraphs);
    console.log('Embeddings generated:', embeddings.length);

    const vectors = paragraphs.map((text, i) => ({
      id: `para-${i + 1}`,
      values: embeddings[i].values,
      metadata: { text },
    }));

    await clearNamespace(indexName, namespace);

    const index = pc.index(indexName);
    await retryOperation(() => index.namespace(namespace).upsert(vectors));
    console.log(`Upserted ${vectors.length} vectors`);

    const hasVectors = await namespaceHasVectors(indexName, namespace);
    if (!hasVectors) {
      console.warn('Failed to verify vectors were upserted, but proceeding...');
    } else {
      console.log('Successfully upserted vectors to namespace ns1');
    }

    if (fs.existsSync(pdfPath)) {
      fs.unlinkSync(pdfPath);
      console.log('Temporary file deleted after processing');
    }

    res.json({
      success: true,
      message: 'File processed successfully',
      paragraphsProcessed: paragraphs.length,
      vectorsUpserted: vectors.length,
    });

  } catch (error) {
    console.error('Upload error:', error);

    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      console.log('Temporary file deleted due to error');
    }

    let message = 'Error processing file';
    if (error.message.includes('index not found') || error.message.includes('404')) {
      message = 'Pinecone index not available. Please try again later.';
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('PineconeConnectionError')) {
      message = 'Cannot connect to Pinecone. Check your network or Pinecone status at https://status.pinecone.io/';
    }

    res.status(500).json({
      success: false,
      message,
      error: error.message,
    });
  }
});

// Generate embeddings with Pinecone
const generateEmbeddings = async (texts) => {
  try {
    const response = await retryOperation(() =>
      pc.inference.embed(model, texts, {
        inputType: 'passage',
        truncate: 'END',
      })
    );

    console.log('Raw embedding response:', JSON.stringify(response, null, 2));

    if (Array.isArray(response)) {
      return response;
    } else if (response?.embeddings) {
      return response.embeddings;
    } else if (response?.data) {
      return response.data;
    } else {
      throw new Error('Unexpected embeddings response format');
    }
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw new Error(`Failed to generate embeddings: ${error.message}`);
  }
};

// Summarize search results with Gemini
const summarizeResults = async (rawResults) => {
  if (!rawResults || rawResults.length === 0) {
    return [];
  }

  const summarizedResults = [];
  for (const result of rawResults) {
    const metadata = result.metadata;
    const inputText = metadata.text || '';

    try {
      const prompt = `You are an educational assistant helping students understand course material. IGNORE ANY PREVIOUS CONTEXT ABOUT PRODUCTS OR COMMERCIAL ITEMS.

Based on the following text from a PDF, provide a clear and structured answer that:
1. Identifies the main topic or concept
2. Explains key points or principles
3. Provides relevant examples or applications if present
4. Maintains academic accuracy and clarity

Text from PDF:
${inputText}

Remember: This is educational content, not product information. Focus on explaining concepts and ideas.`;

      const geminiResult = await geminiModel.generateContent(prompt);
      const summary = geminiResult.response.text().trim();

      summarizedResults.push({
        id: result.id,
        score: result.score,
        metadata: result.metadata,
        summary: summary,
      });
    } catch (error) {
      console.error(`Error summarizing result ${result.id}:`, error.message);
      summarizedResults.push({
        id: result.id,
        score: result.score,
        metadata: result.metadata,
        summary: 'Unable to process this section. Please try rephrasing your question.',
      });
    }
  }

  return summarizedResults;
};

// Search endpoint
app.post('/search', express.json(), async (req, res) => {
  const { query } = req.body;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ message: 'Invalid query' });
  }

  try {
    const hasVectors = await namespaceHasVectors(indexName, namespace);
    if (!hasVectors) {
      console.warn(`No vectors in namespace ${namespace}. Returning empty results.`);
      return res.json({ success: true, results: [] });
    }

    // Clean and normalize the query
    const normalizedQuery = query
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    console.log('Processing query:', normalizedQuery);

    console.log('Generating embedding for query');
    const embeddings = await generateEmbeddings([normalizedQuery]);
    if (!embeddings || !embeddings[0]?.values) {
      throw new Error('Failed to generate query embedding');
    }
    const queryEmbedding = embeddings[0];

    const index = pc.index(indexName);
    const queryResponse = await retryOperation(() =>
      index.namespace(namespace).query({
        vector: queryEmbedding.values,
        topK: 5, // Get top 5 most relevant matches
        includeMetadata: true,
        includeValues: false,
      })
    );

    const rawResults = queryResponse.matches
      .filter(match => match.score > 0.5) // Only include results with good relevance
      .map((match) => ({
      id: match.id,
      score: match.score,
      metadata: match.metadata,
    }));

    if (rawResults.length === 0) {
      return res.json({
        success: true,
        results: [],
        message: 'No relevant information found. Try rephrasing your question or checking a different section of the document.'
      });
    }

    const results = await summarizeResults(rawResults);

    // Combine the results into a comprehensive answer
    const combinedPrompt = `You are an educational assistant helping students understand course material. IGNORE ANY PREVIOUS CONTEXT ABOUT PRODUCTS OR COMMERCIAL ITEMS.

Based on the following search results from a PDF, provide a comprehensive and well-structured answer to the student's question: "${query}"

Search Results:
${results.map(r => r.summary).join('\n\n')}

Please provide a clear, educational response that:
1. Directly addresses the student's question
2. Combines relevant information from the search results
3. Maintains academic accuracy
4. Is well-structured and easy to understand
5. Includes specific examples or references from the text when relevant

Remember: This is educational content, not product information. Focus on explaining concepts and ideas.`;

    const finalResponse = await geminiModel.generateContent(combinedPrompt);
    const finalAnswer = finalResponse.response.text().trim();

    res.json({
      success: true,
      results: [{
        summary: finalAnswer,
        sourceMatches: results
      }]
    });

  } catch (error) {
    console.error('Search error:', error);
    let message = 'Search failed';
    if (error.message.includes('index not found') || error.message.includes('404')) {
      message = 'Pinecone index not available. Please upload a PDF first.';
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('PineconeConnectionError')) {
      message = 'Cannot connect to Pinecone. Check your network or Pinecone status at https://status.pinecone.io/';
    }

    res.status(500).json({
      success: false,
      message,
      error: error.message,
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});